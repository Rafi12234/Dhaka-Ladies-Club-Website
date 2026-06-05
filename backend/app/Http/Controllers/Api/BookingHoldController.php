<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class BookingHoldController extends Controller
{
    private string $timezone = 'Asia/Dhaka';

    private float $defaultShiftPrice = 125000.00;

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
    'customer_name' => ['required', 'string', 'max:150'],
    'customer_email' => ['required', 'email', 'max:150'],
    'customer_phone' => ['required', 'string', 'max:30'],
    'customer_address' => ['required', 'string'],

    'hall_id' => ['required', 'integer', 'exists:halls,id'],
    'booking_slot_id' => ['required', 'integer', 'exists:booking_slots,id'],

    'event_title' => ['required', 'string', 'max:150'],
    'event_type' => ['required', 'string', 'max:100'],
    'event_details' => ['required', 'string'],
    'guest_count' => ['required', 'integer', 'min:1'],

    /*
     * Frontend can send total_amount for display compatibility,
     * but backend will NOT trust it. The final amount is calculated
     * from shifts.price below.
     */
    'total_amount' => ['required', 'numeric', 'min:1'],
]);

        try {
            return DB::transaction(function () use ($validated): JsonResponse {
                $now = Carbon::now($this->timezone);
                $today = Carbon::today($this->timezone)->toDateString();

                $slot = DB::table('booking_slots as bs')
                    ->join('shifts as s', 's.id', '=', 'bs.shift_id')
                    ->where('bs.id', $validated['booking_slot_id'])
                    ->where('bs.hall_id', $validated['hall_id'])
                    ->select($this->slotSelectColumns())
                    ->lockForUpdate()
                    ->first();

                if (! $slot) {
                    return response()->json([
                        'message' => 'This slot is no longer available.',
                    ], 422);
                }

                if ($slot->slot_date < $today) {
                    return response()->json([
                        'message' => 'Past dates cannot be booked. Please choose an upcoming date.',
                    ], 422);
                }

                if ($slot->slot_status !== 'available') {
                    return response()->json([
                        'message' => 'This slot is no longer available.',
                    ], 422);
                }

                $totalAmount = (float) ($slot->shift_price ?? $this->defaultShiftPrice);

                $customerId = $this->upsertCustomer($validated);

                /*
                 * Reuse an existing booking record for the same slot if present.
                 * This avoids unique-constraint errors when a cancelled/pending row
                 * already exists for the slot.
                 */
                $existingBooking = DB::table('bookings')
                    ->where('booking_slot_id', $validated['booking_slot_id'])
                    ->lockForUpdate()
                    ->first();

                if ($existingBooking && $existingBooking->booking_status === 'confirmed') {
                    return response()->json([
                        'message' => 'This slot is already booked.',
                    ], 422);
                }

                $bookingData = [
    'booking_no' => $this->generateBookingNo((int) $validated['booking_slot_id']),
    'customer_id' => $customerId,
    'booking_slot_id' => $validated['booking_slot_id'],
    'booking_status' => 'pending',
    'booking_source' => 'online',
    'event_title' => $validated['event_title'],
    'event_type' => $validated['event_type'],
    'event_details' => $validated['event_details'],
    'guest_count' => $validated['guest_count'],
    'total_amount' => $totalAmount,
    'booked_at' => null,
    'updated_at' => $now,
];

                if ($existingBooking) {
                    DB::table('bookings')
                        ->where('id', $existingBooking->id)
                        ->update($bookingData);

                    $bookingId = $existingBooking->id;
                } else {
                    $bookingId = DB::table('bookings')->insertGetId(array_merge($bookingData, [
                        'created_at' => $now,
                    ]));
                }

                $holdToken = (string) Str::uuid();
                $holdExpiresAt = $now->copy()->addMinutes(10);

                $updated = DB::table('booking_slots')
                    ->where('id', $validated['booking_slot_id'])
                    ->where('hall_id', $validated['hall_id'])
                    ->where('slot_status', 'available')
                    ->whereDate('slot_date', '>=', $today)
                    ->update([
                        'slot_status' => 'payment_in_progress',
                        'hold_token' => $holdToken,
                        'hold_expires_at' => $holdExpiresAt,
                        'hold_booking_id' => $bookingId,
                        'updated_at' => $now,
                    ]);

                if ($updated === 0) {
                    throw new \RuntimeException('This slot is no longer available.');
                }

                $updatedSlot = DB::table('booking_slots as bs')
                    ->join('shifts as s', 's.id', '=', 'bs.shift_id')
                    ->where('bs.id', $validated['booking_slot_id'])
                    ->select($this->slotSelectColumns())
                    ->first();

                return response()->json([
                    'message' => 'Slot held for payment. Complete payment within 10 minutes.',
                    'data' => [
                        'booking_id' => $bookingId,
                        'hold_token' => $holdToken,
                        'hold_expires_at' => $holdExpiresAt->toIso8601String(),
                        'amount' => $totalAmount,
                        'slot' => $updatedSlot,
                    ],
                ], 201);
            });
        } catch (\Throwable $exception) {
            return response()->json([
                'message' => 'Unable to hold this slot.',
                'error' => $exception->getMessage(),
            ], 422);
        }
    }

    public function release(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'hold_token' => ['required', 'string', 'max:100'],
        ]);

        try {
            return DB::transaction(function () use ($validated): JsonResponse {
                $now = Carbon::now($this->timezone);

                $slot = DB::table('booking_slots')
                    ->where('slot_status', 'payment_in_progress')
                    ->where('hold_booking_id', $validated['booking_id'])
                    ->where('hold_token', $validated['hold_token'])
                    ->lockForUpdate()
                    ->first();

                if (! $slot) {
                    return response()->json([
                        'message' => 'Invalid or expired payment session.',
                    ], 422);
                }

                DB::table('booking_slots')
                    ->where('id', $slot->id)
                    ->update([
                        'slot_status' => 'available',
                        'hold_token' => null,
                        'hold_expires_at' => null,
                        'hold_booking_id' => null,
                        'updated_at' => $now,
                    ]);

                DB::table('bookings')
                    ->where('id', $validated['booking_id'])
                    ->where('booking_status', 'pending')
                    ->update([
                        'booking_status' => 'cancelled',
                        'updated_at' => $now,
                    ]);

                return response()->json([
                    'message' => 'Payment session released successfully.',
                ]);
            });
        } catch (\Throwable $exception) {
            return response()->json([
                'message' => 'Unable to release this payment session.',
                'error' => $exception->getMessage(),
            ], 422);
        }
    }

    private function slotSelectColumns(): array
    {
        $columns = ['bs.*'];

        if (Schema::hasColumn('shifts', 'price')) {
            $columns[] = 's.price as shift_price';
        } else {
            $columns[] = DB::raw($this->defaultShiftPrice . ' as shift_price');
        }

        return $columns;
    }

    private function upsertCustomer(array $validated): int
    {
        $now = Carbon::now($this->timezone);

        $user = DB::table('users')
            ->where('email', $validated['customer_email'])
            ->first();

        if (! $user) {
            $userId = DB::table('users')->insertGetId([
                'name' => $validated['customer_name'],
                'email' => $validated['customer_email'],
                'phone' => $validated['customer_phone'] ?? null,
                'password_hash' => Hash::make(Str::random(40)),
                'user_type' => 'customer',
                'status' => 'active',
                'email_verified_at' => $now,
                'phone_verified_at' => ! empty($validated['customer_phone']) ? $now : null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $userId = $user->id;

            DB::table('users')
                ->where('id', $userId)
                ->update([
                    'name' => $validated['customer_name'],
                    'phone' => $validated['customer_phone'] ?? $user->phone,
                    'updated_at' => $now,
                ]);
        }

        $customer = DB::table('customers')
            ->where('user_id', $userId)
            ->first();

        if (! $customer) {
            $customerId = DB::table('customers')->insertGetId([
                'user_id' => $userId,
                'customer_code' => 'CUST-' . Str::upper(Str::random(8)),
                'address' => $validated['customer_address'] ?? null,
                'nid_or_passport' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $customerId = $customer->id;

            DB::table('customers')
                ->where('id', $customerId)
                ->update([
                    'address' => $validated['customer_address'] ?? $customer->address,
                    'updated_at' => $now,
                ]);
        }

        return (int) $customerId;
    }

    private function generateBookingNo(int $bookingSlotId): string
    {
        return 'BKG-' . Carbon::now($this->timezone)->format('YmdHis') . '-S' . str_pad((string) $bookingSlotId, 5, '0', STR_PAD_LEFT) . '-' . Str::upper(Str::random(4));
    }
}
