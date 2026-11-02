<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunicationLog extends Model
{
    protected $fillable = [
        'communication_channel_id',
        'message_content',
        'sent_date',
        'status',
        'user_id',
        'patient_id',
        'dentist_id',
        'clinic_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sent_date' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function communicationChannel(): BelongsTo
    {
        return $this->belongsTo(
            CommunicationChannel::class,
            'communication_channel_id'
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function dentist(): BelongsTo
    {
        return $this->belongsTo(Dentist::class);
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }
}
