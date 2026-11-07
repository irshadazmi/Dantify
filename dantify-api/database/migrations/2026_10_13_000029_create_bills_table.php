<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->decimal('total_amount',10,2)->default(0);
            $table->decimal('paid_amount',10,2)->default(0);
            $table->decimal('balance_amount',10,2)->storedAs('total_amount - paid_amount');
            $table->string('payment_status',50)->default('Pending');
            $table->text('notes')->nullable();
            $table->foreignId('booking_id')->constrained('bookings')->restrictOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
