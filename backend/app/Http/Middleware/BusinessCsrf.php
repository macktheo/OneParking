<?php

namespace App\Http\Middleware;

use App\Services\ParkingService;
use Closure;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

class BusinessCsrf extends ValidateCsrfToken
{
    public function handle($request, Closure $next)
    {
        if ($request->is('api/v1/admin/*')) {
            $u = $request->user();
            $status = (! $u || ! $u->active) ? 401 : ($u->role !== 'admin' ? 403 : null);
            if ($status) {
                app(ParkingService::class)->audit($u ? 'user:'.$u->id : 'guest', 'ADMIN_ACCESS', 'DENIED');

                return response()->json(['code' => $status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN'], $status);
            }
        }

        return parent::handle($request, $next);
    }
}
