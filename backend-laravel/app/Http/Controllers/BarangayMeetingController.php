<?php

namespace App\Http\Controllers;

use App\Models\BarangayMeeting;
use App\Models\User;
use App\Notifications\MeetingScheduledNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class BarangayMeetingController extends Controller
{
    /**
     * Display a listing of meetings
     */
    public function index(Request $request)
    {
        try {
            $query = BarangayMeeting::with('creator')
                ->orderBy('meeting_datetime', 'desc');

            // Filter by meeting type
            if ($request->has('type') && $request->type !== 'all') {
                $query->where('meeting_type', $request->type);
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter upcoming or past
            if ($request->has('filter')) {
                if ($request->filter === 'upcoming') {
                    $query->upcoming();
                } elseif ($request->filter === 'past') {
                    $query->past();
                }
            }

            $meetings = $query->get();

            return response()->json([
                'success' => true,
                'data' => $meetings
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch meetings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch meetings'
            ], 500);
        }
    }

    /**
     * Store a newly created meeting
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'meeting_type' => 'required|in:officials_only,public,residents,emergency',
                'target_sitio' => 'nullable|string|max:255',
                'meeting_datetime' => 'required|date|after:now',
                'location' => 'required|string|max:255',
                'agenda' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            $validated['created_by'] = Auth::id();
            $validated['status'] = 'scheduled';

            $meeting = BarangayMeeting::create($validated);

            // Send notifications based on meeting type
            $this->sendMeetingNotifications($meeting);

            return response()->json([
                'success' => true,
                'message' => 'Meeting scheduled successfully',
                'data' => $meeting->load('creator')
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to create meeting: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to schedule meeting'
            ], 500);
        }
    }

    /**
     * Display the specified meeting
     */
    public function show($id)
    {
        try {
            $meeting = BarangayMeeting::with(['creator', 'attendees'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $meeting
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Meeting not found'
            ], 404);
        }
    }

    /**
     * Update the specified meeting
     */
    public function update(Request $request, $id)
    {
        try {
            $meeting = BarangayMeeting::findOrFail($id);

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'meeting_type' => 'sometimes|required|in:officials_only,public,residents,emergency',
                'target_sitio' => 'nullable|string|max:255',
                'meeting_datetime' => 'sometimes|required|date',
                'location' => 'sometimes|required|string|max:255',
                'agenda' => 'nullable|string',
                'notes' => 'nullable|string',
                'status' => 'sometimes|in:scheduled,ongoing,completed,cancelled'
            ]);

            $oldMeetingType = $meeting->meeting_type;
            $meeting->update($validated);

            // If meeting type changed, send new notifications
            if (isset($validated['meeting_type']) && $validated['meeting_type'] !== $oldMeetingType) {
                $this->sendMeetingNotifications($meeting, true);
            }

            return response()->json([
                'success' => true,
                'message' => 'Meeting updated successfully',
                'data' => $meeting->load('creator')
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update meeting: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update meeting'
            ], 500);
        }
    }

    /**
     * Remove the specified meeting
     */
    public function destroy($id)
    {
        try {
            $meeting = BarangayMeeting::findOrFail($id);
            $meeting->delete();

            return response()->json([
                'success' => true,
                'message' => 'Meeting deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete meeting: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete meeting'
            ], 500);
        }
    }

    /**
     * Get upcoming meetings for the authenticated user
     */
    public function upcomingMeetings(Request $request)
    {
        try {
            $user = Auth::user();
            $query = BarangayMeeting::upcoming();

            // Filter based on user role
            if ($user->role === 'resident') {
                // Residents only see public meetings
                $query->publicMeetings();
            }

            $meetings = $query->get();

            return response()->json([
                'success' => true,
                'data' => $meetings
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch upcoming meetings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch upcoming meetings'
            ], 500);
        }
    }

    /**
     * Send notifications based on meeting type
     */
    private function sendMeetingNotifications(BarangayMeeting $meeting, $isUpdate = false)
    {
        try {
            $notificationData = [
                'meeting_id' => $meeting->id,
                'title' => $meeting->title,
                'meeting_type' => $meeting->meeting_type,
                'meeting_datetime' => $meeting->meeting_datetime->format('Y-m-d H:i:s'),
                'location' => $meeting->location,
                'is_update' => $isUpdate
            ];

            switch ($meeting->meeting_type) {
                case 'officials_only':
                    // Notify all barangay officials including secretaries
                    $officials = User::whereIn('role', ['barangay_official', 'barangay_captain', 'secretary', 'admin'])
                        ->get();
                    
                    foreach ($officials as $official) {
                        $official->notify(new MeetingScheduledNotification($notificationData));
                    }
                    break;

                case 'public':
                case 'residents':
                case 'emergency':
                    // Notify all users (officials, secretaries, and residents) regardless of sitio
                    $users = User::whereIn('role', ['resident', 'barangay_official', 'barangay_captain', 'admin', 'secretary'])
                        ->get();
                    
                    foreach ($users as $user) {
                        $user->notify(new MeetingScheduledNotification($notificationData));
                    }
                    break;
            }

            Log::info("Meeting notifications sent for meeting ID: {$meeting->id}, Type: {$meeting->meeting_type}");
        } catch (\Exception $e) {
            Log::error('Failed to send meeting notifications: ' . $e->getMessage());
            // Don't throw exception, just log the error
        }
    }

    /**
     * Mark user attendance for a meeting
     */
    public function markAttendance(Request $request, $meetingId)
    {
        try {
            $validated = $request->validate([
                'user_id' => 'nullable|exists:users,id',
                'attendance_status' => 'required|in:invited,confirmed,attended,absent',
                'notes' => 'nullable|string'
            ]);

            $userId = $validated['user_id'] ?? Auth::id();
            $meeting = BarangayMeeting::findOrFail($meetingId);

            DB::table('barangay_meeting_attendees')->updateOrInsert(
                [
                    'meeting_id' => $meetingId,
                    'user_id' => $userId
                ],
                [
                    'attendance_status' => $validated['attendance_status'],
                    'notes' => $validated['notes'] ?? null,
                    'updated_at' => now()
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Attendance marked successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark attendance: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark attendance'
            ], 500);
        }
    }

    /**
     * Get meeting statistics
     */
    public function statistics()
    {
        try {
            $stats = [
                'total_meetings' => BarangayMeeting::count(),
                'upcoming_meetings' => BarangayMeeting::upcoming()->count(),
                'past_meetings' => BarangayMeeting::past()->count(),
                'officials_only_meetings' => BarangayMeeting::officialsOnly()->count(),
                'public_meetings' => BarangayMeeting::publicMeetings()->count(),
                'by_status' => [
                    'scheduled' => BarangayMeeting::where('status', 'scheduled')->count(),
                    'ongoing' => BarangayMeeting::where('status', 'ongoing')->count(),
                    'completed' => BarangayMeeting::where('status', 'completed')->count(),
                    'cancelled' => BarangayMeeting::where('status', 'cancelled')->count(),
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch meeting statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics'
            ], 500);
        }
    }

    /**
     * Get all registered sitios with resident counts
     */
    public function getSitios()
    {
        try {
            $sitios = User::select('sitio', DB::raw('count(*) as resident_count'))
                ->whereNotNull('sitio')
                ->where('sitio', '!=', '')
                ->groupBy('sitio')
                ->orderBy('sitio')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $sitios
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch sitios: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sitios'
            ], 500);
        }
    }

    /**
     * Get all residents with their sitio information
     */
    public function getResidents()
    {
        try {
            $residents = User::select('id', 'name', 'email', 'sitio', 'phone', 'address', 'created_at')
                ->where('role', 'resident')
                ->orderBy('sitio')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $residents
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch residents: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch residents'
            ], 500);
        }
    }

    /**
     * Get all barangay officials (excluding admins)
     */
    public function getOfficials()
    {
        try {
            $officials = User::select('id', 'name', 'email', 'role', 'phone', 'address', 'created_at')
                ->whereIn('role', ['barangay_official', 'barangay_captain', 'secretary'])
                ->orderBy('role')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $officials
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch officials: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch officials'
            ], 500);
        }
    }

    /**
     * Schedule automatic meetings for all sitios
     */
    public function scheduleForAllSitios(Request $request)
    {
        try {
            $validated = $request->validate([
                'title_template' => 'required|string|max:255',
                'description' => 'nullable|string',
                'meeting_type' => 'required|in:public,residents',
                'start_date' => 'required|date|after:now',
                'start_time' => 'required|date_format:H:i',
                'duration_minutes' => 'required|integer|min:15|max:480',
                'location_template' => 'required|string|max:255',
                'agenda' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            $sitios = User::select('sitio')
                ->whereNotNull('sitio')
                ->where('sitio', '!=', '')
                ->distinct()
                ->pluck('sitio');

            if ($sitios->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No sitios found with registered residents'
                ], 400);
            }

            $createdMeetings = [];
            $currentDateTime = \Carbon\Carbon::parse($validated['start_date'] . ' ' . $validated['start_time']);

            foreach ($sitios as $sitio) {
                $meetingData = [
                    'title' => str_replace('{sitio}', $sitio, $validated['title_template']),
                    'description' => $validated['description'],
                    'meeting_type' => $validated['meeting_type'],
                    'target_sitio' => $sitio,
                    'meeting_datetime' => $currentDateTime->format('Y-m-d H:i:s'),
                    'location' => str_replace('{sitio}', $sitio, $validated['location_template']),
                    'agenda' => $validated['agenda'],
                    'notes' => $validated['notes'],
                    'created_by' => Auth::id(),
                    'status' => 'scheduled',
                ];

                $meeting = BarangayMeeting::create($meetingData);
                $this->sendMeetingNotifications($meeting);
                
                $createdMeetings[] = $meeting;

                // Increment time for next sitio meeting
                $currentDateTime->addMinutes($validated['duration_minutes']);
            }

            return response()->json([
                'success' => true,
                'message' => count($createdMeetings) . ' meetings scheduled successfully',
                'data' => $createdMeetings
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to schedule sitio meetings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to schedule meetings for sitios'
            ], 500);
        }
    }
}
