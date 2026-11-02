<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssociationSchedule extends Model
{
    public const STATUS_PROPOSED = 'proposed';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_CHANGE_REQUESTED = 'change_requested';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_SUPERSEDED = 'superseded';

    protected $fillable = [
        'clinic_dentist_invite_id',
        'proposed_by_user_id',
        'reviewed_by_user_id',
        'effective_from',
        'effective_until',
        'status',
        'notes',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'effective_from' => 'date',
            'effective_until' => 'date',
            'reviewed_at' => 'datetime',
        ];
    }

    public function association(): BelongsTo
    {
        return $this->belongsTo(
            ClinicDentistInvite::class,
            'clinic_dentist_invite_id'
        );
    }

    public function proposedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'proposed_by_user_id');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function slots(): HasMany
    {
        return $this->hasMany(
            ClinicDentist::class,
            'association_schedule_id'
        );
    }
}