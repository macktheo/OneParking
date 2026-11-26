<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\IpUtils;

class DisplayNetworkOnly
{
    public function handle(Request $r, Closure $next)
    {
        $cidrs = array_filter(array_map('trim', explode(',', config('parking.display_cidrs'))));
        abort_unless(IpUtils::checkIp($r->ip(), $cidrs), 403, 'DISPLAY_NETWORK_DENIED');

        return $next($r);
    }
}
