<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\ClinicService;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ClinicServiceController extends Controller
{
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

        $services = ClinicService::query()
            ->with([
                'service:id,name,description,is_active',
            ])
            ->where('clinic_id', $clinic->id)
            ->when(
                !empty($validated['search']),
                function ($query) use ($validated) {
                    $search = $validated['search'];

                    $query->whereHas('service', function ($q) use ($search) {
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
            ->orderBy('id', 'desc')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'message' => 'Clinic services retrieved successfully.',
            'data' => $services,
        ]);
    }

    /**
     * Browse active master services not yet added by this clinic.
     *
     * The master price and duration are provided as defaults
     * when the clinic adds a service.
     */
    public function catalogue(Request $request): JsonResponse
    {
        $clinic = $this->getAuthorizedClinic($request);

        $validated = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $services = Service::query()
            ->where('is_active', true)
            ->whereDoesntHave('clinicServices', function ($query) use ($clinic) {
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
            'message' => 'Available service catalogue retrieved successfully.',
            'data' => $services,
        ]);
    }

    /**
     * Add a master catalogue service to the clinic.
     */
    public function store(Request $request): JsonResponse
    {
        $clinic = $this->getAuthorizedClinic($request);

        $validated = $request->validate([
            'service_id' => [
                'required',
                'integer',
                Rule::exists('services', 'id')
                    ->where('is_active', true),
                Rule::unique('clinic_services', 'service_id')
                    ->where('clinic_id', $clinic->id),
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

        $service = Service::findOrFail($validated['service_id']);

        $clinicService = DB::transaction(function () use (
            $clinic,
            $service,
            $validated
        ) {
            return ClinicService::create([
                'clinic_id' => $clinic->id,
                'service_id' => $service->id,

                // Use master values as initial defaults.
                'price' => $validated['price'] ?? $service->price,
                'duration_minutes' => $validated['duration_minutes']
                    ?? $service->duration_minutes,

                'is_active' => true,
            ]);
        });

        $clinicService->load('service');

        return response()->json([
            'message' => 'Service added to clinic successfully.',
            'data' => $clinicService,
        ], 201);
    }

    /**
     * Update clinic-specific price and duration.
     *
     * The service_id and clinic_id cannot be changed here.
     */
    public function update(
        Request $request,
        ClinicService $clinicService
    ): JsonResponse {
        $clinic = $this->getAuthorizedClinic($request);

        abort_unless(
            $clinicService->clinic_id === $clinic->id,
            404,
            'Clinic service not found.'
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
            'message' => 'Clinic service updated successfully.',
            'data' => $clinicService->fresh()->load('service'),
        ]);
    }

    /**
     * Activate or deactivate a clinic-specific offering.
     */
    public function updateStatus(
        Request $request,
        ClinicService $clinicService
    ): JsonResponse {
        $clinic = $this->getAuthorizedClinic($request);

        abort_unless(
            $clinicService->clinic_id === $clinic->id,
            404,
            'Clinic service not found.'
        );

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $clinicService->update([
            'is_active' => $validated['is_active'],
        ]);

        return response()->json([
            'message' => 'Clinic service status updated successfully.',
            'data' => $clinicService->fresh()->load('service'),
        ]);
    }
}
