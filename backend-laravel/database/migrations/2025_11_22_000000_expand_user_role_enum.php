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
        DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('admin','barangay_official','resident','secretary','hr_manager','hr') NOT NULL DEFAULT 'resident';");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum (remove secretary, hr_manager, hr)
        DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('admin','barangay_official','resident') NOT NULL DEFAULT 'resident';");
    }
}
