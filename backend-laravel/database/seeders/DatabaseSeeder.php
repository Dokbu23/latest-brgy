<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\HrCompany;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Check if test user exists, if not create it
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('password'),
            ]
        );

        // Create Admin Account if it doesn't exist
        User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Administrator',
                'password' => bcrypt('admin123'),
                'role' => 'admin',
                'barangay' => 'Main Office',
                'phone' => '09000000000',
                'address' => 'Barangay Hall',
            ]
        );

        // Create Secretary Account if it doesn't exist
        User::firstOrCreate(
            ['email' => 'secretary@gmail.com'],
            [
                'name' => 'Secretary Admin',
                'password' => bcrypt('secretary123'),
                'role' => 'secretary',
                'barangay' => 'Barangay Central',
                'phone' => '09123456789',
                'address' => '123 Main Street, Barangay Central',
            ]
        );

        // Create additional secretaries if needed
        User::firstOrCreate(
            ['email' => 'secretary2@gmail.com'],
            [
                'name' => 'Maria Cruz',
                'password' => bcrypt('secretary123'),
                'role' => 'secretary',
                'barangay' => 'South District',
                'phone' => '09234567890',
                'address' => '456 Oak Street, South District',
            ]
        );

        User::firstOrCreate(
            ['email' => 'secretary3@gmail.com'],
            [
                'name' => 'Juan Santos',
                'password' => bcrypt('secretary123'),
                'role' => 'secretary',
                'barangay' => 'North District',
                'phone' => '09345678901',
                'address' => '789 Maple Street, North District',
            ]
        );

        // Create an HR Manager account for testing
        $hr = User::firstOrCreate(
            ['email' => 'hr_manager@gmail.com'],
            [
                'name' => 'HR Manager',
                'password' => bcrypt('hrmanager123'),
                'role' => 'hr',
                'barangay' => 'B. Del Mundo HR',
                'phone' => '09400000000',
                'address' => 'Barangay HR Office',
            ]
        );

        // Ensure HrCompany exists for the HR manager
        HrCompany::firstOrCreate(
            ['user_id' => $hr->id],
            [
                'name' => 'B. Del Mundo HR Company',
                'verified' => true,
            ]
        );

        // Create an Admin-HR hybrid account (admin role + HR company)
        $adminHr = User::firstOrCreate(
            ['email' => 'admin_hr@gmail.com'],
            [
                'name' => 'Admin HR',
                'password' => bcrypt('adminhr123'),
                'role' => 'admin',
                'barangay' => 'B. Del Mundo',
                'phone' => '09500000000',
                'address' => 'Barangay Hall',
            ]
        );

        HrCompany::firstOrCreate(
            ['user_id' => $adminHr->id],
            [
                'name' => 'Admin HR Company',
                'verified' => true,
            ]
        );
    }
}
