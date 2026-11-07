<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DentalAdvice extends Model
{
    protected $table = 'dental_advices';

    protected $fillable = [
        'name',
        'description',
        'default_instructions',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function prescriptionItems(): HasMany
    {
        return $this->hasMany(
            PrescriptionItem::class,
            'dental_advice_id'
        );
    }

    public function dentistPreferences(): HasMany
    {
        return $this->hasMany(
            DentistPrescriptionPreference::class,
            'dental_advice_id'
        );
    }
}