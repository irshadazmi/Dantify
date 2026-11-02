<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClinicController extends Controller
{
    /**
     * List clinics belonging to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $clinics = Clinic::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->paginate(15);

        return response()->json([
            'message' => 'Clinics retrieved successfully.',
            'data' => $clinics,
        ]);
    }

    /**
     * Create a clinic for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'address' => ['required', 'string', 'max:250'],
            'city' => ['required', 'string', 'max:100'],
            'country' => ['required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:254'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $validated['user_id'] = $request->user()->id;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $clinic = Clinic::create($validated);

        return response()->json([
            'message' => 'Clinic created successfully.',
            'data' => $clinic,
        ], 201);
    }

    /**
     * Retrieve a clinic owned by the authenticated user.
     */
    public function show(Request $request, Clinic $clinic): JsonResponse
    {
        $this->authorizeOwnership($request, $clinic);

        return response()->json([
            'message' => 'Clinic retrieved successfully.',
            'data' => $clinic,
        ]);
    }

    /**
     * Update a clinic owned by the authenticated user.
     */
    public function update(
        Request $request,
        Clinic $clinic
    ): JsonResponse {
        $this->authorizeOwnership($request, $clinic);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'address' => ['sometimes', 'required', 'string', 'max:250'],
            'city' => ['sometimes', 'required', 'string', 'max:100'],
            'country' => ['sometimes', 'required', 'string', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'email' => ['sometimes', 'nullable', 'email', 'max:254'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $clinic->update($validated);

        return response()->json([
            'message' => 'Clinic updated successfully.',
            'data' => $clinic->fresh(),
        ]);
    }

    /**
     * Delete a clinic owned by the authenticated user.
     */
    public function destroy(
        Request $request,
        Clinic $clinic
    ): JsonResponse {
        $this->authorizeOwnership($request, $clinic);

        $clinic->delete();

        return response()->json([
            'message' => 'Clinic deleted successfully.',
        ]);
    }

    /**
     * Retrieve the authenticated user's clinic profile.
     */
    public function myProfile(Request $request): JsonResponse
    {
        $clinic = Clinic::where('user_id', $request->user()->id)
            ->first();

        if (!$clinic) {
            return response()->json([
                'message' => 'Clinic profile not found.',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'message' => 'Clinic profile retrieved successfully.',
            'data' => $clinic,
        ]);
    }

    /**
     * Ensure users can only access their own clinics.
     */
    private function authorizeOwnership(
        Request $request,
        Clinic $clinic
    ): void {
        abort_unless(
            $clinic->user_id === $request->user()->id,
            403,
            'You are not authorized to access this clinic.'
        );
    }
}

