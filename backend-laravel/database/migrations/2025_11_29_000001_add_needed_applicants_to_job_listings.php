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
        if (Schema::hasTable('job_listings') && !Schema::hasColumn('job_listings', 'needed_applicants')) {
            Schema::table('job_listings', function (Blueprint $table) {
                $table->integer('needed_applicants')->default(1);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('job_listings') && Schema::hasColumn('job_listings', 'needed_applicants')) {
            Schema::table('job_listings', function (Blueprint $table) {
                $table->dropColumn('needed_applicants');
            });
        }
    }
};
