<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\ClinicServiceOffering;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

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
            'name' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_photo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        unset($validated['profile_photo']);

        $validated['user_id'] = $request->user()->id;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $clinic = Clinic::create($validated);

        if ($request->hasFile('profile_photo')) {
            $path = $this->storeProfilePhoto(
                $request->file('profile_photo'),
                $clinic
            );

            $clinic->update(['profile_photo_path' => $path]);
        }

        return response()->json([
            'message' => 'Clinic created successfully.',
            'data' => $clinic->fresh(),
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
    public function update(Request $request, Clinic $clinic): JsonResponse
    {
        $this->authorizeOwnership($request, $clinic);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'email' => ['sometimes', 'nullable', 'email', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_photo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'remove_profile_photo' => ['sometimes', 'boolean'],
        ]);

        $oldPhotoPath = $clinic->profile_photo_path;

        $removePhoto = (bool) ($validated['remove_profile_photo'] ?? false);
        unset(
            $validated['profile_photo'],
            $validated['remove_profile_photo']
        );

        // Save ordinary profile fields first so the new photo filename
        // uses the latest clinic name when name and photo change together.
        $clinic->fill($validated);
        $clinic->save();

        if ($request->hasFile('profile_photo')) {
            $newPhotoPath = $this->storeProfilePhoto(
                $request->file('profile_photo'),
                $clinic
            );

            $clinic->update(['profile_photo_path' => $newPhotoPath]);

            if ($oldPhotoPath && $oldPhotoPath !== $newPhotoPath) {
                Storage::disk('public')->delete($oldPhotoPath);
            }
        } elseif ($removePhoto && $oldPhotoPath) {
            $clinic->update(['profile_photo_path' => null]);
            Storage::disk('public')->delete($oldPhotoPath);
        }

        return response()->json([
            'message' => 'Clinic updated successfully.',
            'data' => $clinic->fresh(),
        ]);
    }

    /**
     * Delete a clinic. This operation is restricted to OolaSystems SuperAdmin.
     */
    public function destroy(Request $request, Clinic $clinic): JsonResponse
    {
        abort_unless(
            $request->user()
                ->role()
                ->where('name', 'superadmin')
                ->exists(),
            403,
            'Only OolaSystems SuperAdmin can delete clinic profiles.'
        );

        $photoPath = $clinic->profile_photo_path;

        $clinic->delete();

        if ($photoPath) {
            Storage::disk('public')->delete($photoPath);
        }

        return response()->json([
            'message' => 'Clinic deleted successfully.',
        ]);
    }

    /**
     * Retrieve the authenticated user's clinic profile.
     */
    public function myProfile(Request $request): JsonResponse
    {
        $clinic = Clinic::where('user_id', $request->user()->id)->first();

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
     * Store the photo using: profiles/clinics/{user_id}-{slug}.{extension}
     */
    private function storeProfilePhoto(
        UploadedFile $photo,
        Clinic $clinic
    ): string {
        $slug = Str::slug($clinic->name) ?: 'clinic';
        $extension = strtolower($photo->extension() ?: 'jpg');

        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        $filename = $clinic->user_id . '-' . $slug . '.' . $extension;

        $path = $photo->storeAs(
            'profiles/clinics',
            $filename,
            'public'
        );

        if (!$path) {
            throw new RuntimeException('Unable to store the clinic profile photo.');
        }

        return $path;
    }

    /**
     * Ensure users can only access their own clinics.
     */
    private function authorizeOwnership(
        Request $request,
        Clinic $clinic
    ): void {
        abort_unless(
            (int) $clinic->user_id === (int) $request->user()->id,
            403,
            'You are not authorized to access this clinic.'
        );
    }
}
