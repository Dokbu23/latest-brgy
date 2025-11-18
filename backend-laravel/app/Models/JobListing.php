<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobListing extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'company', 'type', 'salary', 'description', 'urgent', 'status', 'posted_at'
    ];

    protected $casts = [
        'urgent' => 'boolean',
        'posted_at' => 'datetime',
    ];
}
