<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TreatmentPlan extends Model
{
    protected $fillable = [
        'total_cost',
        'notes',
        'status',
        'is_active',
        'patient_id',
        'dentist_id',
        'clinic_id',
    ];

    protected function casts(): array
    {
        return [
            'total_cost' => 'decimal:2',
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

    public function treatmentPlanServices(): HasMany
    {
        return $this->hasMany(TreatmentPlanService::class);
    }
}
