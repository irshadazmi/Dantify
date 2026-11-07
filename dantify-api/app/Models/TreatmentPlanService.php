<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TreatmentPlanService extends Model
{
    protected $fillable = [
        'quantity',
        'price',
        'clinic_service_offering_id',
        'treatment_plan_id',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'price' => 'decimal:2',
        ];
    }

    public function clinicServiceOffering(): BelongsTo
    {
        return $this->belongsTo(ClinicServiceOffering::class);
    }

    public function treatmentPlan(): BelongsTo
    {
        return $this->belongsTo(TreatmentPlan::class);
    }
}