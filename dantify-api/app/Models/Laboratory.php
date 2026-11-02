<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Laboratory extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'contact_person',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'email',
        'phone',
        'registration_number',
        'notes',
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

    public function patientFiles(): HasMany
    {
        return $this->hasMany(PatientFile::class);
    }
}
