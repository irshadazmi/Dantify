<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('association_schedules', function (Blueprint $table) {
            $table->id();

            // Accepted clinic-dentist association request.
            $table->foreignId('clinic_dentist_invite_id')
                ->constrained('clinic_dentist_invites')
                ->cascadeOnDelete();

            // User who proposed the schedule.
            $table->foreignId('proposed_by_user_id')
                ->constrained('users')
                ->restrictOnDelete();

            // User who reviewed the proposal.
            $table->foreignId('reviewed_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Schedule validity.
            $table->date('effective_from');
            $table->date('effective_until')->nullable();

            // proposed, confirmed, change_requested, cancelled
            $table->string('status', 30)->default('proposed');

            $table->text('notes')->nullable();

            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            $table->index(
                ['clinic_dentist_invite_id', 'status'],
                'assoc_schedule_invite_status_idx'
            );

            $table->index(
                ['effective_from', 'effective_until'],
                'assoc_schedule_effective_dates_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('association_schedules');
    }
};
