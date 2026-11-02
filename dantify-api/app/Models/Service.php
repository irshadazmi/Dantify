<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Service extends Model
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

    public function appointmentServices(): HasMany
    {
        return $this->hasMany(AppointmentService::class);
    }

    public function billServices(): HasMany
    {
        return $this->hasMany(BillService::class);
    }

    public function treatmentPlanServices(): HasMany
    {
        return $this->hasMany(TreatmentPlanService::class);
    }

    public function clinicServices(): HasMany
    {
        return $this->hasMany(ClinicService::class);
    }

    public function clinics(): BelongsToMany
    {
        return $this->belongsToMany(
            Clinic::class,
            'clinic_services',
            'service_id',
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
