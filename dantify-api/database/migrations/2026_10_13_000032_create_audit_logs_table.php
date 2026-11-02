<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action',255);
            $table->string('table_name',255);
            $table->unsignedBigInteger('record_id')->nullable();
            $table->text('action_details')->nullable();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->dateTime('action_timestamp')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
