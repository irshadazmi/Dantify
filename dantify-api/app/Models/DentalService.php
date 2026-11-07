<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class DentalService extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'duration_minutes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'duration_minutes' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function appointmentServices(): HasManyThrough
    {
        return $this->hasManyThrough(
            AppointmentService::class,
            ClinicServiceOffering::class,
            'dental_service_id',
            'clinic_service_offering_id',
            'id',
            'id'
        );
    }

    public function billServices(): HasManyThrough
    {
        return $this->hasManyThrough(
            BillService::class,
            ClinicServiceOffering::class,
            'dental_service_id',
            'clinic_service_offering_id',
            'id',
            'id'
        );
    }

    public function treatmentPlanServices(): HasManyThrough
    {
        return $this->hasManyThrough(
            TreatmentPlanService::class,
            ClinicServiceOffering::class,
            'dental_service_id',
            'clinic_service_offering_id',
            'id',
            'id'
        );
    }

    public function clinicServiceOfferings(): HasMany
    {
        return $this->hasMany(
            ClinicServiceOffering::class,
            'dental_service_id'
        );
    }

    public function clinics(): BelongsToMany
    {
        return $this->belongsToMany(
            Clinic::class,
            'clinic_service_offerings',
            'dental_service_id',
            'clinic_id'
        )
            ->withPivot([
                'id',
                'price',
                'duration_minutes',
                'is_active',
            ])
            ->withTimestamps();
    }
}
