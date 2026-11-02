<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    /**
     * List staff profiles owned by the user or belonging to their clinics.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $staff = Staff::query()
            ->where(function ($query) use ($userId) {
                $query->where('user_id', $userId)
                    ->orWhereHas('clinic', function ($clinicQuery) use ($userId) {
                        $clinicQuery->where('user_id', $userId);
                    });
            })
            ->with(['clinic:id,name'])
            ->orderBy('name')
            ->paginate(15);

        return response()->json([
            'message' => 'Staff retrieved successfully.',
            'data' => $staff,
        ]);
    }

    /**
     * Create a staff profile.
     *
     * A clinic owner can create a staff record for an existing user account.
     * A staff user can create their own profile only when the supplied clinic
     * belongs to the authenticated user; see the note below before using this
     * flow for staff onboarding.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'clinic_id' => [
                'required',
                'integer',
                Rule::exists('clinics', 'id'),
            ],
            'user_id' => [
                'sometimes',
                'integer',
                Rule::exists('users', 'id'),
            ],
            'name' => ['required', 'string', 'max:100'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'gender' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $clinic = Clinic::findOrFail($validated['clinic_id']);

        abort_unless(
            (int) $clinic->user_id === (int) $user->id,
            403,
            'You are not authorized to add staff to this clinic.'
        );

        $staffUserId = (int) ($validated['user_id'] ?? $user->id);

        $existing = Staff::where('user_id', $staffUserId)->first();

        if ($existing) {
            return response()->json([
                'message' => 'A staff profile already exists for this user.',
                'data' => $existing,
            ], 409);
        }

        unset($validated['user_id']);

        $staff = Staff::create([
            ...$validated,
            'user_id' => $staffUserId,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Staff profile created successfully.',
            'data' => $staff->load('clinic:id,name'),
        ], 201);
    }

    /**
     * Show a staff profile if it belongs to the user or their clinic.
     */
    public function show(Request $request, Staff $staff): JsonResponse
    {
        $this->authorizeStaffAccess($request, $staff);

        return response()->json([
            'message' => 'Staff profile retrieved successfully.',
            'data' => $staff->load('clinic:id,name'),
        ]);
    }

    /**
     * Update a staff profile if the user owns it or its clinic.
     */
    public function update(
        Request $request,
        Staff $staff
    ): JsonResponse {
        $this->authorizeStaffAccess($request, $staff);

        $validated = $request->validate([
            'clinic_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('clinics', 'id'),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:100'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:30'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['clinic_id'])) {
            $clinic = Clinic::findOrFail($validated['clinic_id']);

            abort_unless(
                (int) $clinic->user_id === (int) $request->user()->id,
                403,
                'You are not authorized to assign staff to this clinic.'
            );
        }

        // Staff users may edit their own details, but not clinic assignment
        // or activation status.
        if ((int) $staff->user_id === (int) $request->user()->id) {
            abort_if(
                isset($validated['clinic_id']) ||
                array_key_exists('is_active', $validated),
                403,
                'Only the clinic owner can change clinic assignment or staff status.'
            );
        }

        $staff->update($validated);

        return response()->json([
            'message' => 'Staff profile updated successfully.',
            'data' => $staff->fresh()->load('clinic:id,name'),
        ]);
    }

    /**
     * Delete a staff profile. Only its clinic owner may delete it.
     */
    public function destroy(
        Request $request,
        Staff $staff
    ): JsonResponse {
        abort_unless(
            $staff->clinic &&
            (int) $staff->clinic->user_id === (int) $request->user()->id,
            403,
            'Only the clinic owner can delete this staff profile.'
        );

        $staff->delete();

        return response()->json([
            'message' => 'Staff profile deleted successfully.',
        ]);
    }

    /**
     * Retrieve the authenticated user's staff profile.
     */
    public function myProfile(Request $request): JsonResponse
    {
        $staff = Staff::where('user_id', $request->user()->id)->first();

        if (!$staff) {
            return response()->json([
                'message' => 'Staff profile not found.',
                'next_step' => 'create_profile',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'message' => 'Staff profile retrieved successfully.',
            'next_step' => 'dashboard',
            'data' => $staff->load('clinic:id,name'),
        ]);
    }

    private function authorizeStaffAccess(
        Request $request,
        Staff $staff
    ): void {
        $userId = (int) $request->user()->id;

        $isOwnProfile = (int) $staff->user_id === $userId;
        $isClinicOwner = $staff->clinic &&
            (int) $staff->clinic->user_id === $userId;

        abort_unless(
            $isOwnProfile || $isClinicOwner,
            403,
            'You are not authorized to access this staff profile.'
        );
    }
}
