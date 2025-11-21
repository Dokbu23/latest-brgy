<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Set role = 'hr' for users that have an hr_companies record
        DB::statement("UPDATE users u JOIN hr_companies h ON h.user_id = u.id SET u.role = 'hr' WHERE u.role <> 'admin'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to 'resident' if the user still has an hr_company (only if not admin)
        DB::statement("UPDATE users u JOIN hr_companies h ON h.user_id = u.id SET u.role = 'resident' WHERE u.role = 'hr'");
    }
};
