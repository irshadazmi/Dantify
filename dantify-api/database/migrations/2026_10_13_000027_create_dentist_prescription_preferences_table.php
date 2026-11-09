
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dentist_prescription_preferences', function (Blueprint $table) {
            $table->id();

            // Dentist who owns these preferences
            $table->unsignedBigInteger('dentist_id');

            // Preference type: medicine or dental advice
            $table->enum('item_type', [
                'medicine',
                'dental_advice',
            ]);

            // Only one catalogue reference should be populated
            $table->unsignedBigInteger('medicine_id')->nullable();
            $table->unsignedBigInteger('dental_advice_id')->nullable();

            // Dentist-specific default prescription values
            $table->string('default_dosage', 100)->nullable();
            $table->string('default_frequency', 100)->nullable();
            $table->string('default_duration', 100)->nullable();
            $table->text('default_instructions')->nullable();

            // Display and usage information
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamp('last_prescribed_at')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Foreign keys
            $table->foreign('dentist_id', 'dpp_dentist_fk')
                ->references('id')
                ->on('dentists')
                ->cascadeOnDelete();

            $table->foreign('medicine_id', 'dpp_medicine_fk')
                ->references('id')
                ->on('medicines')
                ->restrictOnDelete();

            $table->foreign('dental_advice_id', 'dpp_dental_advice_fk')
                ->references('id')
                ->on('dental_advices')
                ->restrictOnDelete();

            // Prevent duplicate medicine preferences for a dentist
            $table->unique(
                ['dentist_id', 'medicine_id'],
                'dentist_pref_medicine_unique'
            );

            // Prevent duplicate dental advice preferences for a dentist
            $table->unique(
                ['dentist_id', 'dental_advice_id'],
                'dentist_pref_advice_unique'
            );

            // Efficient retrieval of active dentist preferences
            $table->index(
                ['dentist_id', 'item_type', 'is_active'],
                'dpp_dentist_type_active_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dentist_prescription_preferences');
    }
};
