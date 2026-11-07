<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            BookingStatusSeeder::class,
            DentalServiceSeeder::class,
            CommunicationChannelSeeder::class,
            MedicineSeeder::class,
            DentalAdviceSeeder::class,
        ]);
    }
}