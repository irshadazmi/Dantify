<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_change_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('requested_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('request_type', 20); // CANCELLATION | RESCHEDULE
            $table->text('reason');
            $table->dateTime('requested_booking_date')->nullable();
            $table->string('status', 20)->default('PENDING'); // PENDING | APPROVED | REJECTED
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('review_remarks')->nullable();
            $table->foreignId('replacement_booking_id')->nullable()
                ->constrained('bookings')->nullOnDelete();
            $table->timestamps();

            $table->index(['booking_id', 'status'], 'booking_change_request_booking_status_idx');
            $table->index(['status', 'created_at'], 'booking_change_request_status_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_change_requests');
    }
};
