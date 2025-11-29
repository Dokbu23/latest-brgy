<?php
// routes/api.php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\EmploymentRecordController;
use App\Http\Controllers\Api\V1\SkillController;
use App\Http\Controllers\Api\V1\JobListingController;
use App\Http\Controllers\Api\V1\JobApplicationController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\DocumentRequestController;
use App\Http\Controllers\BarangayMeetingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
// Public resident registration endpoint
Route::post('/register/resident', [AuthController::class, 'registerResident']);
// Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        // Update authenticated user's profile
        Route::patch('/user', [AuthController::class, 'updateProfile']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // Admin-only endpoints
        Route::post('/admin/create-hr', [AuthController::class, 'createHrManager']);
        Route::post('/admin/create-secretary', [AuthController::class, 'createSecretary']);
        Route::get('/admin/stats', [DashboardController::class, 'adminStats']);
        Route::get('/admin/accounts', [AuthController::class, 'allAccounts']);
        Route::patch('/admin/accounts/{id}', [AuthController::class, 'updateAccount']);
        Route::delete('/admin/accounts/{id}', [AuthController::class, 'deleteAccount']);
        
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
        Route::get('document-requests/{id}/download', [DocumentRequestController::class, 'download']);
        Route::get('document-requests/secretaries', [DocumentRequestController::class, 'secretaries']);
        Route::get('secretaries', [DocumentRequestController::class, 'secretaries']);

        // Avatar upload
        Route::post('/user/avatar', [AuthController::class, 'uploadAvatar']);

        // HR/Admin: list applicants for a job
        Route::get('job-listings/{id}/applicants', [JobApplicationController::class, 'applicants']);
        // Admin/HR accept or reject an application
        Route::post('job-applications/{id}/accept', [JobApplicationController::class, 'accept']);
        Route::post('job-applications/{id}/reject', [JobApplicationController::class, 'reject']);
        // Close a job listing
        Route::put('job-listings/{id}/close', [JobListingController::class, 'close']);
        // Schedule interview for an applicant
        Route::post('job-listings/{id}/interviews', [JobApplicationController::class, 'scheduleInterview']);
        Route::get('job-listings/{id}/interviews', [JobApplicationController::class, 'getInterviews']);

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markRead']);

        // Barangay Meetings
        Route::prefix('barangay')->group(function () {
            Route::get('meetings/upcoming/list', [BarangayMeetingController::class, 'upcomingMeetings']);
            Route::get('meetings/statistics/all', [BarangayMeetingController::class, 'statistics']);
            Route::get('sitios', [BarangayMeetingController::class, 'getSitios']);
            Route::get('residents', [BarangayMeetingController::class, 'getResidents']);
            Route::get('officials', [BarangayMeetingController::class, 'getOfficials']);
            Route::post('meetings/schedule-all-sitios', [BarangayMeetingController::class, 'scheduleForAllSitios']);
            Route::get('meetings', [BarangayMeetingController::class, 'index']);
            Route::post('meetings', [BarangayMeetingController::class, 'store']);
            Route::get('meetings/{id}', [BarangayMeetingController::class, 'show']);
            Route::put('meetings/{id}', [BarangayMeetingController::class, 'update']);
            Route::delete('meetings/{id}', [BarangayMeetingController::class, 'destroy']);
            Route::post('meetings/{id}/attendance', [BarangayMeetingController::class, 'markAttendance']);
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