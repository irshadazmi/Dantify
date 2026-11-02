<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bill extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'total_amount',
        'paid_amount',
        'payment_status',
        'notes',
        'appointment_id',
        'is_active',
    ];

    /**
     * Cast attributes to appropriate data types.
     */
    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'balance_amount' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Appointment associated with this bill.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Services included in this bill.
     */
    public function billServices(): HasMany
    {
        return $this->hasMany(BillService::class);
    }

    /**
     * Payments recorded against this bill.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
