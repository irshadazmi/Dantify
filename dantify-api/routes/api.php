
<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AssociationDiscoveryController;
use App\Http\Controllers\Api\AssociationScheduleController;
use App\Http\Controllers\Api\DentistController;
use App\Http\Controllers\Api\LaboratoryController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\ClinicDentistInviteController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\ClinicServiceController;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'application' => 'Dantify API',
    ]);
});

// ======================================================
// PUBLIC AUTHENTICATION ROUTES
// ======================================================

Route::get('/booking/dentists', [
    DentistController::class,
    'publicSearch',
]);

Route::get('/booking/dentists/{dentist}', [
    DentistController::class,
    'publicShow',
]);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Phone OTP verification — required before registration
Route::post('/otp/send', [AuthController::class, 'sendOtp']);
Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);

Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);


// ======================================================
// AUTHENTICATED ROUTES
// ======================================================

Route::middleware('auth:sanctum')->group(function () {

    // --------------------------------------------------
    // Authentication
    // --------------------------------------------------

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);


    // --------------------------------------------------
    // SERVICE MANAGEMENT
    // --------------------------------------------------

    // Common service catalogue — Super Admin
    Route::get('/services', [ServiceController::class, 'index']);
    Route::post('/services', [ServiceController::class, 'store']);
    Route::get('/services/{service}', [ServiceController::class, 'show']);
    Route::put('/services/{service}', [ServiceController::class, 'update']);
    Route::patch(
        '/services/{service}/status',
        [ServiceController::class, 'updateStatus']
    );

    // Clinic-specific services
    Route::get(
        '/clinic/services/catalogue',
        [ClinicServiceController::class, 'catalogue']
    );

    Route::get(
        '/clinic/services',
        [ClinicServiceController::class, 'index']
    );

    Route::post(
        '/clinic/services',
        [ClinicServiceController::class, 'store']
    );

    Route::put(
        '/clinic/services/{clinicService}',
        [ClinicServiceController::class, 'update']
    );

    Route::patch(
        '/clinic/services/{clinicService}/status',
        [ClinicServiceController::class, 'updateStatus']
    );


    // --------------------------------------------------
    // ASSOCIATION DISCOVERY
    // Register before resource routes
    // --------------------------------------------------

    Route::get('/clinics/discover', [
        AssociationDiscoveryController::class,
        'clinics',
    ]);

    Route::get('/dentists/discover', [
        AssociationDiscoveryController::class,
        'dentists',
    ]);


    // --------------------------------------------------
    // ASSOCIATION SCHEDULE MANAGEMENT
    // --------------------------------------------------

    Route::get(
        '/associations/{invite}/schedules',
        [AssociationScheduleController::class, 'index']
    );

    Route::post(
        '/associations/{invite}/schedules',
        [AssociationScheduleController::class, 'store']
    );

    Route::patch(
        '/association-schedules/{schedule}/review',
        [AssociationScheduleController::class, 'review']
    );

    Route::patch(
        '/association-schedules/{schedule}/cancel',
        [AssociationScheduleController::class, 'cancel']
    );


    // --------------------------------------------------
    // CLINIC PROFILE AND CRUD
    // --------------------------------------------------

    Route::get('/my/clinic-profile', [ClinicController::class, 'myProfile']);
    Route::apiResource('clinics', ClinicController::class);


    // --------------------------------------------------
    // DENTIST PROFILE AND CRUD
    // --------------------------------------------------

    Route::get('/my/dentist-profile', [DentistController::class, 'myProfile']);
    Route::apiResource('dentists', DentistController::class);


    // --------------------------------------------------
    // PATIENT PROFILE AND CRUD
    // --------------------------------------------------

    Route::get('/my/patient-profile', [PatientController::class, 'myProfile']);
    Route::apiResource('patients', PatientController::class);


    // --------------------------------------------------
    // STAFF PROFILE AND CRUD
    // --------------------------------------------------

    Route::get('/my/staff-profile', [StaffController::class, 'myProfile']);
    Route::apiResource('staffs', StaffController::class);


    // --------------------------------------------------
    // LABORATORY PROFILE AND CRUD
    // --------------------------------------------------

    Route::get('/my/laboratory-profile', [LaboratoryController::class, 'myProfile']);
    Route::apiResource('laboratories', LaboratoryController::class);


    // --------------------------------------------------
    // CLINIC-DENTIST ASSOCIATIONS
    // --------------------------------------------------

    // Clinic administrator initiates a request
    Route::post(
        '/clinics/{clinic}/dentist-invites',
        [ClinicDentistInviteController::class, 'store']
    );

    // Dentist initiates a request
    Route::post(
        '/dentists/{dentist}/clinic-invites',
        [ClinicDentistInviteController::class, 'storeByDentist']
    );

    // View association requests
    Route::get(
        '/my/dentist-invites',
        [ClinicDentistInviteController::class, 'dentistIndex']
    );

    Route::get(
        '/my/clinic-dentist-invites',
        [ClinicDentistInviteController::class, 'clinicIndex']
    );

    // Respond to an association request
    Route::patch(
        '/dentist-invites/{invite}/respond',
        [ClinicDentistInviteController::class, 'respond']
    );

});


// ======================================================
// APPOINTMENT APIs
// ======================================================

Route::get('/appointments', [AppointmentController::class, 'index']);
Route::post('/appointments', [AppointmentController::class, 'store']);
Route::get('/appointments/{id}', [AppointmentController::class, 'show']);
Route::put('/appointments/{id}', [AppointmentController::class, 'update']);
