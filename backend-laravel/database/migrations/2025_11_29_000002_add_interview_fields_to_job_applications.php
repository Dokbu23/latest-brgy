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
        if (Schema::hasTable('job_applications')) {
            if (!Schema::hasColumn('job_applications', 'interview_date')) {
                Schema::table('job_applications', function (Blueprint $table) {
                    $table->date('interview_date')->nullable();
                    $table->string('interview_time')->nullable();
                    $table->string('interview_location')->nullable();
                    $table->text('interview_notes')->nullable();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('job_applications')) {
            if (Schema::hasColumn('job_applications', 'interview_date')) {
                Schema::table('job_applications', function (Blueprint $table) {
                    $table->dropColumn('interview_date');
                    $table->dropColumn('interview_time');
                    $table->dropColumn('interview_location');
                    $table->dropColumn('interview_notes');
                });
            }
        }
    }
};
