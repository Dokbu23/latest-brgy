<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginUserRequest;
use App\Http\Requests\Api\V1\RegisterUserRequest;
use App\Models\User;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

//php artisan make:controller Api/V1/AuthController
class AuthController extends Controller
{
    use ApiResponses;
    public function login(LoginUserRequest $request)
    {
        $request->validated($request->all());

        if (!Auth::attempt($request->only('email', 'password'))) {
            return $this->error('Invalid credentials', 401);
        }

        $user = Auth::user();
        
        // Session is created by Auth::attempt, regenerate for security
        $request->session()->regenerate();
        
        return $this->ok('Authenticated', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ]);
    }
        // $user = User::where('email', $request->email)->first();

        // if (! $user || ! Hash::check($request->password, $user->password)) {
        //     return response()->json(['message' => 'Invalid credentials'], 401);
        // }

        // $token = $user->createToken('api-token')->plainTextToken;

        // return response()->json([
        //     'token' => $token,
        //     'user' => $user,
        // ]);

        // $credentials = $request->validate([
        //     'email' => ['required', 'email'],
        //     'password' => ['required'],
        // ]);

        // if (Auth::attempt($credentials)) {
        //     $request->session()->regenerate();
        //     return response()->json([
        //         'message' => 'Authenticated',
        //         'user' => Auth::user(),
        //     ]);
        // }

        // return response()->json(['message' => 'Invalid credentials'], 401);
    
    // $user = User::firstWhere('email', $request->email);

    // $token = $user->createToken('auth_token')->plainTextToken;

    // cookie()->queue('auth_token', $token, 60 * 24 * 30, '/', null, true, true);

    // return $this->ok('Authenticated', ['user' => $user]);


    public function logout(Request $request)
    {
        // Invalidate session for cookie-based auth
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->ok('Logged out successfully');
    }

    public function register(RegisterUserRequest $request)
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        return $this->ok(
            'User registered successfully',
        );
    }



    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
