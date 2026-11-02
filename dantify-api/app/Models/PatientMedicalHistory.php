<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientMedicalHistory extends Model
{
    protected $fillable = [
        'condition_name',
        'notes',
        'diagnosed_date',
        'resolved_date',
        'is_active',
        'patient_id',
        'dentist_id',
        'clinic_id',
        'appointment_id',
    ];

    protected function casts(): array
    {
        return [
            'diagnosed_date' => 'date',
            'resolved_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function dentist(): BelongsTo
    {
        return $this->belongsTo(Dentist::class);
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
