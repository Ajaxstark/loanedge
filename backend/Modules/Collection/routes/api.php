<?php

use Illuminate\Support\Facades\Route;
use Modules\Collection\Http\Controllers\CollectionController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::get('collections', [CollectionController::class, 'index']);
    Route::get('collections/loan/{loanId}', [CollectionController::class, 'index']);
    Route::post('collections/recalculate', [CollectionController::class, 'recalculate']);
    Route::patch('collections/{id}', [CollectionController::class, 'update']);
});