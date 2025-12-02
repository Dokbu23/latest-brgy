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
        // Modify the role enum to include 'secretary' and 'hr'
        Schema::table('users', function (Blueprint $table) {
            // Change the enum type to include all roles
            $table->enum('role', ['admin', 'barangay_official', 'resident', 'secretary', 'hr'])->default('resident')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Revert to admin, barangay_official, resident (keeping broader enum to avoid data loss)
            $table->enum('role', ['admin', 'barangay_official', 'resident', 'secretary', 'hr'])->default('resident')->change();
        });
    }
};
