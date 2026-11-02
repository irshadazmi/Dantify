<?php

namespace Database\Seeders;

use App\Models\Clinic;
use App\Models\ClinicService;
use App\Models\Service;
use Illuminate\Database\Seeder;

class ClinicServiceSeeder extends Seeder
{
    public function run(): void
    {
        // Fetch the clinics created by ClinicSeeder.
        $clinics = Clinic::whereIn('email', [
            'clinic1@example.com',
            'clinic2@example.com',
        ])->get();

        // Fetch active services from the common catalogue.
        $services = Service::where('is_active', true)->get();

        if ($clinics->isEmpty()) {
            $this->command?->warn(
                'No seeded clinics found. Run ClinicSeeder first.'
            );

            return;
        }

        if ($services->isEmpty()) {
            $this->command?->warn(
                'No active services found. Run ServiceSeeder first.'
            );

            return;
        }

        foreach ($clinics as $clinic) {
            foreach ($services as $service) {
                ClinicService::updateOrCreate(
                    [
                        'clinic_id' => $clinic->id,
                        'service_id' => $service->id,
                    ],
                    [
                        // Initially inherit the master service defaults.
                        'price' => $service->price,
                        'duration_minutes' => $service->duration_minutes,
                        'is_active' => true,
                    ]
                );
            }
        }

        $this->command?->info(
            'Clinic services seeded successfully.'
        );
    }
}