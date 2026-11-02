<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();

            $table->dateTime('prescription_date')->useCurrent();

            $table->text('notes')->nullable();

            $table->boolean('is_active')->default(true);

            $table->foreignId('patient_id')
                ->constrained('patients')
                ->restrictOnDelete();

            $table->foreignId('dentist_id')
                ->constrained('dentists')
                ->restrictOnDelete();

            $table->foreignId('clinic_id')
                ->constrained('clinics')
                ->restrictOnDelete();

            $table->foreignId('appointment_id')
                ->nullable()
                ->constrained('appointments')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['patient_id', 'prescription_date']);
            $table->index(['dentist_id', 'prescription_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
