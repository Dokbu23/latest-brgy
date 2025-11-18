<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\JobListing;

class JobListingController extends Controller
{
    public function index()
    {
        $jobs = JobListing::orderBy('posted_at', 'desc')->orderBy('id', 'desc')->get();
        return response()->json(['status' => 'success', 'data' => $jobs]);
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'title' => 'required|string|max:255',
            'company' => 'required|string|max:255',
            'type' => 'nullable|string|max:100',
            'salary' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'urgent' => 'nullable|boolean',
        ]);

        $job = JobListing::create(array_merge($payload, [
            'status' => 'open',
            'posted_at' => now(),
        ]));

        return response()->json(['status' => 'success', 'data' => $job], 201);
    }

    public function destroy($id)
    {
        $job = JobListing::find($id);
        if ($job) $job->delete();
        return response()->json(['status' => 'success']);
    }
}
