<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClinicSeeder extends Seeder
{
    public function run(): void
    {
        $clinics = [
            [
                'name' => 'Clinic 1',
                'address' => '123 Street',
                'city' => 'City 1',
                'country' => 'Country 1',
                'phone' => '1234567890',
                'email' => 'clinic1@example.com',
                'is_active' => true,
            ],
            [
                'name' => 'Clinic 2',
                'address' => '456 Street',
                'city' => 'City 2',
                'country' => 'Country 2',
                'phone' => '9876543210',
                'email' => 'clinic2@example.com',
                'is_active' => true,
            ],
        ];

        foreach ($clinics as $clinic) {
            DB::table('clinics')->updateOrInsert(
                ['email' => $clinic['email']],
                array_merge($clinic, [
                    'updated_at' => now(),
                    'created_at' => now(),
                ])
            );
        }
    }
}
