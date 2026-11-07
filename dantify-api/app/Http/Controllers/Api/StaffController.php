<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\Staff;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

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
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'message' => 'Staff retrieved successfully.',
            'data' => $staff,
        ]);
    }

    /**
     * Register a Staff user account, create its Staff profile and optionally
     * store the profile photo. The Staff role is resolved server-side.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'clinic_id' => [
                'required',
                'integer',
                Rule::exists('clinics', 'id'),
            ],

            // User account registration fields.
            'email' => [
                'required',
                'email',
                'max:100',
                'unique:users,email',
            ],
            'phone' => [
                'required',
                'string',
                'regex:/^\+?[0-9]{10,15}$/',
                'unique:users,phone',
            ],
            'is_active' => ['sometimes', 'boolean'],

            // Staff profile fields.
            'name' => ['required', 'string', 'max:100'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'gender' => ['nullable', 'string', 'max:20'],
            'dob' => ['nullable', 'date', 'before_or_equal:today'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'profile_photo' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        $clinic = Clinic::findOrFail($validated['clinic_id']);

        abort_unless(
            (int) $clinic->user_id === (int) $request->user()->id,
            403,
            'You are not authorized to add staff to this clinic.'
        );

        // Never accept role_id from the client. A Staff registration must
        // always receive the role configured as "staff".
        $staffRole = Role::where('name', 'staff')->first();

        if (!$staffRole) {
            throw ValidationException::withMessages([
                'role_id' => [
                    'The Staff role is not configured. Please contact the administrator.',
                ],
            ]);
        }

        $photo = $request->file('profile_photo');
        $isActive = $validated['is_active'] ?? true;
        $storedPhotoPath = null;

        try {
            $staff = DB::transaction(function () use (
                $validated,
                $staffRole,
                $isActive,
                $photo,
                &$storedPhotoPath
            ) {
                // The User model's hashed cast hashes this password.
                $staffUser = User::create([
                    'email' => strtolower($validated['email']),
                    'phone' => $validated['phone'],
                    'password' => 'Staff@12345',
                    'role_id' => $staffRole->id,
                    'is_active' => $isActive,
                ]);

                $staff = Staff::create([
                    'user_id' => $staffUser->id,
                    'clinic_id' => $validated['clinic_id'],
                    'name' => $validated['name'],
                    'job_title' => $validated['job_title'] ?? null,
                    'gender' => $validated['gender'] ?? null,
                    'dob' => $validated['dob'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'city' => $validated['city'] ?? null,
                    'state' => $validated['state'] ?? null,
                    'country' => $validated['country'] ?? null,
                    'postal_code' => $validated['postal_code'] ?? null,
                    'phone' => $staffUser->phone,
                    'email' => $staffUser->email,
                    'is_active' => $isActive,
                ]);

                if ($photo instanceof UploadedFile) {
                    $storedPhotoPath = $this->storeProfilePhoto(
                        $photo,
                        (int) $staffUser->id,
                        $staff->name
                    );

                    $staff->profile_photo_path = $storedPhotoPath;
                    $staff->save();
                }

                return $staff;
            });
        } catch (\Throwable $exception) {
            // Filesystem storage is not part of the database transaction.
            // Remove the uploaded file if any database operation fails.
            if ($storedPhotoPath) {
                Storage::disk('public')->delete($storedPhotoPath);
            }

            throw $exception;
        }

        $staff->load('clinic:id,name');

        return response()->json([
            'message' => 'Staff account and profile created successfully.',
            'user' => [
                'id' => $staff->user_id,
                'email' => $staff->email,
                'phone' => $staff->phone,
                'role' => 'staff',
                'is_active' => (bool) $isActive,
            ],
            'data' => $staff->fresh()->load('clinic:id,name'),
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
     * Update a staff profile, including photo replacement or removal.
     */
    public function update(Request $request, Staff $staff): JsonResponse
    {
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
            'gender' => ['sometimes', 'nullable', 'string', 'max:20'],
            'dob' => ['sometimes', 'nullable', 'date', 'before_or_equal:today', ],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'email' => ['sometimes', 'nullable', 'email', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
            'profile_photo' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'remove_profile_photo' => ['sometimes', 'boolean'],
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

        $photo = $request->file('profile_photo');
        $removePhoto = (bool) ($validated['remove_profile_photo'] ?? false);
        $oldPath = $staff->profile_photo_path;
        $newName = $validated['name'] ?? $staff->name;

        unset(
            $validated['profile_photo'],
            $validated['remove_profile_photo']
        );

        $newPath = null;

        if ($photo instanceof UploadedFile) {
            $newPath = $this->storeProfilePhoto(
                $photo,
                (int) $staff->user_id,
                $newName
            );
            $validated['profile_photo_path'] = $newPath;
        } elseif ($removePhoto) {
            $validated['profile_photo_path'] = null;
        } elseif ($oldPath && $newName !== $staff->name) {
            // Keep the filename consistent with the updated staff name.
            $newPath = $this->renameExistingPhoto(
                $oldPath,
                (int) $staff->user_id,
                $newName
            );

            if ($newPath) {
                $validated['profile_photo_path'] = $newPath;
            }
        }

        try {
            $staff->update($validated);
        } catch (\Throwable $exception) {
            if ($newPath && $newPath !== $oldPath) {
                Storage::disk('public')->delete($newPath);
            }
            throw $exception;
        }

        if ($oldPath && $oldPath !== $staff->profile_photo_path) {
            Storage::disk('public')->delete($oldPath);
        }

        return response()->json([
            'message' => 'Staff profile updated successfully.',
            'data' => $staff->fresh()->load('clinic:id,name'),
        ]);
    }

    /**
     * Delete a staff profile.
     *
     * This endpoint should be restricted to OolaSystems SuperAdmin.
     * The authorization policy/middleware for that role should be enforced
     * before enabling this operation.
     */
    public function destroy(Request $request, Staff $staff): JsonResponse
    {
        $role = $request->user()->role;
        $roleName = is_string($role) ? $role : ($role?->name ?? null);

        abort_unless(
            $roleName === 'superadmin',
            403,
            'Only OolaSystems SuperAdmin can delete staff profiles.'
        );

        if ($staff->profile_photo_path) {
            Storage::disk('public')->delete($staff->profile_photo_path);
        }

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

    private function storeProfilePhoto(
        UploadedFile $photo,
        int $userId,
        string $name
    ): string {
        $extension = strtolower($photo->extension() ?: 'jpg');

        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        abort_unless(
            in_array($extension, ['jpg', 'png', 'webp'], true),
            422,
            'Only JPG, PNG or WebP profile photos are supported.'
        );

        $slug = Str::slug($name);
        $slug = $slug !== '' ? $slug : 'staff';

        $filename = $userId . '-' . $slug . '.' . $extension;
        $directory = 'profiles/staffs';

        $storedPath = $photo->storeAs(
            $directory,
            $filename,
            'public'
        );

        if (!$storedPath) {
            throw new \RuntimeException('Unable to store the staff profile photo.');
        }

        return $storedPath;
    }

    private function renameExistingPhoto(
        string $oldPath,
        int $userId,
        string $name
    ): ?string {
        $disk = Storage::disk('public');

        if (!$disk->exists($oldPath)) {
            return null;
        }

        $extension = strtolower(pathinfo($oldPath, PATHINFO_EXTENSION));

        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        if (!in_array($extension, ['jpg', 'png', 'webp'], true)) {
            return null;
        }

        $slug = Str::slug($name);
        $slug = $slug !== '' ? $slug : 'staff';

        $newPath = 'profiles/staffs/' . $userId . '-' . $slug . '.' . $extension;

        if ($newPath === $oldPath) {
            return $oldPath;
        }

        if ($disk->exists($newPath)) {
            $disk->delete($newPath);
        }

        // Copy first; the old file is deleted only after the database update succeeds.
        return $disk->copy($oldPath, $newPath) ? $newPath : null;
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
