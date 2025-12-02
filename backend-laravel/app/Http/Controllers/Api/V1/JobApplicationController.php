<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\Notification;
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
            $apps = JobApplication::where('job_listing_id', $job->id)
                ->with(['user' => function($query) {
                    $query->select('id', 'name', 'email', 'phone', 'address', 'birthdate', 'avatar', 'barangay');
                }, 'user.skills', 'user.employmentRecords'])
                ->get();
            return response()->json(['status' => 'success', 'data' => $apps]);
        }

        // allow if user owns the hr company for this job
        $hr = \App\Models\HrCompany::where('user_id', $user->id)->first();
        if ($hr && $job->hr_company_id && $job->hr_company_id == $hr->id) {
            $apps = JobApplication::where('job_listing_id', $job->id)
                ->with(['user' => function($query) {
                    $query->select('id', 'name', 'email', 'phone', 'address', 'birthdate', 'avatar', 'barangay');
                }, 'user.skills', 'user.employmentRecords'])
                ->get();
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
            
            // Send notification to the resident
            try {
                $resident = $app->user;
                if ($resident) {
                    Notification::create([
                        'type' => 'job_application_accepted',
                        'notifiable_type' => 'App\\Models\\User',
                        'notifiable_id' => $resident->id,
                        'data' => [
                            'title' => 'Application Accepted',
                            'message' => "Congratulations! Your application for {$job->title} position has been accepted. Please wait for further instructions regarding the interview schedule.",
                            'job_id' => $job->id,
                            'job_title' => $job->title,
                            'application_id' => $app->id
                        ],
                        'read_at' => null,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to create acceptance notification: ' . $e->getMessage());
            }
            
            return response()->json(['status' => 'success', 'data' => $app]);
        }

        // HR owning the job can accept
        $hr = \App\Models\HrCompany::where('user_id', $user->id)->first();
        if ($hr && $job && $job->hr_company_id == $hr->id) {
            $app->status = 'accepted';
            $app->save();
            
            // Send notification to the resident
            try {
                $resident = $app->user;
                if ($resident) {
                    Notification::create([
                        'type' => 'job_application_accepted',
                        'notifiable_type' => 'App\\Models\\User',
                        'notifiable_id' => $resident->id,
                        'data' => [
                            'title' => 'Application Accepted',
                            'message' => "Congratulations! Your application for {$job->title} position has been accepted. Please wait for further instructions regarding the interview schedule.",
                            'job_id' => $job->id,
                            'job_title' => $job->title,
                            'application_id' => $app->id
                        ],
                        'read_at' => null,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to create acceptance notification: ' . $e->getMessage());
            }
            
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
            
            // Send notification to the resident
            try {
                $resident = $app->user;
                if ($resident) {
                    Notification::create([
                        'type' => 'job_application_rejected',
                        'notifiable_type' => 'App\\Models\\User',
                        'notifiable_id' => $resident->id,
                        'data' => [
                            'title' => 'Application Not Selected',
                            'message' => "Unfortunately, your application for {$job->title} position has not been selected at this time. Thank you for your interest and we encourage you to apply for future opportunities.",
                            'job_id' => $job->id,
                            'job_title' => $job->title,
                            'application_id' => $app->id
                        ],
                        'read_at' => null,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to create rejection notification: ' . $e->getMessage());
            }
            
            return response()->json(['status' => 'success', 'data' => $app]);
        }

        $hr = \App\Models\HrCompany::where('user_id', $user->id)->first();
        if ($hr && $job && $job->hr_company_id == $hr->id) {
            $app->status = 'rejected';
            $app->save();
            
            // Send notification to the resident
            try {
                $resident = $app->user;
                if ($resident) {
                    Notification::create([
                        'type' => 'job_application_rejected',
                        'notifiable_type' => 'App\\Models\\User',
                        'notifiable_id' => $resident->id,
                        'data' => [
                            'title' => 'Application Not Selected',
                            'message' => "Unfortunately, your application for {$job->title} position has not been selected at this time. Thank you for your interest and we encourage you to apply for future opportunities.",
                            'job_id' => $job->id,
                            'job_title' => $job->title,
                            'application_id' => $app->id
                        ],
                        'read_at' => null,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to create rejection notification: ' . $e->getMessage());
            }
            
            return response()->json(['status' => 'success', 'data' => $app]);
        }

        return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
    }

    /**
     * Schedule interview for an applicant
     */
    public function scheduleInterview(Request $request, $jobId)
    {
        $user = $request->user();
        if (!$user) return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);

        $job = JobListing::find($jobId);
        if (!$job) return response()->json(['status' => 'error', 'message' => 'Job not found'], 404);

        // Check authorization
        $isAdmin = ($user->role ?? '') === 'admin';
        $hr = \App\Models\HrCompany::where('user_id', $user->id)->first();
        $isOwner = $hr && $job->hr_company_id == $hr->id;

        if (!$isAdmin && !$isOwner) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'job_application_id' => 'required|integer|exists:job_applications,id',
            'interview_date' => 'required|date',
            'interview_time' => 'required|string',
            'location' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $app = JobApplication::find($data['job_application_id']);
        if (!$app || $app->job_listing_id != $jobId) {
            return response()->json(['status' => 'error', 'message' => 'Applicant not found for this job'], 404);
        }

        $app->update([
            'interview_date' => $data['interview_date'],
            'interview_time' => $data['interview_time'],
            'interview_location' => $data['location'] ?? null,
            'interview_notes' => $data['notes'] ?? null,
        ]);

        // Send notification to the resident
        try {
            $resident = $app->user;
            if ($resident) {
                // Create a notification record
                Notification::create([
                    'type' => 'job_interview_scheduled',
                    'notifiable_type' => 'App\\Models\\User',
                    'notifiable_id' => $resident->id,
                    'data' => [
                        'title' => 'Interview Scheduled',
                        'message' => "Your interview for {$job->title} position has been scheduled for {$data['interview_date']} at {$data['interview_time']}",
                        'job_id' => $job->id,
                        'job_title' => $job->title,
                        'interview_date' => $data['interview_date'],
                        'interview_time' => $data['interview_time'],
                        'application_id' => $app->id
                    ],
                    'read_at' => null,
                ]);
            }
        } catch (\Exception $e) {
            // Log but don't fail the request if notification fails
            Log::error('Failed to create interview notification: ' . $e->getMessage());
        }

        return response()->json(['status' => 'success', 'data' => $app]);
    }

    /**
     * Get scheduled interviews for a job
     */
    public function getInterviews(Request $request, $jobId)
    {
        $user = $request->user();
        if (!$user) return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);

        $job = JobListing::find($jobId);
        if (!$job) return response()->json(['status' => 'error', 'message' => 'Job not found'], 404);

        // Check authorization
        $isAdmin = ($user->role ?? '') === 'admin';
        $hr = \App\Models\HrCompany::where('user_id', $user->id)->first();
        $isOwner = $hr && $job->hr_company_id == $hr->id;

        if (!$isAdmin && !$isOwner) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
        }

        $interviews = JobApplication::where('job_listing_id', $jobId)
            ->whereNotNull('interview_date')
            ->with('user')
            ->get();

        return response()->json(['status' => 'success', 'data' => $interviews]);
    }
}
