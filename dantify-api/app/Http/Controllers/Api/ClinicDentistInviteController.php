<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\ClinicDentistInvite;
use App\Models\Dentist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ClinicDentistInviteController extends Controller
{
    /**
     * Clinic administrator requests association with a dentist.
     * POST /api/clinics/{clinic}/dentist-invites
     */
    public function store(
        Request $request,
        Clinic $clinic
    ): JsonResponse {
        $this->authorizeClinicOwner($request, $clinic);

        if (!$clinic->is_active) {
            return response()->json([
                'message' => 'An inactive clinic cannot request an association.',
            ], 422);
        }

        $validated = $request->validate([
            'dentist_id' => [
                'required',
                'integer',
                'exists:dentists,id',
            ],
        ]);

        $dentist = Dentist::findOrFail($validated['dentist_id']);

        if ((int) $dentist->user_id === (int) $clinic->user_id) {
            return response()->json([
                'message' => 'A clinic cannot request association with its own account.',
            ], 422);
        }

        return $this->createOrReuseInvite(
            clinic: $clinic,
            dentist: $dentist,
            requesterId: (int) $request->user()->id
        );
    }

    /**
     * Dentist requests association with a clinic.
     * POST /api/dentists/{dentist}/clinic-invites
     */
    public function storeByDentist(
        Request $request,
        Dentist $dentist
    ): JsonResponse {
        $this->authorizeDentistOwner($request, $dentist);

        $validated = $request->validate([
            'clinic_id' => [
                'required',
                'integer',
                'exists:clinics,id',
            ],
        ]);

        $clinic = Clinic::findOrFail($validated['clinic_id']);

        if (!$clinic->is_active) {
            return response()->json([
                'message' => 'You cannot request association with an inactive clinic.',
            ], 422);
        }

        if ((int) $dentist->user_id === (int) $clinic->user_id) {
            return response()->json([
                'message' => 'A dentist cannot request association with their own account.',
            ], 422);
        }

        return $this->createOrReuseInvite(
            clinic: $clinic,
            dentist: $dentist,
            requesterId: (int) $request->user()->id
        );
    }

    /**
     * Create a new request or reopen a declined request.
     */
    private function createOrReuseInvite(
        Clinic $clinic,
        Dentist $dentist,
        int $requesterId
    ): JsonResponse {
        $invite = DB::transaction(function () use (
            $clinic,
            $dentist,
            $requesterId
        ) {
            $existing = ClinicDentistInvite::where(
                'clinic_id',
                $clinic->id
            )->where(
                'dentist_id',
                $dentist->id
            )->lockForUpdate()->first();

            if ($existing) {
                if (
                    $existing->status !==
                    ClinicDentistInvite::STATUS_DECLINED
                ) {
                    return null;
                }

                $existing->update([
                    'initiated_by_user_id' => $requesterId,
                    'responded_by_user_id' => null,
                    'responded_at' => null,
                    'status' => ClinicDentistInvite::STATUS_PENDING,
                ]);

                return $existing->fresh(['clinic', 'dentist']);
            }

            return ClinicDentistInvite::create([
                'clinic_id' => $clinic->id,
                'dentist_id' => $dentist->id,
                'initiated_by_user_id' => $requesterId,
                'status' => ClinicDentistInvite::STATUS_PENDING,
            ])->load(['clinic', 'dentist']);
        });

        if (!$invite) {
            return response()->json([
                'message' => 'A request for this clinic and dentist already exists or has already been accepted.',
            ], 409);
        }

        return response()->json([
            'message' => 'Association request created successfully.',
            'data' => $invite,
        ], 201);
    }

    /**
     * The non-requesting party accepts or declines.
     * PATCH /api/dentist-invites/{invite}/respond
     */
    public function respond(
        Request $request,
        ClinicDentistInvite $invite
    ): JsonResponse {
        $validated = $request->validate([
            'response' => [
                'required',
                Rule::in(['accept', 'decline']),
            ],
        ]);

        $result = DB::transaction(function () use (
            $request,
            $invite,
            $validated
        ) {
            $lockedInvite = ClinicDentistInvite::whereKey($invite->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (
                $lockedInvite->status !==
                ClinicDentistInvite::STATUS_PENDING
            ) {
                return 'not_pending';
            }

            $clinic = Clinic::findOrFail($lockedInvite->clinic_id);
            $dentist = Dentist::findOrFail($lockedInvite->dentist_id);

            $userId = (int) $request->user()->id;
            $requesterId = (int) $lockedInvite->initiated_by_user_id;

            // Identify the requester and ensure they own one of the profiles.
            if ($requesterId === (int) $clinic->user_id) {
                // Clinic initiated; only the dentist can respond.
                abort_unless(
                    (int) $dentist->user_id === $userId,
                    403,
                    'Only the invited dentist can respond to this request.'
                );
            } elseif ($requesterId === (int) $dentist->user_id) {
                // Dentist initiated; only the clinic administrator can respond.
                abort_unless(
                    (int) $clinic->user_id === $userId,
                    403,
                    'Only the requested clinic can respond to this request.'
                );
            } else {
                abort(
                    409,
                    'The request initiator does not match either profile owner.'
                );
            }

            $lockedInvite->update([
                'status' => $validated['response'] === 'accept'
                    ? ClinicDentistInvite::STATUS_ACCEPTED
                    : ClinicDentistInvite::STATUS_DECLINED,
                'responded_by_user_id' => $userId,
                'responded_at' => now(),
            ]);

            return 'updated';
        });

        if ($result === 'not_pending') {
            return response()->json([
                'message' => 'This request has already been responded to or is no longer pending.',
            ], 409);
        }

        $accepted = $validated['response'] === 'accept';

        return response()->json([
            'message' => $accepted
                ? 'Request accepted. The parties can now configure the dentist schedule.'
                : 'Request declined.',
            'data' => $invite->fresh(['clinic', 'dentist']),
        ]);
    }

    /**
     * Dentist views requests for their profile.
     * GET /api/my/dentist-invites
     */
    public function dentistIndex(Request $request): JsonResponse
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

        $invites = ClinicDentistInvite::with('clinic')
            ->where('dentist_id', $dentist->id)
            ->latest()
            ->paginate(15);

        return response()->json([
            'message' => 'Dentist requests retrieved successfully.',
            'data' => $invites,
        ]);
    }

    /**
     * Clinic administrator views requests for their clinic.
     * GET /api/my/clinic-dentist-invites
     */
    public function clinicIndex(Request $request): JsonResponse
    {
        $clinic = Clinic::where(
            'user_id',
            $request->user()->id
        )->first();

        if (!$clinic) {
            return response()->json([
                'message' => 'Clinic profile not found.',
                'data' => null,
            ], 404);
        }

        $invites = ClinicDentistInvite::with('dentist')
            ->where('clinic_id', $clinic->id)
            ->latest()
            ->paginate(15);

        return response()->json([
            'message' => 'Clinic requests retrieved successfully.',
            'data' => $invites,
        ]);
    }

    private function authorizeClinicOwner(
        Request $request,
        Clinic $clinic
    ): void {
        abort_unless(
            (int) $clinic->user_id === (int) $request->user()->id,
            403,
            'You are not authorized to manage requests for this clinic.'
        );
    }

    private function authorizeDentistOwner(
        Request $request,
        Dentist $dentist
    ): void {
        abort_unless(
            (int) $dentist->user_id === (int) $request->user()->id,
            403,
            'You are not authorized to manage requests for this dentist profile.'
        );
    }
}
