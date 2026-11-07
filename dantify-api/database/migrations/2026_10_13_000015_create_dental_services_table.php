<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dental_services', function (Blueprint $table) {
            $table->id();
            $table->string('name',100);
            $table->string('description',255)->nullable();
            $table->decimal('price',10,2)->default(0);
            $table->unsignedInteger('duration_minutes');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dental_services');
    }
};
