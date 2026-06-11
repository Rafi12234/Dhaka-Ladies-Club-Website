<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CustomerAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => ['nullable', 'string', 'max:150'],
            'email' => ['nullable', 'string', 'max:150'],
            'password' => ['required', 'string'],
        ]);

        $login = trim($validated['login'] ?? $validated['email'] ?? '');

        if ($login === '') {
            throw ValidationException::withMessages([
                'login' => ['Email or phone is required.'],
            ]);
        }

        $user = DB::table('users')
            ->where(function ($query) use ($login) {
                $query->where('email', $login)
                    ->orWhere('phone', $login);
            })
            ->where('user_type', 'customer')
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password_hash)) {
            return response()->json([
                'message' => 'Invalid login credentials.',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your account is not active. Please contact admin.',
            ], 403);
        }

        $plainToken = Str::random(80);

        DB::table('users')
            ->where('id', $user->id)
            ->update([
                'api_token_hash' => hash('sha256', $plainToken),
                'updated_at' => now(),
            ]);

        $mustChangePassword = (int) ($user->must_change_password ?? 0) === 1;

        return response()->json([
            'message' => $mustChangePassword
                ? 'Password change required.'
                : 'Login successful.',
            'data' => [
                'token' => $plainToken,
                'must_change_password' => $mustChangePassword,
                'redirect_to' => $mustChangePassword ? 'change-password.html' : 'index.html',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'user_type' => $user->user_type,
                    'status' => $user->status,
                    'must_change_password' => $mustChangePassword,
                ],
            ],
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = $this->authenticatedCustomer($request);

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated customer.',
            ], 401);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'max:100', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password_hash)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        if (Hash::check($validated['new_password'], $user->password_hash)) {
            return response()->json([
                'message' => 'New password must be different from current password.',
            ], 422);
        }

        $newToken = Str::random(80);

        DB::table('users')
            ->where('id', $user->id)
            ->update([
                'password_hash' => Hash::make($validated['new_password']),
                'must_change_password' => 0,
                'api_token_hash' => hash('sha256', $newToken),
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'Password changed successfully.',
            'data' => [
                'token' => $newToken,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'user_type' => $user->user_type,
                    'status' => $user->status,
                    'must_change_password' => false,
                ],
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $this->authenticatedCustomer($request);

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated customer.',
            ], 401);
        }

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'user_type' => $user->user_type,
                    'status' => $user->status,
                    'must_change_password' => (int) ($user->must_change_password ?? 0) === 1,
                ],
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $this->authenticatedCustomer($request);

        if ($user) {
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'api_token_hash' => null,
                    'updated_at' => now(),
                ]);
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    private function authenticatedCustomer(Request $request): ?object
    {
        $token = $request->bearerToken();

        if (! $token) {
            return null;
        }

        return DB::table('users')
            ->where('api_token_hash', hash('sha256', $token))
            ->where('user_type', 'customer')
            ->where('status', 'active')
            ->first();
    }
}