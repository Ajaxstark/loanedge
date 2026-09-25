<?php

use Illuminate\Support\Facades\Route;
use Modules\Application\Http\Controllers\CustomerApplicationController;

Route::middleware(['auth:sanctum'])
    ->prefix('v1/customer')
    ->group(function () {

        Route::post(
            'application/start',
            [CustomerApplicationController::class, 'start']
        );

        Route::get(
            'application',
            [CustomerApplicationController::class, 'current']
        );

        Route::get(
            'products',
            [CustomerApplicationController::class, 'products']
        );

        Route::patch(
            'application/personal',
            [CustomerApplicationController::class, 'updatePersonalDetails']
        );

        Route::patch(
            'application/address',
            [CustomerApplicationController::class, 'updateAddressDetails']
        );

        Route::patch(
            'application/employment',
            [CustomerApplicationController::class, 'updateEmploymentDetails']
        );

        Route::patch(
            'application/loan',
            [CustomerApplicationController::class, 'updateLoanDetails']
        );

        Route::get(
            'application/documents',
            [CustomerApplicationController::class, 'documents']
        );

        Route::post(
            'application/documents',
            [CustomerApplicationController::class, 'uploadDocument']
        );

        /*
         * Step 6 — Final Submission
         */
        Route::post(
            'application/submit',
            [CustomerApplicationController::class, 'submit']
        );
    });