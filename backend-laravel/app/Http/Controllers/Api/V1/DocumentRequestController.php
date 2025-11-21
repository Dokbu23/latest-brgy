<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use App\Models\DocumentRequest;
use App\Models\User;
use App\Notifications\DocumentRequestStatusChanged;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Auth;

class DocumentRequestController extends BaseController
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    // List requests: secretary sees all; resident sees own
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'secretary' || $user->role === 'admin') {
            $requests = DocumentRequest::with('user', 'assignee')->orderBy('created_at', 'desc')->paginate(20);
        } else {
            $requests = DocumentRequest::with('assignee')->where('user_id', $user->id)->orderBy('created_at', 'desc')->paginate(20);
        }

        return response()->json(['data' => $requests]);
    }

    // Return list of secretaries for assignment (admin only)
    public function secretaries(Request $request)
    {
        $user = $request->user();
        if (($user->role ?? '') !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $secs = User::where('role', 'secretary')->select('id', 'name', 'email')->get();
        return response()->json(['data' => $secs]);
    }

    // Resident creates a new request
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'type' => 'required|string|max:191',
            'notes' => 'nullable|string',
        ]);

        $req = DocumentRequest::create([
            'user_id' => $user->id,
            'type' => $validated['type'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json(['data' => $req], 201);
    }

    // Secretary/Admin updates status: approve/reject and optionally assign
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!in_array($user->role, ['secretary', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,approved,rejected',
            'assigned_to' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        $req = DocumentRequest::findOrFail($id);
        $oldStatus = $req->status;
        $req->status = $validated['status'];
        if (array_key_exists('assigned_to', $validated)) {
            $req->assigned_to = $validated['assigned_to'];
        }
        if (isset($validated['notes'])) {
            $req->notes = $validated['notes'];
        }
        if ($validated['status'] !== 'pending') {
            $req->processed_at = now();
        }
        $req->save();

        // Send notification to requesting user when status changes
        if ($oldStatus !== $req->status) {
            try {
                $req->refresh();
                $req->user && Notification::send($req->user, new DocumentRequestStatusChanged($req));
            } catch (\Throwable $e) {
                // don't break on notification failure
                report($e);
            }
        }

        return response()->json(['data' => $req]);
    }
}
