<?php

use Illuminate\Support\Facades\Route;
use Modules\Emi\Http\Controllers\EmiController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('emis', EmiController::class)->names('emi');
});
