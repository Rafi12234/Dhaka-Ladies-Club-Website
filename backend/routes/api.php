<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminManualBookingController;
use App\Http\Controllers\Api\BookingContextController;
use App\Http\Controllers\Api\BookingHoldController;
use App\Http\Controllers\Api\CalendarSlotController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\HomepageContentController;
use App\Http\Controllers\Api\PaymentController;

/*
|--------------------------------------------------------------------------
| Public Website APIs
|--------------------------------------------------------------------------
| These APIs are needed by normal visitors. Do not protect these with auth,
| otherwise homepage, calendar, and booking page will stop loading.
*/

Route::middleware('throttle:60,1')->group(function () {
    Route::get('/homepage-content', [HomepageContentController::class, 'show'])
        ->name('api.homepage-content.show');

    Route::get('/booking-context', [BookingContextController::class, 'index'])
        ->name('api.booking-context');

    Route::get('/calendar-slots', [CalendarSlotController::class, 'index'])
        ->name('api.calendar-slots');

    Route::get('/calendar-availability', [CalendarSlotController::class, 'availability'])
        ->name('api.calendar-availability');
});

/*
|--------------------------------------------------------------------------
| Public Customer Authentication APIs
|--------------------------------------------------------------------------
| Register and login must remain public.
*/

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:20,1')
        ->name('api.auth.register');

    Route::post('/login', [CustomerAuthController::class, 'login'])
        ->middleware('throttle:20,1')
        ->name('api.auth.login');
});

/*
|--------------------------------------------------------------------------
| Protected Customer APIs
|--------------------------------------------------------------------------
| These APIs must require login because they show/update customer data.
*/

Route::prefix('auth')
    ->middleware(['auth:sanctum'])
    ->group(function () {
        Route::get('/me', [CustomerAuthController::class, 'me'])
            ->middleware('throttle:60,1')
            ->name('api.auth.me');

        Route::get('/panel', [CustomerAuthController::class, 'panel'])
            ->middleware('throttle:60,1')
            ->name('api.auth.panel');

        Route::patch('/profile', [CustomerAuthController::class, 'updateProfile'])
            ->middleware('throttle:20,1')
            ->name('api.auth.profile.update');

        Route::patch('/bookings/{bookingId}', [CustomerAuthController::class, 'updateBooking'])
            ->middleware('throttle:20,1')
            ->name('api.auth.bookings.update');

        Route::post('/change-password', [CustomerAuthController::class, 'changePassword'])
            ->middleware('throttle:20,1')
            ->name('api.auth.change-password');

        Route::post('/logout', [CustomerAuthController::class, 'logout'])
            ->middleware('throttle:20,1')
            ->name('api.auth.logout');
    });

/*
|--------------------------------------------------------------------------
| Booking Hold + Payment APIs
|--------------------------------------------------------------------------
| These remain public because guests can book. Security is handled by
| throttling, validation, booking_id, hold_token, and backend checks.
*/

Route::post('/booking-holds', [BookingHoldController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('api.booking-holds.store');

Route::post('/booking-holds/release', [BookingHoldController::class, 'release'])
    ->middleware('throttle:10,1')
    ->name('api.booking-holds.release');

Route::post('/payments/process', [PaymentController::class, 'process'])
    ->middleware('throttle:5,1')
    ->name('api.payments.process');

/*
|--------------------------------------------------------------------------
| Public Admin Login API
|--------------------------------------------------------------------------
| Admin login must remain public, otherwise admin cannot log in.
*/

Route::post('/admin/login', [AdminAuthController::class, 'login'])
    ->middleware('throttle:10,1')
    ->name('api.admin.login');

/*
|--------------------------------------------------------------------------
| Protected Admin APIs
|--------------------------------------------------------------------------
| These APIs must be protected because they expose bookings, customer info,
| dashboard data, approval/rejection actions, manual booking, and website CMS.
*/

Route::prefix('admin')
    ->middleware(['auth:sanctum', 'throttle:30,1'])
    ->group(function () {
        Route::get('/me', [AdminAuthController::class, 'me'])
            ->name('api.admin.me');

        Route::post('/logout', [AdminAuthController::class, 'logout'])
            ->name('api.admin.logout');

        Route::get('/dashboard', [AdminDashboardController::class, 'dashboard'])
            ->name('api.admin.dashboard');

        Route::get('/bookings', [AdminDashboardController::class, 'bookings'])
            ->name('api.admin.bookings');

        Route::post('/bookings/{id}/approve', [AdminDashboardController::class, 'approveBooking'])
            ->name('api.admin.bookings.approve');

        Route::post('/bookings/{id}/reject', [AdminDashboardController::class, 'rejectBooking'])
            ->name('api.admin.bookings.reject');

        Route::post('/manual-bookings', [AdminManualBookingController::class, 'store'])
            ->middleware('throttle:20,1')
            ->name('api.admin.manual-bookings.store');

        /*
        |--------------------------------------------------------------------------
        | Protected Admin Homepage Content APIs
        |--------------------------------------------------------------------------
        */

        Route::prefix('homepage-content')->group(function () {
            Route::get('/', [HomepageContentController::class, 'adminShow'])
                ->name('api.admin.homepage-content.show');

            Route::put('/', [HomepageContentController::class, 'update'])
                ->name('api.admin.homepage-content.update');

            Route::get('/gallery-files', [HomepageContentController::class, 'listGalleryFiles'])
                ->name('api.admin.homepage-content.gallery-files');

            Route::post('/upload-section-image', [HomepageContentController::class, 'uploadSectionImage'])
                ->name('api.admin.homepage-content.upload-section-image');

            Route::post('/gallery/upload', [HomepageContentController::class, 'uploadGalleryImages'])
                ->name('api.admin.homepage-content.gallery.upload');

            Route::post('/gallery/select', [HomepageContentController::class, 'selectGalleryImages'])
                ->name('api.admin.homepage-content.gallery.select');

            Route::delete('/gallery/file', [HomepageContentController::class, 'deleteGalleryFile'])
                ->name('api.admin.homepage-content.gallery.delete-file');
        });
    });

/*
|--------------------------------------------------------------------------
| API Fallback
|--------------------------------------------------------------------------
*/

Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'API route not found.',
    ], 404);
});