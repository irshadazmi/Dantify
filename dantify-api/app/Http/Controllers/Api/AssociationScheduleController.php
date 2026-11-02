<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssociationSchedule;
use App\Models\Clinic;
use App\Models\ClinicDentist;
use App\Models\ClinicDentistInvite;
use App\Models\Dentist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AssociationScheduleController extends Controller
{
    /**
     * List schedule proposals for an accepted association.
     *
     * GET /api/associations/{invite}/schedules
     */
    public function index(
        Request $request,
        ClinicDentistInvite $invite
    ): JsonResponse {
        $this->authorizeAssociationParticipant($request, $invite);

        $schedules = AssociationSchedule::with([
            'proposedBy.clinicProfile:id,user_id,name',
            'proposedBy.dentistProfile:id,user_id,name',
            'reviewedBy.clinicProfile:id,user_id,name',
            'reviewedBy.dentistProfile:id,user_id,name',
            'slots',
        ])
            ->where('clinic_dentist_invite_id', $invite->id)
            ->latest()
            ->paginate(15);

        // Include the virtual profile-derived name in the API response.
        foreach ($schedules as $schedule) {
            $schedule->proposedBy?->append('name');
            $schedule->reviewedBy?->append('name');
        }

        return response()->json([
            'message' => 'Association schedules retrieved successfully.',
            'association' => $invite->load(['clinic', 'dentist']),
            'data' => $schedules,
        ]);
    }

    /**
     * Either party proposes a schedule.
     *
     * POST /api/associations/{invite}/schedules
     */
    public function store(
        Request $request,
        ClinicDentistInvite $invite
    ): JsonResponse {
        [$clinic, $dentist] = $this->authorizeAssociationParticipant(
            $request,
            $invite
        );

        $validated = $this->validateSchedule($request);

        $schedule = DB::transaction(function () use (
            $request,
            $invite,
            $clinic,
            $dentist,
            $validated
        ) {
            // Do not allow multiple simultaneously pending proposals.
            $pendingExists = AssociationSchedule::where(
                'clinic_dentist_invite_id',
                $invite->id
            )
                ->where(
                    'status',
                    AssociationSchedule::STATUS_PROPOSED
                )
                ->lockForUpdate()
                ->exists();

            if ($pendingExists) {
                abort(
                    409,
                    'A schedule proposal is already awaiting review.'
                );
            }

            $schedule = AssociationSchedule::create([
                'clinic_dentist_invite_id' => $invite->id,
                'proposed_by_user_id' => $request->user()->id,
                'effective_from' => $validated['effective_from'],
                'effective_until' => $validated['effective_until'] ?? null,
                'status' => AssociationSchedule::STATUS_PROPOSED,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['slots'] as $slot) {
                ClinicDentist::create([
                    'association_schedule_id' => $schedule->id,
                    'clinic_id' => $clinic->id,
                    'dentist_id' => $dentist->id,
                    'day_of_week' => $slot['day_of_week'],
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                ]);
            }

            return $schedule;
        });

        $schedule->load([
            'slots',
            'proposedBy.clinicProfile:id,user_id,name',
            'proposedBy.dentistProfile:id,user_id,name',
        ]);

        $schedule->proposedBy?->append('name');

        return response()->json([
            'message' => 'Schedule proposal submitted successfully.',
            'data' => $schedule,
        ], 201);
    }

    /**
     * The other party confirms the proposal or requests changes.
     *
     * PATCH /api/association-schedules/{schedule}/review
     */
   
    public function review(
        Request $request,
        AssociationSchedule $schedule
    ): JsonResponse {
        $validated = $request->validate([
            'response' => [
                'required',
                Rule::in(['confirm', 'request_changes']),
            ],
        ]);

        $invite = ClinicDentistInvite::findOrFail(
            $schedule->clinic_dentist_invite_id
        );

        $this->authorizeAssociationParticipant($request, $invite);

        // The proposer cannot approve their own proposal.
        abort_unless(
            (int) $schedule->proposed_by_user_id !==
            (int) $request->user()->id,
            403,
            'You cannot review your own schedule proposal.'
        );

        $result = DB::transaction(function () use (
            $request,
            $schedule,
            $validated,
            $invite
        ) {
            $lockedSchedule = AssociationSchedule::whereKey(
                $schedule->id
            )->lockForUpdate()->firstOrFail();

            if (
                $lockedSchedule->status !==
                AssociationSchedule::STATUS_PROPOSED
            ) {
                return false;
            }

            if ($validated['response'] === 'confirm') {
                // Preserve history, but only one confirmed schedule
                // should remain current for this association.
                AssociationSchedule::where(
                    'clinic_dentist_invite_id',
                    $invite->id
                )
                    ->where(
                        'status',
                        AssociationSchedule::STATUS_CONFIRMED
                    )
                    ->where('id', '!=', $lockedSchedule->id)
                    ->update([
                        'status' => AssociationSchedule::STATUS_SUPERSEDED,
                    ]);

                $lockedSchedule->status =
                    AssociationSchedule::STATUS_CONFIRMED;
            } else {
                $lockedSchedule->status =
                    AssociationSchedule::STATUS_CHANGE_REQUESTED;
            }

            $lockedSchedule->reviewed_by_user_id =
                $request->user()->id;

            $lockedSchedule->reviewed_at = now();

            $lockedSchedule->save();

            return true;
        });

        if (!$result) {
            return response()->json([
                'message' => 'This schedule proposal has already been reviewed or is no longer pending.',
            ], 409);
        }

        $confirmed = $validated['response'] === 'confirm';

        // Reload the schedule with the reviewer and proposer profiles.
        $data = $schedule->fresh([
            'slots',
            'proposedBy.clinicProfile:id,user_id,name',
            'proposedBy.dentistProfile:id,user_id,name',
            'reviewedBy.clinicProfile:id,user_id,name',
            'reviewedBy.dentistProfile:id,user_id,name',
        ]);

        // Append the virtual profile-derived name attribute.
        $data->proposedBy?->append('name');
        $data->reviewedBy?->append('name');

        return response()->json([
            'message' => $confirmed
                ? 'Schedule confirmed successfully.'
                : 'Changes requested successfully.',
            'data' => $data,
        ]);
    }

    /**
     * The proposing party can cancel their proposal.
     *
     * PATCH /api/association-schedules/{schedule}/cancel
     */
    public function cancel(
        Request $request,
        AssociationSchedule $schedule
    ): JsonResponse {
        $invite = ClinicDentistInvite::findOrFail(
            $schedule->clinic_dentist_invite_id
        );

        $this->authorizeAssociationParticipant($request, $invite);

        abort_unless(
            (int) $schedule->proposed_by_user_id ===
            (int) $request->user()->id,
            403,
            'Only the user who proposed this schedule can cancel it.'
        );

        $updated = DB::transaction(function () use ($schedule) {
            $lockedSchedule = AssociationSchedule::whereKey(
                $schedule->id
            )->lockForUpdate()->firstOrFail();

            if (!in_array($lockedSchedule->status, [
                AssociationSchedule::STATUS_PROPOSED,
                AssociationSchedule::STATUS_CHANGE_REQUESTED,
            ], true)) {
                return false;
            }

            $lockedSchedule->update([
                'status' => AssociationSchedule::STATUS_CANCELLED,
            ]);

            return true;
        });

        if (!$updated) {
            return response()->json([
                'message' => 'Only pending or change-requested proposals can be cancelled.',
            ], 409);
        }

        return response()->json([
            'message' => 'Schedule proposal cancelled successfully.',
            'data' => $schedule->fresh(['slots']),
        ]);
    }

    /**
     * Validate schedule details and ensure time slots do not overlap.
     */
    private function validateSchedule(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'effective_from' => [
                'required',
                'date',
            ],
            'effective_until' => [
                'nullable',
                'date',
                'after_or_equal:effective_from',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'slots' => [
                'required',
                'array',
                'min:1',
            ],
            'slots.*.day_of_week' => [
                'required',
                Rule::in([
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                ]),
            ],
            'slots.*.start_time' => [
                'required',
                'date_format:H:i',
            ],
            'slots.*.end_time' => [
                'required',
                'date_format:H:i',
            ],
        ]);

        $validator->after(function ($validator) use ($request) {
            $slots = $request->input('slots', []);

            $byDay = [];

            foreach ($slots as $index => $slot) {
                if (
                    empty($slot['day_of_week']) ||
                    empty($slot['start_time']) ||
                    empty($slot['end_time'])
                ) {
                    continue;
                }

                $start = $slot['start_time'];
                $end = $slot['end_time'];
                $day = $slot['day_of_week'];

                if ($start >= $end) {
                    $validator->errors()->add(
                        "slots.$index.end_time",
                        'End time must be later than start time.'
                    );

                    continue;
                }

                $byDay[$day][] = [
                    'index' => $index,
                    'start' => $start,
                    'end' => $end,
                ];
            }

            foreach ($byDay as $daySlots) {
                usort(
                    $daySlots,
                    fn ($a, $b) => strcmp($a['start'], $b['start'])
                );

                for ($i = 1; $i < count($daySlots); $i++) {
                    $previous = $daySlots[$i - 1];
                    $current = $daySlots[$i];

                    if ($current['start'] < $previous['end']) {
                        $validator->errors()->add(
                            "slots.{$current['index']}.start_time",
                            'This time slot overlaps another shift on the same day.'
                        );
                    }
                }
            }
        });

        return $validator->validate();
    }

    /**
     * Ensure the association is accepted and the user owns
     * either the clinic or dentist profile.
     */
    private function authorizeAssociationParticipant(
        Request $request,
        ClinicDentistInvite $invite
    ): array {
        abort_unless(
            $invite->status === ClinicDentistInvite::STATUS_ACCEPTED,
            422,
            'Scheduling is available only for accepted associations.'
        );

        $clinic = Clinic::findOrFail($invite->clinic_id);
        $dentist = Dentist::findOrFail($invite->dentist_id);

        $userId = (int) $request->user()->id;

        $isClinicOwner = (int) $clinic->user_id === $userId;
        $isDentistOwner = (int) $dentist->user_id === $userId;

        abort_unless(
            $isClinicOwner || $isDentistOwner,
            403,
            'You are not authorized to access this association schedule.'
        );

        return [$clinic, $dentist];
    }
}
