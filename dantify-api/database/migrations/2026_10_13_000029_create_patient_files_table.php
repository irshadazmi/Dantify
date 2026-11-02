<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_files', function (Blueprint $table) {
            $table->id();

            // Patient and clinic associations
            $table->foreignId('patient_id')
                ->constrained('patients')
                ->restrictOnDelete();

            $table->foreignId('clinic_id')
                ->constrained('clinics')
                ->restrictOnDelete();

            // Optional appointment association
            $table->foreignId('appointment_id')
                ->nullable()
                ->constrained('appointments')
                ->nullOnDelete();

            // User who uploaded the file
            $table->foreignId('uploaded_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Optional laboratory association
            $table->foreignId('laboratory_id')
                ->nullable()
                ->constrained('laboratories')
                ->nullOnDelete();

            // Optional association with a laboratory order.
            // The lab_orders migration must run before this migration.
            $table->foreignId('lab_order_id')
                ->nullable()
                ->constrained('lab_orders')
                ->nullOnDelete();

            // File classification
            $table->string('file_category', 50);
            // Examples: document, clinical_image, lab_report,
            // prescription, consent_form, other

            $table->string('file_type', 100)->nullable();
            // Examples: X-Ray, MRI, CT Scan, blood_test_report

            // File storage and metadata
            $table->string('original_filename');
            $table->text('storage_path');
            $table->string('mime_type', 150)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();

            $table->text('description')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Helpful indexes for common searches
            $table->index(
                ['patient_id', 'file_category'],
                'patient_files_patient_category_idx'
            );

            $table->index(
                ['clinic_id', 'created_at'],
                'patient_files_clinic_created_idx'
            );

            $table->index(
                ['laboratory_id', 'lab_order_id'],
                'patient_files_lab_order_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_files');
    }
};
