<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginUserRequest;
use App\Http\Requests\Api\V1\RegisterUserRequest;
use App\Http\Requests\Api\V1\RegisterResidentRequest;
use App\Models\User;
use App\Models\HrCompany;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

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
        
        $token = $user->createToken('api-token')->plainTextToken;

        $hr = HrCompany::where('user_id', $user->id)->first();
        return $this->ok('Login successful', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'resident',
                'barangay' => $user->barangay,
                'phone' => $user->phone,
                'address' => $user->address,
                'avatar' => $user->avatar ?? null,
                'hr_company' => $hr ? ['id' => $hr->id, 'name' => $hr->name, 'verified' => (bool)$hr->verified] : null,
            ],
            'token' => $token,
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

        $token = $user->createToken('api-token')->plainTextToken;

        return $this->ok('Registration successful', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'barangay' => $user->barangay,
                'phone' => $user->phone,
                'address' => $user->address,
                'avatar' => $user->avatar ?? null,
            ],
            'token' => $token,
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

        $token = $user->createToken('api-token')->plainTextToken;

        $hr = HrCompany::where('user_id', $user->id)->first();
        return $this->ok('Resident registration successful', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'barangay' => $user->barangay,
                'phone' => $user->phone,
                'address' => $user->address,
                'avatar' => $user->avatar ?? null,
                'hr_company' => $hr ? ['id' => $hr->id, 'name' => $hr->name, 'verified' => (bool)$hr->verified] : null,
            ],
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return $this->ok('Logged out successfully');
    }

    public function user(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->error('Not authenticated', 401);
        }

        $hr = HrCompany::where('user_id', $user->id)->first();
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
                'avatar' => $user->avatar ?? null,
                'hr_company' => $hr ? ['id' => $hr->id, 'name' => $hr->name, 'verified' => (bool)$hr->verified] : null,
            ]
        ]);
    }

    /**
     * Upload avatar for authenticated user.
     */
    public function uploadAvatar(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Not authenticated', 401);
        }

        $validated = $request->validate([
            'avatar' => 'required|image|max:2048',
        ]);

        /** @var UploadedFile $file */
        $file = $request->file('avatar');
        $path = $file->store('avatars', 'public');

        // Build accessible URL
        $url = Storage::url($path);

        // Save to user and return
        $user->avatar = $url;
        $user->save();

        return $this->ok('Avatar uploaded', [
            'avatar_url' => $url,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'barangay' => $user->barangay,
                'phone' => $user->phone,
                'address' => $user->address,
                'avatar' => $user->avatar,
            ]
        ]);
    }

    /**
     * Update authenticated user's profile.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Not authenticated', 401);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'barangay' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'birthdate' => 'nullable|date',
        ]);

        $user->fill($validated);
        $user->save();

        $hr = HrCompany::where('user_id', $user->id)->first();
        return $this->ok('Profile updated', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'resident',
                'barangay' => $user->barangay,
                'phone' => $user->phone,
                'address' => $user->address,
                'birthdate' => $user->birthdate,
                'avatar' => $user->avatar ?? null,
                'hr_company' => $hr ? ['id' => $hr->id, 'name' => $hr->name, 'verified' => (bool)$hr->verified] : null,
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
            'role' => 'hr',
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
                'avatar' => $user->avatar ?? null,
            ]
        ]);
    }

    /**
     * Admin-only: create a Secretary account (role 'secretary').
     */
    public function createSecretary(Request $request)
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
            'role' => 'secretary',
            'barangay' => $validated['barangay'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        return $this->ok('Secretary account created', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar ?? null,
            ]
        ]);
    }

    /**
     * Admin-only: get all accounts (residents, secretaries, HR managers, admins).
     */
    public function allAccounts(Request $request)
    {
        $authUser = $request->user();
        if (!$authUser || ($authUser->role ?? '') !== 'admin') {
            return $this->error('Forbidden: insufficient permissions', 403);
        }

        $users = User::select('id', 'name', 'email', 'role', 'phone', 'barangay', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->ok('All accounts', $users);
    }

    /**
     * Admin-only: update an account (name, role, phone, barangay, etc.).
     */
    public function updateAccount(Request $request, $id)
    {
        $authUser = $request->user();
        if (!$authUser || ($authUser->role ?? '') !== 'admin') {
            return $this->error('Forbidden: insufficient permissions', 403);
        }

        $user = User::find($id);
        if (!$user) {
            return $this->error('User not found', 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'role' => 'sometimes|in:resident,secretary,hr,admin',
            'phone' => 'sometimes|nullable|string|max:50',
            'barangay' => 'sometimes|nullable|string|max:255',
            'address' => 'sometimes|nullable|string',
        ]);

        $user->fill($validated);
        $user->save();

        return $this->ok('Account updated', $user);
    }

    /**
     * Admin-only: delete an account.
     */
    public function deleteAccount(Request $request, $id)
    {
        $authUser = $request->user();
        if (!$authUser || ($authUser->role ?? '') !== 'admin') {
            return $this->error('Forbidden: insufficient permissions', 403);
        }

        $user = User::find($id);
        if (!$user) {
            return $this->error('User not found', 404);
        }

        // Prevent deleting the authenticated admin
        if ($user->id === $authUser->id) {
            return $this->error('Cannot delete your own account', 400);
        }

        $user->delete();

        return $this->ok('Account deleted');
    }
}