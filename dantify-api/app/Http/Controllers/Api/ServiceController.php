<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    /**
     * Ensure that only Super Admin users can manage
     * the common service catalogue.
     */
    private function authorizeSuperAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->role?->name === 'superadmin',
            403,
            'You are not authorized to manage the service catalogue.'
        );
    }

    /**
     * List all common services.
     *
     * Supports:
     * ?search=cleaning
     * ?is_active=1
     * ?per_page=15
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $services = Service::query()
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
            ->when(
                array_key_exists('is_active', $validated),
                fn ($query) => $query->where(
                    'is_active',
                    $validated['is_active']
                )
            )
            ->orderBy('name')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'message' => 'Services retrieved successfully.',
            'data' => $services,
        ]);
    }

    /**
     * Create a common service.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('services', 'name'),
            ],
            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
            'price' => [
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
            ],
            'duration_minutes' => [
                'required',
                'integer',
                'min:1',
            ],
            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;

        $service = Service::create($validated);

        return response()->json([
            'message' => 'Service created successfully.',
            'data' => $service,
        ], 201);
    }

    /**
     * Retrieve a common service.
     */
    public function show(
        Request $request,
        Service $service
    ): JsonResponse {
        $this->authorizeSuperAdmin($request);

        return response()->json([
            'message' => 'Service retrieved successfully.',
            'data' => $service,
        ]);
    }

    /**
     * Update a common service.
     *
     * Updating the master service does not modify
     * any clinic-specific price or duration.
     */
    public function update(
        Request $request,
        Service $service
    ): JsonResponse {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('services', 'name')->ignore($service->id),
            ],
            'description' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
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
            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $service->update($validated);

        return response()->json([
            'message' => 'Service updated successfully.',
            'data' => $service->fresh(),
        ]);
    }

    /**
     * Activate or deactivate a common service.
     */
    public function updateStatus(
        Request $request,
        Service $service
    ): JsonResponse {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $service->update([
            'is_active' => $validated['is_active'],
        ]);

        return response()->json([
            'message' => 'Service status updated successfully.',
            'data' => $service->fresh(),
        ]);
    }
}
