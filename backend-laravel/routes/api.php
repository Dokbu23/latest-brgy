<?php
// routes/api.php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\EmploymentRecordController;
use App\Http\Controllers\Api\V1\SkillController;
use App\Http\Controllers\Api\V1\JobListingController;
use App\Http\Controllers\Api\V1\JobApplicationController;
use App\Http\Controllers\Api\V1\DocumentRequestController;
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
        Route::post('/admin/create-secretary', [AuthController::class, 'createSecretary']);
        
        // Dashboard
        Route::get('/dashboard/statistics', [DashboardController::class, 'statistics']);
        Route::get('/dashboard/activities', [DashboardController::class, 'recentActivities']);
        
        // Resources
        Route::apiResource('employment-records', EmploymentRecordController::class);
        Route::apiResource('skills', SkillController::class);
        Route::apiResource('job-listings', JobListingController::class);
        Route::post('job-applications', [JobApplicationController::class, 'store']);
        Route::get('job-applications', [JobApplicationController::class, 'index']);

        // Document Requests - residents can create; secretary/admin can list+update
        Route::get('document-requests', [DocumentRequestController::class, 'index']);
        Route::post('document-requests', [DocumentRequestController::class, 'store']);
        Route::patch('document-requests/{id}', [DocumentRequestController::class, 'update']);
        Route::get('document-requests/secretaries', [DocumentRequestController::class, 'secretaries']);

        // HR/Admin: list applicants for a job
        Route::get('job-listings/{id}/applicants', [JobApplicationController::class, 'applicants']);
        // Admin/HR accept or reject an application
        Route::post('job-applications/{id}/accept', [JobApplicationController::class, 'accept']);
        Route::post('job-applications/{id}/reject', [JobApplicationController::class, 'reject']);
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