<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\DocumentRequest;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SecretaryAnalyticsController extends Controller
{
    /**
     * Get analytics data for secretary dashboard
     */
    public function index()
    {
        try {
            // All Document Requests Stats
            $totalRequests = DocumentRequest::count();
            $pendingRequests = DocumentRequest::where('status', 'pending')->count();
            $approvedRequests = DocumentRequest::where('status', 'approved')->count();
            $rejectedRequests = DocumentRequest::where('status', 'rejected')->count();

            // Payment/Sales Stats
            $totalPaidRequests = DocumentRequest::where('is_paid', true)->where('amount', '>', 0)->count();
            $totalRevenue = DocumentRequest::where('is_paid', true)->sum('amount');
            $freeRequests = DocumentRequest::where('amount', 0)->count();
            $paidRequests = DocumentRequest::where('amount', '>', 0)->count();

            // Revenue Trend (Last 7 Days)
            $revenueTrend = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $dailyRevenue = DocumentRequest::whereDate('created_at', $date)
                    ->where('is_paid', true)
                    ->sum('amount');
                $revenueTrend[] = [
                    'date' => $date->format('M d'),
                    'amount' => (float) $dailyRevenue
                ];
            }

            // Requests Trend (Last 7 Days)
            $requestsTrend = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $count = DocumentRequest::whereDate('created_at', $date)->count();
                $requestsTrend[] = [
                    'date' => $date->format('M d'),
                    'count' => $count
                ];
            }

            // Requests by Document Type - Show all types with zero values
            $allDocumentTypes = [
                'barangay_clearance' => 'Barangay Clearance',
                'certificate_of_indigency' => 'Certificate of Indigency',
                'certificate_of_residency' => 'Residency Certificate',
                'barangay_id' => 'Barangay ID',
                'other' => 'Other'
            ];

            $existingRequests = DocumentRequest::select('type', DB::raw('count(*) as count'))
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

            // Top Requesters
            $topRequesters = DocumentRequest::select('user_id', DB::raw('count(*) as request_count'))
                ->groupBy('user_id')
                ->orderBy('request_count', 'desc')
                ->limit(5)
                ->with('user:id,name,email')
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => $item->user->name ?? 'Unknown',
                        'email' => $item->user->email ?? '',
                        'count' => $item->request_count
                    ];
                })
                ->toArray();

            // Payment Stats by Type - Show all types with zero values
            $existingPayments = DocumentRequest::select('type', DB::raw('sum(amount) as total_amount'), DB::raw('count(*) as count'))
                ->where('amount', '>', 0)
                ->groupBy('type')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [$item->type => [
                        'revenue' => (float) $item->total_amount,
                        'count' => $item->count
                    ]];
                })
                ->toArray();

            $paymentByType = [];
            foreach ($allDocumentTypes as $type => $label) {
                $paymentByType[] = [
                    'label' => $label,
                    'revenue' => $existingPayments[$type]['revenue'] ?? 0.0,
                    'count' => $existingPayments[$type]['count'] ?? 0
                ];
            }

            // Recent Paid Requests
            $recentPaidRequests = DocumentRequest::where('amount', '>', 0)
                ->with('user:id,name,email')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'type' => $this->formatDocumentType($item->type),
                        'amount' => (float) $item->amount,
                        'user_name' => $item->user->name ?? 'Unknown',
                        'created_at' => $item->created_at->format('M d, Y'),
                        'status' => $item->status
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
                    'sales' => [
                        'totalRevenue' => (float) $totalRevenue,
                        'totalPaidRequests' => $totalPaidRequests,
                        'freeRequests' => $freeRequests,
                        'paidRequests' => $paidRequests,
                        'averagePerRequest' => $paidRequests > 0 ? (float) ($totalRevenue / $paidRequests) : 0
                    ],
                    'trends' => [
                        'revenue' => $revenueTrend,
                        'requests' => $requestsTrend
                    ],
                    'breakdown' => [
                        'byType' => $requestsByType,
                        'paymentByType' => $paymentByType
                    ],
                    'topRequesters' => $topRequesters,
                    'recentPaidRequests' => $recentPaidRequests
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
            'other' => 'Other',
        ];

        return $labels[$type] ?? ucwords(str_replace('_', ' ', $type));
    }
}
