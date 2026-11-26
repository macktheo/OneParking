<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('ADMIN_PASSWORD');
        $token = env('DEVICE_TOKEN');
        if (! $password || strlen($password) < 12 || ! $token || strlen($token) < 32) {
            throw new \RuntimeException('Set ADMIN_PASSWORD (>=12) dan DEVICE_TOKEN (>=32) pada .env.');
        }
        DB::table('users')->insertOrIgnore(['email' => env('ADMIN_EMAIL', 'admin@oneparking.test'), 'name' => 'Administrator', 'password' => Hash::make($password), 'role' => 'admin', 'created_at' => now(), 'updated_at' => now()]);
        if (env('VIEWER_PASSWORD')) {
            DB::table('users')->updateOrInsert(['email' => env('VIEWER_EMAIL', 'viewer@oneparking.test')], ['name' => 'Akun uji non-admin', 'password' => Hash::make(env('VIEWER_PASSWORD')), 'role' => 'viewer', 'active' => true, 'created_at' => now(), 'updated_at' => now()]);
        }
        DB::table('settings')->insertOrIgnore(['id' => 1]);
        if (! DB::table('devices')->where('id', 1)->exists()) {
            DB::table('devices')->insert(['id' => 1, 'name' => 'NodeMCU Gate 01', 'credential_hash' => hash('sha256', $token)]);
        }
    }
}
