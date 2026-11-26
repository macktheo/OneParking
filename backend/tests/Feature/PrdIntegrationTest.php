<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class PrdIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private string $token = 'qa-test-device-token-32-or-more-characters';

    protected function setUp(): void
    {
        parent::setUp();
        DB::table('settings')->insert(['id' => 1]);
        DB::table('devices')->insert(['id' => 1, 'name' => 'Test gate', 'credential_hash' => hash('sha256', $this->token)]);
    }

    private function admin(): User
    {
        $u = User::factory()->create();
        $u->role = 'admin';
        $u->save();
        $this->actingAs($u);

        return $u;
    }

    private function scan(string $mode = 'REGISTER', ?string $request = null)
    {
        DB::table('devices')->where('id', 1)->update(['mode' => $mode]);

        return $this->withToken($this->token)->postJson('/api/v1/device/scan', ['request_id' => $request ?? (string) Str::uuid(), 'uid' => '001234AB', 'mode_version' => 1, 'scanned_at' => now()->toIso8601String()]);
    }

    private function card(): int
    {
        $h = DB::table('holders')->insertGetId(['name' => '<script>alert(1)</script>', 'student_number' => '0001', 'vehicle_plate' => 'TEST']);

        return DB::table('cards')->insertGetId(['holder_id' => $h, 'uid' => '001234AB', 'balance' => 0]);
    }

    public function test_supplied_firmware_heartbeat_and_command_ack_contract(): void
    {
        $this->withToken($this->token)->postJson('/api/v1/device/heartbeat', ['gate_state' => 'COMMANDED_CLOSED', 'mode_version' => 0, 'rssi' => -55, 'sent_at' => now()->toIso8601String(), 'reader_ready' => true, 'boot' => true])->assertOk()->assertJsonPath('mode', 'REGISTER')->assertJsonPath('mode_version', 1);
        $this->card();
        $result = $this->scan('ENTRY')->assertJsonPath('code', 'ENTRY_SUCCESS')->json();
        $id = $result['gate_command']['id'];
        $this->withToken($this->token)->postJson('/api/v1/device/commands/'.$id.'/ack', ['status' => 'EXECUTED'])->assertOk()->assertJsonPath('status', 'OPEN_COMMANDED');
        $this->postJson('/api/v1/device/commands/'.$id.'/ack', ['status' => 'CLOSED_COMMANDED'])->assertOk();
        $this->postJson('/api/v1/device/commands/'.$id.'/ack', ['status' => 'EXECUTED'])->assertJsonPath('status', 'CLOSED_COMMANDED');
    }

    public function test_results_and_commands_are_owned_by_device(): void
    {
        $this->card();
        $id = (string) Str::uuid();
        $result = $this->scan('ENTRY', $id)->json();
        $other = 'other-device-secret-at-least-32-characters';
        DB::table('devices')->insert(['id' => 2, 'name' => 'Other', 'credential_hash' => hash('sha256', $other)]);
        $this->withToken($other)->getJson('/api/v1/device/requests/'.$id)->assertNotFound();
        $this->postJson('/api/v1/device/commands/'.$result['gate_command']['id'].'/ack', ['status' => 'EXECUTED'])->assertNotFound();
        $this->withToken($this->token)->getJson('/api/v1/device/requests/'.$id)->assertJsonPath('code', 'ENTRY_SUCCESS');
    }

    public function test_expired_command_ack_never_revives_command(): void
    {
        $this->card();
        $result = $this->scan('ENTRY')->json();
        $this->travel(11)->seconds();
        $this->withToken($this->token)->postJson('/api/v1/device/commands/'.$result['gate_command']['id'].'/ack', ['status' => 'EXECUTED'])->assertJsonPath('status', 'EXPIRED');
    }

    public function test_device_config_and_admin_device_data_do_not_expose_token(): void
    {
        $this->withToken($this->token)->getJson('/api/v1/device/config')->assertOk()->assertJsonMissingPath('credential_hash');
        $this->admin();
        $r = $this->getJson('/api/v1/admin/devices')->assertOk();
        $this->assertStringNotContainsString($this->token, $r->getContent());
        $this->assertStringNotContainsString('credential_hash', $r->getContent());
    }

    public function test_claim_expiry_and_consumed_scan_cannot_be_reclaimed(): void
    {
        $this->admin();
        $this->scan();
        $claim = $this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $this->travel(61)->seconds();
        $this->postJson('/api/v1/admin/cards', ['claim_id' => $claim, 'name' => 'Test', 'student_number' => '0001', 'vehicle_plate' => 'TEST'])->assertUnprocessable();
        $this->assertDatabaseCount('cards', 0);
    }

    public function test_create_holder_then_attach_scanned_card(): void
    {
        $this->admin();
        $h = $this->postJson('/api/v1/admin/holders', ['name' => 'Test', 'student_number' => '0001', 'vehicle_plate' => 'TEST'])->assertOk()->json('id');
        $this->scan();
        $claim = $this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $this->postJson('/api/v1/admin/cards', ['holder_id' => $h, 'claim_id' => $claim])->assertOk();
        $this->assertDatabaseCount('holders', 1);
        $this->assertDatabaseHas('cards', ['holder_id' => $h, 'balance' => 0]);
    }

    public function test_rejected_scans_appear_in_history_and_filters_csv(): void
    {
        $this->scan('ENTRY')->assertJsonPath('code', 'UNKNOWN_CARD');
        $this->admin();
        $r = $this->getJson('/api/v1/admin/transactions?status=REJECTED&type=SCAN_REJECTED')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.reason', 'UNKNOWN_CARD');
        $this->getJson('/api/v1/admin/transactions?status=SUCCESS')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/admin/transactions/export?status=REJECTED')->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->getJson('/api/v1/admin/transactions?from=not-date')->assertUnprocessable();
    }

    public function test_topup_request_lookup_is_scoped_to_admin(): void
    {
        $this->admin();
        $this->card();
        $this->scan('TOPUP');
        $claim = $this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $id = (string) Str::uuid();
        $this->postJson('/api/v1/admin/topup', ['claim_id' => $claim, 'request_id' => $id, 'amount' => 20000])->assertOk();
        $this->getJson('/api/v1/admin/requests/'.$id)->assertJsonPath('balance_after', 20000);
        $this->admin();
        $this->getJson('/api/v1/admin/requests/'.$id)->assertNotFound();
    }

    public function test_boolean_and_string_nominals_rejected_without_balance_changes(): void
    {
        $this->admin();
        $this->card();
        $this->scan('TOPUP');
        $claim = $this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        foreach ([true, false, '20000', 2000.5, 0, -100, 100000001] as $amount) {
            $this->postJson('/api/v1/admin/topup', ['claim_id' => $claim, 'request_id' => (string) Str::uuid(), 'amount' => $amount])->assertUnprocessable();
        }$this->assertDatabaseHas('cards', ['balance' => 0]);
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_disabled_and_invalid_credentials_rejected(): void
    {
        DB::table('devices')->update(['enabled' => false]);
        $this->withToken($this->token)->postJson('/api/v1/device/heartbeat', ['gate_state' => 'COMMANDED_CLOSED'])->assertUnauthorized();
        $this->withToken('bad-token')->getJson('/api/v1/device/config')->assertUnauthorized();
    }

    public function test_inactive_user_cannot_login_and_profile_is_safe(): void
    {
        $u = User::factory()->create(['password' => Hash::make('test-password-123')]);
        $u->active = false;
        $u->save();
        $this->postJson('/login', ['email' => $u->email, 'password' => 'test-password-123'])->assertUnprocessable();
        $this->getJson('/api/v1/auth/user')->assertUnauthorized();
        $this->admin();
        $this->getJson('/api/v1/auth/user')->assertOk()->assertJsonMissingPath('password')->assertJsonMissingPath('remember_token');
    }

    public function test_ledger_is_immutable_and_cannot_record_negative_balance(): void
    {
        $this->admin();
        $id = $this->card();
        $this->scan('TOPUP');
        $claim = $this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $this->postJson('/api/v1/admin/topup', ['claim_id' => $claim, 'request_id' => (string) Str::uuid(), 'amount' => 20000])->assertOk();
        foreach (['update', 'delete'] as $op) {
            try {
                DB::transaction(function () use ($op) {
                    $q = DB::table('transactions');
                    if ($op === 'update') {
                        $q->update(['amount' => 1]);
                    } else {
                        $q->delete();
                    }
                });
                $this->fail('Ledger mutation accepted');
            } catch (QueryException $e) {
                $this->assertNotEmpty($e->getMessage());
            }
        }$this->assertDatabaseCount('transactions', 1);
        $this->assertDatabaseHas('cards', ['id' => $id, 'balance' => 20000]);
        $this->artisan('parking:reconcile')->assertSuccessful();
    }

    public function test_generated_guard_protects_active_session_even_if_manual_guard_is_wrong(): void
    {
        $id = $this->card();
        $this->scan('ENTRY');
        $this->expectException(QueryException::class);
        DB::transaction(fn () => DB::table('parking_sessions')->insert(['card_id' => $id, 'active_card_id' => $id + 100, 'entry_at' => now(), 'fee_snapshot' => 2000, 'status' => 'ACTIVE']));
    }

    public function test_display_denies_public_network_and_clears_result(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.15'])->getJson('/api/v1/display/status')->assertForbidden();
        $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1']);
        $this->card();
        $this->scan('ENTRY');
        $this->withToken($this->token)->postJson('/api/v1/device/heartbeat', ['gate_state' => 'COMMANDED_CLOSED']);
        $this->getJson('/api/v1/display/status')->assertJsonPath('code', 'ENTRY_SUCCESS');
        $this->travel(6)->seconds();
        $this->getJson('/api/v1/display/status')->assertJsonPath('code', 'STANDBY')->assertJsonPath('balance_after', null);
    }

    public function test_stale_heartbeat_and_sql_shaped_uid_are_rejected(): void
    {
        $this->withToken($this->token)->postJson('/api/v1/device/heartbeat', ['gate_state' => 'COMMANDED_CLOSED', 'sent_at' => now()->subMinute()->toIso8601String()])->assertConflict();
        $this->postJson('/api/v1/device/scan', ['request_id' => (string) Str::uuid(), 'uid' => "' OR 1=1 --", 'mode_version' => 1, 'scanned_at' => now()->toIso8601String()])->assertUnprocessable();
        $this->assertDatabaseCount('parking_sessions', 0);
    }

    public function test_scan_claim_is_bound_to_exact_session_even_for_same_admin(): void
    {
        $this->admin();
        $this->scan();
        $claim = $this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $this->withCookie(config('session.cookie'), str_repeat('a', 40));
        $this->postJson('/api/v1/admin/cards', ['claim_id' => $claim, 'name' => 'Test', 'student_number' => '001', 'vehicle_plate' => 'TEST'])->assertUnprocessable();
        $this->assertDatabaseCount('cards', 0);
    }

    public function test_claim_does_not_fall_back_after_latest_unknown_card(): void
    {
        $this->admin();
        $this->card();
        $this->scan('TOPUP')->assertJsonPath('code', 'TOPUP_SCAN');
        $this->withToken($this->token)->postJson('/api/v1/device/scan', ['request_id' => (string) Str::uuid(), 'uid' => 'DEADC0DE', 'mode_version' => 1, 'scanned_at' => now()->toIso8601String()])->assertJsonPath('code', 'UNKNOWN_CARD');
        $this->postJson('/api/v1/admin/scan-claims')->assertUnprocessable();
    }
    public function test_uid_only_registration_needs_no_holder_and_flows_through_exit():void {
        $this->admin();$this->scan();$claim=$this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $this->postJson('/api/v1/admin/cards',['claim_id'=>$claim])->assertOk()->assertJsonPath('uid','001234AB');
        $this->assertDatabaseCount('holders',0);$this->assertDatabaseHas('cards',['uid'=>'001234AB','holder_id'=>null,'balance'=>0]);
        $this->getJson('/api/v1/admin/cards')->assertJsonPath('0.uid','001234AB')->assertJsonMissingPath('0.student_number');
        $this->scan('TOPUP');$claim=$this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $this->postJson('/api/v1/admin/topup',['claim_id'=>$claim,'request_id'=>(string)Str::uuid(),'amount'=>20000])->assertOk();
        $this->scan('ENTRY')->assertJsonPath('code','ENTRY_SUCCESS');
        $this->getJson('/api/v1/admin/parking')->assertJsonPath('0.uid','001234AB');
        $this->scan('EXIT')->assertJsonPath('code','EXIT_SUCCESS')->assertJsonPath('balance_after',18000);
        $this->getJson('/api/v1/admin/transactions?type=PARKING_PAYMENT')->assertJsonPath('data.0.uid','001234AB');
        $this->artisan('parking:reconcile')->assertSuccessful();
    }
    public function test_uid_schema_change_preserves_nonnegative_card_balance_guard():void {
        $id=$this->card();$this->expectException(\Illuminate\Database\QueryException::class);
        DB::transaction(fn()=>DB::table('cards')->where('id',$id)->update(['balance'=>-1]));
    }
}
