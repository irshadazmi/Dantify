<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Appointment extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'appointment_date',
        'notes',
        'patient_id',
        'dentist_id',
        'clinic_id',
        'appointment_status_id',
    ];

    /**
     * Cast attributes to appropriate data types.
     */
    protected function casts(): array
    {
        return [
            'appointment_date' => 'datetime',
        ];
    }

    /**
     * Patient associated with this appointment.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Dentist assigned to this appointment.
     */
    public function dentist(): BelongsTo
    {
        return $this->belongsTo(Dentist::class);
    }

    /**
     * Clinic assigned to this appointment.
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    /**
     * Status of this appointment.
     */
    public function appointmentStatus(): BelongsTo
    {
        return $this->belongsTo(
            AppointmentStatus::class,
            'appointment_status_id'
        );
    }

    /**
     * Services associated with this appointment.
     */
    public function appointmentServices(): HasMany
    {
        return $this->hasMany(AppointmentService::class);
    }

    /**
     * Bills generated for this appointment.
     */
    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    /**
     * Prescriptions issued for this appointment.
     */
    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    /**
     * Laboratory orders associated with this appointment.
     */
    public function labOrders(): HasMany
    {
        return $this->hasMany(LabOrder::class);
    }

    /**
     * Patient files associated with this appointment.
     */
    public function patientFiles(): HasMany
    {
        return $this->hasMany(PatientFile::class);
    }
}
