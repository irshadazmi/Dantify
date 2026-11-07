<?php

namespace Database\Seeders;

use App\Models\Medicine;
use Illuminate\Database\Seeder;

class MedicineSeeder extends Seeder
{
    public function run(): void
    {
        $medicines = [
            [
                'name' => 'Paracetamol 500 mg Tablet',
                'generic_name' => 'Paracetamol',
                'composition' => 'Paracetamol 500 mg',
                'brand_name' => null,
                'strength' => '500 mg',
                'dosage_form' => 'Tablet',
                'manufacturer' => null,
                'description' => 'Analgesic and antipyretic medicine.',
                'default_instructions' => null,
            ],
            [
                'name' => 'Ibuprofen 400 mg Tablet',
                'generic_name' => 'Ibuprofen',
                'composition' => 'Ibuprofen 400 mg',
                'brand_name' => null,
                'strength' => '400 mg',
                'dosage_form' => 'Tablet',
                'manufacturer' => null,
                'description' => 'Non-steroidal anti-inflammatory medicine.',
                'default_instructions' => null,
            ],
            [
                'name' => 'Amoxicillin 500 mg Capsule',
                'generic_name' => 'Amoxicillin',
                'composition' => 'Amoxicillin 500 mg',
                'brand_name' => null,
                'strength' => '500 mg',
                'dosage_form' => 'Capsule',
                'manufacturer' => null,
                'description' => 'Prescription antibiotic.',
                'default_instructions' => null,
            ],
            [
                'name' => 'Amoxicillin-Clavulanate 625 mg Tablet',
                'generic_name' => 'Amoxicillin + Clavulanic Acid',
                'composition' => 'Amoxicillin 500 mg + Clavulanic Acid 125 mg',
                'brand_name' => null,
                'strength' => '625 mg',
                'dosage_form' => 'Tablet',
                'manufacturer' => null,
                'description' => 'Prescription combination antibiotic.',
                'default_instructions' => null,
            ],
            [
                'name' => 'Metronidazole 400 mg Tablet',
                'generic_name' => 'Metronidazole',
                'composition' => 'Metronidazole 400 mg',
                'brand_name' => null,
                'strength' => '400 mg',
                'dosage_form' => 'Tablet',
                'manufacturer' => null,
                'description' => 'Prescription antimicrobial medicine.',
                'default_instructions' => null,
            ],
            [
                'name' => 'Chlorhexidine 0.2% Mouthwash',
                'generic_name' => 'Chlorhexidine Gluconate',
                'composition' => 'Chlorhexidine Gluconate 0.2%',
                'brand_name' => null,
                'strength' => '0.2%',
                'dosage_form' => 'Mouthwash',
                'manufacturer' => null,
                'description' => 'Antiseptic mouthwash for oral care.',
                'default_instructions' => null,
            ],
            [
                'name' => 'Lidocaine 2% Dental Cartridge',
                'generic_name' => 'Lidocaine',
                'composition' => 'Lidocaine 2%',
                'brand_name' => null,
                'strength' => '2%',
                'dosage_form' => 'Dental Injection',
                'manufacturer' => null,
                'description' => 'Local anaesthetic used in dental procedures.',
                'default_instructions' => null,
            ],
            [
                'name' => 'Benzocaine 20% Oral Gel',
                'generic_name' => 'Benzocaine',
                'composition' => 'Benzocaine 20%',
                'brand_name' => null,
                'strength' => '20%',
                'dosage_form' => 'Oral Gel',
                'manufacturer' => null,
                'description' => 'Topical oral anaesthetic preparation.',
                'default_instructions' => null,
            ],
            [
                'name' => 'Dexamethasone 0.5 mg Tablet',
                'generic_name' => 'Dexamethasone',
                'composition' => 'Dexamethasone 0.5 mg',
                'brand_name' => null,
                'strength' => '0.5 mg',
                'dosage_form' => 'Tablet',
                'manufacturer' => null,
                'description' => 'Prescription corticosteroid.',
                'default_instructions' => null,
            ],
            [
                'name' => 'Nystatin Oral Suspension',
                'generic_name' => 'Nystatin',
                'composition' => 'Nystatin 100,000 units/mL',
                'brand_name' => null,
                'strength' => '100,000 units/mL',
                'dosage_form' => 'Oral Suspension',
                'manufacturer' => null,
                'description' => 'Antifungal medicine for oral use.',
                'default_instructions' => null,
            ],
        ];

        foreach ($medicines as $medicine) {
            Medicine::updateOrCreate(
                [
                    'name' => $medicine['name'],
                    'strength' => $medicine['strength'],
                    'dosage_form' => $medicine['dosage_form'],
                ],
                [
                    'generic_name' => $medicine['generic_name'],
                    'composition' => $medicine['composition'],
                    'brand_name' => $medicine['brand_name'],
                    'manufacturer' => $medicine['manufacturer'],
                    'description' => $medicine['description'],
                    'default_instructions' => $medicine['default_instructions'],
                    'is_active' => true,
                ]
            );
        }
    }
}
