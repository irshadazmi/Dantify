<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MoreUsersSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            [
                'name' => 'Umair Ahmed',
                'email' => 'umair.ahmed@google.com',
                'password' => 'Patient@12345',
                'role' => 'patient',
            ],
            [
                'name' => 'Rifa Ahmed',
                'email' => 'rifa.ahmed@google.com',
                'password' => 'Dentist@12345',
                'role' => 'dentist',
            ],
            [
                'name' => 'Sunita Kale',
                'email' => 'sunita.kale@google.com',
                'password' => 'Staff@12345',
                'role' => 'staff',
            ],
            [
                'name' => 'Modern Diagnostics',
                'email' => 'modern.test@google.com',
                'password' => 'Laboratory@12345',
                'role' => 'laboratory',
            ],
        ];

        foreach ($accounts as $account) {
            $role = Role::where('name', $account['role'])->first();

            if (!$role) {
                $this->command?->warn(
                    "Role '{$account['role']}' not found. Skipping {$account['email']}."
                );

                continue;
            }

            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make($account['password']),
                    'role_id' => $role->id,
                ]
            );

            $this->command?->info(
                "Created or updated: {$account['email']}"
            );
        }
    }
}
