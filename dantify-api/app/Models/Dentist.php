<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Dentist extends Model
{
    protected $fillable = [
        'name',
        'gender',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'phone',
        'email',
        'specialization',
        'user_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function clinicDentists(): HasMany
    {
        return $this->hasMany(ClinicDentist::class);
    }

    public function clinics(): BelongsToMany
    {
        return $this->belongsToMany(
            Clinic::class,
            'clinic_dentists',
            'dentist_id',
            'clinic_id'
        )->withPivot([
            'day_of_week',
            'start_time',
            'end_time',
        ])->withTimestamps();
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function treatmentPlans(): HasMany
    {
        return $this->hasMany(TreatmentPlan::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    public function labOrders(): HasMany
    {
        return $this->hasMany(LabOrder::class);
    }

    public function patientMedicalHistories(): HasMany
    {
        return $this->hasMany(PatientMedicalHistory::class);
    }

    public function patientFeedback(): HasMany
    {
        return $this->hasMany(PatientFeedback::class);
    }

    public function communicationLogs(): HasMany
    {
        return $this->hasMany(CommunicationLog::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
