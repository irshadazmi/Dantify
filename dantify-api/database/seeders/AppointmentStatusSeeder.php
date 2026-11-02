<?php

namespace Database\Seeders;

use App\Models\AppointmentStatus;
use Illuminate\Database\Seeder;

class AppointmentStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            [
                'code' => 'SCHEDULED',
                'name' => 'Scheduled',
                'description' => 'Appointment has been scheduled.',
                'is_active' => true,
                'is_terminal' => false,
            ],
            [
                'code' => 'CONFIRMED',
                'name' => 'Confirmed',
                'description' => 'Appointment has been confirmed by the patient.',
                'is_active' => true,
                'is_terminal' => false,
            ],
            [
                'code' => 'CHECKED_IN',
                'name' => 'Checked In',
                'description' => 'Patient has arrived and checked in at the clinic.',
                'is_active' => true,
                'is_terminal' => false,
            ],
            [
                'code' => 'IN_PROGRESS',
                'name' => 'In Progress',
                'description' => 'Appointment is currently in progress.',
                'is_active' => true,
                'is_terminal' => false,
            ],
            [
                'code' => 'COMPLETED',
                'name' => 'Completed',
                'description' => 'Appointment has been completed successfully.',
                'is_active' => true,
                'is_terminal' => true,
            ],
            [
                'code' => 'CANCELLED',
                'name' => 'Cancelled',
                'description' => 'Appointment was cancelled before completion.',
                'is_active' => true,
                'is_terminal' => true,
            ],
            [
                'code' => 'NO_SHOW',
                'name' => 'No Show',
                'description' => 'Patient did not show up for the appointment.',
                'is_active' => true,
                'is_terminal' => true,
            ],
            [
                'code' => 'RESCHEDULED',
                'name' => 'Rescheduled',
                'description' => 'Appointment has been rescheduled to another time.',
                'is_active' => true,
                'is_terminal' => true,
            ],
            [
                'code' => 'PENDING_CONFIRMATION',
                'name' => 'Pending Confirmation',
                'description' => 'Appointment is awaiting confirmation.',
                'is_active' => true,
                'is_terminal' => false,
            ],
            [
                'code' => 'AWAITING_PAYMENT',
                'name' => 'Awaiting Payment',
                'description' => 'Appointment completed but payment is pending.',
                'is_active' => true,
                'is_terminal' => false,
            ],
            [
                'code' => 'FOLLOW_UP_REQUIRED',
                'name' => 'Follow Up Required',
                'description' => 'Follow-up appointment is required.',
                'is_active' => true,
                'is_terminal' => false,
            ],
            [
                'code' => 'BLOCKED',
                'name' => 'Blocked',
                'description' => 'Time slot is blocked and unavailable for booking.',
                'is_active' => true,
                'is_terminal' => true,
            ],
        ];

        foreach ($statuses as $status) {
            AppointmentStatus::updateOrCreate(
                ['code' => $status['code']],
                [
                    'name' => $status['name'],
                    'description' => $status['description'],
                    'is_active' => $status['is_active'],
                    'is_terminal' => $status['is_terminal'],
                ]
            );
        }
    }
}
