<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClinicServiceOffering extends Model
{
    protected $fillable = [
        'clinic_id',
        'dental_service_id',
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

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function dentalService(): BelongsTo
    {
        return $this->belongsTo(DentalService::class);
    }

    public function appointmentServices(): HasMany
    {
        return $this->hasMany(
            AppointmentService::class,
            'clinic_service_offering_id'
        );
    }

    public function treatmentPlanServices(): HasMany
    {
        return $this->hasMany(
            TreatmentPlanService::class,
            'clinic_service_offering_id'
        );
    }

    public function billServices(): HasMany
    {
        return $this->hasMany(
            BillService::class,
            'clinic_service_offering_id'
        );
    }
}
