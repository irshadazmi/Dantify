<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treatment_plan_services', function (Blueprint $table) {
            $table->id();

            $table->foreignId('treatment_plan_id')
                ->constrained('treatment_plans')
                ->cascadeOnDelete();

            $table->foreignId('clinic_service_offering_id')
                ->constrained('clinic_service_offerings')
                ->restrictOnDelete();

            $table->unsignedInteger('quantity')->default(1);

            // Price snapshot when the treatment plan is created
            $table->decimal('price', 10, 2);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treatment_plan_services');
    }
};