<?php

namespace App\Models;

use App\Models\Concerns\HasProfilePhoto;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Laboratory extends Model
{
    use HasProfilePhoto;

    protected $appends = [
        'profile_photo_url',
    ];
    
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
        'profile_photo_path',
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
