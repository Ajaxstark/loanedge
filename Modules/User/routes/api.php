<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Http\Controllers\UserController;
use Modules\User\Http\Controllers\AuthController;

Route::prefix('v1')->group(function () {
    // Public routes — no login required
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    // Protected routes — login required
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::apiResource('users', UserController::class)->names('user');
    });
});