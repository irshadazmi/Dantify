<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_services', function (Blueprint $table) {
            $table->id();

            $table->foreignId('booking_id')
                ->constrained('bookings')
                ->cascadeOnDelete();

            $table->foreignId('clinic_service_offering_id')
                ->constrained('clinic_service_offerings')
                ->restrictOnDelete();

            $table->unsignedInteger('quantity')->default(1);

            // Agreed price per unit at booking time
            $table->decimal('unit_price', 10, 2);

            $table->timestamps();

            // Prevent duplicate offering lines for the same booking
            $table->unique(
                ['booking_id', 'clinic_service_offering_id'],
                'booking_services_booking_offering_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_services');
    }
};