<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\ClinicServiceOffering;
use App\Models\DentalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ClinicServiceController extends Controller
{
    /**
     * List active services offered by a clinic.
     * Public endpoint used by the patient booking flow.
     */
    public function publicIndex(
        Request $request,
        Clinic $clinic
    ): JsonResponse {
        abort_unless(
            $clinic->is_active,
            404,
            'Clinic not found or inactive.'
        );

        $validated = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $offerings = ClinicServiceOffering::query()
            ->with([
                'dentalService:id,name,description,is_active',
            ])
            ->where('clinic_id', $clinic->id)
            ->where('is_active', true)
            ->whereHas('dentalService', function ($query) {
                $query->where('is_active', true);
            })
            ->when(
                !empty($validated['search']),
                function ($query) use ($validated) {
                    $search = $validated['search'];

                    $query->whereHas(
                        'dentalService',
                        function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%");
                        }
                    );
                }
            )
            ->orderBy('id')
            ->paginate($validated['per_page'] ?? 50);

        return response()->json([
            'message' => 'Clinic services retrieved successfully.',
            'data' => $offerings,
        ]);
    }
    
    /**
     * Resolve and authorize the authenticated clinic.
     */
    private function getAuthorizedClinic(Request $request): Clinic
    {
        abort_unless(
            $request->user()?->role?->name === 'clinic',
            403,
            'Only clinic users can manage clinic services.'
        );

        return $request->user()
            ->clinicProfile()
            ->firstOrFail();
    }

    /**
     * List services offered by the authenticated clinic.
     */
    public function index(Request $request): JsonResponse
    {
        $clinic = $this->getAuthorizedClinic($request);

        $validated = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $offerings = ClinicServiceOffering::query()
            ->with([
                'dentalService:id,name,description,is_active',
            ])
            ->where('clinic_id', $clinic->id)
            ->when(
                !empty($validated['search']),
                function ($query) use ($validated) {
                    $search = $validated['search'];

                    $query->whereHas('dentalService', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                array_key_exists('is_active', $validated),
                fn ($query) => $query->where(
                    'is_active',
                    $validated['is_active']
                )
            )
            ->orderByDesc('id')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'message' => 'Clinic service offerings retrieved successfully.',
            'data' => $offerings,
        ]);
    }

    /**
     * Browse active master dental services not yet added by this clinic.
     *
     * Master price and duration are used as defaults when
     * the clinic adds a service.
     */
    public function catalogue(Request $request): JsonResponse
    {
        $clinic = $this->getAuthorizedClinic($request);

        $validated = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $services = DentalService::query()
            ->where('is_active', true)
            ->whereDoesntHave('clinicServiceOfferings', function ($query) use ($clinic) {
                $query->where('clinic_id', $clinic->id);
            })
            ->when(
                !empty($validated['search']),
                function ($query) use ($validated) {
                    $search = $validated['search'];

                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere(
                                'description',
                                'like',
                                "%{$search}%"
                            );
                    });
                }
            )
            ->orderBy('name')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'message' => 'Available dental service catalogue retrieved successfully.',
            'data' => $services,
        ]);
    }

    /**
     * Add a master dental service to the clinic.
     */
    public function store(Request $request): JsonResponse
    {
        $clinic = $this->getAuthorizedClinic($request);

        $validated = $request->validate([
            'dental_service_id' => [
                'required',
                'integer',
                Rule::exists('dental_services', 'id')
                    ->where('is_active', true),
                Rule::unique(
                    'clinic_service_offerings',
                    'dental_service_id'
                )->where('clinic_id', $clinic->id),
            ],
            'price' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
                'max:99999999.99',
            ],
            'duration_minutes' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $dentalService = DentalService::findOrFail(
            $validated['dental_service_id']
        );

        $offering = DB::transaction(function () use (
            $clinic,
            $dentalService,
            $validated
        ) {
            return ClinicServiceOffering::create([
                'clinic_id' => $clinic->id,
                'dental_service_id' => $dentalService->id,

                // Use master values as initial defaults.
                'price' => $validated['price'] ?? $dentalService->price,
                'duration_minutes' => $validated['duration_minutes']
                    ?? $dentalService->duration_minutes,

                'is_active' => true,
            ]);
        });

        $offering->load('dentalService');

        return response()->json([
            'message' => 'Dental service added to clinic successfully.',
            'data' => $offering,
        ], 201);
    }

    /**
     * Update clinic-specific price and duration.
     *
     * The dental_service_id and clinic_id cannot be changed here.
     */
    public function update(
        Request $request,
        ClinicServiceOffering $clinicService
    ): JsonResponse {
        $clinic = $this->getAuthorizedClinic($request);

        abort_unless(
            (int) $clinicService->clinic_id === (int) $clinic->id,
            404,
            'Clinic service offering not found.'
        );

        $validated = $request->validate([
            'price' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
            ],
            'duration_minutes' => [
                'sometimes',
                'required',
                'integer',
                'min:1',
            ],
        ]);

        $clinicService->update($validated);

        return response()->json([
            'message' => 'Clinic service offering updated successfully.',
            'data' => $clinicService->fresh()->load('dentalService'),
        ]);
    }

    /**
     * Activate or deactivate a clinic-specific offering.
     */
    public function updateStatus(
        Request $request,
        ClinicServiceOffering $clinicService
    ): JsonResponse {
        $clinic = $this->getAuthorizedClinic($request);

        abort_unless(
            (int) $clinicService->clinic_id === (int) $clinic->id,
            404,
            'Clinic service offering not found.'
        );

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $clinicService->update([
            'is_active' => $validated['is_active'],
        ]);

        return response()->json([
            'message' => 'Clinic service offering status updated successfully.',
            'data' => $clinicService->fresh()->load('dentalService'),
        ]);
    }
}