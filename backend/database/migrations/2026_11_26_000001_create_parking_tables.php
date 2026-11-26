<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->string('role')->default('viewer'));
        Schema::create('settings', function (Blueprint $t) {
            $t->id();
            $t->unsignedInteger('rate')->default(2000);
            $t->unsignedInteger('topup_min')->default(1000);
            $t->unsignedInteger('topup_max')->default(1000000);
            $t->unsignedInteger('duration_ms')->default(3000);
        });
        Schema::create('devices', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('credential_hash', 64);
            $t->boolean('enabled')->default(true);
            $t->string('mode')->default('REGISTER');
            $t->unsignedInteger('mode_version')->default(1);
            $t->timestamp('last_seen_at')->nullable();
            $t->string('commanded_position')->default('UNKNOWN');
        });
        Schema::create('holders', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('student_number');
            $t->string('vehicle_plate');
        });
        Schema::create('cards', function (Blueprint $t) {
            $t->id();
            $t->foreignId('holder_id')->constrained('holders');
            $t->string('uid', 20)->unique();
            $t->unsignedBigInteger('balance')->default(0);
            $t->string('status')->default('ACTIVE');
        });
        Schema::create('parking_sessions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('card_id')->constrained('cards');
            $t->unsignedBigInteger('active_card_id')->nullable()->unique();
            $t->timestamp('entry_at');
            $t->timestamp('exit_at')->nullable();
            $t->unsignedInteger('fee_snapshot');
            $t->string('status')->default('ACTIVE');
        });
        Schema::create('transactions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('card_id')->constrained('cards');
            $t->foreignId('session_id')->nullable()->unique()->constrained('parking_sessions');
            $t->string('type');
            $t->unsignedBigInteger('amount');
            $t->unsignedBigInteger('balance_before');
            $t->unsignedBigInteger('balance_after');
            $t->unsignedBigInteger('actor_id')->nullable();
            $t->uuid('request_id');
            $t->timestamp('created_at');
        });
        Schema::create('operation_requests', function (Blueprint $t) {
            $t->id();
            $t->string('scope');
            $t->uuid('request_id');
            $t->string('payload_hash', 64);
            $t->text('result');
            $t->unique(['scope', 'request_id']);
        });
        Schema::create('scan_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('device_id')->constrained('devices');
            $t->string('uid', 20);
            $t->unsignedInteger('mode_version');
            $t->string('mode');
            $t->uuid('request_id');
            $t->string('result_code');
            $t->timestamp('created_at');
        });
        Schema::create('scan_claims', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('scan_id')->constrained('scan_events');
            $t->foreignId('user_id')->constrained('users');
            $t->timestamp('expires_at');
            $t->boolean('used')->default(false);
        });
        Schema::create('gate_commands', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('scan_id')->unique()->constrained('scan_events');
            $t->foreignId('device_id')->constrained('devices');
            $t->timestamp('expires_at');
            $t->unsignedInteger('duration_ms');
            $t->string('execution_status')->default('PENDING');
            $t->timestamp('acknowledged_at')->nullable();
        });
        Schema::create('audit_logs', function (Blueprint $t) {
            $t->id();
            $t->string('actor');
            $t->string('action');
            $t->string('result');
            $t->string('request_id')->nullable();
            $t->timestamp('created_at');
        });
    }

    public function down(): void
    {
        foreach (['audit_logs', 'gate_commands', 'scan_claims', 'scan_events', 'operation_requests', 'transactions', 'parking_sessions', 'cards', 'holders', 'devices', 'settings'] as $table) {
            Schema::dropIfExists($table);
        }Schema::table('users', fn (Blueprint $t) => $t->dropColumn('role'));
    }
};
