<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_services', function (Blueprint $table) {
            $table->id();

            $table->foreignId('clinic_id')
                ->constrained('clinics')
                ->cascadeOnDelete();

            $table->foreignId('service_id')
                ->constrained('services')
                ->restrictOnDelete();

            // Clinic-specific price and treatment duration
            $table->decimal('price', 10, 2)->default(0);
            $table->unsignedInteger('duration_minutes');

            // Whether this clinic currently offers the service
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // A service can be listed only once per clinic
            $table->unique(
                ['clinic_id', 'service_id'],
                'clinic_services_clinic_service_unique'
            );

            $table->index(['clinic_id', 'is_active']);
            $table->index(['service_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_services');
    }
};