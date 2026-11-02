<?php

namespace Database\Seeders;

use App\Models\Laboratory;
use Illuminate\Database\Seeder;

class LaboratorySeeder extends Seeder
{
    public function run(): void
    {
        $laboratories = [
            [
                'name' => 'Demo Dental Laboratory',
                'contact_person' => 'Lab Administrator',
                'email' => 'demo.lab@example.com',
                'phone' => '9000000001',
                'address' => '123 Dental Lab Street',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'country' => 'India',
                'postal_code' => '411001',
                'registration_number' => 'DEMO-LAB-001',
                'notes' => 'Sample laboratory record for development and testing.',
                'is_active' => true,
            ],
        ];

        foreach ($laboratories as $laboratory) {
            Laboratory::updateOrCreate(
                ['registration_number' => $laboratory['registration_number']],
                $laboratory
            );
        }
    }
}
