<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'action',
        'table_name',
        'record_id',
        'action_details',
        'user_id',
        'action_timestamp',
    ];

    /**
     * Cast attributes to appropriate data types.
     */
    protected function casts(): array
    {
        return [
            'record_id' => 'integer',
            'action_timestamp' => 'datetime',
        ];
    }

    /**
     * User who performed the audited action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
