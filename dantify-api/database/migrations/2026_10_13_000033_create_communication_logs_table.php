<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communication_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('communication_channel_id')
                ->constrained('communication_channels')
                ->restrictOnDelete();

            $table->text('message_content')->nullable();
            $table->dateTime('sent_date')->nullable();
            $table->string('status', 50)->nullable();

            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('patient_id')
                ->nullable()
                ->constrained('patients')
                ->nullOnDelete();

            $table->foreignId('dentist_id')
                ->nullable()
                ->constrained('dentists')
                ->nullOnDelete();

            $table->foreignId('clinic_id')
                ->nullable()
                ->constrained('clinics')
                ->nullOnDelete();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communication_logs');
    }
};
