<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class ExpandUserRoleEnum extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add additional roles used by the application
        // Using raw statement to alter enum safely across MySQL versions
        DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('admin','barangay_official','resident','secretary','hr') NOT NULL DEFAULT 'resident';");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep the expanded enum to avoid data loss during rollback
        DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('admin','barangay_official','resident','secretary','hr') NOT NULL DEFAULT 'resident';");
    }
}
