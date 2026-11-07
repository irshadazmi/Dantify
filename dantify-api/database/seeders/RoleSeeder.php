<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'superadmin',
                'description' => 'System-wide administration',
            ],
            [
                'name' => 'clinic',
                'description' => 'Clinic administration',
            ],
            [
                'name' => 'dentist',
                'description' => 'Dental practitioner',
            ],
            [
                'name' => 'staff',
                'description' => 'Patient registration and bookings',
            ],
            [
                'name' => 'laboratory',
                'description' => 'Laboratory provider access for managing lab orders and reports',
            ],
            [
                'name' => 'patient',
                'description' => 'Patient access',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                ['description' => $role['description']]
            );
        }
    }
}
