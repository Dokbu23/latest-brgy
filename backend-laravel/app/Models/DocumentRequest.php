<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentRequest extends Model
{
    use HasFactory;

    protected $table = 'document_requests';

    protected $fillable = [
        'user_id',
        'type',
        'notes',
        'status',
        'urgency',
        'assigned_to',
        'processed_at',
        'is_paid',
        'amount',
        'download_count',
        'max_downloads',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_paid' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
