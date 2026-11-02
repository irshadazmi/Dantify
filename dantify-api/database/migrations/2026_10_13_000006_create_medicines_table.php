<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();

            $table->string('name', 255);
            $table->string('generic_name', 255)->nullable();
            $table->string('brand_name', 255)->nullable();

            $table->string('strength', 100)->nullable();
            $table->string('dosage_form', 100)->nullable();
            // Examples: Tablet, Capsule, Syrup, Gel, Mouthwash

            $table->string('manufacturer', 255)->nullable();

            $table->text('description')->nullable();
            $table->text('default_instructions')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('name');
            $table->index('generic_name');
            $table->index('brand_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
