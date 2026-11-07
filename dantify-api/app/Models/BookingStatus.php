<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookingStatus extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'booking_statuses';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active',
        'is_terminal',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_terminal' => 'boolean',
        ];
    }

    /**
     * Bookings associated with this status.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'booking_status_id');
    }
}
