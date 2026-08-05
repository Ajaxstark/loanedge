<?php

use Illuminate\Support\Facades\Route;
use Modules\Loan\Http\Controllers\LoanController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::get('loans', [LoanController::class, 'index']);
    Route::get('loans/lead/{leadId}', [LoanController::class, 'index']);
    Route::get('loans/{id}', [LoanController::class, 'show']);
    Route::post('loans', [LoanController::class, 'store']);
    Route::patch('loans/{id}/disburse', [LoanController::class, 'disburse']);
});