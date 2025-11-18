<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
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
}
