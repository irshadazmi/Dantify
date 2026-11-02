<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicService extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'clinic_id',
        'service_id',
        'price',
        'duration_minutes',
        'is_active',
    ];

    /**
     * Cast attributes to appropriate data types.
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'duration_minutes' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Clinic offering this service.
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    /**
     * Master service associated with this offering.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}