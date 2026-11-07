
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_dentists', function (Blueprint $table) {
            $table->id();

            $table->foreignId('dentist_id')
                ->constrained('dentists')
                ->cascadeOnDelete();

            $table->foreignId('clinic_id')
                ->constrained('clinics')
                ->cascadeOnDelete();

            $table->foreignId('association_schedule_id')
                ->nullable()
                ->constrained('association_schedules')
                ->cascadeOnDelete();

            $table->string('day_of_week', 10);
            $table->time('start_time');
            $table->time('end_time');

            $table->timestamps();

            $table->unique(
                [
                    'association_schedule_id',
                    'dentist_id',
                    'clinic_id',
                    'day_of_week',
                    'start_time',
                ],
                'clinic_dentist_schedule_slot_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_dentists');
    }
};
