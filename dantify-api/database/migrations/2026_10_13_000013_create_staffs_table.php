<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staffs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            // A staff member may be linked to a clinic; nullable supports
            // staff accounts created before clinic assignment.
            $table->foreignId('clinic_id')
                ->nullable()
                ->constrained('clinics')
                ->nullOnDelete();

            $table->string('name',100);
            $table->string('job_title',100)->nullable();
            $table->string('gender', 20)->nullable();
            $table->date('dob')->nullable();
            $table->string('address', 255)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('phone',20)->nullable();
            $table->string('email',100)->nullable();
            $table->string('profile_photo_path', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staffs');
    }
};
