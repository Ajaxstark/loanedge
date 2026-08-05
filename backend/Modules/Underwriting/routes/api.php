<?php

use Illuminate\Support\Facades\Route;
use Modules\Underwriting\Http\Controllers\UnderwritingController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::get('underwriting', [UnderwritingController::class, 'index']);
    Route::get('underwriting/lead/{leadId}', [UnderwritingController::class, 'index']);
    Route::post('underwriting', [UnderwritingController::class, 'store']);
    Route::patch('underwriting/{id}', [UnderwritingController::class, 'update']);
});