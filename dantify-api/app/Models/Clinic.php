<?php

namespace App\Models;

use App\Models\Concerns\HasProfilePhoto;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Clinic extends Model
{
    use HasProfilePhoto;

    protected $appends = [
        'profile_photo_url',
    ];
    
    protected $fillable = [
        'user_id',
        'name',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'phone',
        'email',
        'profile_photo_path',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function clinicDentists(): HasMany
    {
        return $this->hasMany(ClinicDentist::class);
    }

    public function dentists(): BelongsToMany
    {
        return $this->belongsToMany(
            Dentist::class,
            'clinic_dentists',
            'clinic_id',
            'dentist_id'
        )->withPivot([
            'day_of_week',
            'start_time',
            'end_time',
        ])->withTimestamps();
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Booking::class);
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

    public function patientFiles(): HasMany
    {
        return $this->hasMany(PatientFile::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function patientFeedback(): HasMany
    {
        return $this->hasMany(PatientFeedback::class);
    }

    public function serviceOfferings(): HasMany
    {
        return $this->hasMany(
            ClinicServiceOffering::class,
            'clinic_id'
        );
    }

    public function dentalServices(): BelongsToMany
    {
        return $this->belongsToMany(
            DentalService::class,
            'clinic_service_offerings',
            'clinic_id',
            'dental_service_id'
        )
            ->withPivot([
                'id',
                'price',
                'duration_minutes',
                'is_active',
            ])
            ->withTimestamps();
    }

    public function communicationLogs(): HasMany
    {
        return $this->hasMany(CommunicationLog::class);
    }
}
