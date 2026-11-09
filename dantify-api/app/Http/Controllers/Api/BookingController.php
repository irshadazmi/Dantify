<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssociationSchedule;
use App\Models\Booking;
use App\Models\BookingService;
use App\Models\BookingStatus;
use App\Models\BookingStatusHistory;
use App\Models\BookingChangeRequest;
use App\Models\ClinicDentist;
use App\Models\ClinicServiceOffering;
use App\Models\Dentist;
use App\Models\Patient;
use App\Models\Clinic;
use App\Models\Staff;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    /**
     * Booking statuses which do not occupy appointment time.
     */
    private const NON_BLOCKING_STATUSES = [
        'cancelled',
        'completed',
        'no_show',
        'rescheduled',
    ];

    /**
     * Generate appointment slots at 15-minute intervals.
     */
    private const SLOT_INTERVAL_MINUTES = 15;


    /**
     * List bookings accessible to the authenticated user.
     *
     * GET /api/bookings
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Support both a string role and a Role model relationship.
        $roleValue = $user->getAttribute('role');

        $role = strtolower(trim(
            is_string($roleValue)
                ? $roleValue
                : ($roleValue->name ?? '')
        ));

        $query = Booking::with([
            'patient',
            'dentist',
            'clinic',
            'bookingStatus',
            'bookingServices.clinicServiceOffering.dentalService',
        ])->latest('booking_date');

        if ($role === 'patient') {

            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                return response()->json([
                    'message' => 'No patient profile is linked to this account.',
                ], 403);
            }

            $query->where('patient_id', $patient->id);
        } elseif ($role === 'dentist') {

            $dentist = Dentist::where('user_id', $user->id)->first();

            if (!$dentist) {
                return response()->json([
                    'message' => 'No dentist profile is linked to this account.',
                ], 403);
            }

            $query->where('dentist_id', $dentist->id);
        } elseif ($role === 'clinic') {

            $clinic = Clinic::where('user_id', $user->id)->first();

            if (!$clinic) {
                return response()->json([
                    'message' => 'No clinic profile is linked to this account.',
                ], 403);
            }

            $query->where('clinic_id', $clinic->id);
        } elseif ($role === 'staff') {

            $staff = Staff::where('user_id', $user->id)
                ->where('is_active', true)
                ->first();

            if (!$staff || !$staff->clinic_id) {
                return response()->json([
                    'message' => 'No active clinic is linked to this staff account.',
                ], 403);
            }

            $query->where('clinic_id', $staff->clinic_id);
        } elseif (in_array($role, ['admin', 'superadmin'], true)) {

            // Super Admin can view bookings across all clinics.

        } else {

            return response()->json([
                'message' => 'You are not authorized to list bookings.',
            ], 403);
        }

        $bookings = $query->paginate(
            min(max((int) $request->input('per_page', 15), 1), 100)
        );

        return response()->json($bookings);
    }

    /**
     * Get available appointment slots.
     *
     * GET /api/bookings/availability
     *
     * Required query parameters:
     * dentist_id
     * clinic_id
     * date
     * services[0][clinic_service_offering_id]
     * services[0][quantity]
     */
    public function availability(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'dentist_id' => [
                'required',
                'integer',
                'exists:dentists,id',
            ],
            'clinic_id' => [
                'required',
                'integer',
                'exists:clinics,id',
            ],
            'date' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:today',
            ],
            'services' => [
                'required',
                'array',
                'min:1',
            ],
            'services.*.clinic_service_offering_id' => [
                'required',
                'integer',
                'distinct',
                'exists:clinic_service_offerings,id',
            ],
            'services.*.quantity' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
            'exclude_booking_id' => [
                'nullable',
                'integer',
                'exists:bookings,id',
            ],
        ]);

        $services = $this->resolveServices(
            $validated['services'],
            (int) $validated['clinic_id']
        );

        $duration = $this->calculateDuration(
            $validated['services'],
            $services
        );

        $date = Carbon::parse($validated['date']);

        $scheduleSlots = $this->getConfirmedScheduleSlots(
            (int) $validated['dentist_id'],
            (int) $validated['clinic_id'],
            $date
        );

        if ($scheduleSlots->isEmpty()) {
            return response()->json([
                'message' => 'No confirmed working schedule is available for this dentist and clinic on the selected date.',
                'data' => [
                    'date' => $validated['date'],
                    'duration_minutes' => $duration,
                    'slots' => [],
                ],
            ]);
        }

        $bookings = $this->getBlockingBookings(
            (int) $validated['dentist_id'],
            $date,
            $validated['exclude_booking_id'] ?? null
        );

        $slots = [];

        foreach ($scheduleSlots as $schedule) {
            $start = Carbon::parse(
                $date->format('Y-m-d') . ' ' . $schedule->start_time
            );

            $end = Carbon::parse(
                $date->format('Y-m-d') . ' ' . $schedule->end_time
            );

            while ($start->copy()->addMinutes($duration)->lte($end)) {
                $slotStart = $start->copy();
                $slotEnd = $slotStart->copy()->addMinutes($duration);

                $available = $slotStart->gt(now())
                    && !$this->hasBookingConflict(
                        $slotStart,
                        $slotEnd,
                        $bookings
                    );

                if ($available) {
                    $slots[] = [
                        'start_time' => $slotStart->format('H:i'),
                        'end_time' => $slotEnd->format('H:i'),
                        'duration_minutes' => $duration,
                        'available' => true,
                    ];
                }

                $start->addMinutes(self::SLOT_INTERVAL_MINUTES);
            }
        }

        return response()->json([
            'message' => 'Available appointment slots retrieved successfully.',
            'data' => [
                'dentist_id' => (int) $validated['dentist_id'],
                'clinic_id' => (int) $validated['clinic_id'],
                'date' => $validated['date'],
                'duration_minutes' => $duration,
                'slots' => $slots,
            ],
        ]);
    }

    /**
     * Check whether a specific appointment time is available.
     *
     * GET /api/bookings/check-slot
     *
     * Required query parameters:
     * dentist_id, clinic_id, date, start_time, services
     */
    public function checkSlot(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'dentist_id' => [
                'required',
                'integer',
                'exists:dentists,id',
            ],
            'clinic_id' => [
                'required',
                'integer',
                'exists:clinics,id',
            ],
            'date' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:today',
            ],
            'start_time' => [
                'required',
                'date_format:H:i',
            ],
            'services' => [
                'required',
                'array',
                'min:1',
            ],
            'services.*.clinic_service_offering_id' => [
                'required',
                'integer',
                'distinct',
                'exists:clinic_service_offerings,id',
            ],
            'services.*.quantity' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
            'exclude_booking_id' => [
                'nullable',
                'integer',
                'exists:bookings,id',
            ],
        ]);

        $services = $this->resolveServices(
            $validated['services'],
            (int) $validated['clinic_id']
        );

        $duration = $this->calculateDuration(
            $validated['services'],
            $services
        );

        $start = Carbon::parse(
            $validated['date'] . ' ' . $validated['start_time']
        );

        $end = $start->copy()->addMinutes($duration);

        $scheduleSlots = $this->getConfirmedScheduleSlots(
            (int) $validated['dentist_id'],
            (int) $validated['clinic_id'],
            $start
        );

        $withinSchedule = $scheduleSlots->contains(
            function ($schedule) use ($start, $end) {
                $scheduleStart = Carbon::parse(
                    $start->format('Y-m-d') . ' ' . $schedule->start_time
                );

                $scheduleEnd = Carbon::parse(
                    $start->format('Y-m-d') . ' ' . $schedule->end_time
                );

                return $start->gte($scheduleStart)
                    && $end->lte($scheduleEnd);
            }
        );

        if (!$withinSchedule) {
            return response()->json([
                'message' => 'The requested appointment is outside the dentist working schedule.',
                'data' => [
                    'available' => false,
                    'reason' => 'outside_working_schedule',
                ],
            ]);
        }

        $bookings = $this->getBlockingBookings(
            (int) $validated['dentist_id'],
            $start,
            $validated['exclude_booking_id'] ?? null
        );

        $conflict = $this->hasBookingConflict(
            $start,
            $end,
            $bookings
        );

        $available = $start->gt(now()) && !$conflict;

        return response()->json([
            'message' => $available
                ? 'The requested appointment slot is available.'
                : 'The requested appointment slot is not available.',
            'data' => [
                'available' => $available,
                'date' => $start->format('Y-m-d'),
                'start_time' => $start->format('H:i'),
                'end_time' => $end->format('H:i'),
                'duration_minutes' => $duration,
                'reason' => !$start->gt(now())
                    ? 'past_time'
                    : ($conflict ? 'booking_conflict' : null),
            ],
        ]);
    }

    /**
     * Create a booking and its service lines.
     *
     * POST /api/bookings
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $this->roleName($request);

        if (!in_array(
            $role,
            ['patient', 'dentist', 'admin', 'superadmin'],
            true
        )) {
            return response()->json([
                'message' => 'You are not authorized to create bookings.',
            ], 403);
        }

        $validated = $request->validate([
            'patient_id' => [
                'nullable',
                'integer',
                'exists:patients,id',
            ],
            'dentist_id' => [
                'nullable',
                'integer',
                'exists:dentists,id',
            ],
            'clinic_id' => [
                'required',
                'integer',
                'exists:clinics,id',
            ],
            'booking_date' => [
                'required',
                'date',
                'after:now',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],
            'services' => [
                'required',
                'array',
                'min:1',
            ],
            'services.*.clinic_service_offering_id' => [
                'required',
                'integer',
                'distinct',
                'exists:clinic_service_offerings,id',
            ],
            'services.*.quantity' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        if ($role !== 'patient' && empty($validated['patient_id'])) {
            throw ValidationException::withMessages([
                'patient_id' => ['The patient field is required.'],
            ]);
        }

        if ($role !== 'dentist' && empty($validated['dentist_id'])) {
            throw ValidationException::withMessages([
                'dentist_id' => ['The dentist field is required.'],
            ]);
        }

        if ($role === 'patient') {
            $patient = Patient::where('user_id', $user->id)->first();

            if (!$patient) {
                return response()->json([
                    'message' => 'No patient profile is linked to this account.',
                ], 403);
            }

            $validated['patient_id'] = $patient->id;
        }

        if ($role === 'dentist') {
            $dentist = Dentist::where('user_id', $user->id)->first();

            if (!$dentist) {
                return response()->json([
                    'message' => 'No dentist profile is linked to this account.',
                ], 403);
            }

            $validated['dentist_id'] = $dentist->id;
        }

        $services = $this->resolveServices(
            $validated['services'],
            (int) $validated['clinic_id']
        );

        $bookingDate = Carbon::parse($validated['booking_date']);

        $status = BookingStatus::where('code', 'PENDING_CONFIRMATION')
            ->where('is_active', true)
            ->first();

        if (!$status) {
            return response()->json([
                'message' => 'The PENDING_CONFIRMATION booking status is not configured.',
            ], 422);
        }

        $booking = DB::transaction(function () use (
            $validated,
            $services,
            $bookingDate,
            $status
        ) {
            // Lock the dentist row so concurrent booking requests
            // for this dentist are serialized.
            Dentist::whereKey($validated['dentist_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $this->assertDentistClinicSchedule(
                (int) $validated['dentist_id'],
                (int) $validated['clinic_id'],
                $bookingDate,
                $validated['services'],
                $services
            );

            $duration = $this->calculateDuration(
                $validated['services'],
                $services
            );

            $end = $bookingDate->copy()->addMinutes($duration);

            $bookings = $this->getBlockingBookings(
                (int) $validated['dentist_id'],
                $bookingDate
            );

            if ($this->hasBookingConflict(
                $bookingDate,
                $end,
                $bookings
            )) {
                abort(409, 'This appointment slot has just been booked. Please select another time.');
            }

            $booking = Booking::create([
                'patient_id' => $validated['patient_id'],
                'dentist_id' => $validated['dentist_id'],
                'clinic_id' => $validated['clinic_id'],
                'booking_date' => $bookingDate,
                'notes' => $validated['notes'] ?? null,
                'booking_status_id' => $status->id,
            ]);

            foreach ($validated['services'] as $item) {
                $offering = $services->get(
                    (int) $item['clinic_service_offering_id']
                );

                BookingService::create([
                    'booking_id' => $booking->id,
                    'clinic_service_offering_id' => $offering->id,
                    'quantity' => $item['quantity'] ?? 1,
                    'unit_price' => $offering->price,
                ]);
            }


            BookingStatusHistory::create([
                'booking_id' => $booking->id,
                'from_status_id' => null,
                'to_status_id' => $status->id,
                'changed_by_user_id' => request()->user()->id,
                'remarks' => 'Booking created.',
            ]);

            return $booking;
        });

        return response()->json([
            'message' => 'Booking created successfully.',
            'data' => $booking->load([
                'patient',
                'dentist',
                'clinic',
                'bookingStatus',
                'bookingServices.clinicServiceOffering.dentalService',
            ]),
        ], 201);
    }

    /**
     * Show a single booking.
     *
     * GET /api/bookings/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $booking = Booking::with([
            'patient',
            'dentist',
            'clinic',
            'bookingStatus',
            'bookingServices.clinicServiceOffering.dentalService',
        ])->findOrFail($id);

        if (!$this->canAccessBooking($request, $booking)) {
            return response()->json([
                'message' => 'You are not authorized to view this booking.',
            ], 403);
        }

        return response()->json([
            'data' => $booking,
        ]);
    }

    /**
     * Update booking details.
     *
     * PUT /api/bookings/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);

        if (!$this->canManageBooking($request, $booking)) {
            return response()->json([
                'message' => 'You are not authorized to update this booking.',
            ], 403);
        }

        // Date and service changes must use the approval-based rescheduling flow.
        $validated = $request->validate([
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        if (empty($validated)) {
            return response()->json([
                'message' => 'Only booking notes can be edited directly. Use the rescheduling request workflow to change appointment date or services.',
            ], 422);
        }

        $booking->update($validated);

        return response()->json([
            'message' => 'Booking notes updated successfully.',
            'data' => $booking->fresh()->load([
                'patient', 'dentist', 'clinic', 'bookingStatus',
                'bookingServices.clinicServiceOffering.dentalService',
            ]),
        ]);
    }

    /**
     * Resolve and validate active service offerings for a clinic.
     */
    private function resolveServices(
        array $items,
        int $clinicId
    ): Collection {
        $offeringIds = collect($items)
            ->pluck('clinic_service_offering_id')
            ->map(fn($id) => (int) $id)
            ->unique()
            ->values();

        $offerings = ClinicServiceOffering::query()
            ->whereIn('id', $offeringIds)
            ->where('clinic_id', $clinicId)
            ->where('is_active', true)
            ->whereHas('dentalService', function ($query) {
                $query->where('is_active', true);
            })
            ->get()
            ->keyBy('id');

        if ($offerings->count() !== $offeringIds->count()) {
            throw ValidationException::withMessages([
                'services' => [
                    'One or more selected services are unavailable at this clinic.',
                ],
            ]);
        }

        return $offerings;
    }

    /**
     * Calculate total appointment duration from selected services.
     */
    private function calculateDuration(
        array $items,
        Collection $offerings
    ): int {
        $duration = 0;

        foreach ($items as $item) {
            $offering = $offerings->get(
                (int) $item['clinic_service_offering_id']
            );

            $quantity = (int) ($item['quantity'] ?? 1);

            $duration +=
                (int) $offering->duration_minutes * $quantity;
        }

        if ($duration <= 0) {
            throw ValidationException::withMessages([
                'services' => [
                    'The selected services must have a valid appointment duration.',
                ],
            ]);
        }

        return $duration;
    }

    /**
     * Get confirmed working schedule slots for a dentist and clinic.
     *
     * Only accepted associations and confirmed schedules are considered.
     */
    private function getConfirmedScheduleSlots(
        int $dentistId,
        int $clinicId,
        Carbon $date
    ): Collection {
        $day = $date->format('l');

        return ClinicDentist::query()
            ->where('dentist_id', $dentistId)
            ->where('clinic_id', $clinicId)
            ->where('day_of_week', $day)
            ->whereHas('associationSchedule', function ($query) use ($date) {
                $query
                    ->where(
                        'status',
                        AssociationSchedule::STATUS_CONFIRMED
                    )
                    ->whereDate('effective_from', '<=', $date->toDateString())
                    ->where(function ($q) use ($date) {
                        $q->whereNull('effective_until')
                            ->orWhereDate(
                                'effective_until',
                                '>=',
                                $date->toDateString()
                            );
                    })
                    ->whereHas('association', function ($association) {
                        $association->where('status', 'accepted');
                    });
            })
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Verify that the requested appointment fits a confirmed schedule.
     */
    private function assertDentistClinicSchedule(
        int $dentistId,
        int $clinicId,
        Carbon $start,
        array $items,
        Collection $offerings
    ): void {
        $schedules = $this->getConfirmedScheduleSlots(
            $dentistId,
            $clinicId,
            $start
        );

        $duration = $this->calculateDuration($items, $offerings);
        $end = $start->copy()->addMinutes($duration);

        $withinSchedule = $schedules->contains(
            function ($schedule) use ($start, $end) {
                $scheduleStart = Carbon::parse(
                    $start->format('Y-m-d') . ' ' . $schedule->start_time
                );

                $scheduleEnd = Carbon::parse(
                    $start->format('Y-m-d') . ' ' . $schedule->end_time
                );

                return $start->gte($scheduleStart)
                    && $end->lte($scheduleEnd);
            }
        );

        if (!$withinSchedule) {
            throw ValidationException::withMessages([
                'booking_date' => [
                    'The requested appointment is outside the dentist confirmed working schedule.',
                ],
            ]);
        }
    }

    /**
     * Retrieve existing blocking bookings for the dentist on a date.
     *
     * This intentionally checks all clinics because a dentist cannot
     * attend two clinics at the same time.
     */
    private function getBlockingBookings(
        int $dentistId,
        Carbon $date,
        ?int $excludeBookingId = null
    ): Collection {
        $query = Booking::query()
            ->with([
                'bookingStatus',
                'bookingServices.clinicServiceOffering',
            ])
            ->where('dentist_id', $dentistId)
            ->whereDate('booking_date', $date->toDateString());

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query->get()->filter(function ($booking) {
            $status = strtolower(
                $booking->bookingStatus->code
                    ?? $booking->bookingStatus->name
                    ?? ''
            );

            return !in_array(
                str_replace(' ', '_', $status),
                self::NON_BLOCKING_STATUSES,
                true
            );
        })->values();
    }

    /**
     * Check whether a requested time overlaps any existing booking.
     */
    private function hasBookingConflict(
        Carbon $requestedStart,
        Carbon $requestedEnd,
        Collection $bookings
    ): bool {
        foreach ($bookings as $booking) {
            $existingStart = Carbon::parse($booking->booking_date);

            $existingDuration = 0;

            foreach ($booking->bookingServices as $service) {
                $offering = $service->clinicServiceOffering;

                if ($offering) {
                    $existingDuration +=
                        (int) $offering->duration_minutes
                        * (int) $service->quantity;
                }
            }

            // Legacy bookings without service lines occupy 30 minutes.
            if ($existingDuration <= 0) {
                $existingDuration = 30;
            }

            $existingEnd = $existingStart->copy()
                ->addMinutes($existingDuration);

            // Overlap exists when:
            // requestedStart < existingEnd
            // AND requestedEnd > existingStart
            if (
                $requestedStart->lt($existingEnd)
                && $requestedEnd->gt($existingStart)
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check booking access for patients, dentists and administrators.
     */
    private function roleName(Request $request): string
    {
        $user = $request->user();
        $roleValue = $user?->getAttribute('role');

        return strtolower(trim(
            is_string($roleValue)
                ? $roleValue
                : ($roleValue->name ?? '')
        ));
    }

    private function clinicIdForUser(Request $request): ?int
    {
        $user = $request->user();
        $role = $this->roleName($request);

        if ($role === 'clinic') {
            $id = Clinic::where('user_id', $user->id)->value('id');
            return $id ? (int) $id : null;
        }

        if ($role === 'staff') {
            $staff = Staff::where('user_id', $user->id)
                ->where('is_active', true)
                ->first();
            return $staff?->clinic_id ? (int) $staff->clinic_id : null;
        }

        return null;
    }

    private function canAccessBooking(
        Request $request,
        Booking $booking,
        bool $forUpdate = false
    ): bool {
        $user = $request->user();
        $role = $this->roleName($request);

        if (in_array($role, ['admin', 'superadmin'], true)) {
            return true;
        }

        if ($role === 'patient') {
            $patientId = Patient::where('user_id', $user->id)->value('id');
            return $patientId !== null
                && (int) $booking->patient_id === (int) $patientId
                && !$forUpdate;
        }

        if ($role === 'dentist') {
            $dentistId = Dentist::where('user_id', $user->id)->value('id');
            return $dentistId !== null
                && (int) $booking->dentist_id === (int) $dentistId;
        }

        $clinicId = $this->clinicIdForUser($request);
        return $clinicId !== null
            && (int) $booking->clinic_id === $clinicId;
    }

    private function canManageBooking(Request $request, Booking $booking): bool
    {
        $role = $this->roleName($request);

        if (in_array($role, ['admin', 'superadmin'], true)) {
            return true;
        }

        $clinicId = $this->clinicIdForUser($request);
        return $clinicId !== null && (int) $booking->clinic_id === $clinicId;
    }

    private function changeStatus(
        Booking $booking,
        string $targetCode,
        int $actorId,
        ?string $remarks = null
    ): void {
        $target = BookingStatus::where('code', $targetCode)
            ->where('is_active', true)
            ->firstOrFail();

        $previousId = (int) $booking->booking_status_id;
        $booking->booking_status_id = $target->id;
        $booking->save();

        BookingStatusHistory::create([
            'booking_id' => $booking->id,
            'from_status_id' => $previousId,
            'to_status_id' => $target->id,
            'changed_by_user_id' => $actorId,
            'remarks' => $remarks,
        ]);
    }

    /**
     * Change booking status using the role-aware transition matrix.
     * PATCH /api/bookings/{id}/status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:CONFIRMED,CHECKED_IN,IN_PROGRESS,COMPLETED,CANCELLED,NO_SHOW'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $booking = Booking::with('bookingStatus')->findOrFail($id);
        $role = $this->roleName($request);
        $current = $booking->bookingStatus?->code;
        $target = $validated['status'];

        $clinicManager = $this->canManageBooking($request, $booking);
        $assignedDentist = $role === 'dentist'
            && Dentist::where('user_id', $request->user()->id)
                ->whereKey($booking->dentist_id)->exists();

        $allowed = [
            'PENDING_CONFIRMATION' => ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED' => ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
            'CHECKED_IN' => ['IN_PROGRESS'],
            'IN_PROGRESS' => ['COMPLETED'],
        ];

        if (!in_array($target, $allowed[$current] ?? [], true)) {
            return response()->json([
                'message' => "Transition from {$current} to {$target} is not permitted.",
            ], 422);
        }

        $authorized = match ($target) {
            'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW' => $clinicManager
                || in_array($role, ['admin', 'superadmin'], true),
            'IN_PROGRESS', 'COMPLETED' => $assignedDentist
                || in_array($role, ['admin', 'superadmin'], true),
            default => false,
        };

        if (!$authorized) {
            return response()->json([
                'message' => 'You are not authorized to perform this status transition.',
            ], 403);
        }

        DB::transaction(function () use ($id, $target, $request, $validated, $current, $allowed) {
            $locked = Booking::with('bookingStatus')->lockForUpdate()->findOrFail($id);
            if ($locked->bookingStatus?->code !== $current
                || !in_array($target, $allowed[$locked->bookingStatus?->code] ?? [], true)) {
                abort(409, 'The booking status changed. Refresh the booking and try again.');
            }
            $this->changeStatus(
                $locked,
                $target,
                (int) $request->user()->id,
                $validated['remarks'] ?? null
            );
        });

        return response()->json([
            'message' => 'Booking status updated successfully.',
            'data' => Booking::with('bookingStatus')->findOrFail($id),
        ]);
    }

    /**
     * Read-only booking status audit trail.
     * GET /api/bookings/{id}/history
     */
    public function history(Request $request, int $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);

        if (!$this->canAccessBooking($request, $booking)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        return response()->json([
            'data' => $booking->statusHistories()
                ->with(['fromStatus', 'toStatus', 'changedBy'])
                ->orderBy('created_at')
                ->get(),
        ]);
    }

    /**
     * Patient submits cancellation or rescheduling request.
     * POST /api/bookings/{id}/change-requests
     */
    public function storeChangeRequest(Request $request, int $id): JsonResponse
    {
        $booking = Booking::with('bookingStatus')->findOrFail($id);
        $role = $this->roleName($request);

        if (!$this->canAccessBooking($request, $booking)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        if ($role !== 'patient') {
            return response()->json([
                'message' => 'Only the patient can submit cancellation or rescheduling requests.',
            ], 403);
        }

        if (!in_array($booking->bookingStatus?->code, [
            'PENDING_CONFIRMATION', 'CONFIRMED',
        ], true)) {
            return response()->json([
                'message' => 'This booking can no longer be changed.',
            ], 422);
        }

        $validated = $request->validate([
            'request_type' => ['required', 'in:CANCELLATION,RESCHEDULE'],
            'reason' => ['required', 'string', 'max:2000'],
            'requested_booking_date' => [
                'required_if:request_type,RESCHEDULE',
                'nullable',
                'date',
                'after:now',
            ],
        ]);

        // Lock the parent booking while checking/creating the request. This
        // prevents two rapid submissions from creating duplicate pending rows.
        $changeRequest = DB::transaction(function () use ($booking, $validated, $request) {
            $lockedBooking = Booking::with('bookingStatus')
                ->lockForUpdate()
                ->findOrFail($booking->id);

            if (!in_array($lockedBooking->bookingStatus?->code, [
                'PENDING_CONFIRMATION', 'CONFIRMED',
            ], true)) {
                abort(409, 'This booking can no longer be changed.');
            }

            $pending = BookingChangeRequest::where('booking_id', $lockedBooking->id)
                ->where('status', 'PENDING')
                ->lockForUpdate()
                ->exists();

            if ($pending) {
                abort(409, 'A pending change request already exists for this booking. Review that request before submitting another.');
            }

            // One request belongs to the whole booking, not to individual
            // service lines. The selected services stay on the parent booking.
            return BookingChangeRequest::create([
                'booking_id' => $lockedBooking->id,
                'requested_by_user_id' => $request->user()->id,
                'request_type' => $validated['request_type'],
                'reason' => $validated['reason'],
                'requested_booking_date' => $validated['requested_booking_date'] ?? null,
                'status' => 'PENDING',
            ]);
        });

        return response()->json([
            'message' => 'Booking change request submitted for clinic review.',
            'data' => $changeRequest,
        ], 201);
    }

    /**
     * Review a patient cancellation/rescheduling request.
     * PATCH /api/booking-change-requests/{requestId}/review
     */
    public function reviewChangeRequest(Request $request, int $requestId): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'in:APPROVED,REJECTED'],
            'review_remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $changeRequest = BookingChangeRequest::with([
            'booking.bookingServices.clinicServiceOffering',
            'booking.bookingStatus',
        ])->findOrFail($requestId);

        if (!$this->canManageBooking($request, $changeRequest->booking)
            && !in_array($this->roleName($request), ['admin', 'superadmin'], true)) {
            return response()->json(['message' => 'Not authorized to review this request.'], 403);
        }

        $result = DB::transaction(function () use ($changeRequest, $validated, $request) {
            $changeRequest = BookingChangeRequest::with([
                'booking.bookingServices.clinicServiceOffering',
                'booking.bookingStatus',
            ])->lockForUpdate()->findOrFail($changeRequest->id);

            if ($changeRequest->status !== 'PENDING') {
                abort(409, 'This request has already been reviewed.');
            }

            $booking = Booking::with([
                'bookingServices.clinicServiceOffering',
                'bookingStatus',
            ])->lockForUpdate()->findOrFail($changeRequest->booking_id);

            if (!in_array($booking->bookingStatus?->code, [
                'PENDING_CONFIRMATION', 'CONFIRMED',
            ], true)) {
                abort(409, 'The booking is no longer eligible for cancellation or rescheduling.');
            }

            if ($validated['decision'] === 'REJECTED') {
                $changeRequest->update([
                    'status' => 'REJECTED',
                    'reviewed_by_user_id' => $request->user()->id,
                    'reviewed_at' => now(),
                    'review_remarks' => $validated['review_remarks'] ?? null,
                ]);
                return ['request' => $changeRequest->fresh(), 'replacement' => null];
            }

            if ($changeRequest->request_type === 'CANCELLATION') {
                $this->changeStatus(
                    $booking,
                    'CANCELLED',
                    (int) $request->user()->id,
                    'Cancellation approved. ' . ($validated['review_remarks'] ?? '')
                );
                $replacement = null;
            } else {
                $newDate = Carbon::parse($changeRequest->requested_booking_date);
                $items = $booking->bookingServices->map(fn ($line) => [
                    'clinic_service_offering_id' => $line->clinic_service_offering_id,
                    'quantity' => $line->quantity,
                ])->values()->all();

                if (empty($items)) {
                    abort(422, 'Cannot reschedule a booking without service lines.');
                }

                Dentist::whereKey($booking->dentist_id)->lockForUpdate()->firstOrFail();
                $services = $this->resolveServices($items, (int) $booking->clinic_id);
                $this->assertDentistClinicSchedule(
                    (int) $booking->dentist_id,
                    (int) $booking->clinic_id,
                    $newDate,
                    $items,
                    $services
                );

                $duration = $this->calculateDuration($items, $services);
                $end = $newDate->copy()->addMinutes($duration);
                $existing = $this->getBlockingBookings(
                    (int) $booking->dentist_id,
                    $newDate,
                    (int) $booking->id
                );

                if ($this->hasBookingConflict($newDate, $end, $existing)) {
                    abort(409, 'The requested rescheduling slot is no longer available.');
                }

                // Approval confirms the replacement booking immediately.
                // The clinic should not need a second confirmation action.
                $confirmedStatus = BookingStatus::where('code', 'CONFIRMED')
                    ->where('is_active', true)->firstOrFail();

                $replacement = Booking::create([
                    'patient_id' => $booking->patient_id,
                    'dentist_id' => $booking->dentist_id,
                    'clinic_id' => $booking->clinic_id,
                    'booking_date' => $newDate,
                    'notes' => $booking->notes,
                    'booking_status_id' => $confirmedStatus->id,
                ]);

                foreach ($booking->bookingServices as $line) {
                    BookingService::create([
                        'booking_id' => $replacement->id,
                        'clinic_service_offering_id' => $line->clinic_service_offering_id,
                        'quantity' => $line->quantity,
                        'unit_price' => $line->unit_price,
                    ]);
                }

                BookingStatusHistory::create([
                    'booking_id' => $replacement->id,
                    'from_status_id' => null,
                    'to_status_id' => $confirmedStatus->id,
                    'changed_by_user_id' => $request->user()->id,
                    'remarks' => 'Rescheduling request #' . $changeRequest->id . ' approved. Replacement booking is confirmed.',
                ]);

                $this->changeStatus(
                    $booking,
                    'RESCHEDULED',
                    (int) $request->user()->id,
                    'Rescheduled to booking #' . $replacement->id
                );
            }

            $changeRequest->update([
                'status' => 'APPROVED',
                'reviewed_by_user_id' => $request->user()->id,
                'reviewed_at' => now(),
                'review_remarks' => $validated['review_remarks'] ?? null,
                'replacement_booking_id' => $replacement?->id,
            ]);

            return [
                'request' => $changeRequest->fresh(),
                'replacement' => $replacement,
            ];
        });

        return response()->json([
            'message' => 'Booking change request reviewed successfully.',
            'data' => $result['request'],
            'replacement_booking' => $result['replacement']?->load('bookingStatus', 'bookingServices'),
        ]);
    }

    /**
     * List change requests for a booking.
     * GET /api/bookings/{id}/change-requests
     */
    public function changeRequests(Request $request, int $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);

        if (!$this->canAccessBooking($request, $booking)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        return response()->json([
            'data' => $booking->changeRequests()->with([
                'requestedBy', 'reviewedBy', 'replacementBooking',
            ])->latest()->get(),
        ]);
    }
}
