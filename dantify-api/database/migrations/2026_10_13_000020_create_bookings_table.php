<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();

            // Booking date and time
            $table->dateTime('booking_date')->nullable();

            $table->text('notes')->nullable();

            // Patient, dentist, and clinic
            $table->foreignId('patient_id')
                ->constrained('patients')
                ->restrictOnDelete();

            $table->foreignId('dentist_id')
                ->constrained('dentists')
                ->restrictOnDelete();

            $table->foreignId('clinic_id')
                ->constrained('clinics')
                ->restrictOnDelete();

            // Booking status
            $table->foreignId('booking_status_id')
                ->constrained('booking_statuses')
                ->restrictOnDelete();

            $table->timestamps();

            // Useful for listing bookings by clinic and date
            $table->index(
                ['clinic_id', 'booking_date'],
                'bookings_clinic_date_index'
            );

            // Useful for listing a dentist's bookings
            $table->index(
                ['dentist_id', 'booking_date'],
                'bookings_dentist_date_index'
            );

            // Useful for listing a patient's bookings
            $table->index(
                ['patient_id', 'booking_date'],
                'bookings_patient_date_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};