<?php

use Illuminate\Support\Facades\Route;
use Modules\Application\Http\Controllers\ApplicationController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('applications', ApplicationController::class)->names('application');
});
