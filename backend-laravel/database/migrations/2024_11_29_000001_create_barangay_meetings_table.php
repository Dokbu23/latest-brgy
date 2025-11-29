<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('barangay_meetings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('meeting_type', ['officials_only', 'public', 'residents', 'emergency'])->default('officials_only');
            $table->dateTime('meeting_datetime');
            $table->string('location');
            $table->text('agenda')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])->default('scheduled');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['meeting_type', 'meeting_datetime']);
            $table->index(['status', 'meeting_datetime']);
        });

        Schema::create('barangay_meeting_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('barangay_meetings')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('attendance_status', ['invited', 'confirmed', 'attended', 'absent'])->default('invited');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['meeting_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barangay_meeting_attendees');
        Schema::dropIfExists('barangay_meetings');
    }
};
