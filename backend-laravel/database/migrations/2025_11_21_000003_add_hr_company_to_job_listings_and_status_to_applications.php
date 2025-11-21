<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('job_listings') && !Schema::hasColumn('job_listings', 'hr_company_id')) {
            Schema::table('job_listings', function (Blueprint $table) {
                $table->foreignId('hr_company_id')->nullable()->after('company')->constrained('hr_companies')->nullOnDelete();
            });
        }

        if (Schema::hasTable('job_applications') && !Schema::hasColumn('job_applications', 'status')) {
            Schema::table('job_applications', function (Blueprint $table) {
                $table->string('status')->default('pending')->after('cover_letter');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('job_listings') && Schema::hasColumn('job_listings', 'hr_company_id')) {
            Schema::table('job_listings', function (Blueprint $table) {
                $table->dropConstrainedForeignId('hr_company_id');
            });
        }

        if (Schema::hasTable('job_applications') && Schema::hasColumn('job_applications', 'status')) {
            Schema::table('job_applications', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};
