<?php

namespace Database\Seeders;

use App\Models\BookingStatus;
use Illuminate\Database\Seeder;

class BookingStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            [
                'code' => 'PENDING_CONFIRMATION',
                'name' => 'Pending Confirmation',
                'description' => 'Booking is awaiting confirmation.',
                'is_active' => true,
                'is_terminal' => false,
            ],
            [
                'code' => 'CONFIRMED',
                'name' => 'Confirmed',
                'description' => 'Booking has been confirmed.',
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
                'description' => 'Consultation or procedure is currently in progress.',
                'is_active' => true,
                'is_terminal' => false,
            ],
            [
                'code' => 'COMPLETED',
                'name' => 'Completed',
                'description' => 'Booking has been completed successfully.',
                'is_active' => true,
                'is_terminal' => true,
            ],
            [
                'code' => 'CANCELLED',
                'name' => 'Cancelled',
                'description' => 'Booking was cancelled before completion.',
                'is_active' => true,
                'is_terminal' => true,
            ],
            [
                'code' => 'NO_SHOW',
                'name' => 'No Show',
                'description' => 'Patient did not arrive for the booking.',
                'is_active' => true,
                'is_terminal' => true,
            ],
            [
                'code' => 'RESCHEDULED',
                'name' => 'Rescheduled',
                'description' => 'Booking was rescheduled and replaced by another booking.',
                'is_active' => true,
                'is_terminal' => true,
            ],
        ];

        foreach ($statuses as $status) {
            BookingStatus::updateOrCreate(
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