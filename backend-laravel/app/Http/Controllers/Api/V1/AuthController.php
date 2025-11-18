<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginUserRequest;
use App\Http\Requests\Api\V1\RegisterUserRequest;
use App\Http\Requests\Api\V1\RegisterResidentRequest;
use App\Models\User;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponses;

    public function login(LoginUserRequest $request)
    {
        $credentials = $request->validated();

        if (!Auth::attempt($credentials)) {
            return $this->error('Invalid credentials', 401);
        }

        $user = Auth::user();
        
        // Regenerate session for security
        $request->session()->regenerate();

        return $this->ok('Login successful', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'resident',
                'barangay' => $user->barangay,
                'phone' => $user->phone,
                'address' => $user->address,
            ]
        ]);
    }

    public function register(RegisterUserRequest $request)
    {
        $data = $request->validated();
        // Force public registrations to be residents only — disallow creating admin or other privileged roles
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'resident',
            // Use null coalescing for optional fields to avoid undefined array key notices
            'barangay' => $data['barangay'] ?? null,
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'birthdate' => $data['birthdate'] ?? null,
        ]);

        // Auto-login after registration
        Auth::login($user);
        $request->session()->regenerate();

        return $this->ok('Registration successful', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'barangay' => $user->barangay,
                'phone' => $user->phone,
                'address' => $user->address,
            ]
        ]);
    }

    /**
     * Register a resident (public-facing registration for residents only).
     */
    public function registerResident(RegisterResidentRequest $request)
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'resident',
            'barangay' => $data['barangay'] ?? null,
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'birthdate' => $data['birthdate'] ?? null,
        ]);

        // Auto-login after registration
        Auth::login($user);
        $request->session()->regenerate();

        return $this->ok('Resident registration successful', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'barangay' => $user->barangay,
                'phone' => $user->phone,
                'address' => $user->address,
            ]
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->ok('Logged out successfully');
    }

    public function user(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->error('Not authenticated', 401);
        }

        return $this->ok('User data', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'resident',
                'barangay' => $user->barangay,
                'phone' => $user->phone,
                'address' => $user->address,
                'birthdate' => $user->birthdate,
            ]
        ]);
    }

    /**
     * Admin-only: create an HR Manager account (hr_manager role).
     * Only users with role 'admin' can create HR manager accounts.
     */
    public function createHrManager(Request $request)
    {
        $authUser = $request->user();
        if (!$authUser || ($authUser->role ?? '') !== 'admin') {
            return $this->error('Forbidden: insufficient permissions', 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'barangay' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'hr_manager',
            'barangay' => $validated['barangay'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        return $this->ok('HR Manager created', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'barangay' => $user->barangay,
            ]
        ]);
    }
}