<?php

use Illuminate\Support\Facades\Route;
use Modules\KYC\Http\Controllers\KYCController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::get('kyc/lead/{leadId}', [KYCController::class, 'index']);
    Route::post('kyc', [KYCController::class, 'store']);
    Route::patch('kyc/{id}/status', [KYCController::class, 'updateStatus']);
    Route::delete('kyc/{id}', [KYCController::class, 'destroy']);
});