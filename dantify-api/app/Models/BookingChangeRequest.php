<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingChangeRequest extends Model
{
    protected $fillable = [
        'booking_id',
        'requested_by_user_id',
        'request_type',
        'reason',
        'requested_booking_date',
        'status',
        'reviewed_by_user_id',
        'reviewed_at',
        'review_remarks',
        'replacement_booking_id',
    ];

    protected function casts(): array
    {
        return [
            'requested_booking_date' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function replacementBooking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'replacement_booking_id');
    }
}
