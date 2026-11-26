<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SetAdminPassword extends Command
{
    protected $signature = 'parking:admin-password {--email=}';

    protected $description = 'Set an admin password locally without printing it';

    public function handle(): int
    {
        $email = $this->option('email') ?: env('ADMIN_EMAIL', 'admin@oneparking.test');
        $user = DB::table('users')->where('email', $email)->where('role', 'admin')->first();
        if (! $user) {
            $this->error('Admin not found. Run db:seed first.');

            return 1;
        }$password = $this->secret('Password baru (minimal 12 karakter)');
        if (strlen($password) < 12) {
            $this->error('Minimal 12 karakter.');

            return 1;
        }if ($password !== $this->secret('Ulangi password')) {
            $this->error('Konfirmasi tidak sama.');

            return 1;
        }DB::table('users')->where('id', $user->id)->update(['password' => Hash::make($password), 'remember_token' => null]);
        DB::table('sessions')->where('user_id', $user->id)->delete();
        $this->info('Password diperbarui, sesi lama dicabut.');

        return 0;
    }
}
