<?php

use Illuminate\Support\Facades\Route;
use Modules\Approval\Http\Controllers\ApprovalController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('approvals', ApprovalController::class)->names('approval');
});
