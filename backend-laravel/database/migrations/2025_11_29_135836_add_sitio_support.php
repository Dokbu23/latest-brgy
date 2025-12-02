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
        // Add sitio field to users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('sitio')->nullable()->after('barangay');
        });

        // Add sitio field to meetings table
        Schema::table('barangay_meetings', function (Blueprint $table) {
            $table->string('target_sitio')->nullable()->after('meeting_type')->comment('Specific sitio for the meeting, null means all sitios');
            $table->index('target_sitio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('sitio');
        });

        Schema::table('barangay_meetings', function (Blueprint $table) {
            $table->dropIndex(['target_sitio']);
            $table->dropColumn('target_sitio');
        });
    }
};
