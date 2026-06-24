<?php

use App\Http\Controllers\Api\BookingContextController;
use App\Http\Controllers\Api\BookingHoldController;
use App\Http\Controllers\Api\CalendarSlotController;
use App\Http\Controllers\Api\PaymentController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminManualBookingController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\HomepageContentController;


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


Route::prefix('admin')->middleware('throttle:30,1')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login'])
        ->name('api.admin.login');

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
});
Route::prefix('auth')->group(function () {
    Route::post('/login', [CustomerAuthController::class, 'login'])
        ->middleware('throttle:20,1');

    Route::post('/change-password', [CustomerAuthController::class, 'changePassword'])
        ->middleware('throttle:20,1');

    Route::get('/me', [CustomerAuthController::class, 'me'])
        ->middleware('throttle:60,1');

    Route::post('/logout', [CustomerAuthController::class, 'logout'])
        ->middleware('throttle:20,1');
    Route::get('/panel', [CustomerAuthController::class, 'panel'])
    ->middleware('throttle:60,1');

Route::patch('/profile', [CustomerAuthController::class, 'updateProfile'])
    ->middleware('throttle:20,1');

Route::patch('/bookings/{bookingId}', [CustomerAuthController::class, 'updateBooking'])
    ->middleware('throttle:20,1');
});

Route::get('/homepage-content', [HomepageContentController::class, 'show'])
    ->middleware('throttle:60,1')
    ->name('api.homepage-content.show');

Route::prefix('admin/homepage-content')->middleware('throttle:30,1')->group(function () {
    Route::get('/', [HomepageContentController::class, 'show'])
        ->name('api.admin.homepage-content.show');

    Route::put('/', [HomepageContentController::class, 'update'])
        ->name('api.admin.homepage-content.update');

    Route::post('/upload-image', [HomepageContentController::class, 'uploadImage'])
        ->name('api.admin.homepage-content.upload-image');

    Route::post('/gallery', [HomepageContentController::class, 'storeGalleryImage'])
        ->name('api.admin.homepage-content.gallery.store');

    Route::delete('/gallery/{imageId}', [HomepageContentController::class, 'deleteGalleryImage'])
        ->name('api.admin.homepage-content.gallery.delete');
});

Route::get('/homepage-content', [HomepageContentController::class, 'show'])
    ->middleware('throttle:60,1')
    ->name('api.homepage-content.show');

Route::prefix('admin/homepage-content')->middleware('throttle:30,1')->group(function () {
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

Route::fallback(function () {
    return response()->json([
        'message' => 'API route not found.',
    ], 404);
});