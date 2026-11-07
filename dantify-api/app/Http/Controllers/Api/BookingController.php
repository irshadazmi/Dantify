<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssociationSchedule;
use App\Models\Booking;
use App\Models\BookingService;
use App\Models\BookingStatus;
use App\Models\ClinicDentist;
use App\Models\ClinicServiceOffering;
use App\Models\Dentist;
use App\Models\Patient;
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
        $role = strtolower($user->role->name ?? '');

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

        } elseif (!in_array($role, ['admin', 'superadmin'], true)) {
            return response()->json([
                'message' => 'You are not authorized to list bookings.',
            ], 403);
        }

        $bookings = $query->paginate(
            min((int) $request->input('per_page', 15), 100)
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
            $date
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
        $role = strtolower($user->role->name ?? '');

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

        $status = BookingStatus::where(function ($query) {
            $query->where('code', 'scheduled')
                ->orWhere('name', 'Scheduled');
        })->first();

        if (!$status) {
            return response()->json([
                'message' => 'The Scheduled booking status is not configured.',
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
        $booking = Booking::with([
            'bookingServices.clinicServiceOffering',
        ])->findOrFail($id);

        if (!$this->canAccessBooking($request, $booking, true)) {
            return response()->json([
                'message' => 'You are not authorized to update this booking.',
            ], 403);
        }

        $validated = $request->validate([
            'booking_date' => [
                'sometimes',
                'required',
                'date',
                'after:now',
            ],
            'notes' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],
            'services' => [
                'sometimes',
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

        $newDate = Carbon::parse(
            $validated['booking_date'] ?? $booking->booking_date
        );

        $serviceItems = $validated['services'] ?? $booking
            ->bookingServices
            ->map(fn ($item) => [
                'clinic_service_offering_id' =>
                    $item->clinic_service_offering_id,
                'quantity' => $item->quantity,
            ])
            ->values()
            ->all();

        $services = $this->resolveServices(
            $serviceItems,
            (int) $booking->clinic_id
        );

        DB::transaction(function () use (
            $booking,
            $validated,
            $newDate,
            $serviceItems,
            $services
        ) {
            Dentist::whereKey($booking->dentist_id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->assertDentistClinicSchedule(
                (int) $booking->dentist_id,
                (int) $booking->clinic_id,
                $newDate,
                $serviceItems,
                $services
            );

            $duration = $this->calculateDuration(
                $serviceItems,
                $services
            );

            $end = $newDate->copy()->addMinutes($duration);

            $bookings = $this->getBlockingBookings(
                (int) $booking->dentist_id,
                $newDate,
                $booking->id
            );

            if ($this->hasBookingConflict(
                $newDate,
                $end,
                $bookings
            )) {
                abort(409, 'The requested appointment time conflicts with another booking.');
            }

            $booking->fill([
                'booking_date' => $newDate,
                'notes' => array_key_exists('notes', $validated)
                    ? $validated['notes']
                    : $booking->notes,
            ])->save();

            if (array_key_exists('services', $validated)) {
                $booking->bookingServices()->delete();

                foreach ($serviceItems as $item) {
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
            }
        });

        return response()->json([
            'message' => 'Booking updated successfully.',
            'data' => $booking->fresh()->load([
                'patient',
                'dentist',
                'clinic',
                'bookingStatus',
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
            ->map(fn ($id) => (int) $id)
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
    private function canAccessBooking(
        Request $request,
        Booking $booking,
        bool $forUpdate = false
    ): bool {
        $user = $request->user();
        $role = strtolower($user->role->name ?? '');

        if (in_array($role, ['admin', 'superadmin'], true)) {
            return true;
        }

        if ($role === 'patient') {
            $patientId = Patient::where('user_id', $user->id)
                ->value('id');

            return $patientId !== null
                && (int) $booking->patient_id === (int) $patientId
                && !$forUpdate;
        }

        if ($role === 'dentist') {
            $dentistId = Dentist::where('user_id', $user->id)
                ->value('id');

            return $dentistId !== null
                && (int) $booking->dentist_id === (int) $dentistId
                && !$forUpdate;
        }

        return false;
    }
}
