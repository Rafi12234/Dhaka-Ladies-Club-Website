<?php

use App\Http\Controllers\Api\BookingContextController;
use App\Http\Controllers\Api\BookingHoldController;
use App\Http\Controllers\Api\CalendarSlotController;
use App\Http\Controllers\Api\PaymentController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminDashboardController;

Route::middleware('throttle:60,1')->group(function () {
    Route::get('/booking-context', [BookingContextController::class, 'index'])
        ->name('api.booking-context');

    Route::get('/calendar-slots', [CalendarSlotController::class, 'index'])
        ->name('api.calendar-slots');
    Route::get('/calendar-availability', [CalendarSlotController::class, 'availability'])
        ->name('api.calendar-availability');
});

Route::middleware('throttle:20,1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register'])
        ->name('api.auth.register');

    Route::post('/auth/login', [AuthController::class, 'login'])
        ->name('api.auth.login');

    Route::get('/auth/me', [AuthController::class, 'me'])
        ->name('api.auth.me');

    Route::post('/auth/logout', [AuthController::class, 'logout'])
        ->name('api.auth.logout');
});

Route::post('/booking-holds', [BookingHoldController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('api.booking-holds.store');

Route::post('/booking-holds/release', [BookingHoldController::class, 'release'])
    ->middleware('throttle:10,1')
    ->name('api.booking-holds.release');

Route::post('/payments/process', [PaymentController::class, 'process'])
    ->middleware('throttle:5,1')
    ->name('api.payments.process');

Route::fallback(function () {
    return response()->json([
        'message' => 'API route not found.',
    ], 404);
});
Route::prefix('admin')->middleware('throttle:30,1')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login'])
        ->name('api.admin.login');

    Route::get('/me', [AdminAuthController::class, 'me'])
        ->name('api.admin.me');

    Route::post('/logout', [AdminAuthController::class, 'logout'])
        ->name('api.admin.logout');

    Route::get('/dashboard', [AdminDashboardController::class, 'dashboard'])
        ->name('api.admin.dashboard');

    Route::get('/completed-bookings', [AdminDashboardController::class, 'completedBookings'])
        ->name('api.admin.completed-bookings');
});