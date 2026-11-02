<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicDentist extends Model
{
    protected $fillable = [
        'dentist_id',
        'clinic_id',
        'association_schedule_id',
        'day_of_week',
        'start_time',
        'end_time',
    ];

    protected function casts(): array
    {
        return [
            'dentist_id' => 'integer',
            'clinic_id' => 'integer',
            'association_schedule_id' => 'integer',
        ];
    }

    public function dentist(): BelongsTo
    {
        return $this->belongsTo(Dentist::class);
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function associationSchedule(): BelongsTo
    {
        return $this->belongsTo(
            AssociationSchedule::class,
            'association_schedule_id'
        );
    }
}