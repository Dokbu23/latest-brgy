<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureSecretary
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? '') !== 'secretary') {
            // allow admin as well
            if (!($user && ($user->role ?? '') === 'admin')) {
                return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
            }
        }

        return $next($request);
    }
}
