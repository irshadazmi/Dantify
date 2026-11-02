<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunicationChannel extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'communication_channels';

    /**
     * Disable timestamps because the migration does not define them.
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'type_name',
        'description',
        'is_active',
    ];

    /**
     * Cast attributes to appropriate data types.
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Communication logs associated with this channel.
     */
    public function communicationLogs(): HasMany
    {
        return $this->hasMany(
            CommunicationLog::class,
            'communication_channel_id'
        );
    }
}
