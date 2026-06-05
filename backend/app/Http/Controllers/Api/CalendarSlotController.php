<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CalendarSlotController extends Controller
{
    private string $timezone = 'Asia/Dhaka';

    private float $defaultShiftPrice = 125000.00;

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hall_id' => ['required', 'integer', 'exists:halls,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $this->releaseExpiredHolds();

        $today = Carbon::today($this->timezone)->toDateString();

        $fromDate = ! empty($validated['from'])
            ? max($validated['from'], $today)
            : $today;

        $toDate = $validated['to'] ?? $fromDate;

        if ($toDate < $today) {
            return response()->json([
                'message' => 'Calendar slots loaded successfully.',
                'data' => [],
            ]);
        }

        if ($toDate < $fromDate) {
            $toDate = $fromDate;
        }

        $this->ensureSlotsExist(
            (int) $validated['hall_id'],
            $fromDate,
            $toDate
        );

        /*
         * Default false so calendar can show available/booked/blocked/payment_in_progress.
         * If needed, frontend can call ?only_available=1.
         */
        $onlyAvailable = $request->has('only_available')
            ? $request->boolean('only_available')
            : false;

        $slots = DB::table('booking_slots as bs')
            ->select($this->calendarSlotSelectColumns())
            ->join('halls as h', 'h.id', '=', 'bs.hall_id')
            ->join('shifts as s', 's.id', '=', 'bs.shift_id')
            ->where('bs.hall_id', $validated['hall_id'])
            ->whereBetween('bs.slot_date', [$fromDate, $toDate])
            ->when($onlyAvailable, function ($query) {
                $query->where('bs.slot_status', 'available');
            })
            ->orderBy('bs.slot_date')
            ->orderBy('s.sort_order')
            ->get()
            ->map(fn ($slot) => $this->formatSlotForCalendar($slot));

        return response()->json([
            'message' => 'Calendar slots loaded successfully.',
            'data' => $slots,
        ]);
    }

    /**
     * Return date-wise counts of available slots for the calendar.
     */
    public function availability(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hall_id' => ['required', 'integer', 'exists:halls,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $this->releaseExpiredHolds();

        $today = Carbon::today($this->timezone)->toDateString();

        $fromDate = ! empty($validated['from'])
            ? max($validated['from'], $today)
            : $today;

        $toDate = $validated['to'] ?? $fromDate;

        if ($toDate < $today) {
            return response()->json([
                'message' => 'Calendar availability loaded successfully.',
                'data' => [],
            ]);
        }

        if ($toDate < $fromDate) {
            $toDate = $fromDate;
        }

        $this->ensureSlotsExist(
            (int) $validated['hall_id'],
            $fromDate,
            $toDate
        );

        $rows = DB::table('booking_slots')
            ->select('slot_date', DB::raw('COUNT(*) as available_count'))
            ->where('hall_id', $validated['hall_id'])
            ->whereBetween('slot_date', [$fromDate, $toDate])
            ->where('slot_status', 'available')
            ->groupBy('slot_date')
            ->orderBy('slot_date')
            ->get();

        return response()->json([
            'message' => 'Calendar availability loaded successfully.',
            'data' => $rows,
        ]);
    }

    private function calendarSlotSelectColumns(): array
    {
        $columns = [
            'bs.id as slot_id',
            'bs.slot_date',
            'bs.slot_status',
            'bs.hold_expires_at',
            'h.id as hall_id',
            'h.name as hall_name',
            'h.slug as hall_slug',
            's.id as shift_id',
            's.name as shift_name',
            's.start_time',
            's.end_time',
            's.sort_order',
        ];

        if (Schema::hasColumn('shifts', 'price')) {
            $columns[] = 's.price as shift_price';
        } else {
            $columns[] = DB::raw($this->defaultShiftPrice . ' as shift_price');
        }

        return $columns;
    }

    private function formatSlotForCalendar(object $slot): object
    {
        $statusText = match ($slot->slot_status) {
            'available' => 'Available',
            'booked' => 'Booked',
            'blocked' => 'Blocked',
            'payment_in_progress' => 'Booking In Progress',
            default => ucfirst(str_replace('_', ' ', $slot->slot_status)),
        };

        $price = (float) ($slot->shift_price ?? $this->defaultShiftPrice);

        $slot->price = $price;
        $slot->total_amount = $price;
        $slot->hold_expires_at_iso = null;
        $slot->hold_remaining_seconds = null;

        if ($slot->slot_status === 'payment_in_progress' && ! empty($slot->hold_expires_at)) {
            $expiresAt = Carbon::parse($slot->hold_expires_at, $this->timezone);

            $slot->hold_expires_at_iso = $expiresAt->toIso8601String();
            $slot->hold_remaining_seconds = max(
                0,
                (int) Carbon::now($this->timezone)->diffInSeconds($expiresAt, false)
            );
        }

        $slot->calendar_title = "{$slot->shift_name} {$statusText}";
        $slot->popup_title = "{$slot->shift_name} ({$slot->start_time} - {$slot->end_time}) - {$statusText}";
        $slot->price_label = '৳' . number_format($price, 2);

        return $slot;
    }

    private function ensureSlotsExist(int $hallId, string $fromDate, string $toDate): void
    {
        $shifts = DB::table('shifts')
            ->select('id')
            ->where('status', 'active')
            ->orderBy('sort_order')
            ->get();

        if ($shifts->isEmpty()) {
            return;
        }

        $rows = [];
        $now = Carbon::now($this->timezone);
        $current = Carbon::parse($fromDate, $this->timezone);
        $end = Carbon::parse($toDate, $this->timezone);

        while ($current->lte($end)) {
            foreach ($shifts as $shift) {
                $exists = DB::table('booking_slots')
                    ->where('hall_id', $hallId)
                    ->where('shift_id', $shift->id)
                    ->where('slot_date', $current->toDateString())
                    ->exists();

                if (! $exists) {
                    $rows[] = [
                        'hall_id' => $hallId,
                        'shift_id' => $shift->id,
                        'slot_date' => $current->toDateString(),
                        'slot_status' => 'available',
                        'hold_token' => null,
                        'hold_expires_at' => null,
                        'hold_booking_id' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            $current->addDay();
        }

        if (! empty($rows)) {
            DB::table('booking_slots')->insert($rows);
        }
    }

    private function releaseExpiredHolds(): void
    {
        DB::transaction(function (): void {
            $now = Carbon::now($this->timezone);

            $expiredSlots = DB::table('booking_slots')
                ->where('slot_status', 'payment_in_progress')
                ->whereNotNull('hold_expires_at')
                ->where('hold_expires_at', '<=', $now)
                ->lockForUpdate()
                ->get();

            if ($expiredSlots->isEmpty()) {
                return;
            }

            $expiredBookingIds = $expiredSlots
                ->pluck('hold_booking_id')
                ->filter()
                ->values();

            DB::table('booking_slots')
                ->whereIn('id', $expiredSlots->pluck('id'))
                ->update([
                    'slot_status' => 'available',
                    'hold_token' => null,
                    'hold_expires_at' => null,
                    'hold_booking_id' => null,
                    'updated_at' => $now,
                ]);

            if ($expiredBookingIds->isNotEmpty()) {
                DB::table('bookings')
                    ->whereIn('id', $expiredBookingIds)
                    ->where('booking_status', 'pending')
                    ->update([
                        'booking_status' => 'cancelled',
                        'updated_at' => $now,
                    ]);
            }
        });
    }
}
