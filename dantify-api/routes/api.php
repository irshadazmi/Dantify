
<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\AssociationDiscoveryController;
use App\Http\Controllers\Api\AssociationScheduleController;
use App\Http\Controllers\Api\DentistController;
use App\Http\Controllers\Api\LaboratoryController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\ClinicDentistInviteController;
use App\Http\Controllers\Api\DentalServiceController;
use App\Http\Controllers\Api\MedicineController;
use App\Http\Controllers\Api\DentalAdviceController;
use App\Http\Controllers\Api\ClinicServiceController;

// ======================================================
// API HEALTH CHECK
// ======================================================

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'application' => 'Dantify API',
    ]);
});

// ======================================================
// PUBLIC ROUTES
// ======================================================

// ------------------------------------------------------
// PUBLIC DENTIST SEARCH AND PROFILE
// ------------------------------------------------------

Route::get('/booking/dentists', [
    DentistController::class,
    'publicSearch',
]);

Route::get('/booking/dentists/{dentist}', [
    DentistController::class,
    'publicShow',
]);

// ------------------------------------------------------
// PUBLIC CLINIC SERVICES
// ------------------------------------------------------

Route::get(
    '/public/clinics/{clinic}/services',
    [ClinicServiceController::class, 'publicIndex']
);

// ------------------------------------------------------
// PUBLIC BOOKING AVAILABILITY
// These endpoints must be accessible without login.
// ------------------------------------------------------

Route::get(
    '/bookings/availability',
    [BookingController::class, 'availability']
);

Route::get(
    '/bookings/check-slot',
    [BookingController::class, 'checkSlot']
);

// ------------------------------------------------------
// PUBLIC AUTHENTICATION
// ------------------------------------------------------

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Phone OTP verification
Route::post('/otp/send', [AuthController::class, 'sendOtp']);
Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);

Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);


// ======================================================
// AUTHENTICATED ROUTES
// ======================================================

Route::middleware('auth:sanctum')->group(function () {

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // ==================================================
    // BOOKING MANAGEMENT
    // Availability and check-slot are public above.
    // Creating and managing bookings require authentication.
    // ==================================================

    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::put('/bookings/{id}', [BookingController::class, 'update']);

    // --------------------------------------------------
    // SERVICE MANAGEMENT
    // --------------------------------------------------

    // Common service catalogue — Super Admin
    Route::get('/services', [DentalServiceController::class, 'index']);
    Route::post('/services', [DentalServiceController::class, 'store']);
    Route::get('/services/{service}', [DentalServiceController::class, 'show']);
    Route::put('/services/{service}', [DentalServiceController::class, 'update']);

    Route::patch(
        '/services/{service}/status',
        [DentalServiceController::class, 'updateStatus']
    );

    // --------------------------------------------------
    // MEDICINE MASTER CATALOGUE — SUPER ADMIN
    // --------------------------------------------------

    Route::get('/medicines', [MedicineController::class, 'index']);
    Route::post('/medicines', [MedicineController::class, 'store']);
    Route::get('/medicines/{medicine}', [MedicineController::class, 'show']);
    Route::put('/medicines/{medicine}', [MedicineController::class, 'update']);

    Route::patch(
        '/medicines/{medicine}/status',
        [MedicineController::class, 'updateStatus']
    );

    // --------------------------------------------------
    // CLINICAL RECOMMENDATIONS — SUPER ADMIN
    // --------------------------------------------------

    Route::get(
        '/dental-advices',
        [DentalAdviceController::class, 'index']
    );

    Route::post(
        '/dental-advices',
        [DentalAdviceController::class, 'store']
    );

    Route::get(
        '/dental-advices/{recommendation}',
        [DentalAdviceController::class, 'show']
    );

    Route::put(
        '/dental-advices/{recommendation}',
        [DentalAdviceController::class, 'update']
    );

    Route::patch(
        '/dental-advices/{recommendation}/status',
        [DentalAdviceController::class, 'updateStatus']
    );

    // --------------------------------------------------
    // CLINIC-SPECIFIC SERVICES
    // --------------------------------------------------

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
    // Register before resource routes.
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
