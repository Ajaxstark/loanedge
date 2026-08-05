<?php

use Illuminate\Support\Facades\Route;
use Modules\Emi\Http\Controllers\EmiController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::get('emi', [EmiController::class, 'index']);
    Route::get('emi/loan/{loanId}', [EmiController::class, 'index']);
    Route::post('emi/generate/{loanId}', [EmiController::class, 'generate']);
    Route::patch('emi/{id}/pay', [EmiController::class, 'pay']);
});