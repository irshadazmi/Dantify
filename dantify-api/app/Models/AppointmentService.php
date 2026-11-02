<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentService extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'appointment_id',
        'service_id',
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
     * Appointment associated with this service line.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Master service associated with this appointment service.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}