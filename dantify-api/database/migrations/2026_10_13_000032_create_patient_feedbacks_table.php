<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->text('feedback_text')->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('dentist_id')->constrained('dentists')->restrictOnDelete();
            $table->foreignId('clinic_id')->constrained('clinics')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_feedbacks');
    }
};
