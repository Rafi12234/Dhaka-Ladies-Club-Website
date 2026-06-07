<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150'],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $existingUser = DB::table('users')
            ->where('email', $validated['email'])
            ->first();

        if ($existingUser) {
            return response()->json([
                'message' => 'Registration failed.',
                'error' => 'This email is already registered.',
            ], 422);
        }

        $now = now();

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password_hash' => Hash::make($validated['password']),
            'user_type' => 'customer',
            'status' => 'active',
        ];

        if (Schema::hasColumn('users', 'created_at')) {
            $userData['created_at'] = $now;
        }

        if (Schema::hasColumn('users', 'updated_at')) {
            $userData['updated_at'] = $now;
        }

        $userId = DB::table('users')->insertGetId($userData);

        $user = DB::table('users')->where('id', $userId)->first();

        $token = $this->issueToken($user->id);

        return response()->json([
            'message' => 'Registration successful.',
            'data' => [
                'token' => $token,
                'user' => $this->publicUser($user),
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = DB::table('users')
            ->where('email', $validated['email'])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password_hash)) {
            return response()->json([
                'message' => 'Login failed.',
                'error' => 'Invalid email or password.',
            ], 422);
        }

        if (($user->status ?? 'active') !== 'active') {
            return response()->json([
                'message' => 'Login failed.',
                'error' => 'Your account is not active.',
            ], 403);
        }

        $token = $this->issueToken($user->id);

        $freshUser = DB::table('users')->where('id', $user->id)->first();

        return response()->json([
            'message' => 'Login successful.',
            'data' => [
                'token' => $token,
                'user' => $this->publicUser($freshUser),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $this->authenticatedUser($request);

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        return response()->json([
            'message' => 'Authenticated user loaded successfully.',
            'data' => [
                'user' => $this->publicUser($user),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $this->authenticatedUser($request);

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

    private function issueToken(int $userId): string
    {
        $plainToken = Str::random(80);

        DB::table('users')
            ->where('id', $userId)
            ->update([
                'api_token_hash' => hash('sha256', $plainToken),
                'updated_at' => now(),
            ]);

        return $plainToken;
    }

    private function authenticatedUser(Request $request): ?object
    {
        $token = $request->bearerToken();

        if (! $token) {
            return null;
        }

        return DB::table('users')
            ->where('api_token_hash', hash('sha256', $token))
            ->where('status', 'active')
            ->first();
    }

    private function publicUser(object $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'user_type' => $user->user_type,
            'status' => $user->status,
        ];
    }
}