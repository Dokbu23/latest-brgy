<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\JobListing;

class JobListingController extends Controller
{
    public function index(Request $request)
    {
        $jobs = JobListing::orderBy('posted_at', 'desc')->orderBy('id', 'desc')->get();

        // If the request is authenticated, include a flag for whether the current user applied
        $user = $request->user();
        if ($user) {
            $applied = \App\Models\JobApplication::where('user_id', $user->id)
                ->pluck('job_listing_id')
                ->toArray();

            $jobs = $jobs->map(function ($job) use ($applied) {
                $jobArr = $job->toArray();
                $jobArr['applied_by_current_user'] = in_array($job->id, $applied);
                return $jobArr;
            });
        }

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
            'needed_applicants' => 'nullable|integer|min:1',
        ]);

        $user = $request->user();

        // Require authentication for creating job listings (ensures legacy 'posted_by' FK can be satisfied)
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $extra = [
            'status' => 'open',
            'posted_at' => now(),
        ];

        // Provide safe defaults for legacy columns in case the DB requires them
        $extra['location'] = $request->input('location', '');
        $extra['employment_type'] = $request->input('employment_type', '');
        $extra['requirements'] = $request->input('requirements', '');
        // If the authenticated user is HR, associate the job with their company
        if ($user && ($user->role ?? '') === 'barangay_official') {
            // keep existing barangay_official role behavior (allowed)
        }

        // If user owns an HrCompany, attach it
        $hr = \App\Models\HrCompany::where('user_id', $user->id)->first();
        if ($hr) {
            $extra['hr_company_id'] = $hr->id;
        }

        // For legacy schema compatibility, set posted_by to the authenticated user
        $extra['posted_by'] = $user->id;

        $job = JobListing::create(array_merge($payload, $extra));

        return response()->json(['status' => 'success', 'data' => $job], 201);
    }

    public function show($id)
    {
        $job = JobListing::find($id);
        if (!$job) {
            return response()->json(['status' => 'error', 'message' => 'Job not found'], 404);
        }
        return response()->json(['status' => 'success', 'data' => $job]);
    }

    public function destroy($id)
    {
        $job = JobListing::find($id);
        if ($job) $job->delete();
        return response()->json(['status' => 'success']);
    }

    public function close($id)
    {
        $job = JobListing::find($id);
        if (!$job) {
            return response()->json(['status' => 'error', 'message' => 'Job not found'], 404);
        }

        $job->update(['status' => 'filled']);
        return response()->json(['status' => 'success', 'data' => $job]);
    }
}
