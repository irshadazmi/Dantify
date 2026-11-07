<?php

namespace Database\Seeders;

use App\Models\DentalService;
use Illuminate\Database\Seeder;

class DentalServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'name' => 'Dental Consultation',
                'description' => 'Initial dental examination and consultation',
                'price' => 500.00,
                'duration_minutes' => 30,
            ],
            [
                'name' => 'Follow-up Consultation',
                'description' => 'Follow-up examination and treatment review',
                'price' => 300.00,
                'duration_minutes' => 15,
            ],
            [
                'name' => 'Dental X-Ray',
                'description' => 'Intraoral dental radiograph',
                'price' => 300.00,
                'duration_minutes' => 15,
            ],
            [
                'name' => 'OPG X-Ray',
                'description' => 'Panoramic dental radiograph',
                'price' => 1000.00,
                'duration_minutes' => 20,
            ],
            [
                'name' => 'Dental Cleaning',
                'description' => 'Professional teeth cleaning and polishing',
                'price' => 1000.00,
                'duration_minutes' => 30,
            ],
            [
                'name' => 'Scaling and Polishing',
                'description' => 'Removal of plaque and tartar with polishing',
                'price' => 1500.00,
                'duration_minutes' => 45,
            ],
            [
                'name' => 'Fluoride Treatment',
                'description' => 'Professional topical fluoride application',
                'price' => 800.00,
                'duration_minutes' => 20,
            ],
            [
                'name' => 'Dental Filling',
                'description' => 'Restoration of a tooth using filling material',
                'price' => 1200.00,
                'duration_minutes' => 45,
            ],
            [
                'name' => 'Root Canal Treatment',
                'description' => 'Endodontic treatment to preserve an affected tooth',
                'price' => 5000.00,
                'duration_minutes' => 60,
            ],
            [
                'name' => 'Tooth Extraction',
                'description' => 'Routine extraction of a tooth',
                'price' => 1500.00,
                'duration_minutes' => 30,
            ],
            [
                'name' => 'Surgical Tooth Extraction',
                'description' => 'Surgical removal of an impacted or difficult tooth',
                'price' => 5000.00,
                'duration_minutes' => 60,
            ],
            [
                'name' => 'Dental Crown',
                'description' => 'Tooth preparation and crown restoration service',
                'price' => 6000.00,
                'duration_minutes' => 45,
            ],
            [
                'name' => 'Dental Bridge',
                'description' => 'Fixed prosthetic replacement for missing teeth',
                'price' => 12000.00,
                'duration_minutes' => 60,
            ],
            [
                'name' => 'Complete Denture',
                'description' => 'Complete removable denture service',
                'price' => 15000.00,
                'duration_minutes' => 45,
            ],
            [
                'name' => 'Dental Implant Consultation',
                'description' => 'Assessment and planning for dental implant treatment',
                'price' => 1000.00,
                'duration_minutes' => 30,
            ],
            [
                'name' => 'Dental Implant Placement',
                'description' => 'Surgical placement of a dental implant',
                'price' => 25000.00,
                'duration_minutes' => 90,
            ],
            [
                'name' => 'Teeth Whitening',
                'description' => 'Professional cosmetic teeth whitening',
                'price' => 6000.00,
                'duration_minutes' => 60,
            ],
            [
                'name' => 'Orthodontic Consultation',
                'description' => 'Assessment and planning for teeth alignment',
                'price' => 700.00,
                'duration_minutes' => 30,
            ],
            [
                'name' => 'Braces Adjustment',
                'description' => 'Routine orthodontic appliance adjustment',
                'price' => 1000.00,
                'duration_minutes' => 30,
            ],
            [
                'name' => 'Gum Treatment',
                'description' => 'Periodontal examination and non-surgical gum care',
                'price' => 2000.00,
                'duration_minutes' => 45,
            ],
            [
                'name' => 'Emergency Dental Treatment',
                'description' => 'Urgent assessment and initial dental care',
                'price' => 1500.00,
                'duration_minutes' => 30,
            ],
        ];

        foreach ($services as $service) {
            DentalService::updateOrCreate(
                ['name' => $service['name']],
                [
                    'description' => $service['description'],
                    'price' => $service['price'],
                    'duration_minutes' => $service['duration_minutes'],
                    'is_active' => true,
                ]
            );
        }
    }
}