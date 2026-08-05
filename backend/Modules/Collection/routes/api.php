<?php

use Illuminate\Support\Facades\Route;
use Modules\Collection\Http\Controllers\CollectionController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::get('collections', [CollectionController::class, 'index']);
    Route::get('collections/lead/{leadId}', [CollectionController::class, 'index']);
    Route::post('collections', [CollectionController::class, 'store']);
    Route::patch('collections/{id}', [CollectionController::class, 'update']);
});