
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_dentist_invites', function (Blueprint $table) {
            $table->id();

            $table->foreignId('dentist_id')
                ->constrained('dentists')
                ->cascadeOnDelete();

            $table->foreignId('clinic_id')
                ->constrained('clinics')
                ->cascadeOnDelete();

            // The user who initiated the association request
            $table->foreignId('initiated_by_user_id')
                ->constrained('users')
                ->restrictOnDelete();

            // The user who accepted or rejected the request
            $table->foreignId('responded_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('status', 20)->default('pending');

            // Set when the other party accepts or rejects
            $table->timestamp('responded_at')->nullable();

            $table->timestamps();

            // Only one association request per clinic-dentist pair
            $table->unique(
                ['clinic_id', 'dentist_id'],
                'clinic_dentist_invites_unique'
            );

            $table->index(['clinic_id', 'status']);
            $table->index(['dentist_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_dentist_invites');
    }
};
