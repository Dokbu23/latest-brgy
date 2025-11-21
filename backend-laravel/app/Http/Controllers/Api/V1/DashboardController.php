<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\JobListing;
use App\Models\Skill;
use App\Models\User;

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
}
