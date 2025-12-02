<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\HrCompany;

class EnsureHr
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        // HR users are those who have an HrCompany record
        $hr = HrCompany::where('user_id', $user->id)->first();
        if (!$hr) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
        }

        // attach hr to request for convenience
        $request->attributes->set('hr_company', $hr);

        return $next($request);
    }
}
