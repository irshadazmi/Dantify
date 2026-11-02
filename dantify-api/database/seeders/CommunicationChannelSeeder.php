<?php

namespace Database\Seeders;

use App\Models\CommunicationChannel;
use Illuminate\Database\Seeder;

class CommunicationChannelSeeder extends Seeder
{
    public function run(): void
    {
        $channels = [
            [
                'type_name' => 'Email',
                'description' => 'Email communications such as receipts or reminders',
            ],
            [
                'type_name' => 'SMS',
                'description' => 'Short message service communications',
            ],
            [
                'type_name' => 'WhatsApp',
                'description' => 'Messages sent via WhatsApp',
            ],
            [
                'type_name' => 'Phone Call',
                'description' => 'Details of phone call communications',
            ],
            [
                'type_name' => 'In-App Notification',
                'description' => 'Notifications sent within the app',
            ],
            [
                'type_name' => 'Postal Mail',
                'description' => 'Traditional postal mail',
            ],
            [
                'type_name' => 'Fax',
                'description' => 'Communication via fax machines',
            ],
            [
                'type_name' => 'Push Notification',
                'description' => 'Push notifications to mobile devices',
            ],
            [
                'type_name' => 'Chatbot',
                'description' => 'Automated chatbot interactions',
            ],
            [
                'type_name' => 'Social Media',
                'description' => 'Social media communications',
            ],
        ];

        foreach ($channels as $channel) {
            CommunicationChannel::updateOrCreate(
                ['type_name' => $channel['type_name']],
                [
                    'description' => $channel['description'],
                    'is_active' => true,
                ]
            );
        }
    }
}
