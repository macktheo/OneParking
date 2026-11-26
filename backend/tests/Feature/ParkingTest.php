<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class ParkingTest extends TestCase
{
    use RefreshDatabase;

    private string $token = 'test-only-device-token-at-least-32-chars';

    protected function setUp(): void
    {
        parent::setUp();
        DB::table('settings')->insert(['id' => 1]);
        DB::table('devices')->insert(['id' => 1, 'name' => 'Test', 'credential_hash' => hash('sha256', $this->token)]);
    }

    private function admin(): User
    {
        $u = User::factory()->create();
        DB::table('users')->where('id', $u->id)->update(['role' => 'admin']);
        $u->refresh();
        $this->actingAs($u);

        return $u;
    }

    private function mode(string $mode): void
    {
        DB::table('devices')->where('id', 1)->update(['mode' => $mode]);
    }

    private function scan(?array $p = null)
    {
        return $this->withToken($this->token)->postJson('/api/v1/device/scan', $p ?? $this->payload());
    }

    private function payload(): array
    {
        return ['request_id' => (string) Str::uuid(), 'uid' => '0012ABCD', 'mode_version' => 1, 'scanned_at' => now()->toIso8601String()];
    }

    private function card(int $balance = 20000): int
    {
        $h = DB::table('holders')->insertGetId(['name' => 'Dummy', 'student_number' => '001', 'vehicle_plate' => 'TEST']);

        return DB::table('cards')->insertGetId(['holder_id' => $h, 'uid' => '0012ABCD', 'balance' => $balance]);
    }

    public function test_device_auth_and_admin_rbac(): void
    {
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
        $this->postJson('/api/v1/device/scan', [])->assertUnauthorized();
        $this->actingAs(User::factory()->create())->postJson('/api/v1/admin/topup', [])->assertForbidden();
    }

    public function test_delete_card_keeps_history_and_balance_and_reregistration_restores_uid(): void
    {
        $this->admin(); $id=$this->card();
        $this->mode('ENTRY'); $this->scan()->assertJsonPath('code','ENTRY_SUCCESS');
        $this->mode('EXIT'); $this->scan()->assertJsonPath('code','EXIT_SUCCESS');
        $this->deleteJson('/api/v1/admin/cards/'.$id)->assertOk();
        $this->deleteJson('/api/v1/admin/cards/'.$id)->assertOk();
        $this->getJson('/api/v1/admin/cards')->assertJsonCount(0);
        $this->getJson('/api/v1/admin/dashboard')->assertJsonPath('active_cards',0);
        $this->assertDatabaseHas('cards',['id'=>$id,'balance'=>18000]);
        $this->assertNotNull(DB::table('cards')->where('id',$id)->value('deleted_at'));
        $this->assertDatabaseCount('transactions',1);
        $this->getJson('/api/v1/admin/transactions?card_id='.$id)->assertJsonPath('data.0.uid','0012ABCD');
        $this->mode('ENTRY');$this->scan()->assertJsonPath('code','UNKNOWN_CARD')->assertJsonPath('gate_command',null);
        $this->patchJson('/api/v1/admin/cards/'.$id.'/status',['status'=>'ACTIVE'])->assertNotFound();
        $this->mode('REGISTER');$this->scan();
        $claim=$this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $this->postJson('/api/v1/admin/cards',['claim_id'=>$claim])->assertOk()->assertJsonPath('id',$id)->assertJsonPath('balance',18000)->assertJsonPath('restored',true);
        $this->assertDatabaseHas('cards',['id'=>$id,'deleted_at'=>null,'status'=>'ACTIVE','balance'=>18000]);
        $this->assertDatabaseCount('cards',1);
        $this->assertSame(1,DB::table('audit_logs')->where('action','CARD_DELETE')->count());
    }

    public function test_delete_rejects_active_parking_and_requires_admin(): void
    {
        $id=$this->card();
        $this->deleteJson('/api/v1/admin/cards/'.$id)->assertUnauthorized();
        $this->actingAs(User::factory()->create())->deleteJson('/api/v1/admin/cards/'.$id)->assertForbidden();
        $this->admin();$this->mode('ENTRY');$this->scan();
        $this->deleteJson('/api/v1/admin/cards/'.$id)->assertConflict()->assertJsonPath('message','CARD_HAS_ACTIVE_SESSION');
        $this->assertDatabaseHas('cards',['id'=>$id,'deleted_at'=>null]);
        $this->assertDatabaseHas('parking_sessions',['card_id'=>$id,'status'=>'ACTIVE']);
    }

    public function test_delete_invalidates_an_existing_topup_claim(): void
    {
        $this->admin();$id=$this->card();$this->mode('TOPUP');$this->scan();
        $claim=$this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $this->deleteJson('/api/v1/admin/cards/'.$id)->assertOk();
        $this->postJson('/api/v1/admin/topup',['request_id'=>(string)Str::uuid(),'claim_id'=>$claim,'amount'=>10000])->assertUnprocessable()->assertJsonPath('message','CARD_NOT_ACTIVE');
        $this->assertDatabaseHas('cards',['id'=>$id,'balance'=>20000]);
        $this->assertDatabaseCount('transactions',0);
    }

    public function test_register_preserves_leading_zero_and_scan_is_single_use(): void
    {
        $this->admin();
        $this->scan()->assertJsonPath('code', 'REGISTER_SCAN')->assertJsonPath('gate_command', null);
        $claim = $this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $this->postJson('/api/v1/admin/cards', ['claim_id' => $claim, 'name' => 'Test', 'student_number' => '001', 'vehicle_plate' => 'B1'])->assertOk();
        $this->assertDatabaseHas('cards', ['uid' => '0012ABCD', 'balance' => 0]);
        $this->postJson('/api/v1/admin/scan-claims')->assertUnprocessable();
    }

    public function test_entry_exit_retry_and_rate_snapshot(): void
    {
        $id = $this->card();
        $this->mode('ENTRY');
        $p = $this->payload();
        $first = $this->scan($p)->assertOk()->assertJsonPath('code', 'ENTRY_SUCCESS')->json();
        $this->scan($p)->assertExactJson($first);
        $this->scan()->assertJsonPath('code', 'ALREADY_INSIDE')->assertJsonPath('gate_command', null);
        DB::table('settings')->update(['rate' => 9000]);
        $this->mode('EXIT');
        $p = $this->payload();
        $this->scan($p)->assertJsonPath('fee', 2000)->assertJsonPath('balance_after', 18000);
        for ($i = 0; $i < 10; $i++) {
            $this->scan($p)->assertJsonPath('balance_after', 18000);
        }$this->scan()->assertJsonPath('code', 'INVALID_SESSION');
        $this->assertDatabaseCount('transactions', 1);
        $this->assertDatabaseHas('cards', ['id' => $id, 'balance' => 18000]);
    }

    public function test_auto_mode_enters_then_exits_and_retries_do_not_toggle_again(): void
    {
        $id = $this->card();
        $this->mode('AUTO');
        $entry = $this->payload();
        $this->scan($entry)->assertJsonPath('code', 'ENTRY_SUCCESS');
        $this->scan($entry)->assertJsonPath('code', 'ENTRY_SUCCESS');
        $this->assertDatabaseCount('parking_sessions', 1);
        $exit = $this->payload();
        $this->scan($exit)->assertJsonPath('code', 'EXIT_SUCCESS')->assertJsonPath('balance_after', 18000);
        $this->scan($exit)->assertJsonPath('code', 'EXIT_SUCCESS');
        $this->assertDatabaseCount('transactions', 1);
        $this->assertDatabaseHas('cards', ['id' => $id, 'balance' => 18000]);
        $this->assertDatabaseCount('gate_commands', 2);
    }

    public function test_mode_restore_cannot_overwrite_a_newer_operator_choice(): void
    {
        $this->admin();
        $this->patchJson('/api/v1/admin/devices/1/mode', ['mode'=>'AUTO', 'expected_version'=>1])->assertOk();
        $this->patchJson('/api/v1/admin/devices/1/mode', ['mode'=>'ENTRY', 'expected_version'=>1])->assertConflict();
        $this->assertDatabaseHas('devices', ['id'=>1, 'mode'=>'AUTO', 'mode_version'=>2]);
    }

    public function test_insufficient_balance_keeps_session_and_gate_closed(): void
    {
        $this->card(0);
        $this->mode('ENTRY');
        $this->scan();
        $this->mode('EXIT');
        $this->scan()->assertJsonPath('code', 'INSUFFICIENT_BALANCE')->assertJsonPath('gate_command', null);
        $this->assertDatabaseHas('parking_sessions', ['status' => 'ACTIVE']);
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_blocked_unknown_stale_mode_and_replay_conflict(): void
    {
        $this->mode('ENTRY');
        $this->scan()->assertJsonPath('code', 'UNKNOWN_CARD');
        $id = $this->card();
        DB::table('cards')->where('id', $id)->update(['status' => 'BLOCKED']);
        $this->scan()->assertJsonPath('code', 'BLOCKED_CARD');
        $p = $this->payload();
        $p['mode_version'] = 9;
        $this->scan($p)->assertJsonPath('code', 'STALE_MODE');
        $p['uid'] = '12345678';
        $this->scan($p)->assertConflict();
        $p = $this->payload();
        $p['scanned_at'] = now()->subMinute()->toIso8601String();
        $this->scan($p)->assertJsonPath('code', 'STALE_SCAN');
    }

    public function test_topup_exactly_once_and_invalid_amounts(): void
    {
        $this->admin();
        $this->card(0);
        $this->mode('TOPUP');
        $this->scan()->assertJsonPath('gate_command', null);
        $claim = $this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $p = ['request_id' => (string) Str::uuid(), 'claim_id' => $claim, 'amount' => 20000];
        foreach ([0, -1, 1.5, 'abc', 999, 1000001] as $amount) {
            $invalid = $p;
            $invalid['amount'] = $amount;
            $this->postJson('/api/v1/admin/topup', $invalid)->assertUnprocessable();
        }$this->postJson('/api/v1/admin/topup', $p)->assertOk()->assertJsonPath('balance_after', 20000);
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/admin/topup', $p)->assertJsonPath('balance_after', 20000);
        }$p['amount'] = 30000;
        $this->postJson('/api/v1/admin/topup', $p)->assertConflict();
        $this->assertDatabaseCount('transactions', 1);
    }

    public function test_claim_cannot_cross_admin_sessions(): void
    {
        $first = $this->admin();
        $this->scan();
        $claim = $this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $this->admin();
        $this->postJson('/api/v1/admin/cards', ['claim_id' => $claim, 'name' => 'X', 'student_number' => 'Y', 'vehicle_plate' => 'Z'])->assertUnprocessable();
    }

    public function test_database_exception_rolls_back_entire_exit(): void
    {
        $this->card();
        $this->mode('ENTRY');
        $this->scan();
        $this->mode('EXIT');
        $injected = false;
        DB::listen(function ($event) use (&$injected) {
            if (! $injected && preg_match('/insert into [`"]?transactions/i', $event->sql)) {
                $injected = true;
                throw new \RuntimeException('Injected failure before commit');
            }
        });
        $this->scan()->assertStatus(500);
        $this->assertDatabaseHas('cards', ['balance' => 20000]);
        $this->assertDatabaseHas('parking_sessions', ['status' => 'ACTIVE', 'exit_at' => null]);
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_display_does_not_expose_identity_or_credentials(): void
    {
        $this->card();
        $this->mode('ENTRY');
        $this->scan();
        $this->withToken($this->token)->postJson('/api/v1/device/heartbeat', ['commanded_position' => 'CLOSED'])->assertOk();
        $r = $this->getJson('/api/v1/display/status')->assertOk()->assertJsonPath('code', 'ENTRY_SUCCESS');
        $this->assertStringNotContainsString('0012ABCD', $r->getContent());
        $this->assertStringNotContainsString($this->token, $r->getContent());
        $this->travel(16)->seconds();
        $this->getJson('/api/v1/display/status')->assertJsonPath('code', 'OFFLINE');
    }

    public function test_login_failure_rate_limit_and_logout(): void
    {
        $u = User::factory()->create(['password' => Hash::make('correct-test-password')]);
        $this->postJson('/login', ['email' => $u->email, 'password' => 'wrong'])->assertUnprocessable();
        $this->postJson('/login', ['email' => $u->email, 'password' => 'correct-test-password'])->assertOk();
        $this->postJson('/logout')->assertOk();
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/login', ['email' => $u->email, 'password' => 'wrong'])->assertUnprocessable();
        }$this->postJson('/login', ['email' => $u->email, 'password' => 'wrong'])->assertStatus(429);
    }

    public function test_claim_invalid_after_mode_change_and_no_balance_edit_api(): void
    {
        $this->admin();
        $id = $this->card(0);
        $this->mode('TOPUP');
        $this->scan();
        $claim = $this->postJson('/api/v1/admin/scan-claims')->json('claim_id');
        $this->patchJson('/api/v1/admin/devices/1/mode', ['mode' => 'ENTRY'])->assertOk();
        $this->postJson('/api/v1/admin/topup', ['request_id' => (string) Str::uuid(), 'claim_id' => $claim, 'amount' => 20000])->assertConflict();
        $this->patchJson('/api/v1/admin/cards/'.$id.'/balance', ['balance' => 99999])->assertNotFound();
        $this->assertDatabaseHas('cards', ['balance' => 0]);
    }
}
