<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dentist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DentistController extends Controller
{
    
    /**
     * Search dentists available through active clinics.
     * Public endpoint for the patient booking flow.
     */
    public function publicSearch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $dentists = Dentist::query()
            ->whereHas('clinics', function ($query) {
                $query->where('clinics.is_active', true);
            })
            ->with(['clinics' => function ($query) {
                $query->where('clinics.is_active', true)
                    ->select([
                        'clinics.id',
                        'clinics.name',
                        'clinics.address',
                        'clinics.city',
                        'clinics.state',
                        'clinics.country',
                        'clinics.postal_code',
                        'clinics.phone',
                        'clinics.email',
                    ]);
            }])
            ->when(
                !empty($validated['query']),
                function ($builder) use ($validated) {
                    $term = $validated['query'];

                    $builder->where(function ($query) use ($term) {
                        $query->where('name', 'like', "%{$term}%")
                            ->orWhere(
                                'specialization',
                                'like',
                                "%{$term}%"
                            );
                    });
                }
            )
            ->when(
                !empty($validated['location']),
                function ($builder) use ($validated) {
                    // "Pune, Maharashtra" should match city=Pune OR
                    // state=Maharashtra, rather than searching the full
                    // combined string in either individual database column.
                    $locationTerms = collect(
                        preg_split('/[,;]+/', $validated['location'])
                    )
                        ->map(fn ($term) => trim($term))
                        ->filter()
                        ->values();

                    $builder->whereHas('clinics', function ($query) use ($locationTerms) {
                        $query->where('clinics.is_active', true)
                            ->where(function ($query) use ($locationTerms) {
                                foreach ($locationTerms as $term) {
                                    $query->orWhere(function ($termQuery) use ($term) {
                                        $termQuery->where('clinics.city', 'like', "%{$term}%")
                                            ->orWhere('clinics.state', 'like', "%{$term}%")
                                            ->orWhere('clinics.postal_code', 'like', "%{$term}%")
                                            ->orWhere('clinics.address', 'like', "%{$term}%");
                                    });
                                }
                            });
                    });
                }
            )
            ->orderBy('name')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'message' => 'Dentist search completed successfully.',
            'data' => $dentists,
        ]);
    }

    /**
     * List dentist profiles belonging to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $dentists = Dentist::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->paginate(15);

        return response()->json([
            'message' => 'Dentists retrieved successfully.',
            'data' => $dentists,
        ]);
    }

    /**
     * Create the authenticated user's dentist profile.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $existing = Dentist::where('user_id', $user->id)->first();

        if ($existing) {
            return response()->json([
                'message' => 'Your dentist profile already exists.',
                'data' => $existing,
            ], 409);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'gender' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'specialization' => ['nullable', 'string', 'max:150'],
            'profile_photo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        $photoPath = $request->file('profile_photo')
            ? $request->file('profile_photo')->store('dentists', 'public')
            : null;

        unset($validated['profile_photo']);

        $dentist = Dentist::create([
            ...$validated,
            'profile_photo_path' => $photoPath,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Dentist profile created successfully.',
            'data' => $dentist,
        ], 201);
    }

    /**
     * Show a dentist profile belonging to the authenticated user.
     */
    public function show(
        Request $request,
        Dentist $dentist
    ): JsonResponse {
        $this->authorizeDentistAccess($request, $dentist);

        return response()->json([
            'message' => 'Dentist profile retrieved successfully.',
            'data' => $dentist,
        ]);
    }

    /**
     * Update the authenticated user's dentist profile.
     */
    public function update(
        Request $request,
        Dentist $dentist
    ): JsonResponse {
        $this->authorizeDentistAccess($request, $dentist);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:30'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'specialization' => ['sometimes', 'nullable', 'string', 'max:150'],
            'profile_photo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'remove_profile_photo' => ['sometimes', 'boolean'],
        ]);

        $oldPhotoPath = $dentist->profile_photo_path;

        if ($request->hasFile('profile_photo')) {
            $newPhotoPath = $request->file('profile_photo')
                ->store('dentists', 'public');

            $validated['profile_photo_path'] = $newPhotoPath;
        } elseif ($request->boolean('remove_profile_photo')) {
            $validated['profile_photo_path'] = null;
        }

        unset(
            $validated['profile_photo'],
            $validated['remove_profile_photo']
        );

        $dentist->update($validated);

        $newPhotoPath = $dentist->profile_photo_path;

        if ($oldPhotoPath && $oldPhotoPath !== $newPhotoPath) {
            Storage::disk('public')->delete($oldPhotoPath);
        }

        return response()->json([
            'message' => 'Dentist profile updated successfully.',
            'data' => $dentist->fresh(),
        ]);
    }

    /**
     * Delete the authenticated user's dentist profile.
     */
    public function destroy(
        Request $request,
        Dentist $dentist
    ): JsonResponse {
        $this->authorizeDentistAccess($request, $dentist);

        $photoPath = $dentist->profile_photo_path;

        $dentist->delete();

        if ($photoPath) {
            Storage::disk('public')->delete($photoPath);
        }

        return response()->json([
            'message' => 'Dentist profile deleted successfully.',
        ]);
    }

    /**
     * Retrieve the authenticated user's dentist profile.
     */
    public function myProfile(Request $request): JsonResponse
    {
        $dentist = Dentist::where(
            'user_id',
            $request->user()->id
        )->first();

        if (!$dentist) {
            return response()->json([
                'message' => 'Dentist profile not found.',
                'next_step' => 'create_profile',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'message' => 'Dentist profile retrieved successfully.',
            'next_step' => 'dashboard',
            'data' => $dentist,
        ]);
    }

    /**
     * Show a dentist profile for the public patient booking flow.
     *
     * Only dentists associated with at least one active clinic are
     * discoverable through the public booking experience.
     */
    public function publicShow(Dentist $dentist): JsonResponse
    {
        $publicDentist = Dentist::query()
            ->whereKey($dentist->getKey())
            ->whereHas('clinics', function ($query) {
                $query->where('clinics.is_active', true);
            })
            ->with(['clinics' => function ($query) {
                $query->where('clinics.is_active', true)
                    ->select([
                        'clinics.id',
                        'clinics.name',
                        'clinics.address',
                        'clinics.city',
                        'clinics.state',
                        'clinics.country',
                        'clinics.postal_code',
                        'clinics.phone',
                        'clinics.email',
                    ]);
            }])
            ->firstOrFail();

        return response()->json([
            'message' => 'Dentist profile retrieved successfully.',
            'data' => $publicDentist,
        ]);
    }

    private function authorizeDentistAccess(
        Request $request,
        Dentist $dentist
    ): void {
        abort_unless(
            (int) $dentist->user_id === (int) $request->user()->id,
            403,
            'You are not authorized to access this dentist profile.'
        );
    }
}
