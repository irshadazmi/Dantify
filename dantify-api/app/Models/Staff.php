<?php

namespace App\Models;

use App\Models\Concerns\HasProfilePhoto;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Staff extends Model
{
    use HasProfilePhoto;

    protected $appends = [
        'profile_photo_url',
    ];
    
    protected $table = 'staff';

    protected $fillable = [
        'user_id',
        'clinic_id',
        'name',
        'job_title',
        'gender',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'phone',
        'email',
        'profile_photo_path',
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

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }
}
