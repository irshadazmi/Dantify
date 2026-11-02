<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminRole = Role::where('name', 'superadmin')->first();

        if (!$superAdminRole) {
            $this->command->error(
                'Admin role not found. Run RoleSeeder first.'
            );
            return;
        }

        User::updateOrCreate(
            ['email' => 'superadmin@dantify.com'],
            [
                'phone' => '9999999999',
                'password' => Hash::make('SuperAdmin@12345'),
                'role_id' => $superAdminRole->id,
                'is_active' => true,
            ]
        );

        $this->command->info('Super Admin user seeded successfully.');
    }
}
