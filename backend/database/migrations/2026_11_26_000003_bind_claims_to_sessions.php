<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scan_claims', fn (Blueprint $t) => $t->string('session_hash', 64)->nullable());
        Schema::table('audit_logs', fn (Blueprint $t) => $t->text('safe_metadata')->nullable());
    }

    public function down(): void
    {
        Schema::table('scan_claims', fn (Blueprint $t) => $t->dropColumn('session_hash'));
        Schema::table('audit_logs', fn (Blueprint $t) => $t->dropColumn('safe_metadata'));
    }
};
