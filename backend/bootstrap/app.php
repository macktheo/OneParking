<?php

use App\Http\Middleware\BusinessCsrf;
use App\Services\ParkingService;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php', api: __DIR__.'/../routes/api.php', commands: __DIR__.'/../routes/console.php', health: '/up')
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: array_filter(explode(',', env('APP_TRUSTED_PROXIES', '127.0.0.1,::1'))));
        $middleware->web(replace: [ValidateCsrfToken::class => BusinessCsrf::class]);
    })
    ->withExceptions(function (Exceptions $e) {
        $e->shouldRenderJsonWhen(fn (Request $r) => $r->is('api/*', 'login', 'logout', 'sanctum/*'));
        $e->respond(function (Response $response) {
            $r = request();
            $status = $response->getStatusCode();
            if ($status >= 400 && $r->is('api/*', 'login', 'logout', 'sanctum/*')) {
                try {
                    DB::table('audit_logs')->insert(['actor' => $r->user() ? 'user:'.$r->user()->id : 'guest', 'action' => 'HTTP_'.$r->method().'_'.substr($r->path(), 0, 180), 'result' => 'HTTP_'.$status, 'request_id' => Str::isUuid((string) $r->input('request_id')) ? $r->input('request_id') : null, 'created_at' => now()]);
                } catch (Throwable $error) {
                    Log::warning('Audit unavailable', ['status' => $status]);
                }
            }

            if ($status >= 500 && $r->attributes->get('device')) {
                try {
                    app(ParkingService::class)->publish($r->attributes->get('device')->id, 'ERROR');
                } catch (Throwable $ignored) {
                }
            }

            return $response;
        });
    })
    ->create();
