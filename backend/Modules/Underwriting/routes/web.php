<?php

use Illuminate\Support\Facades\Route;
use Modules\Underwriting\Http\Controllers\UnderwritingController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('underwritings', UnderwritingController::class)->names('underwriting');
});
