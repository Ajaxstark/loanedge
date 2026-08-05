<?php

use Illuminate\Support\Facades\Route;
use Modules\Approval\Http\Controllers\ApprovalController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::post('approvals', [ApprovalController::class, 'store']);
    Route::get('approvals', [ApprovalController::class, 'index']);
    Route::get('approvals/lead/{leadId}', [ApprovalController::class, 'index']);
    Route::patch('approvals/{id}', [ApprovalController::class, 'update']);
});