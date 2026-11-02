<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_medical_histories', function (Blueprint $table) {
            $table->id();
            $table->string('condition_name',255);
            $table->text('notes')->nullable();
            $table->date('diagnosed_date')->nullable();
            $table->date('resolved_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('dentist_id')->constrained('dentists')->restrictOnDelete();
            $table->foreignId('clinic_id')->constrained('clinics')->restrictOnDelete();
            $table->foreignId('appointment_id')->constrained('appointments')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_medical_histories');
    }
};
