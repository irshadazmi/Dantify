<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PatientController extends Controller
{
    /**
     * List patients accessible to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $patients = Patient::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('name')
            ->paginate(15);

        return response()->json($patients);
    }

    /**
     * Create the authenticated user's patient profile.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // A user should have only one patient profile.
        $existing = Patient::where('user_id', $user->id)->first();

        if ($existing) {
            return response()->json([
                'message' => 'Your patient profile already exists.',
                'data' => $existing,
            ], 409);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'gender' => ['nullable', 'string', 'max:30'],
            'dob' => ['nullable', 'date', 'before_or_equal:today'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => [
                'nullable',
                'email',
                'max:255',
            ],
            'insurance_provider_id' => [
                'nullable',
                'integer',
                'exists:insurance_providers,id',
            ],
        ]);

        // Never accept user_id from the request body.
        $patient = Patient::create([
            ...$validated,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Patient profile created successfully.',
            'data' => $patient,
        ], 201);
    }

    /**
     * Show a patient record, only if it belongs to this user.
     */
    public function show(Request $request, Patient $patient): JsonResponse
    {
        $this->authorizePatientAccess($request, $patient);

        return response()->json([
            'data' => $patient,
        ]);
    }

    /**
     * Update the authenticated user's patient profile.
     */
    public function update(
        Request $request,
        Patient $patient
    ): JsonResponse {
        $this->authorizePatientAccess($request, $patient);

        $validated = $request->validate([
            'nane' => ['sometimes', 'required', 'string', 'max:100'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:30'],
            'dob' => [
                'sometimes',
                'nullable',
                'date',
                'before_or_equal:today',
            ],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
            ],
            'insurance_provider_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:insurance_providers,id',
            ],
        ]);

        // user_id is intentionally not editable.
        $patient->update($validated);

        return response()->json([
            'message' => 'Patient profile updated successfully.',
            'data' => $patient->fresh(),
        ]);
    }

    /**
     * Delete the authenticated user's patient profile.
     */
    public function destroy(
        Request $request,
        Patient $patient
    ): JsonResponse {
        $this->authorizePatientAccess($request, $patient);

        $patient->delete();

        return response()->json([
            'message' => 'Patient profile deleted successfully.',
        ]);
    }

    /**
     * Get the authenticated user's patient profile.
     */
    public function myProfile(Request $request): JsonResponse
    {
        $patient = Patient::where(
            'user_id',
            $request->user()->id
        )->first();

        if (!$patient) {
            return response()->json([
                'message' => 'Patient profile not found.',
                'next_step' => 'create_profile',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'next_step' => 'dashboard',
            'data' => $patient,
        ]);
    }

    /**
     * Ensure the patient record belongs to the current user.
     */
    private function authorizePatientAccess(
        Request $request,
        Patient $patient
    ): void {
        abort_unless(
            (int) $patient->user_id === (int) $request->user()->id,
            403,
            'You are not authorized to access this patient profile.'
        );
    }
}
