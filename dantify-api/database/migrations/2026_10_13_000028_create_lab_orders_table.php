<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_orders', function (Blueprint $table) {
            $table->id();
            $table->string('lab_name',255);
            $table->string('lab_test_type',100);
            $table->date('test_date')->nullable();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('dentist_id')->constrained('dentists')->restrictOnDelete();
            $table->foreignId('clinic_id')->constrained('clinics')->restrictOnDelete();
            $table->foreignId('booking_id')->constrained('bookings')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_orders');
    }
};
