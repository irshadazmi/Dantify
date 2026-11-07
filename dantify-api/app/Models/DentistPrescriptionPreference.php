<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DentistPrescriptionPreference extends Model
{
    protected $fillable = [
        'dentist_id',
        'item_type',
        'medicine_id',
        'dental_advice_id',
        'default_dosage',
        'default_frequency',
        'default_duration',
        'default_instructions',
        'sort_order',
        'usage_count',
        'last_prescribed_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'usage_count' => 'integer',
            'last_prescribed_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function dentist(): BelongsTo
    {
        return $this->belongsTo(Dentist::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function dentalAdvice(): BelongsTo
    {
        return $this->belongsTo(
            DentalAdvice::class,
            'dental_advice_id'
        );
    }
}
