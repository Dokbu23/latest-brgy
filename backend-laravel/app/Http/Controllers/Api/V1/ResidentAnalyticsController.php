<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\DocumentRequest;
use App\Models\JobListing;
use App\Models\JobApplication;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ResidentAnalyticsController extends Controller
{
    /**
     * Get analytics data for the authenticated resident
     */
    public function index()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated'
                ], 401);
            }

            // My Document Requests
            $myRequests = DocumentRequest::where('user_id', $user->id);
            $totalRequests = $myRequests->count();
            $pendingRequests = (clone $myRequests)->where('status', 'pending')->count();
            $approvedRequests = (clone $myRequests)->where('status', 'approved')->count();
            $rejectedRequests = (clone $myRequests)->where('status', 'rejected')->count();

            // Document requests trend (last 7 days)
            $recentTrend = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $count = DocumentRequest::where('user_id', $user->id)
                    ->whereDate('created_at', $date)
                    ->count();
                $recentTrend[] = [
                    'date' => $date->format('M d'),
                    'count' => $count
                ];
            }

            // My Job Applications
            $myApplications = JobApplication::where('user_id', $user->id);
            $totalApplications = $myApplications->count();
            $pendingApplications = (clone $myApplications)->where('status', 'pending')->count();
            $acceptedApplications = (clone $myApplications)->where('status', 'accepted')->count();
            $rejectedApplications = (clone $myApplications)->where('status', 'rejected')->count();

            // Community Stats
            $totalPopulation = User::where('role', 'resident')->count();
            $totalJobs = JobListing::count();
            $activeJobs = JobListing::where('is_active', true)->count();

            // My Requests by Document Type
            $requestsByType = DocumentRequest::where('user_id', $user->id)
                ->select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->orderBy('count', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'label' => $this->formatDocumentType($item->type),
                        'value' => $item->count
                    ];
                })
                ->toArray();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'myRequests' => [
                        'total' => $totalRequests,
                        'pending' => $pendingRequests,
                        'approved' => $approvedRequests,
                        'rejected' => $rejectedRequests,
                        'recentTrend' => $recentTrend
                    ],
                    'myApplications' => [
                        'total' => $totalApplications,
                        'pending' => $pendingApplications,
                        'accepted' => $acceptedApplications,
                        'rejected' => $rejectedApplications
                    ],
                    'communityStats' => [
                        'totalPopulation' => $totalPopulation,
                        'totalJobs' => $totalJobs,
                        'activeJobs' => $activeJobs
                    ],
                    'requestsByType' => $requestsByType
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch analytics data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format document type for display
     */
    private function formatDocumentType($type)
    {
        $labels = [
            'barangay_clearance' => 'Barangay Clearance',
            'certificate_indigency' => 'Certificate of Indigency',
            'certificate_of_indigency' => 'Certificate of Indigency',
            'residency_cert' => 'Residency Certificate',
            'certificate_of_residency' => 'Residency Certificate',
            'good_moral' => 'Good Moral',
            'good_moral_certificate' => 'Good Moral',
            'business_permit' => 'Business Permit',
            'other' => 'Other',
        ];

        return $labels[$type] ?? ucwords(str_replace('_', ' ', $type));
    }
}
