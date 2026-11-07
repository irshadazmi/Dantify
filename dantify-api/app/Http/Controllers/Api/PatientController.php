<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

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
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'insurance_provider_id' => [
                'nullable',
                'integer',
                'exists:insurance_providers,id',
            ],
            'profile_photo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        unset($validated['profile_photo']);

        $patient = Patient::create([
            ...$validated,
            'user_id' => $user->id,
        ]);

        if ($request->hasFile('profile_photo')) {
            $photoPath = $this->storeProfilePhoto(
                $request->file('profile_photo'),
                $patient
            );

            $patient->update([
                'profile_photo_path' => $photoPath,
            ]);
        }

        return response()->json([
            'message' => 'Patient profile created successfully.',
            'data' => $patient->fresh(),
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
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:30'],
            'dob' => [
                'sometimes',
                'nullable',
                'date',
                'before_or_equal:today',
            ],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'insurance_provider_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:insurance_providers,id',
            ],
            'profile_photo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'remove_profile_photo' => ['sometimes', 'boolean'],
        ]);

        $oldPhotoPath = $patient->profile_photo_path;
        $removePhoto = (bool) ($validated['remove_profile_photo'] ?? false);

        unset(
            $validated['profile_photo'],
            $validated['remove_profile_photo']
        );

        $patient->fill($validated);
        $patient->save();

        if ($request->hasFile('profile_photo')) {
            $newPhotoPath = $this->storeProfilePhoto(
                $request->file('profile_photo'),
                $patient
            );

            $patient->update([
                'profile_photo_path' => $newPhotoPath,
            ]);

            if ($oldPhotoPath && $oldPhotoPath !== $newPhotoPath) {
                Storage::disk('public')->delete($oldPhotoPath);
            }
        } elseif ($removePhoto && $oldPhotoPath) {
            $patient->update([
                'profile_photo_path' => null,
            ]);

            Storage::disk('public')->delete($oldPhotoPath);
        }

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
        abort_unless(
            $request->user()
                ->role()
                ->where('name', 'superadmin')
                ->exists(),
            403,
            'Only OolaSystems SuperAdmin can delete patient profiles.'
        );

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
     * Store patient photo as:
     * profiles/patients/{user_id}-{name}.{extension}
     */

    private function storeProfilePhoto(
        UploadedFile $photo,
        Patient $patient
    ): string {
        $slug = Str::slug($patient->name) ?: 'patient';

        $extension = strtolower($photo->extension() ?: 'jpg');

        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        $filename = $patient->user_id . '-' . $slug . '.' . $extension;

        $path = $photo->storeAs(
            'profiles/patients',
            $filename,
            'public'
        );

        if (!$path) {
            throw new RuntimeException(
                'Unable to store the patient profile photo.'
            );
        }

        return $path;
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
