<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientFile extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'patient_id',
        'clinic_id',
        'appointment_id',
        'uploaded_by_user_id',
        'laboratory_id',
        'lab_order_id',
        'file_category',
        'file_type',
        'original_filename',
        'storage_path',
        'mime_type',
        'file_size',
        'description',
        'is_active',
    ];

    /**
     * Cast attributes to appropriate data types.
     */
    protected function casts(): array
    {
        return [
            'patient_id' => 'integer',
            'clinic_id' => 'integer',
            'appointment_id' => 'integer',
            'uploaded_by_user_id' => 'integer',
            'laboratory_id' => 'integer',
            'lab_order_id' => 'integer',
            'file_size' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Patient associated with this file.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Clinic associated with this file.
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    /**
     * Appointment associated with this file, if any.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * User who uploaded the file.
     */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    /**
     * Laboratory associated with this file, if any.
     */
    public function laboratory(): BelongsTo
    {
        return $this->belongsTo(Laboratory::class);
    }

    /**
     * Laboratory order associated with this file, if any.
     */
    public function labOrder(): BelongsTo
    {
        return $this->belongsTo(LabOrder::class);
    }
}
