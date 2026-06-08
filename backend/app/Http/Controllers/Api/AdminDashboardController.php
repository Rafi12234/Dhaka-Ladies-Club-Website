<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    private string $timezone = 'Asia/Dhaka';

    public function dashboard(Request $request): JsonResponse
    {
        $admin = $this->authenticatedAdmin($request);

        if (! $admin) {
            return response()->json([
                'message' => 'Unauthenticated admin.',
            ], 401);
        }

        [$startDate, $endDate, $label] = $this->resolveDateRange($request);

        $completedBase = DB::table('bookings as b')
            ->join('booking_slots as bs', 'bs.id', '=', 'b.booking_slot_id')
            ->whereNotNull('b.booked_at')
            ->whereNotIn('b.booking_status', ['pending', 'cancelled'])
            ->whereBetween('b.booked_at', [$startDate, $endDate]);

        $filteredBookings = (clone $completedBase)->count();
        $filteredRevenue = (clone $completedBase)->sum('b.total_amount');

        $bookedToday = $this->countCompletedBetween(
            Carbon::today($this->timezone)->startOfDay(),
            Carbon::today($this->timezone)->endOfDay()
        );

        $bookedThisWeek = $this->countCompletedBetween(
            Carbon::now($this->timezone)->startOfWeek(),
            Carbon::now($this->timezone)->endOfWeek()
        );

        $bookedThisMonth = $this->countCompletedBetween(
            Carbon::now($this->timezone)->startOfMonth(),
            Carbon::now($this->timezone)->endOfMonth()
        );

        $totalCustomers = DB::table('customers')->count();

        $slotStatusBreakdown = DB::table('booking_slots')
            ->select('slot_status', DB::raw('COUNT(*) as total'))
            ->groupBy('slot_status')
            ->orderBy('slot_status')
            ->get();

        $bookingStatusBreakdown = DB::table('bookings')
            ->select('booking_status', DB::raw('COUNT(*) as total'))
            ->groupBy('booking_status')
            ->orderBy('booking_status')
            ->get();

        $eventTypeBreakdown = DB::table('bookings')
            ->select('event_type', DB::raw('COUNT(*) as total'))
            ->whereNotNull('booked_at')
            ->whereNotIn('booking_status', ['pending', 'cancelled'])
            ->whereBetween('booked_at', [$startDate, $endDate])
            ->groupBy('event_type')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $recentBookings = DB::table('bookings as b')
            ->join('customers as c', 'c.id', '=', 'b.customer_id')
            ->join('users as u', 'u.id', '=', 'c.user_id')
            ->join('booking_slots as bs', 'bs.id', '=', 'b.booking_slot_id')
            ->leftJoin('halls as h', 'h.id', '=', 'bs.hall_id')
            ->leftJoin('shifts as s', 's.id', '=', 'bs.shift_id')
            ->whereNotNull('b.booked_at')
            ->whereNotIn('b.booking_status', ['pending', 'cancelled'])
            ->orderByDesc('b.booked_at')
            ->limit(8)
            ->select([
                'b.id',
                'b.booking_no',
                'b.booking_status',
                'b.event_title',
                'b.event_type',
                'b.guest_count',
                'b.total_amount',
                'b.booked_at',
                'u.name as customer_name',
                'u.email as customer_email',
                'u.phone as customer_phone',
                'c.address as customer_address',
                'bs.slot_date',
                'h.name as hall_name',
                's.name as shift_name',
                's.start_time',
                's.end_time',
            ])
            ->get();

        return response()->json([
            'message' => 'Admin dashboard loaded successfully.',
            'data' => [
                'admin' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'user_type' => $admin->user_type,
                ],
                'filter' => [
                    'label' => $label,
                    'start_date' => $startDate->toDateTimeString(),
                    'end_date' => $endDate->toDateTimeString(),
                ],
                'cards' => [
                    'booked_today' => $bookedToday,
                    'booked_this_week' => $bookedThisWeek,
                    'booked_this_month' => $bookedThisMonth,
                    'filtered_bookings' => $filteredBookings,
                    'filtered_revenue' => (float) $filteredRevenue,
                    'total_customers' => $totalCustomers,
                ],
                'slot_status_breakdown' => $slotStatusBreakdown,
                'booking_status_breakdown' => $bookingStatusBreakdown,
                'event_type_breakdown' => $eventTypeBreakdown,
                'recent_bookings' => $recentBookings,
            ],
        ]);
    }

    public function completedBookings(Request $request): JsonResponse
    {
        $admin = $this->authenticatedAdmin($request);

        if (! $admin) {
            return response()->json([
                'message' => 'Unauthenticated admin.',
            ], 401);
        }

        [$startDate, $endDate, $label] = $this->resolveDateRange($request);

        $bookings = DB::table('bookings as b')
            ->join('customers as c', 'c.id', '=', 'b.customer_id')
            ->join('users as u', 'u.id', '=', 'c.user_id')
            ->join('booking_slots as bs', 'bs.id', '=', 'b.booking_slot_id')
            ->leftJoin('halls as h', 'h.id', '=', 'bs.hall_id')
            ->leftJoin('shifts as s', 's.id', '=', 'bs.shift_id')
            ->whereNotNull('b.booked_at')
            ->whereNotIn('b.booking_status', ['pending', 'cancelled'])
            ->whereBetween('b.booked_at', [$startDate, $endDate])
            ->orderByDesc('b.booked_at')
            ->select([
                'b.id',
                'b.booking_no',
                'b.booking_status',
                'b.booking_source',
                'b.event_title',
                'b.event_type',
                'b.event_details',
                'b.guest_count',
                'b.total_amount',
                'b.booked_at',

                'u.id as user_id',
                'u.name as customer_name',
                'u.email as customer_email',
                'u.phone as customer_phone',
                'u.status as user_status',

                'c.id as customer_id',
                'c.address as customer_address',

                'bs.id as booking_slot_id',
                'bs.slot_date',
                'bs.slot_status',

                'h.name as hall_name',
                's.name as shift_name',
                's.start_time',
                's.end_time',
            ])
            ->get();

        return response()->json([
            'message' => 'Completed bookings loaded successfully.',
            'data' => [
                'filter' => [
                    'label' => $label,
                    'start_date' => $startDate->toDateTimeString(),
                    'end_date' => $endDate->toDateTimeString(),
                ],
                'bookings' => $bookings,
            ],
        ]);
    }

    private function authenticatedAdmin(Request $request): ?object
    {
        $token = $request->bearerToken();

        if (! $token) {
            return null;
        }

        return DB::table('users')
            ->where('api_token_hash', hash('sha256', $token))
            ->where('user_type', 'Super Admin')
            ->where('status', 'active')
            ->first();
    }

    private function resolveDateRange(Request $request): array
    {
        $unit = $request->query('unit', 'days');
        $count = (int) $request->query('count', 1);

        if ($count < 1) {
            $count = 1;
        }

        if ($count > 1000) {
            $count = 1000;
        }

        $allowedUnits = ['days', 'weeks', 'months', 'years'];

        if (! in_array($unit, $allowedUnits, true)) {
            $unit = 'days';
        }

        $endDate = Carbon::now($this->timezone)->endOfDay();

        if ($unit === 'days') {
            $startDate = Carbon::now($this->timezone)->subDays($count - 1)->startOfDay();
        } elseif ($unit === 'weeks') {
            $startDate = Carbon::now($this->timezone)->subWeeks($count)->startOfDay();
        } elseif ($unit === 'months') {
            $startDate = Carbon::now($this->timezone)->subMonths($count)->startOfDay();
        } else {
            $startDate = Carbon::now($this->timezone)->subYears($count)->startOfDay();
        }

        return [$startDate, $endDate, "Last {$count} {$unit}"];
    }

    private function countCompletedBetween(Carbon $startDate, Carbon $endDate): int
    {
        return DB::table('bookings')
            ->whereNotNull('booked_at')
            ->whereNotIn('booking_status', ['pending', 'cancelled'])
            ->whereBetween('booked_at', [$startDate, $endDate])
            ->count();
    }
}