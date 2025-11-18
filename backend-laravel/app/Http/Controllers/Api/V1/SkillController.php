<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Skill;

class SkillController extends Controller
{
    public function index()
    {
        $skills = Skill::orderBy('skill')->get();
        return response()->json(['status' => 'success', 'data' => $skills]);
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'skill' => 'required|string|max:255',
            'count' => 'nullable|integer|min:0',
        ]);

        $entry = Skill::create([
            'skill' => $payload['skill'],
            'count' => $payload['count'] ?? 0,
        ]);

        return response()->json(['status' => 'success', 'data' => $entry], 201);
    }

    public function destroy($id)
    {
        $skill = Skill::find($id);
        if ($skill) $skill->delete();
        return response()->json(['status' => 'success']);
    }
}
