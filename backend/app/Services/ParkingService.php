<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ParkingService
{
    public function audit(string $actor, string $action, string $result, ?string $id = null, array $metadata = []): void
    {
        DB::table('audit_logs')->insert(['actor' => $actor, 'action' => $action, 'result' => $result, 'request_id' => $id, 'safe_metadata' => json_encode($metadata), 'created_at' => now()]);
    }

    // A singleton row serializes mutations on this one-reader MVP. MySQL locks it until commit.
    public function atomic(string $scope, array $payload, callable $fn): array
    {
        return DB::transaction(function () use ($scope, $payload, $fn) {
            DB::table('settings')->where('id', 1)->lockForUpdate()->first();
            $canonical = $payload;
            ksort($canonical);
            $hash = hash('sha256', json_encode($canonical));
            $old = DB::table('operation_requests')->where('scope', $scope)->where('request_id', $payload['request_id'])->first();
            if ($old) {
                abort_if($old->payload_hash !== $hash, 409, 'REQUEST_PAYLOAD_CONFLICT');

                return json_decode($old->result, true);
            }
            $result = $fn();
            DB::table('operation_requests')->insert(['scope' => $scope, 'request_id' => $payload['request_id'], 'payload_hash' => $hash, 'result' => json_encode($result)]);
            $this->audit($scope, 'TRANSACTION', $result['code'], $payload['request_id']);

            return $result;
        }, 3);
    }

    public function scan(object $device, array $p): array
    {
        return $this->atomic('device:'.$device->id, $p, function () use ($device, $p) {
            $d = DB::table('devices')->where('id', $device->id)->lockForUpdate()->first();
            abort_unless($d && $d->enabled, 403, 'DEVICE_DISABLED');
            $s = DB::table('settings')->first();
            $code = '';
            $gate = null;
            $fee = null;
            $balance = null;
            if (abs(now()->timestamp - strtotime($p['scanned_at'])) > 30) {
                $code = 'STALE_SCAN';
            } elseif ($d->mode_version != $p['mode_version']) {
                $code = 'STALE_MODE';
            } else {
                $card = DB::table('cards')->where('uid', $p['uid'])->whereNull('deleted_at')->lockForUpdate()->first();
                if ($d->mode === 'REGISTER') {
                    $code = 'REGISTER_SCAN';
                } elseif (! $card) {
                    $code = 'UNKNOWN_CARD';
                } elseif ($card->status !== 'ACTIVE') {
                    $code = 'BLOCKED_CARD';
                } elseif ($d->mode === 'TOPUP') {
                    $code = 'TOPUP_SCAN';
                } else {
                    $session = DB::table('parking_sessions')->where('active_card_id', $card->id)->lockForUpdate()->first();
                    if ($d->mode === 'ENTRY' || ($d->mode === 'AUTO' && ! $session)) {
                        if ($session) {
                            $code = 'ALREADY_INSIDE';
                        } else {
                            DB::table('parking_sessions')->insert(['card_id' => $card->id, 'active_card_id' => $card->id, 'entry_at' => now(), 'fee_snapshot' => $s->rate, 'status' => 'ACTIVE']);
                            $fee = $s->rate;
                            $code = 'ENTRY_SUCCESS';
                        }
                    } else {
                        if (! $session) {
                            $code = 'INVALID_SESSION';
                        } elseif ($card->balance < $session->fee_snapshot) {
                            $code = 'INSUFFICIENT_BALANCE';
                        } else {
                            $fee = $session->fee_snapshot;
                            $balance = $card->balance - $fee;
                            DB::table('cards')->where('id', $card->id)->update(['balance' => $balance]);
                            DB::table('parking_sessions')->where('id', $session->id)->update(['active_card_id' => null, 'status' => 'COMPLETED', 'exit_at' => now()]);
                            DB::table('transactions')->insert(['card_id' => $card->id, 'session_id' => $session->id, 'type' => 'PARKING_PAYMENT', 'amount' => $fee, 'balance_before' => $card->balance, 'balance_after' => $balance, 'request_id' => $p['request_id'], 'created_at' => now()]);
                            $code = 'EXIT_SUCCESS';
                        }
                    }
                }
            }
            $scan = DB::table('scan_events')->insertGetId(['device_id' => $d->id, 'uid' => $p['uid'], 'mode' => $d->mode, 'mode_version' => $p['mode_version'], 'request_id' => $p['request_id'], 'result_code' => $code, 'created_at' => now()]);
            if (in_array($code, ['ENTRY_SUCCESS', 'EXIT_SUCCESS'])) {
                $id = (string) Str::uuid();
                $expires = now()->addSeconds(10);
                DB::table('gate_commands')->insert(['id' => $id, 'scan_id' => $scan, 'device_id' => $d->id, 'expires_at' => $expires, 'duration_ms' => $s->duration_ms]);
                $gate = ['id' => $id, 'action' => 'OPEN', 'duration_ms' => $s->duration_ms, 'expires_at' => $expires->toIso8601String(), 'expires_epoch' => $expires->timestamp];
            }

            $this->publish($d->id, $code, $fee, $balance);

            return ['success' => in_array($code, ['REGISTER_SCAN', 'TOPUP_SCAN', 'ENTRY_SUCCESS', 'EXIT_SUCCESS']), 'code' => $code, 'fee' => $fee, 'balance_after' => $balance, 'gate_command' => $gate];
        });
    }

    public function claim(int $user, string $sessionHash): array
    {
        return DB::transaction(function () use ($user, $sessionHash) {
            $scan = DB::table('scan_events')->latest('id')->first();
            abort_unless($scan && in_array($scan->result_code, ['REGISTER_SCAN', 'TOPUP_SCAN']) && now()->diffInSeconds($scan->created_at, true) <= 60, 422, 'NO_RECENT_SCAN');
            abort_if(DB::table('scan_claims')->where('scan_id', $scan->id)->where('used', true)->exists(), 422, 'SCAN_ALREADY_USED');
            $id = (string) Str::uuid();
            DB::table('scan_claims')->insert(['id' => $id, 'scan_id' => $scan->id, 'user_id' => $user, 'session_hash' => $sessionHash, 'expires_at' => now()->addSeconds(60)]);

            return ['claim_id' => $id, 'uid' => $scan->uid, 'mode' => $scan->mode, 'scan_id' => $scan->id, 'expires_at' => now()->addSeconds(60)->toIso8601String(), 'expires_in' => 60, 'card' => DB::table('cards')->where('uid', $scan->uid)->whereNull('deleted_at')->first()];
        });
    }

    public function consume(string $id, int $user, string $mode, string $sessionHash): object
    {
        $claim = DB::table('scan_claims')->where('id', $id)->lockForUpdate()->first();
        abort_unless($claim && $claim->user_id === $user && hash_equals($claim->session_hash ?? '', $sessionHash) && ! $claim->used && now()->lt($claim->expires_at), 422, 'INVALID_SCAN_CLAIM');
        $scan = DB::table('scan_events')->where('id', $claim->scan_id)->first();
        abort_if(DB::table('scan_claims')->where('scan_id', $scan->id)->where('used', true)->exists(), 409, 'SCAN_ALREADY_USED');
        $device = DB::table('devices')->where('id', $scan->device_id)->first();
        abort_unless($scan->mode === $mode && $scan->mode_version === $device->mode_version && $device->mode === $mode && now()->diffInSeconds($scan->created_at, true) <= 120, 409, 'SCAN_MODE_CHANGED');
        DB::table('scan_claims')->where('scan_id', $scan->id)->update(['used' => true]);

        return $scan;
    }

    public function publish(int $device, string $code, ?int $fee = null, ?int $balance = null): void
    {
        DB::table('display_events')->insert(['device_id' => $device, 'code' => $code, 'fee' => $fee, 'balance_after' => $balance, 'created_at' => now()]);
    }

    public function topup(int $user, array $p, string $sessionHash): array
    {
        return $this->atomic('admin:'.$user, $p, function () use ($user, $p, $sessionHash) {
            $settings = DB::table('settings')->first();
            abort_unless($p['amount'] >= $settings->topup_min && $p['amount'] <= $settings->topup_max, 422, 'TOPUP_OUT_OF_RANGE');
            $scan = $this->consume($p['claim_id'], $user, 'TOPUP', $sessionHash);
            $card = DB::table('cards')->where('uid', $scan->uid)->whereNull('deleted_at')->lockForUpdate()->first();
            abort_unless($card && $card->status === 'ACTIVE', 422, 'CARD_NOT_ACTIVE');
            $after = $card->balance + $p['amount'];
            DB::table('cards')->where('id', $card->id)->update(['balance' => $after]);
            DB::table('transactions')->insert(['card_id' => $card->id, 'type' => 'TOPUP', 'amount' => $p['amount'], 'balance_before' => $card->balance, 'balance_after' => $after, 'actor_id' => $user, 'request_id' => $p['request_id'], 'created_at' => now()]);

            $this->publish($scan->device_id, 'TOPUP_SUCCESS', null, $after);

            return ['success' => true, 'code' => 'TOPUP_SUCCESS', 'balance_after' => $after, 'gate_command' => null];
        });
    }
}
