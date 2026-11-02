<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentService;
use App\Models\AppointmentStatus;
use App\Models\ClinicService;
use App\Models\Dentist;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentController extends Controller
{
    /**
     * List appointments accessible to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = strtolower($user->role->name ?? '');

        $query = Appointment::with([
            'patient',
            'dentist',
            'clinic',
            'appointmentStatus',
            'appointmentServices.service',
        ])->latest('appointment_date');

        if ($role === 'patient') {
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                return response()->json([
                    'message' => 'No patient profile is linked to this account.',
                ], 403);
            }

            $query->where('patient_id', $patient->id);
        } elseif ($role === 'dentist') {
            $dentist = Dentist::where('user_id', $user->id)->first();

            if (!$dentist) {
                return response()->json([
                    'message' => 'No dentist profile is linked to this account.',
                ], 403);
            }

            $query->where('dentist_id', $dentist->id);
        } elseif (!in_array($role, ['admin', 'superadmin'], true)) {
            return response()->json([
                'message' => 'You are not authorized to list appointments.',
            ], 403);
        }

        $appointments = $query->paginate(
            min((int) $request->input('per_page', 15), 100)
        );

        return response()->json($appointments);
    }

    /**
     * Create an appointment and its service lines.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = strtolower($user->role->name ?? '');

        if (!in_array(
            $role,
            ['patient', 'dentist', 'admin', 'superadmin'],
            true
        )) {
            return response()->json([
                'message' => 'You are not authorized to create appointments.',
            ], 403);
        }

        $validated = $request->validate([
            'patient_id' => ['nullable', 'integer', 'exists:patients,id'],
            'dentist_id' => ['nullable', 'integer', 'exists:dentists,id'],
            'clinic_id' => ['required', 'integer', 'exists:clinics,id'],
            'appointment_date' => ['required', 'date', 'after:now'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'services' => ['required', 'array', 'min:1'],
            'services.*.service_id' => [
                'required',
                'integer',
                'distinct',
                'exists:services,id',
            ],
            'services.*.quantity' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        if ($role !== 'patient' && empty($validated['patient_id'])) {
            throw ValidationException::withMessages([
                'patient_id' => ['The patient field is required.'],
            ]);
        }

        if ($role !== 'dentist' && empty($validated['dentist_id'])) {
            throw ValidationException::withMessages([
                'dentist_id' => ['The dentist field is required.'],
            ]);
        }

        // Derive patient identity from the authenticated account.
        if ($role === 'patient') {
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                return response()->json([
                    'message' => 'No patient profile is linked to this account.',
                ], 403);
            }

            $validated['patient_id'] = $patient->id;
        }

        // Dentists can book only against their own dentist profile.
        if ($role === 'dentist') {
            $dentist = Dentist::where('user_id', $user->id)->first();

            if (!$dentist) {
                return response()->json([
                    'message' => 'No dentist profile is linked to this account.',
                ], 403);
            }

            $validated['dentist_id'] = $dentist->id;
        }

        // Ensure the selected dentist works at the selected clinic.
        $worksAtClinic = DB::table('dentist_clinics')
            ->where('dentist_id', $validated['dentist_id'])
            ->where('clinic_id', $validated['clinic_id'])
            ->exists();

        if (!$worksAtClinic) {
            throw ValidationException::withMessages([
                'clinic_id' => [
                    'The selected dentist is not associated with this clinic.',
                ],
            ]);
        }

        // Resolve the initial appointment status from the status master.
        $status = AppointmentStatus::where(function ($query) {
            $query->where('code', 'scheduled')
                ->orWhere('name', 'Scheduled');
        })->first();

        if (!$status) {
            return response()->json([
                'message' => 'The Scheduled appointment status is not configured.',
            ], 422);
        }

        $appointment = DB::transaction(function () use (
            $validated,
            $status
        ) {
            $appointment = Appointment::create([
                'patient_id' => $validated['patient_id'],
                'dentist_id' => $validated['dentist_id'],
                'clinic_id' => $validated['clinic_id'],
                'appointment_date' => $validated['appointment_date'],
                'notes' => $validated['notes'] ?? null,
                'appointment_status_id' => $status->id,
            ]);

            foreach ($validated['services'] as $item) {
                $clinicService = ClinicService::where(
                    'clinic_id',
                    $validated['clinic_id']
                )
                    ->where('service_id', $item['service_id'])
                    ->where('is_active', true)
                    ->first();

                if (!$clinicService) {
                    throw ValidationException::withMessages([
                        'services' => [
                            'One or more selected services are not offered by this clinic.',
                        ],
                    ]);
                }

                AppointmentService::create([
                    'appointment_id' => $appointment->id,
                    'service_id' => $clinicService->service_id,
                    'quantity' => $item['quantity'] ?? 1,
                    'unit_price' => $clinicService->price,
                ]);
            }

            return $appointment;
        });

        return response()->json([
            'message' => 'Appointment created successfully.',
            'data' => $appointment->load([
                'patient',
                'dentist',
                'clinic',
                'appointmentStatus',
                'appointmentServices.service',
            ]),
        ], 201);
    }

    /**
     * Show a single appointment.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::with([
            'patient',
            'dentist',
            'clinic',
            'appointmentStatus',
            'appointmentServices.service',
        ])->findOrFail($id);

        if (!$this->canAccessAppointment($request, $appointment)) {
            return response()->json([
                'message' => 'You are not authorized to view this appointment.',
            ], 403);
        }

        return response()->json(['data' => $appointment]);
    }

    /**
     * Update appointment details.
     *
     * Service lines can optionally be replaced by passing a services array.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::with('appointmentServices')
            ->findOrFail($id);

        if (!$this->canAccessAppointment($request, $appointment, true)) {
            return response()->json([
                'message' => 'You are not authorized to update this appointment.',
            ], 403);
        }

        $validated = $request->validate([
            'appointment_date' => ['sometimes', 'required', 'date', 'after:now'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'services' => ['sometimes', 'array', 'min:1'],
            'services.*.service_id' => [
                'required',
                'integer',
                'distinct',
                'exists:services,id',
            ],
            'services.*.quantity' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        DB::transaction(function () use (
            $appointment,
            $validated
        ) {
            $appointment->fill([
                'appointment_date' => $validated['appointment_date']
                    ?? $appointment->appointment_date,
                'notes' => array_key_exists('notes', $validated)
                    ? $validated['notes']
                    : $appointment->notes,
            ])->save();

            if (array_key_exists('services', $validated)) {
                $appointment->appointmentServices()->delete();

                foreach ($validated['services'] as $item) {
                    $clinicService = ClinicService::where(
                        'clinic_id',
                        $appointment->clinic_id
                    )
                        ->where('service_id', $item['service_id'])
                        ->where('is_active', true)
                        ->first();

                    if (!$clinicService) {
                        throw ValidationException::withMessages([
                            'services' => [
                                'One or more selected services are not offered by this clinic.',
                            ],
                        ]);
                    }

                    AppointmentService::create([
                        'appointment_id' => $appointment->id,
                        'service_id' => $clinicService->service_id,
                        'quantity' => $item['quantity'] ?? 1,
                        'unit_price' => $clinicService->price,
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Appointment updated successfully.',
            'data' => $appointment->fresh()->load([
                'patient',
                'dentist',
                'clinic',
                'appointmentStatus',
                'appointmentServices.service',
            ]),
        ]);
    }

    /**
     * Check appointment access for patients, dentists and administrators.
     */
    private function canAccessAppointment(
        Request $request,
        Appointment $appointment,
        bool $forUpdate = false
    ): bool {
        $user = $request->user();
        $role = strtolower($user->role->name ?? '');

        if (in_array($role, ['admin', 'superadmin'], true)) {
            return true;
        }

        if ($role === 'patient') {
            $patientId = Patient::where('user_id', $user->id)
                ->value('id');

            return $patientId !== null
                && (int) $appointment->patient_id === (int) $patientId
                && !$forUpdate;
        }

        if ($role === 'dentist') {
            $dentistId = Dentist::where('user_id', $user->id)
                ->value('id');

            return $dentistId !== null
                && (int) $appointment->dentist_id === (int) $dentistId
                && !$forUpdate;
        }

        return false;
    }
}