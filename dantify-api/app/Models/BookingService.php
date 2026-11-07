<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingService extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'booking_id',
        'clinic_service_offering_id',
        'quantity',
        'unit_price',
        'notes',
    ];

    /**
     * Cast attributes to appropriate data types.
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
        ];
    }

    /**
     * Booking associated with this service line.
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Clinic service associated with this booking service.
     */
    public function clinicServiceOffering(): BelongsTo
    {
        return $this->belongsTo(ClinicServiceOffering::class);
    }
}