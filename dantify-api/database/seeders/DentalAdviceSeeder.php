<?php

namespace Database\Seeders;

use App\Models\DentalAdvice;
use Illuminate\Database\Seeder;

class DentalAdviceSeeder extends Seeder
{
    public function run(): void
    {
        $advices = [
            // Oral Hygiene
            [
                'name' => 'Brush Twice Daily',
                'description' => 'Maintain regular oral hygiene by brushing teeth twice daily.',
                'default_instructions' => 'Brush gently twice daily using a soft-bristled toothbrush and fluoride toothpaste.',
            ],
            [
                'name' => 'Use Dental Floss',
                'description' => 'Clean interdental spaces to remove plaque and food particles.',
                'default_instructions' => 'Use dental floss gently once daily to clean between the teeth.',
            ],
            [
                'name' => 'Use a Soft-Bristled Toothbrush',
                'description' => 'Use a soft-bristled toothbrush to reduce gum irritation.',
                'default_instructions' => 'Use a soft-bristled toothbrush and avoid aggressive brushing.',
            ],
            [
                'name' => 'Tongue Cleaning',
                'description' => 'Maintain tongue hygiene and reduce bacterial accumulation.',
                'default_instructions' => 'Clean the tongue gently once daily using a tongue cleaner or toothbrush.',
            ],

            // Oral Rinsing and Care
            [
                'name' => 'Warm Saline Water Rinse',
                'description' => 'Warm saline rinsing for oral hygiene and selected post-procedure care.',
                'default_instructions' => 'Rinse gently with warm saline water as advised by the dentist.',
            ],
            [
                'name' => 'Chlorhexidine Mouth Rinse',
                'description' => 'Antiseptic oral rinse for selected dental conditions.',
                'default_instructions' => 'Use the prescribed concentration and frequency as directed by the dentist. Avoid swallowing.',
            ],
            [
                'name' => 'Avoid Vigorous Rinsing',
                'description' => 'Avoid disturbing the extraction site or surgical area.',
                'default_instructions' => 'Avoid vigorous rinsing, spitting or disturbing the treated area during the period advised by the dentist.',
            ],

            // Post-Operative Care
            [
                'name' => 'Apply Cold Compress',
                'description' => 'External cold application for selected post-operative swelling.',
                'default_instructions' => 'Apply a cold compress externally in short intervals as advised by the dentist. Do not apply ice directly to the skin.',
            ],
            [
                'name' => 'Avoid Smoking',
                'description' => 'Avoid smoking during dental treatment recovery.',
                'default_instructions' => 'Avoid smoking and tobacco products during the recovery period specified by the dentist.',
            ],
            [
                'name' => 'Avoid Alcohol',
                'description' => 'Avoid alcohol during recovery or when advised due to medication interactions.',
                'default_instructions' => 'Avoid alcohol for the period advised by the dentist, particularly when taking medicines that may interact with alcohol.',
            ],
            [
                'name' => 'Maintain Oral Hygiene After Extraction',
                'description' => 'Maintain appropriate oral hygiene while protecting the extraction site.',
                'default_instructions' => 'Keep the mouth clean and follow the dentist\'s instructions for cleaning around the extraction site.',
            ],
            [
                'name' => 'Avoid Disturbing Extraction Site',
                'description' => 'Protect the blood clot and healing extraction socket.',
                'default_instructions' => 'Do not touch, probe or disturb the extraction site with fingers or tongue.',
            ],

            // Dietary Advice
            [
                'name' => 'Soft Food Diet',
                'description' => 'Temporarily consume soft foods during dental recovery.',
                'default_instructions' => 'Consume soft, easy-to-chew foods for the duration advised by the dentist.',
            ],
            [
                'name' => 'Avoid Hot Foods and Beverages',
                'description' => 'Avoid excessively hot food and beverages during selected recovery periods.',
                'default_instructions' => 'Avoid very hot foods and beverages until the treated area has recovered as advised.',
            ],
            [
                'name' => 'Avoid Hard and Sticky Foods',
                'description' => 'Avoid foods that may damage restorations or irritate treated areas.',
                'default_instructions' => 'Avoid hard, crunchy and sticky foods for the period advised by the dentist.',
            ],
            [
                'name' => 'Stay Hydrated',
                'description' => 'Maintain adequate hydration during recovery.',
                'default_instructions' => 'Drink adequate water throughout the day unless medically restricted.',
            ],

            // Preventive Care
            [
                'name' => 'Limit Sugary Foods and Drinks',
                'description' => 'Reduce sugar exposure to support dental health.',
                'default_instructions' => 'Limit frequent consumption of sugary foods and beverages.',
            ],
            [
                'name' => 'Regular Dental Check-up',
                'description' => 'Attend periodic dental examinations for preventive care.',
                'default_instructions' => 'Schedule regular dental check-ups at the interval recommended by the dentist.',
            ],
            [
                'name' => 'Professional Dental Cleaning',
                'description' => 'Professional scaling and cleaning when clinically indicated.',
                'default_instructions' => 'Schedule professional dental cleaning as recommended by the dentist.',
            ],

            // Follow-up and Monitoring
            [
                'name' => 'Dental Follow-up Visit',
                'description' => 'Return for clinical reassessment after treatment.',
                'default_instructions' => 'Attend the follow-up booking on the date scheduled by the dentist.',
            ],
            [
                'name' => 'Monitor for Swelling or Bleeding',
                'description' => 'Monitor the treated area for unexpected post-treatment symptoms.',
                'default_instructions' => 'Contact the dental clinic if swelling, bleeding or pain worsens or does not improve as expected.',
            ],
            [
                'name' => 'Report Persistent Pain',
                'description' => 'Seek dental reassessment if pain persists or worsens.',
                'default_instructions' => 'Contact the dentist if pain persists, becomes severe or worsens.',
            ],
        ];

        foreach ($advices as $advice) {
            DentalAdvice::updateOrCreate(
                [
                    'name' => $advice['name'],
                ],
                [
                    'description' => $advice['description'],
                    'default_instructions' => $advice['default_instructions'],
                    'is_active' => true,
                ]
            );
        }
    }
}
