<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeviceAuth
{
    public function handle(Request $r, Closure $next)
    {
        $token = $r->bearerToken();
        $d = $token ? DB::table('devices')->where('credential_hash', hash('sha256', $token))->where('enabled', true)->first() : null;
        if (! $d) {
            DB::table('audit_logs')->insert(['actor' => 'device:unknown', 'action' => 'DEVICE_AUTH', 'result' => 'DENIED', 'created_at' => now()]);

            return response()->json(['code' => 'UNAUTHENTICATED'], 401);
        }
        $r->attributes->set('device', $d);

        return $next($r);
    }
}
