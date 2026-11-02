<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillService extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'quantity',
        'price',
        'service_id',
        'bill_id',
    ];

    /**
     * Cast attributes to appropriate data types.
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'price' => 'decimal:2',
        ];
    }

    /**
     * Bill to which this service belongs.
     */
    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bill::class);
    }

    /**
     * Service associated with this bill item.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
