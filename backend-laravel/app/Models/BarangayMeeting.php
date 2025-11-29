<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BarangayMeeting extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'meeting_type',
        'target_sitio',
        'meeting_datetime',
        'location',
        'agenda',
        'notes',
        'status',
        'created_by'
    ];

    protected $casts = [
        'meeting_datetime' => 'datetime',
    ];

    protected $appends = ['meeting_date'];

    /**
     * Get the user who created the meeting
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all attendees for this meeting
     */
    public function attendees()
    {
        return $this->belongsToMany(User::class, 'barangay_meeting_attendees', 'meeting_id', 'user_id')
            ->withPivot('attendance_status', 'notes')
            ->withTimestamps();
    }

    /**
     * Get meeting date for frontend compatibility
     */
    public function getMeetingDateAttribute()
    {
        return $this->meeting_datetime;
    }

    /**
     * Scope for upcoming meetings
     */
    public function scopeUpcoming($query)
    {
        return $query->where('meeting_datetime', '>=', now())
            ->where('status', 'scheduled')
            ->orderBy('meeting_datetime', 'asc');
    }

    /**
     * Scope for past meetings
     */
    public function scopePast($query)
    {
        return $query->where('meeting_datetime', '<', now())
            ->orderBy('meeting_datetime', 'desc');
    }

    /**
     * Scope for officials only meetings
     */
    public function scopeOfficialsOnly($query)
    {
        return $query->where('meeting_type', 'officials_only');
    }

    /**
     * Scope for public meetings
     */
    public function scopePublicMeetings($query)
    {
        return $query->whereIn('meeting_type', ['public', 'residents', 'emergency']);
    }
}
