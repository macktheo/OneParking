<?php

namespace App\Http\Controllers;

use App\Rules\Rupiah;
use App\Services\ParkingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;

class ParkingController extends Controller
{
    public function login(Request $r, ParkingService $s)
    {
        $p = $r->validate(['email' => 'required|email', 'password' => 'required|string|max:256']);
        $key = 'login:'.$r->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $s->audit('guest', 'LOGIN', 'RATE_LIMIT');
            abort(429, 'LOGIN_RATE_LIMIT');
        }
        if (! Auth::attempt([...$p, 'active' => true])) {
            RateLimiter::hit($key, 60);
            $s->audit('guest', 'LOGIN', 'DENIED');
            abort(422, 'LOGIN_FAILED');
        }
        RateLimiter::clear($key);
        $r->session()->regenerate();
        $s->audit('user:'.$r->user()->id, 'LOGIN', 'OK');

        return ['id' => $r->user()->id, 'name' => $r->user()->name, 'role' => $r->user()->role];
    }

    public function me(Request $r)
    {
        abort_unless($r->user() && $r->user()->active, 401, 'UNAUTHENTICATED');

        return collect($r->user())->only(['id', 'name', 'email', 'role']);
    }

    public function logout(Request $r)
    {
        Auth::logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();

        return ['success' => true];
    }

    public function dashboard()
    {
        $start = now('Asia/Jakarta')->startOfDay()->utc();
        $rows = DB::table('transactions')->where('created_at', '>=', $start)->get(['created_at']);
        $activity = array_fill(0, 24, 0);
        foreach ($rows as $row) {
            $hour = Carbon::parse($row->created_at, 'UTC')->tz('Asia/Jakarta')->hour;
            $activity[$hour]++;
        }

        return ['active_cards' => DB::table('cards')->whereNull('deleted_at')->where('status', 'ACTIVE')->count(), 'active_sessions' => DB::table('parking_sessions')->where('status', 'ACTIVE')->count(), 'revenue' => (int) DB::table('transactions')->where('type', 'PARKING_PAYMENT')->sum('amount'), 'rejected' => DB::table('scan_events')->whereNotIn('result_code', ['ENTRY_SUCCESS', 'EXIT_SUCCESS', 'REGISTER_SCAN', 'TOPUP_SCAN'])->count(), 'activity' => $activity, 'transaction_count' => DB::table('transactions')->count(), 'topup_total' => (int) DB::table('transactions')->where('type', 'TOPUP')->sum('amount')];
    }

    public function live()
    {
        return ['dashboard' => $this->dashboard(), 'devices' => $this->devices(), 'scan' => DB::table('scan_events')->latest('id')->first()];
    }

    public function readerState()
    {
        return ['devices' => $this->devices(), 'scan' => DB::table('scan_events')->latest('id')->first()];
    }

    public function cards(){return DB::table('cards')->whereNull('deleted_at')->select('id','uid','balance','status','created_at')->orderByDesc('id')->get();}

    public function deleteCard(Request $r, ParkingService $s, int $id)
    {
        return DB::transaction(function () use ($r, $s, $id) {
            DB::table('settings')->where('id', 1)->lockForUpdate()->first();
            $card = DB::table('cards')->where('id', $id)->lockForUpdate()->first();
            abort_unless($card, 404, 'CARD_NOT_FOUND');
            if ($card->deleted_at) return ['success'=>true];
            abort_if(DB::table('parking_sessions')->where('card_id', $id)->where('status', 'ACTIVE')->exists(), 409, 'CARD_HAS_ACTIVE_SESSION');
            // Retain the UID, balance and foreign keys for the immutable financial history.
            DB::table('cards')->where('id', $id)->update(['deleted_at'=>now()]);
            $s->audit('admin:'.$r->user()->id, 'CARD_DELETE', 'OK', null, ['card_id'=>$id]);
            return ['success'=>true];
        });
    }

    public function holders()
    {
        return DB::table('holders')->orderByDesc('id')->get();
    }

    public function holder(Request $r, ParkingService $s, ?int $id = null)
    {
        $p = $r->validate(['name' => 'required|string|max:100', 'student_number' => 'required|string|max:40', 'vehicle_plate' => 'required|string|max:20']);

        return DB::transaction(function () use ($p, $r, $s, $id) {
            if ($id) {
                abort_unless(DB::table('holders')->where('id', $id)->exists(), 404);
                DB::table('holders')->where('id', $id)->update($p);
            } else {
                $id = DB::table('holders')->insertGetId($p);
            }$s->audit('admin:'.$r->user()->id, 'HOLDER_SAVE', 'OK');

            return ['id' => $id, ...$p];
        });
    }

    public function register(Request $r, ParkingService $s)
    {
        $p = $r->validate(['claim_id'=>'required|uuid','holder_id'=>'nullable|integer|exists:holders,id']);

        return DB::transaction(function () use ($p, $r, $s) {
            DB::table('settings')->where('id', 1)->lockForUpdate()->first();
            $scan = $s->consume($p['claim_id'], $r->user()->id, 'REGISTER', hash('sha256', $r->session()->getId()));
            $existing = DB::table('cards')->where('uid', $scan->uid)->lockForUpdate()->first();
            abort_if($existing && !$existing->deleted_at, 409, 'CARD_EXISTS');
            if ($existing) {
                DB::table('cards')->where('id', $existing->id)->update(['deleted_at'=>null, 'status'=>'ACTIVE']);
                $s->audit('admin:'.$r->user()->id, 'CARD_RESTORE', 'OK', null, ['card_id'=>$existing->id]);
                return ['id'=>$existing->id,'uid'=>$existing->uid,'balance'=>$existing->balance,'restored'=>true];
            }
            $id = DB::table('cards')->insertGetId(['holder_id'=>$p['holder_id']??null,'uid'=>$scan->uid,'balance'=>0,'status'=>'ACTIVE','created_at'=>now()]);
            $s->audit('admin:'.$r->user()->id, 'REGISTER', 'OK');

            return ['id'=>$id,'uid'=>$scan->uid,'balance'=>0];
        });
    }

    public function status(Request $r, int $id, ParkingService $s)
    {
        $p = $r->validate(['status' => 'required|in:ACTIVE,BLOCKED']);

        return DB::transaction(function () use ($p, $id, $r, $s) {
            DB::table('settings')->where('id', 1)->lockForUpdate()->first();
            abort_unless(DB::table('cards')->where('id', $id)->whereNull('deleted_at')->exists(), 404);
            DB::table('cards')->where('id', $id)->update($p);
            $s->audit('admin:'.$r->user()->id, 'CARD_STATUS', 'OK', null, ['card_id' => $id, 'status' => $p['status']]);

            return ['success' => true];
        });
    }

    public function topup(Request $r, ParkingService $s)
    {
        $p = $r->validate(['request_id' => 'required|uuid', 'claim_id' => 'required|uuid', 'amount' => ['required', new Rupiah]]);

        return $s->topup($r->user()->id, $p, hash('sha256', $r->session()->getId()));
    }

    public function mode(Request $r, int $id, ParkingService $s)
    {
        $p = $r->validate(['mode' => 'required|in:REGISTER,TOPUP,ENTRY,EXIT,AUTO', 'expected_version' => 'nullable|integer|min:1']);

        return DB::transaction(function () use ($p, $id, $r, $s) {
            DB::table('settings')->where('id', 1)->lockForUpdate()->first();
            $d = DB::table('devices')->where('id', $id)->lockForUpdate()->first();
            abort_unless($d && $d->enabled, 422, 'DEVICE_DISABLED');
            if (isset($p['expected_version'])) abort_unless((int)$d->mode_version === (int)$p['expected_version'], 409, 'MODE_CHANGED');
            DB::table('devices')->where('id', $id)->update(['mode' => $p['mode'], 'mode_version' => $d->mode_version + 1]);
            $s->audit('admin:'.$r->user()->id, 'MODE', 'OK', null, ['mode' => $p['mode'], 'mode_version' => $d->mode_version + 1]);

            return ['success' => true, 'mode' => $p['mode'], 'mode_version' => $d->mode_version + 1];
        });
    }

    public function settings(Request $r, ParkingService $s)
    {
        $p = $r->validate(['rate' => ['required', new Rupiah], 'topup_min' => ['required', new Rupiah], 'topup_max' => ['required', new Rupiah, 'gte:topup_min'], 'duration_ms' => 'required|integer|min:500|max:5000']);

        return DB::transaction(function () use ($p, $r, $s) {
            $old = DB::table('settings')->where('id', 1)->lockForUpdate()->first();
            DB::table('settings')->where('id', 1)->update($p);
            if ($old->rate !== $p['rate']) {
                DB::table('parking_rates')->insert(['amount' => $p['rate'], 'created_by' => $r->user()->id, 'created_at' => now()]);
            }$s->audit('admin:'.$r->user()->id, 'SETTINGS', 'OK');

            return ['success' => true];
        });
    }

    public function scan(Request $r, ParkingService $s)
    {
        $p = $r->validate(['request_id' => 'required|uuid', 'uid' => ['required', 'string', 'regex:/^(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{14}|[0-9A-Fa-f]{20})$/'], 'mode_version' => 'required|integer|min:1', 'scanned_at' => 'required|date']);
        $p['uid'] = strtoupper($p['uid']);
        $d = $r->attributes->get('device');
        if (! DB::table('operation_requests')->where('scope', 'device:'.$d->id)->where('request_id', $p['request_id'])->exists()) {
            $s->publish($d->id, 'PROCESSING');
        }$result = $s->scan($d, $p);

        return response()->json($result, in_array($result['code'], ['STALE_MODE', 'STALE_SCAN']) ? 409 : 200);
    }

    public function config(Request $r)
    {
        $d = $r->attributes->get('device');

        return ['mode' => $d->mode, 'mode_version' => $d->mode_version, 'server_epoch' => now()->timestamp, 'heartbeat_interval_ms' => 5000];
    }

    public function heartbeat(Request $r)
    {
        $p = $r->validate(['commanded_position' => 'required_without:gate_state|in:OPEN,CLOSED,UNKNOWN', 'gate_state' => 'required_without:commanded_position|in:COMMANDED_OPEN,COMMANDED_CLOSED,UNKNOWN', 'rssi' => 'nullable|integer|between:-127,0', 'sent_at' => 'nullable|date', 'mode_version' => 'nullable|integer|min:0', 'boot' => 'nullable|boolean', 'reader_ready' => 'nullable|boolean']);
        if (isset($p['sent_at'])) {
            abort_if(abs(now()->timestamp - strtotime($p['sent_at'])) > 30, 409, 'STALE_HEARTBEAT');
        }$position = $p['commanded_position'] ?? match ($p['gate_state']) {
            'COMMANDED_OPEN' => 'OPEN','COMMANDED_CLOSED' => 'CLOSED',default => 'UNKNOWN'
        };
        $update = ['last_seen_at' => now(), 'commanded_position' => $position];
        if (isset($p['mode_version'])) {
            $update['reported_mode_version'] = $p['mode_version'];
        }
        if (isset($p['rssi'])) {
            $update['rssi'] = $p['rssi'];
        }if (isset($p['reader_ready'])) {
            $update['reader_ready'] = $p['reader_ready'];
        }if ($p['boot'] ?? false) {
            $update['boot_at'] = now();
        }$id = $r->attributes->get('device')->id;
        DB::table('devices')->where('id', $id)->update($update);
        $d = DB::table('devices')->where('id', $id)->first();

        return ['success' => true, 'mode' => $d->mode, 'mode_version' => $d->mode_version, 'server_epoch' => now()->timestamp];
    }

    public function result(Request $r, string $id)
    {
        $op = DB::table('operation_requests')->where('scope', 'device:'.$r->attributes->get('device')->id)->where('request_id', $id)->first();
        abort_unless($op, 404);

        return json_decode($op->result, true);
    }

    public function ack(Request $r, string $id)
    {
        $p = $r->validate(['status' => 'required|in:OPEN_COMMANDED,CLOSED_COMMANDED,EXPIRED,EXECUTED', 'acknowledged_at' => 'nullable|date']);

        return DB::transaction(function () use ($id, $r, $p) {
            $q = DB::table('gate_commands')->where('id', $id)->where('device_id', $r->attributes->get('device')->id);
            $cmd = $q->lockForUpdate()->first();
            abort_unless($cmd, 404);
            $state = $p['status'] === 'EXECUTED' ? 'OPEN_COMMANDED' : $p['status'];
            if (in_array($cmd->execution_status, ['CLOSED_COMMANDED', 'EXPIRED'])) {
                return ['success' => true, 'status' => $cmd->execution_status];
            }if ($state === 'OPEN_COMMANDED' && now()->gte($cmd->expires_at)) {
                $state = 'EXPIRED';
            }$q->update(['execution_status' => $state, 'acknowledged_at' => now()]);

            return ['success' => true, 'status' => $state];
        });
    }

    public function devices()
    {
        return DB::table('devices')->select('id', 'name', 'mode', 'mode_version', 'reported_mode_version', 'enabled', 'last_seen_at', 'commanded_position', 'rssi', 'reader_ready', 'boot_at')->get()->map(function ($d) {
            $d->online = $d->enabled && $d->last_seen_at && now()->diffInSeconds($d->last_seen_at, true) < 15;
            $d->last_command = DB::table('gate_commands')->where('device_id', $d->id)->latest('expires_at')->first();

            return $d;
        });
    }

    public function latestScan()
    {
        return ['scan' => DB::table('scan_events')->latest('id')->first()];
    }

    public function parking(Request $r)
    {
        $p = $r->validate(['status' => 'nullable|in:ACTIVE,COMPLETED', 'card_id' => 'nullable|integer', 'from' => 'nullable|date_format:Y-m-d', 'to' => 'nullable|date_format:Y-m-d']);
        $q = DB::table('parking_sessions as p')->join('cards as c', 'c.id', '=', 'p.card_id')->select('p.*','c.uid')->selectRaw('c.uid as name');
        foreach (['status', 'card_id'] as $f) {
            if (isset($p[$f])) {
                $q->where('p.'.$f, $p[$f]);
            }
        }if (isset($p['from'])) {
            $q->whereDate('entry_at', '>=', $p['from']);
        }if (isset($p['to'])) {
            $q->whereDate('entry_at', '<=', $p['to']);
        }

        return $q->orderByDesc('p.id')->limit(500)->get();
    }

    private function historyQuery(Request $r)
    {
        $p = $r->validate(['card_id' => 'nullable|integer|min:1', 'type' => 'nullable|in:TOPUP,PARKING_PAYMENT,SCAN_REJECTED', 'status' => 'nullable|in:SUCCESS,REJECTED', 'from' => 'nullable|date_format:Y-m-d', 'to' => 'nullable|date_format:Y-m-d', 'query' => 'nullable|string|max:100', 'page' => 'nullable|integer|min:1']);
        $a = DB::table('transactions as t')->join('cards as c', 'c.id', '=', 't.card_id')->selectRaw("t.id, t.card_id, c.uid as name, c.uid, t.type, t.amount, t.balance_before, t.balance_after, t.request_id, t.created_at, 'SUCCESS' as status, NULL as reason");
        $b = DB::table('scan_events as s')->leftJoin('cards as c', 'c.uid', '=', 's.uid')->whereNotIn('s.result_code', ['ENTRY_SUCCESS', 'EXIT_SUCCESS', 'REGISTER_SCAN', 'TOPUP_SCAN'])->selectRaw("s.id, c.id as card_id, s.uid as name, s.uid, 'SCAN_REJECTED' as type, NULL as amount, NULL as balance_before, NULL as balance_after, s.request_id, s.created_at, 'REJECTED' as status, s.result_code as reason");
        $q = DB::query()->fromSub($a->unionAll($b), 'history');
        foreach (['card_id', 'type', 'status'] as $f) {
            if (isset($p[$f])) {
                $q->where($f, $p[$f]);
            }
        }if (isset($p['from'])) {
            $q->whereDate('created_at', '>=', $p['from']);
        }if (isset($p['to'])) {
            $q->whereDate('created_at', '<=', $p['to']);
        }if (isset($p['query'])) {
            $v = '%'.$p['query'].'%';
            $q->where(fn ($x) => $x->where('name', 'like', $v)->orWhere('request_id', 'like', $v));
        }

        return $q->orderByDesc('created_at')->orderByDesc('id');
    }

    public function transactions(Request $r)
    {
        return $this->historyQuery($r)->paginate(25);
    }

    public function csv(Request $r)
    {
        $query = $this->historyQuery($r);

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['type', 'status', 'card_id', 'uid', 'amount', 'balance_before', 'balance_after', 'request_id', 'UTC', 'reason']);
            foreach ($query->cursor() as $row) {
                $data = [$row->type, $row->status, $row->card_id, $row->uid, $row->amount, $row->balance_before, $row->balance_after, $row->request_id, $row->created_at, $row->reason];
                fputcsv($out, array_map(fn ($v) => is_string($v) && preg_match('/^[=+@\-]/', $v) ? "'".$v : $v, $data));
            }fclose($out);
        }, 'oneparking-transactions.csv', ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'no-store']);
    }

    public function display()
    {
        $d = DB::table('devices')->first();
        $fresh = $d && $d->enabled && $d->last_seen_at && now()->diffInSeconds($d->last_seen_at, true) < 15;
        $event = $d ? DB::table('display_events')->where('device_id', $d->id)->latest('id')->first() : null;
        $recent = $event && now()->diffInSeconds($event->created_at, true) < 5;
        $code = $fresh ? ($recent ? $event->code : 'STANDBY') : 'OFFLINE';
        $map = ['ALREADY_INSIDE' => 'INVALID_SESSION', 'STALE_MODE' => 'ERROR', 'STALE_SCAN' => 'ERROR', 'TOPUP_SCAN' => 'TOPUP_SCAN'];

        return ['mode' => $d?->mode, 'online' => (bool) $fresh, 'code' => $map[$code] ?? $code, 'fee' => $fresh && $recent ? $event->fee : null, 'balance_after' => $fresh && $recent ? $event->balance_after : null, 'gate' => 'Posisi fisik tidak terverifikasi', 'rate' => (int) DB::table('settings')->value('rate'), 'server_time' => now()->toIso8601String()];
    }
}
