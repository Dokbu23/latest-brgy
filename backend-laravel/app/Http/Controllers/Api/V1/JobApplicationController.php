<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\JobApplication;
use App\Models\JobListing;

class JobApplicationController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $data = $request->validate([
            'job_id' => 'required|integer|exists:job_listings,id',
            'cover_letter' => 'nullable|string',
        ]);

        $job = JobListing::find($data['job_id']);
        if (!$job) {
            return response()->json(['status' => 'error', 'message' => 'Job not found'], 404);
        }

        // Prevent duplicate applications by same user
        $exists = JobApplication::where('user_id', $user->id)->where('job_listing_id', $job->id)->first();
        if ($exists) {
            return response()->json(['status' => 'error', 'message' => 'Already applied'], 422);
        }

        $application = JobApplication::create([
            'user_id' => $user->id,
            'job_listing_id' => $job->id,
            'cover_letter' => $data['cover_letter'] ?? null,
        ]);

        return response()->json(['status' => 'success', 'data' => $application], 201);
    }

    /**
     * List current user's job applications
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $apps = JobApplication::where('user_id', $user->id)->with('jobListing')->get();
        return response()->json(['status' => 'success', 'data' => $apps]);
    }

    /**
     * List applicants for a given job (admin or HR owning the job)
     */
    public function applicants(Request $request, $jobId)
    {
        $user = $request->user();
        if (!$user) return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);

        $job = JobListing::find($jobId);
        if (!$job) return response()->json(['status' => 'error', 'message' => 'Job not found'], 404);

        // allow if admin
        if (($user->role ?? '') === 'admin') {
            $apps = JobApplication::where('job_listing_id', $job->id)->with('user')->get();
            return response()->json(['status' => 'success', 'data' => $apps]);
        }

        // allow if user owns the hr company for this job
        $hr = \App\Models\HrCompany::where('user_id', $user->id)->first();
        if ($hr && $job->hr_company_id && $job->hr_company_id == $hr->id) {
            $apps = JobApplication::where('job_listing_id', $job->id)->with('user')->get();
            return response()->json(['status' => 'success', 'data' => $apps]);
        }

        return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
    }

    /**
     * Accept an application
     */
    public function accept(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);

        $app = JobApplication::find($id);
        if (!$app) return response()->json(['status' => 'error', 'message' => 'Application not found'], 404);

        $job = $app->jobListing;

        // admin can accept
        if (($user->role ?? '') === 'admin') {
            $app->status = 'accepted';
            $app->save();
            return response()->json(['status' => 'success', 'data' => $app]);
        }

        // HR owning the job can accept
        $hr = \App\Models\HrCompany::where('user_id', $user->id)->first();
        if ($hr && $job && $job->hr_company_id == $hr->id) {
            $app->status = 'accepted';
            $app->save();
            return response()->json(['status' => 'success', 'data' => $app]);
        }

        return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
    }

    /**
     * Reject an application
     */
    public function reject(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);

        $app = JobApplication::find($id);
        if (!$app) return response()->json(['status' => 'error', 'message' => 'Application not found'], 404);

        $job = $app->jobListing;

        if (($user->role ?? '') === 'admin') {
            $app->status = 'rejected';
            $app->save();
            return response()->json(['status' => 'success', 'data' => $app]);
        }

        $hr = \App\Models\HrCompany::where('user_id', $user->id)->first();
        if ($hr && $job && $job->hr_company_id == $hr->id) {
            $app->status = 'rejected';
            $app->save();
            return response()->json(['status' => 'success', 'data' => $app]);
        }

        return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
    }
}
