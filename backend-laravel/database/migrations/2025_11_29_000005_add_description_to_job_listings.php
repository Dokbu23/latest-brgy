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
        if (Schema::hasTable('job_listings') && !Schema::hasColumn('job_listings', 'description')) {
            Schema::table('job_listings', function (Blueprint $table) {
                $table->text('description')->nullable()->after('salary');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('job_listings') && Schema::hasColumn('job_listings', 'description')) {
            Schema::table('job_listings', function (Blueprint $table) {
                $table->dropColumn('description');
            });
        }
    }
};
