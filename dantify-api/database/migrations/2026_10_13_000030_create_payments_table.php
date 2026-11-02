<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->decimal('amount',10,2);
            $table->dateTime('payment_date')->useCurrent();
            $table->enum('payment_mode',['Cash','Credit Card','Debit Card','Bank Transfer','Check','Online Payment','Mobile Wallet','Insurance','EMI','Gift Card/Voucher','UPI','Other']);
            $table->string('transaction_reference',100)->nullable();
            $table->string('notes',255)->nullable();
            $table->foreignId('bill_id')->constrained('bills')->restrictOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('dentist_id')->constrained('dentists')->restrictOnDelete();
            $table->foreignId('clinic_id')->constrained('clinics')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
