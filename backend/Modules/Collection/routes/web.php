<?php

use Illuminate\Support\Facades\Route;
use Modules\Collection\Http\Controllers\CollectionController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('collections', CollectionController::class)->names('collection');
});
