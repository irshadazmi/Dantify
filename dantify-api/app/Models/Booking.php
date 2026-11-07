<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'booking_date',
        'notes',
        'patient_id',
        'dentist_id',
        'clinic_id',
        'booking_status_id',
    ];

    /**
     * Cast attributes to appropriate data types.
     */
    protected function casts(): array
    {
        return [
            'booking_date' => 'datetime',
        ];
    }

    /**
     * Patient associated with this booking.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Dentist assigned to this booking.
     */
    public function dentist(): BelongsTo
    {
        return $this->belongsTo(Dentist::class);
    }

    /**
     * Clinic assigned to this booking.
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    /**
     * Status of this booking.
     */
    public function bookingStatus(): BelongsTo
    {
        return $this->belongsTo(
            BookingStatus::class,
            'booking_status_id'
        );
    }

    /**
     * Dental Services associated with this booking.
     */
    public function bookingServices(): HasMany
    {
        return $this->hasMany(BookingService::class);
    }

    /**
     * Bills generated for this booking.
     */
    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    /**
     * Prescriptions issued for this booking.
     */
    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    /**
     * Laboratory orders associated with this booking.
     */
    public function labOrders(): HasMany
    {
        return $this->hasMany(LabOrder::class);
    }

    /**
     * Patient files associated with this booking.
     */
    public function patientFiles(): HasMany
    {
        return $this->hasMany(PatientFile::class);
    }
}
