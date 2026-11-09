<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Laboratory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class LaboratoryController extends Controller
{
    /**
     * List laboratory profiles belonging to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $laboratories = Laboratory::where(
            'user_id',
            $request->user()->id
        )
            ->orderBy('name')
            ->paginate(15);

        return response()->json([
            'message' => 'Laboratories retrieved successfully.',
            'data' => $laboratories,
        ]);
    }

    /**
     * Create the authenticated user's laboratory profile.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $existing = Laboratory::where('user_id', $user->id)->first();

        if ($existing) {
            return response()->json([
                'message' => 'Your laboratory profile already exists.',
                'data' => $existing,
            ], 409);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'contact_person' => ['nullable', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'registration_number' => [
                'nullable',
                'string',
                'max:100',
            ],
            'notes' => ['nullable', 'string', 'max:2000'],
            'profile_photo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        // Uploaded files are stored separately; never mass-assign the file.
        unset($validated['profile_photo']);

        $laboratory = Laboratory::create([
            ...$validated,
            'user_id' => $user->id,
            'is_active' => true,
        ]);

        if ($request->hasFile('profile_photo')) {
            $path = $this->storeProfilePhoto(
                $request->file('profile_photo'),
                $laboratory
            );

            $laboratory->update(['profile_photo_path' => $path]);
        }

        return response()->json([
            'message' => 'Laboratory profile created successfully.',
            'data' => $laboratory->fresh(),
        ], 201);
    }

    /**
     * Show a laboratory profile belonging to the authenticated user.
     */
    public function show(
        Request $request,
        Laboratory $laboratory
    ): JsonResponse {
        $this->authorizeLaboratoryAccess($request, $laboratory);

        return response()->json([
            'message' => 'Laboratory profile retrieved successfully.',
            'data' => $laboratory,
        ]);
    }

    /**
     * Update the authenticated user's laboratory profile.
     */
    public function update(
        Request $request,
        Laboratory $laboratory
    ): JsonResponse {
        $this->authorizeLaboratoryAccess($request, $laboratory);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'contact_person' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
            ],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'address' => [
                'sometimes',
                'nullable',
                'string',
                'max:500',
            ],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'country' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'postal_code' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
            ],
            'registration_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_photo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'remove_profile_photo' => ['sometimes', 'boolean'],
        ]);

        // Only an authorized administrator should be able to deactivate
        // a laboratory account. A laboratory user cannot change this flag.
        if (array_key_exists('is_active', $validated)) {
            abort(403, 'You are not authorized to change laboratory status.');
        }

        $oldPhotoPath = $laboratory->profile_photo_path;
        $removePhoto = (bool) ($validated['remove_profile_photo'] ?? false);

        unset(
            $validated['profile_photo'],
            $validated['remove_profile_photo']
        );

        // Save profile fields first so a simultaneous name/photo update uses
        // the latest laboratory name when generating the photo filename.
        $laboratory->fill($validated);
        $laboratory->save();

        if ($request->hasFile('profile_photo')) {
            $newPhotoPath = $this->storeProfilePhoto(
                $request->file('profile_photo'),
                $laboratory
            );

            $laboratory->update(['profile_photo_path' => $newPhotoPath]);

            if ($oldPhotoPath && $oldPhotoPath !== $newPhotoPath) {
                Storage::disk('public')->delete($oldPhotoPath);
            }
        } elseif ($removePhoto && $oldPhotoPath) {
            $laboratory->update(['profile_photo_path' => null]);
            Storage::disk('public')->delete($oldPhotoPath);
        }

        return response()->json([
            'message' => 'Laboratory profile updated successfully.',
            'data' => $laboratory->fresh(),
        ]);
    }

    /**
     * Delete the authenticated user's laboratory profile.
     */
    public function destroy(
        Request $request,
        Laboratory $laboratory
    ): JsonResponse {
        $this->authorizeLaboratoryAccess($request, $laboratory);

        $photoPath = $laboratory->profile_photo_path;

        $laboratory->delete();

        if ($photoPath) {
            Storage::disk('public')->delete($photoPath);
        }

        return response()->json([
            'message' => 'Laboratory profile deleted successfully.',
        ]);
    }

    /**
     * Retrieve the authenticated user's laboratory profile.
     */
    public function myProfile(Request $request): JsonResponse
    {
        $laboratory = Laboratory::where(
            'user_id',
            $request->user()->id
        )->first();

        if (!$laboratory) {
            return response()->json([
                'message' => 'Laboratory profile not found.',
                'next_step' => 'create_profile',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'message' => 'Laboratory profile retrieved successfully.',
            'next_step' => 'dashboard',
            'data' => $laboratory,
        ]);
    }

    /**
     * Store the photo using:
     * profiles/laboratories/{user_id}-{slug}.{extension}
     */
    private function storeProfilePhoto(
        UploadedFile $photo,
        Laboratory $laboratory
    ): string {
        $slug = Str::slug($laboratory->name) ?: 'laboratory';
        $extension = strtolower($photo->extension() ?: 'jpg');

        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        $filename = $laboratory->user_id . '-' . $slug . '.' . $extension;

        $path = $photo->storeAs(
            'profiles/laboratories',
            $filename,
            'public'
        );

        if (!$path) {
            throw new RuntimeException('Unable to store the laboratory profile photo.');
        }

        return $path;
    }

    private function authorizeLaboratoryAccess(
        Request $request,
        Laboratory $laboratory
    ): void {
        abort_unless(
            (int) $laboratory->user_id === (int) $request->user()->id,
            403,
            'You are not authorized to access this laboratory profile.'
        );
    }
}
