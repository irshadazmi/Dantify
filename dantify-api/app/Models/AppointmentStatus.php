<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AppointmentStatus extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'appointment_statuses';

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
     * Appointments associated with this status.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'appointment_status_id');
    }
}
