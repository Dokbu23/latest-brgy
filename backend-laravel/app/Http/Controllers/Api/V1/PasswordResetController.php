<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponses;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class PasswordResetController extends Controller
{
    use ApiResponses;

    // Generate and store a reset token. In production you should email the token.
    public function sendResetToken(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return $this->error('If the email exists, a reset token will be sent.', 200);
        }

        $token = bin2hex(random_bytes(16));

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => $token, 'created_at' => Carbon::now()]
        );

        // NOTE: For dev/testing we return the token in the response. In production, email it instead.
        return $this->ok('Password reset token created', ['token' => $token]);
    }

    // Reset password using token
    public function reset(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $record = DB::table('password_reset_tokens')->where('email', $request->email)->first();

        if (! $record || ! hash_equals($record->token, $request->token)) {
            return $this->error('Invalid token', 400);
        }

        // Optional: check token expiry (e.g., 60 minutes)
        $created = Carbon::parse($record->created_at);
        if ($created->diffInMinutes(Carbon::now()) > 60) {
            return $this->error('Token expired', 400);
        }

        $user = User::where('email', $request->email)->first();
        if (! $user) {
            return $this->error('User not found', 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return $this->ok('Password has been reset');
    }
}
