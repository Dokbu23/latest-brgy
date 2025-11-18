<?php
// routes/api.php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\EmploymentRecordController;
use App\Http\Controllers\Api\V1\SkillController;
use App\Http\Controllers\Api\V1\JobListingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['web'])->group(function () {
    // Public routes - exclude CSRF for API
    Route::post('/login', [AuthController::class, 'login'])->withoutMiddleware('csrf');
    Route::post('/register', [AuthController::class, 'register'])->withoutMiddleware('csrf');
    // Public resident registration endpoint
    Route::post('/register/resident', [AuthController::class, 'registerResident'])->withoutMiddleware('csrf');
    
    // Protected routes
    Route::middleware('auth')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // Admin-only endpoints
        Route::post('/admin/create-hr', [AuthController::class, 'createHrManager']);
        
        // Dashboard
        Route::get('/dashboard/statistics', [DashboardController::class, 'statistics']);
        Route::get('/dashboard/activities', [DashboardController::class, 'recentActivities']);
        
        // Resources
        Route::apiResource('employment-records', EmploymentRecordController::class);
        Route::apiResource('skills', SkillController::class);
        Route::apiResource('job-listings', JobListingController::class);
    });
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Barangay Portal API is running',
        'timestamp' => now()->toISOString(),
    ]);
});