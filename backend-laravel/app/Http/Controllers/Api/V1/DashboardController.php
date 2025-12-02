<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\JobListing;
use App\Models\Skill;
use App\Models\User;
use App\Models\DocumentRequest;

class DashboardController extends Controller
{
    public function statistics()
    {
        $skillsCount = Skill::count();
        $jobs = JobListing::orderBy('posted_at', 'desc')->limit(5)->get();

        $totalResidents = User::count();
        // For basic demo purposes we don't track employment in DB; set placeholders
        $employed = 0;
        $unemployed = 0;
        $employedPercentage = $totalResidents > 0 ? round(($employed / max(1, $totalResidents)) * 100, 1) : 0;

        $statistics = [
            'totalResidents' => $totalResidents,
            'employedResidents' => $employed,
            'unemployedResidents' => $unemployed,
            'activeJobs' => JobListing::count(),
            'registeredSkills' => $skillsCount,
            'newRegistrations' => 0,
            'pendingApplications' => 0,
        ];

        $recentActivities = [
            ['id' => 1, 'type' => 'job_posted', 'message' => 'New job posted', 'time' => '1 hour ago', 'icon' => '💼'],
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'statistics' => $statistics,
                'recentActivities' => $recentActivities,
                'employmentStats' => [
                    'employed' => $employed,
                    'unemployed' => $unemployed,
                    'employedPercentage' => $employedPercentage,
                ],
                'skillsData' => Skill::orderBy('count', 'desc')->get()->map(function($s){ return ['skill' => $s->skill, 'count' => $s->count]; }),
                'recentJobs' => $jobs,
            ]
        ]);
    }
    public function recentActivities()
    {
        // Get recent activities for the authenticated user
        $user = Auth::user();
    

        // For residents, show their job applications and general activities
        $activities = [];

        // Add some mock activities for demonstration
        $activities[] = [
            'id' => 1,
            'type' => 'welcome',
            'message' => 'Welcome to the Barangay Portal!',
            'time' => 'Just now',
            'icon' => '👋'
        ];

        $activities[] = [
            'id' => 2,
            'type' => 'profile_complete',
            'message' => 'Profile setup completed',
            'time' => '2 hours ago',
            'icon' => '✅'
        ];

        $activities[] = [
            'id' => 3,
            'type' => 'job_browse',
            'message' => 'Browsed available job listings',
            'time' => '1 day ago',
            'icon' => '🔍'
        ];

        // If user has applied to jobs, show those activities
        $jobApplications = \App\Models\JobApplication::where('user_id', $user->id)
            ->with('jobListing')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        foreach ($jobApplications as $application) {
            $activities[] = [
                'id' => 4 + $application->id,
                'type' => 'job_application',
                'message' => 'Applied for ' . ($application->jobListing ? $application->jobListing->title : 'a job'),
                'time' => $application->created_at->diffForHumans(),
                'icon' => '📝'
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $activities
        ]);
    }

    public function adminStats()
    {
        // Get comprehensive admin dashboard stats
        $residents = User::where('role', 'resident')->count();
        
        // Get employed residents (those with currently_working employment records)
        $employed = User::where('role', 'resident')
            ->whereHas('employmentRecords', function($query) {
                $query->where('currently_working', true);
            })->count();
        
        // Get seeking residents (those without current employment)
        $seeking = User::where('role', 'resident')
            ->whereDoesntHave('employmentRecords', function($query) {
                $query->where('currently_working', true);
            })->count();
        
        $jobs = JobListing::count();
        $applications = \App\Models\JobApplication::count();
        $documentRequests = DocumentRequest::count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'residents' => $residents,
                'employed' => $employed,
                'seeking' => $seeking,
                'jobs' => $jobs,
                'applications' => $applications,
                'document_requests' => $documentRequests,
            ]
        ]);
    }

    public function adminActivities()
    {
        $activities = [];

        // Get recent document requests
        $recentDocuments = DocumentRequest::orderBy('created_at', 'desc')->limit(3)->get();
        foreach ($recentDocuments as $doc) {
            $activities[] = [
                'id' => 'doc-' . $doc->id,
                'icon' => '📝',
                'title' => 'New Document Request',
                'description' => $doc->document_type . ' request created',
                'time' => $doc->created_at->diffForHumans(),
                'timestamp' => $doc->created_at->timestamp,
            ];
        }

        // Get recent job applications
        $recentApplications = \App\Models\JobApplication::orderBy('created_at', 'desc')->limit(2)->get();
        foreach ($recentApplications as $app) {
            $activities[] = [
                'id' => 'app-' . $app->id,
                'icon' => '💼',
                'title' => 'New Job Application',
                'description' => 'Application submitted for ' . ($app->jobListing->title ?? 'a position'),
                'time' => $app->created_at->diffForHumans(),
                'timestamp' => $app->created_at->timestamp,
            ];
        }

        // Get recently created users
        $recentUsers = User::orderBy('created_at', 'desc')->limit(2)->get();
        foreach ($recentUsers as $user) {
            $activities[] = [
                'id' => 'user-' . $user->id,
                'icon' => '👤',
                'title' => 'New User Registered',
                'description' => $user->name . ' created an account',
                'time' => $user->created_at->diffForHumans(),
                'timestamp' => $user->created_at->timestamp,
            ];
        }

        // Sort activities by timestamp
        usort($activities, function($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });

        // Remove timestamp and limit to 5 most recent
        $activities = array_slice($activities, 0, 5);
        foreach ($activities as &$activity) {
            unset($activity['timestamp']);
        }

        return response()->json([
            'status' => 'success',
            'data' => $activities
        ]);
    }
}
