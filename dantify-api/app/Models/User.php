<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'email',
        'phone',
        'password',
        'role_id',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function clinicProfile(): HasOne
    {
        return $this->hasOne(Clinic::class);
    }

    public function dentistProfile(): HasOne
    {
        return $this->hasOne(Dentist::class);
    }

    /**
     * Resolve the user's display name from their role-specific profile.
     */
    public function getNameAttribute(): ?string
    {
        return $this->clinicProfile?->name
            ?? $this->dentistProfile?->name;
    }
}
