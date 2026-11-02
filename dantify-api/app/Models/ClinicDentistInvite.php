<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClinicDentistInvite extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_DECLINED = 'declined';

    protected $fillable = [
        'dentist_id',
        'clinic_id',
        'initiated_by_user_id',
        'responded_by_user_id',
        'status',
        'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'responded_at' => 'datetime',
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

    public function initiatedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'initiated_by_user_id'
        );
    }

    public function respondedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'responded_by_user_id'
        );
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(
            AssociationSchedule::class,
            'clinic_dentist_invite_id'
        );
    }
}
