<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dev/dantify-migrate', function () {

    abort_unless(
        request('key') === 'Dantify@123',
        403
    );

    Artisan::call('migrate', ['--force' => true]);
    $migration = Artisan::output();

    Artisan::call('db:seed', ['--force' => true]);
    $seeding = Artisan::output();

    return response()->json([
        'message' => 'Dantify migration and seeding completed',
        'migration' => $migration,
        'seeding' => $seeding,
    ]);
});
