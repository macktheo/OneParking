<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminOnly
{
    public function handle(Request $r, Closure $next)
    {
        if (! $r->user() || ! $r->user()->active) {
            return response()->json(['code' => 'UNAUTHENTICATED'], 401);
        }
        if ($r->user()->role !== 'admin') {
            return response()->json(['code' => 'FORBIDDEN'], 403);
        }

        return $next($r);
    }
}
