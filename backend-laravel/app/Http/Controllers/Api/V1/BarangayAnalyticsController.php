<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\DocumentRequest;
use App\Models\BarangayMeeting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class BarangayAnalyticsController extends Controller
{
    /**
     * Get analytics data for barangay officials dashboard
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
            
            $barangay = $user->barangay;
            
            if (!$barangay) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User does not have a barangay assigned'
                ], 400);
            }

            // Document Requests Overview
            $totalRequests = DocumentRequest::whereHas('user', function($query) use ($barangay) {
                $query->where('barangay', $barangay);
            })->count();

            $pendingRequests = DocumentRequest::whereHas('user', function($query) use ($barangay) {
                $query->where('barangay', $barangay);
            })->where('status', 'pending')->count();

            $approvedRequests = DocumentRequest::whereHas('user', function($query) use ($barangay) {
                $query->where('barangay', $barangay);
            })->where('status', 'approved')->count();

            $rejectedRequests = DocumentRequest::whereHas('user', function($query) use ($barangay) {
                $query->where('barangay', $barangay);
            })->where('status', 'rejected')->count();

            // Residents Stats
            $totalResidents = User::where('barangay', $barangay)
                ->where('role', 'resident')
                ->count();

            $verifiedResidents = 0;
            $unverifiedResidents = 0;

            // Meetings Stats
            $totalMeetings = BarangayMeeting::where('barangay', $barangay)->count();
            
            $upcomingMeetings = BarangayMeeting::where('barangay', $barangay)
                ->where('date', '>=', Carbon::today())
                ->count();

            $pastMeetings = BarangayMeeting::where('barangay', $barangay)
                ->where('date', '<', Carbon::today())
                ->count();

            // Revenue Stats
            $totalRevenue = DocumentRequest::whereHas('user', function($query) use ($barangay) {
                $query->where('barangay', $barangay);
            })->where('is_paid', true)->sum('amount');

            $thisMonthRevenue = DocumentRequest::whereHas('user', function($query) use ($barangay) {
                $query->where('barangay', $barangay);
            })->where('is_paid', true)
                ->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->sum('amount');

            $lastMonthRevenue = DocumentRequest::whereHas('user', function($query) use ($barangay) {
                $query->where('barangay', $barangay);
            })->where('is_paid', true)
                ->whereMonth('created_at', Carbon::now()->subMonth()->month)
                ->whereYear('created_at', Carbon::now()->subMonth()->year)
                ->sum('amount');

            // Document Requests Trend (Last 7 Days)
            $requestsTrend = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $count = DocumentRequest::whereHas('user', function($query) use ($barangay) {
                    $query->where('barangay', $barangay);
                })->whereDate('created_at', $date)->count();
                
                $requestsTrend[] = [
                    'date' => $date->format('M d'),
                    'count' => $count
                ];
            }

            // Revenue Trend (Last 7 Days)
            $revenueTrend = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $dailyRevenue = DocumentRequest::whereHas('user', function($query) use ($barangay) {
                    $query->where('barangay', $barangay);
                })->whereDate('created_at', $date)
                    ->where('is_paid', true)
                    ->sum('amount');
                
                $revenueTrend[] = [
                    'date' => $date->format('M d'),
                    'amount' => (float) $dailyRevenue
                ];
            }

            // Requests by Document Type
            $allDocumentTypes = [
                'barangay_clearance' => 'Barangay Clearance',
                'certificate_of_indigency' => 'Certificate of Indigency',
                'certificate_of_residency' => 'Residency Certificate',
                'barangay_id' => 'Barangay ID',
                'other' => 'Other'
            ];

            $existingRequests = DocumentRequest::whereHas('user', function($query) use ($barangay) {
                $query->where('barangay', $barangay);
            })->select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->get()
                ->pluck('count', 'type')
                ->toArray();

            $requestsByType = [];
            foreach ($allDocumentTypes as $type => $label) {
                $requestsByType[] = [
                    'label' => $label,
                    'value' => $existingRequests[$type] ?? 0
                ];
            }

            // Requests by Status (Last 30 Days)
            $statusBreakdown = [
                [
                    'status' => 'Pending',
                    'count' => DocumentRequest::whereHas('user', function($query) use ($barangay) {
                        $query->where('barangay', $barangay);
                    })->where('status', 'pending')
                        ->where('created_at', '>=', Carbon::now()->subDays(30))
                        ->count()
                ],
                [
                    'status' => 'Approved',
                    'count' => DocumentRequest::whereHas('user', function($query) use ($barangay) {
                        $query->where('barangay', $barangay);
                    })->where('status', 'approved')
                        ->where('created_at', '>=', Carbon::now()->subDays(30))
                        ->count()
                ],
                [
                    'status' => 'Rejected',
                    'count' => DocumentRequest::whereHas('user', function($query) use ($barangay) {
                        $query->where('barangay', $barangay);
                    })->where('status', 'rejected')
                        ->where('created_at', '>=', Carbon::now()->subDays(30))
                        ->count()
                ]
            ];

            // Recent Document Requests
            $recentRequests = DocumentRequest::whereHas('user', function($query) use ($barangay) {
                $query->where('barangay', $barangay);
            })->with('user:id,name,email')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'type' => $this->formatDocumentType($item->type),
                        'status' => $item->status,
                        'amount' => (float) $item->amount,
                        'user_name' => $item->user->name ?? 'Unknown',
                        'created_at' => $item->created_at->format('M d, Y h:i A')
                    ];
                })
                ->toArray();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'overview' => [
                        'totalRequests' => $totalRequests,
                        'pending' => $pendingRequests,
                        'approved' => $approvedRequests,
                        'rejected' => $rejectedRequests
                    ],
                    'residents' => [
                        'total' => $totalResidents,
                        'verified' => $verifiedResidents,
                        'unverified' => $unverifiedResidents
                    ],
                    'meetings' => [
                        'total' => $totalMeetings,
                        'upcoming' => $upcomingMeetings,
                        'past' => $pastMeetings
                    ],
                    'revenue' => [
                        'total' => (float) $totalRevenue,
                        'thisMonth' => (float) $thisMonthRevenue,
                        'lastMonth' => (float) $lastMonthRevenue,
                        'change' => $lastMonthRevenue > 0 
                            ? (($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 
                            : 0
                    ],
                    'trends' => [
                        'requests' => $requestsTrend,
                        'revenue' => $revenueTrend
                    ],
                    'breakdown' => [
                        'byType' => $requestsByType,
                        'byStatus' => $statusBreakdown
                    ],
                    'recentRequests' => $recentRequests
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Barangay Analytics Error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);
            
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
            'barangay_id' => 'Barangay ID',
            'other' => 'Other',
        ];

        return $labels[$type] ?? ucwords(str_replace('_', ' ', $type));
    }
}
