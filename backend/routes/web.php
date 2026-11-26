<?php

use App\Http\Controllers\ParkingController as C;
use App\Http\Middleware\AdminOnly;
use App\Http\Middleware\DisplayNetworkOnly;
use App\Services\ParkingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

Route::get('/sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);
Route::post('/login', [C::class, 'login']);
Route::post('/logout', [C::class, 'logout']);
Route::prefix('api/v1')->group(function () {
    Route::get('/auth/user', [C::class, 'me']);
    Route::get('/display/status', [C::class, 'display'])->middleware(['throttle:120,1', DisplayNetworkOnly::class]);
    Route::prefix('admin')->middleware(AdminOnly::class)->group(function () {
        Route::get('/dashboard', [C::class, 'dashboard']);
        Route::get('/live', [C::class, 'live']);
        Route::get('/reader-state', [C::class, 'readerState']);
        Route::get('/cards', [C::class, 'cards']);
        Route::post('/cards', [C::class, 'register']);
        Route::delete('/cards/{id}', [C::class, 'deleteCard'])->whereNumber('id');
        Route::patch('/cards/{id}/status', [C::class, 'status'])->whereNumber('id');
        Route::get('/holders', [C::class, 'holders']);
        Route::post('/holders', [C::class, 'holder']);
        Route::patch('/holders/{id}', [C::class, 'holder'])->whereNumber('id');
        Route::get('/scans/latest', [C::class, 'latestScan']);
        Route::post('/scan-claims', fn (Request $r, ParkingService $s) => $s->claim($r->user()->id, hash('sha256', $r->session()->getId())));
        Route::get('/requests/{id}', function (Request $r, string $id) {
            $op = DB::table('operation_requests')->where('scope', 'admin:'.$r->user()->id)->where('request_id', $id)->first();
            abort_unless($op, 404);

            return json_decode($op->result, true);
        })->whereUuid('id');
        Route::post('/topup', [C::class, 'topup']);
        Route::get('/parking', [C::class, 'parking']);
        Route::get('/transactions', [C::class, 'transactions']);
        Route::get('/transactions/export', [C::class, 'csv']);
        Route::get('/devices', [C::class, 'devices']);
        Route::patch('/devices/{id}/mode', [C::class, 'mode'])->whereNumber('id');
        Route::get('/settings', fn () => DB::table('settings')->first());
        Route::patch('/settings', [C::class, 'settings']);
        Route::get('/audit-logs', fn () => DB::table('audit_logs')->latest('id')->limit(500)->get());
    });
});
Route::view('/{path?}', 'app')->where('path', '^(?!api/|sanctum/).*$');
