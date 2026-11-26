<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'active')) {
            Schema::table('users', fn (Blueprint $t) => $t->boolean('active')->default(true));
        }
        if (! Schema::hasColumn('cards', 'created_at')) {
            Schema::table('cards', fn (Blueprint $t) => $t->timestamp('created_at')->nullable());
        }
        if (! Schema::hasColumn('devices', 'rssi')) {
            Schema::table('devices', function (Blueprint $t) {
                $t->integer('rssi')->nullable();
                $t->boolean('reader_ready')->nullable();
                $t->timestamp('boot_at')->nullable();
            });
        }
        if (! Schema::hasColumn('parking_sessions', 'active_card_guard')) {
            Schema::table('parking_sessions', function (Blueprint $t) {
                $t->unsignedBigInteger('active_card_guard')->nullable()->virtualAs("CASE WHEN status = 'ACTIVE' THEN card_id ELSE NULL END")->unique();
            });
        }
        if (! Schema::hasTable('parking_rates')) {
            Schema::create('parking_rates', function (Blueprint $t) {
                $t->id();
                $t->unsignedInteger('amount');
                $t->foreignId('created_by')->nullable()->constrained('users');
                $t->timestamp('created_at');
            });
        }
        if (! Schema::hasTable('display_events')) {
            Schema::create('display_events', function (Blueprint $t) {
                $t->id();
                $t->foreignId('device_id')->constrained('devices');
                $t->string('code');
                $t->unsignedInteger('fee')->nullable();
                $t->unsignedBigInteger('balance_after')->nullable();
                $t->timestamp('created_at');
            });
        }
        if (! DB::table('parking_rates')->exists()) {
            DB::table('parking_rates')->insert(['amount' => DB::table('settings')->value('rate') ?? 2000, 'created_at' => now()]);
        }
        $sqlite = DB::getDriverName() === 'sqlite';
        if ($sqlite) {
            foreach (['INSERT', 'UPDATE'] as $event) {
                DB::unprepared('CREATE TRIGGER cards_balance_'.strtolower($event)." BEFORE $event ON cards WHEN NEW.balance < 0 BEGIN SELECT RAISE(ABORT, 'negative balance'); END");
                DB::unprepared('CREATE TRIGGER sessions_guard_'.strtolower($event)." BEFORE $event ON parking_sessions WHEN NOT ((NEW.status = 'ACTIVE' AND NEW.active_card_id = NEW.card_id AND NEW.exit_at IS NULL) OR (NEW.status = 'COMPLETED' AND NEW.active_card_id IS NULL AND NEW.exit_at IS NOT NULL)) BEGIN SELECT RAISE(ABORT, 'invalid session state'); END");
            }
            DB::unprepared("CREATE TRIGGER ledger_valid BEFORE INSERT ON transactions WHEN NEW.amount <= 0 OR NEW.balance_before < 0 OR NEW.balance_after < 0 OR NOT ((NEW.type = 'TOPUP' AND NEW.session_id IS NULL AND NEW.balance_after = NEW.balance_before + NEW.amount) OR (NEW.type = 'PARKING_PAYMENT' AND NEW.session_id IS NOT NULL AND NEW.balance_after = NEW.balance_before - NEW.amount)) BEGIN SELECT RAISE(ABORT, 'invalid ledger'); END");
            foreach (['UPDATE', 'DELETE'] as $e) {
                DB::unprepared('CREATE TRIGGER ledger_no_'.strtolower($e)." BEFORE $e ON transactions BEGIN SELECT RAISE(ABORT, 'ledger immutable'); END");
            }
        } else {
            if (! $this->hasConstraint('cards_balance_nonnegative')) {
                DB::statement('ALTER TABLE cards ADD CONSTRAINT cards_balance_nonnegative CHECK (balance >= 0)');
            }
            if (! $this->hasConstraint('session_state_valid')) {
                DB::statement("ALTER TABLE parking_sessions ADD CONSTRAINT session_state_valid CHECK ((status = 'ACTIVE' AND active_card_id = card_id AND exit_at IS NULL) OR (status = 'COMPLETED' AND active_card_id IS NULL AND exit_at IS NOT NULL))");
            }
            if (! $this->hasConstraint('ledger_valid')) {
                DB::statement("ALTER TABLE transactions ADD CONSTRAINT ledger_valid CHECK (amount > 0 AND balance_before >= 0 AND balance_after >= 0 AND ((type = 'TOPUP' AND session_id IS NULL AND balance_after = balance_before + amount) OR (type = 'PARKING_PAYMENT' AND session_id IS NOT NULL AND balance_before = balance_after + amount)))");
            }
            foreach (['UPDATE', 'DELETE'] as $e) {
                DB::unprepared('CREATE TRIGGER ledger_no_'.strtolower($e)." BEFORE $e ON transactions FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ledger immutable'");
            }
        }
    }

    private function hasConstraint(string $name): bool
    {
        return DB::table('information_schema.TABLE_CONSTRAINTS')->where('CONSTRAINT_SCHEMA', DB::getDatabaseName())->where('CONSTRAINT_NAME', $name)->exists();
    }

    public function down(): void
    {
        foreach (['ledger_valid', 'ledger_no_update', 'ledger_no_delete', 'cards_balance_insert', 'cards_balance_update', 'sessions_guard_insert', 'sessions_guard_update'] as $name) {
            DB::unprepared('DROP TRIGGER IF EXISTS '.$name);
        }
        if (DB::getDriverName() !== 'sqlite') {
            foreach (['cards' => 'cards_balance_nonnegative', 'parking_sessions' => 'session_state_valid', 'transactions' => 'ledger_valid'] as $table => $name) {
                DB::statement("ALTER TABLE $table DROP CHECK $name");
            }
        }
        Schema::dropIfExists('display_events');
        Schema::dropIfExists('parking_rates');
        Schema::table('parking_sessions', function (Blueprint $t) {
            $t->dropUnique(['active_card_guard']);
            $t->dropColumn('active_card_guard');
        });
        Schema::table('devices', fn (Blueprint $t) => $t->dropColumn(['rssi', 'reader_ready', 'boot_at']));
        Schema::table('cards', fn (Blueprint $t) => $t->dropColumn('created_at'));
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('active'));
    }
};
