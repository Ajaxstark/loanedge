<?php

use Illuminate\Support\Facades\Route;
use Modules\Lead\Http\Controllers\LeadController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('leads', LeadController::class)->names('lead');
});
