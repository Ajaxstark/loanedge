<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomerAuth\Http\Controllers\CustomerAuthController;

Route::prefix('v1/customer')->group(function () {
    Route::post('register', [CustomerAuthController::class, 'register']);
    Route::post('verify-otp', [CustomerAuthController::class, 'verifyOtp']);
    Route::post('resend-otp', [CustomerAuthController::class, 'resendOtp']);
    Route::post('login', [CustomerAuthController::class, 'login']);
    Route::post('verify-login-otp', [CustomerAuthController::class, 'verifyLoginOtp']);
});