<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomerAuth\Http\Controllers\CustomerAuthController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('customerauths', CustomerAuthController::class)->names('customerauth');
});
