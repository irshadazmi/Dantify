<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();

            // Appointment date and time
            $table->dateTime('appointment_date')->nullable();

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

            // Appointment status
            $table->foreignId('appointment_status_id')
                ->constrained('appointment_statuses')
                ->restrictOnDelete();

            $table->timestamps();

            // Useful for listing appointments by clinic and date
            $table->index(
                ['clinic_id', 'appointment_date'],
                'appointments_clinic_date_index'
            );

            // Useful for listing a dentist's appointments
            $table->index(
                ['dentist_id', 'appointment_date'],
                'appointments_dentist_date_index'
            );

            // Useful for listing a patient's appointments
            $table->index(
                ['patient_id', 'appointment_date'],
                'appointments_patient_date_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};