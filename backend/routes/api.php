<?php

use App\Http\Controllers\ParkingController as C;
use App\Http\Middleware\DeviceAuth;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/device')->middleware(['throttle:240,1', DeviceAuth::class])->group(function () {
    Route::get('/config', [C::class, 'config']);
    Route::post('/scan', [C::class, 'scan']);
    Route::post('/heartbeat', [C::class, 'heartbeat']);
    Route::get('/requests/{id}', [C::class, 'result'])->whereUuid('id');
    Route::post('/commands/{id}/ack', [C::class, 'ack'])->whereUuid('id');
});
