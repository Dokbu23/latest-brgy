<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobListing extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'company', 'type', 'salary', 'description', 'urgent', 'status', 'posted_at', 'hr_company_id'
    ];

    protected $casts = [
        'urgent' => 'boolean',
        'posted_at' => 'datetime',
    ];

    public function hrCompany()
    {
        return $this->belongsTo(HrCompany::class, 'hr_company_id');
    }
}
