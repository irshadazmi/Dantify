<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointment_services', function (Blueprint $table) {
            $table->id();

            $table->foreignId('appointment_id')
                ->constrained('appointments')
                ->cascadeOnDelete();

            $table->foreignId('service_id')
                ->constrained('services')
                ->restrictOnDelete();

            // Number of units of this service
            $table->unsignedInteger('quantity')->default(1);

            // Agreed price per unit at booking time
            $table->decimal('unit_price', 10, 2);

            $table->timestamps();

            // Prevent duplicate service lines for the same appointment
            $table->unique(
                ['appointment_id', 'service_id'],
                'appointment_services_appointment_service_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_services');
    }
};