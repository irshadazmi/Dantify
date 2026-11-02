<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\ClinicDentistInvite;
use App\Models\Dentist;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssociationDiscoveryController extends Controller
{
    /**
     * Discover active clinics for the authenticated dentist.
     * GET /api/clinics/discover
     *
     * The query parameter searches clinic name, address, city, state,
     * country and postal code.
     */
    public function clinics(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:100'],
            'search_all' => ['sometimes', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $user = $request->user();

        $dentist = Dentist::where('user_id', $user->id)->first();

        if (!$dentist) {
            return response()->json([
                'message' => 'Dentist profile not found. Complete your dentist profile first.',
                'next_step' => 'create_profile',
                'data' => null,
            ], 404);
        }

        $queryTerm = trim((string) ($validated['query'] ?? ''));
        $locationTerm = trim((string) ($validated['location'] ?? ''));

        $clinics = Clinic::query()
            ->where('is_active', true)
            ->where('user_id', '!=', $user->id)
            ->when($queryTerm !== '', function (Builder $builder) use ($queryTerm) {
                $builder->where(function (Builder $query) use ($queryTerm) {
                    $like = '%' . $queryTerm . '%';

                    $query->where('name', 'like', $like)
                        ->orWhere('address', 'like', $like)
                        ->orWhere('city', 'like', $like)
                        ->orWhere('state', 'like', $like)
                        ->orWhere('country', 'like', $like)
                        ->orWhere('postal_code', 'like', $like);
                });
            })
            ->when($locationTerm !== '', function (Builder $builder) use ($locationTerm) {
                $builder->where(function (Builder $query) use ($locationTerm) {
                    $like = '%' . $locationTerm . '%';

                    $query->where('address', 'like', $like)
                        ->orWhere('city', 'like', $like)
                        ->orWhere('state', 'like', $like)
                        ->orWhere('country', 'like', $like)
                        ->orWhere('postal_code', 'like', $like);
                });
            })
            ->select([
                'id',
                'user_id',
                'name',
                'address',
                'city',
                'state',
                'country',
                'postal_code',
                'is_active',
            ])
            ->orderBy('name')
            ->paginate($validated['per_page'] ?? 15);

        $clinics->getCollection()->transform(
            function (Clinic $clinic) use ($dentist) {
                $clinic->setAttribute(
                    'is_associated',
                    $clinic->dentists()
                        ->where('dentists.id', $dentist->id)
                        ->exists()
                );

                $invite = ClinicDentistInvite::where('clinic_id', $clinic->id)
                    ->where('dentist_id', $dentist->id)
                    ->latest('id')
                    ->first();

                $clinic->setAttribute('invite_status', $invite?->status);
                $clinic->setAttribute('invite_id', $invite?->id);
                $clinic->setAttribute(
                    'invite_initiated_by_user_id',
                    $invite?->initiated_by_user_id
                );

                return $clinic;
            }
        );

        return response()->json([
            'message' => 'Clinic discovery completed successfully.',
            'data' => $clinics,
        ]);
    }

    /**
     * Discover dentist profiles for the authenticated clinic.
     * GET /api/dentists/discover
     *
     * The query parameter searches dentist name, specialization, address,
     * city, state, country and postal code.
     */
    public function dentists(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:100'],
            'search_all' => ['sometimes', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $user = $request->user();

        $clinic = Clinic::where('user_id', $user->id)->first();

        if (!$clinic) {
            return response()->json([
                'message' => 'Clinic profile not found. Complete your clinic profile first.',
                'next_step' => 'create_profile',
                'data' => null,
            ], 404);
        }

        if (!$clinic->is_active) {
            return response()->json([
                'message' => 'Your clinic must be active before you can discover and invite dentists.',
                'data' => null,
            ], 422);
        }

        $queryTerm = trim((string) ($validated['query'] ?? ''));
        $locationTerm = trim((string) ($validated['location'] ?? ''));

        $dentists = Dentist::query()
            ->where('user_id', '!=', $user->id)
            ->when($queryTerm !== '', function (Builder $builder) use ($queryTerm) {
                $builder->where(function (Builder $query) use ($queryTerm) {
                    $like = '%' . $queryTerm . '%';

                    $query->where('name', 'like', $like)
                        ->orWhere('specialization', 'like', $like)
                        ->orWhere('address', 'like', $like)
                        ->orWhere('city', 'like', $like)
                        ->orWhere('state', 'like', $like)
                        ->orWhere('country', 'like', $like)
                        ->orWhere('postal_code', 'like', $like);
                });
            })
            ->when($locationTerm !== '', function (Builder $builder) use ($locationTerm) {
                $builder->where(function (Builder $query) use ($locationTerm) {
                    $like = '%' . $locationTerm . '%';

                    $query->where('address', 'like', $like)
                        ->orWhere('city', 'like', $like)
                        ->orWhere('state', 'like', $like)
                        ->orWhere('country', 'like', $like)
                        ->orWhere('postal_code', 'like', $like);
                });
            })
            ->select([
                'id',
                'user_id',
                'name',
                'specialization',
                'address',
                'city',
                'state',
                'country',
                'postal_code',
            ])
            ->orderBy('name')
            ->paginate($validated['per_page'] ?? 15);

        $dentists->getCollection()->transform(
            function (Dentist $dentist) use ($clinic) {
                $dentist->setAttribute(
                    'is_associated',
                    $clinic->dentists()
                        ->where('dentists.id', $dentist->id)
                        ->exists()
                );

                $invite = ClinicDentistInvite::where('clinic_id', $clinic->id)
                    ->where('dentist_id', $dentist->id)
                    ->latest('id')
                    ->first();

                $dentist->setAttribute('invite_status', $invite?->status);
                $dentist->setAttribute('invite_id', $invite?->id);
                $dentist->setAttribute(
                    'invite_initiated_by_user_id',
                    $invite?->initiated_by_user_id
                );

                return $dentist;
            }
        );

        return response()->json([
            'message' => 'Dentist discovery completed successfully.',
            'data' => $dentists,
        ]);
    }
}