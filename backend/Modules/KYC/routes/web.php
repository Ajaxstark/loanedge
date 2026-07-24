<?php

use Illuminate\Support\Facades\Route;
use Modules\KYC\Http\Controllers\KYCController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('kycs', KYCController::class)->names('kyc');
});
