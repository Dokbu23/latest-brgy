<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notification;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $limit = (int) $request->query('limit', 10);

        $notifications = Notification::where('notifiable_type', 'App\\Models\\User')
            ->where('notifiable_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function (Notification $n) {
                $payload = $n->data ?: [];
                return [
                    'id' => $n->id,
                    'type' => $n->type,
                    'title' => $payload['title'] ?? null,
                    'message' => $payload['message'] ?? null,
                    'data' => $payload,
                    'read' => $n->read_at ? true : false,
                    'created_at' => $n->created_at,
                    'updated_at' => $n->updated_at,
                ];
            });

        return response()->json(['status' => 'success', 'data' => $notifications]);
    }

    public function markRead(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $n = Notification::where('id', $id)
            ->where('notifiable_type', 'App\\Models\\User')
            ->where('notifiable_id', $user->id)
            ->first();

        if (!$n) {
            return response()->json(['status' => 'error', 'message' => 'Notification not found'], 404);
        }

        $n->read_at = now();
        $n->save();

        return response()->json(['status' => 'success']);
    }
}
