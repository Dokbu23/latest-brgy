<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class BarangayOfficialsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $officials = [
            [
                'name' => 'Juan Dela Cruz',
                'email' => 'captain@barangay.com',
                'password' => Hash::make('password123'),
                'role' => 'barangay_captain',
                'position' => 'Barangay Captain',
                'barangay' => 'B. Del Mundo',
                'phone' => '09123456789',
                'address' => 'Barangay Hall, B. Del Mundo',
            ],
            [
                'name' => 'Maria Santos',
                'email' => 'kagawad1@barangay.com',
                'password' => Hash::make('password123'),
                'role' => 'barangay_official',
                'position' => 'Kagawad - Committee on Health',
                'barangay' => 'B. Del Mundo',
                'phone' => '09123456790',
                'address' => 'Sitio 1, B. Del Mundo',
            ],
            [
                'name' => 'Pedro Garcia',
                'email' => 'kagawad2@barangay.com',
                'password' => Hash::make('password123'),
                'role' => 'barangay_official',
                'position' => 'Kagawad - Committee on Education',
                'barangay' => 'B. Del Mundo',
                'phone' => '09123456791',
                'address' => 'Sitio 2, B. Del Mundo',
            ],
            [
                'name' => 'Ana Reyes',
                'email' => 'kagawad3@barangay.com',
                'password' => Hash::make('password123'),
                'role' => 'barangay_official',
                'position' => 'Kagawad - Committee on Peace and Order',
                'barangay' => 'B. Del Mundo',
                'phone' => '09123456792',
                'address' => 'Sitio 3, B. Del Mundo',
            ],
            [
                'name' => 'Roberto Mendoza',
                'email' => 'kagawad4@barangay.com',
                'password' => Hash::make('password123'),
                'role' => 'barangay_official',
                'position' => 'Kagawad - Committee on Agriculture',
                'barangay' => 'B. Del Mundo',
                'phone' => '09123456793',
                'address' => 'Sitio 4, B. Del Mundo',
            ],
            [
                'name' => 'Carmen Lopez',
                'email' => 'kagawad5@barangay.com',
                'password' => Hash::make('password123'),
                'role' => 'barangay_official',
                'position' => 'Kagawad - Committee on Infrastructure',
                'barangay' => 'B. Del Mundo',
                'phone' => '09123456794',
                'address' => 'Sitio 5, B. Del Mundo',
            ],
            [
                'name' => 'Jose Ramos',
                'email' => 'kagawad6@barangay.com',
                'password' => Hash::make('password123'),
                'role' => 'barangay_official',
                'position' => 'Kagawad - Committee on Finance',
                'barangay' => 'B. Del Mundo',
                'phone' => '09123456795',
                'address' => 'Sitio 6, B. Del Mundo',
            ],
            [
                'name' => 'Linda Torres',
                'email' => 'kagawad7@barangay.com',
                'password' => Hash::make('password123'),
                'role' => 'barangay_official',
                'position' => 'Kagawad - Committee on Social Services',
                'barangay' => 'B. Del Mundo',
                'phone' => '09123456796',
                'address' => 'Sitio 7, B. Del Mundo',
            ],
            [
                'name' => 'Ricardo Cruz',
                'email' => 'sk.chairman@barangay.com',
                'password' => Hash::make('password123'),
                'role' => 'barangay_official',
                'position' => 'SK Chairman',
                'barangay' => 'B. Del Mundo',
                'phone' => '09123456797',
                'address' => 'Youth Center, B. Del Mundo',
            ],
            [
                'name' => 'Teresa Santos',
                'email' => 'treasurer@barangay.com',
                'password' => Hash::make('password123'),
                'role' => 'barangay_official',
                'position' => 'Barangay Treasurer',
                'barangay' => 'B. Del Mundo',
                'phone' => '09123456798',
                'address' => 'Barangay Hall, B. Del Mundo',
            ],
        ];

        foreach ($officials as $official) {
            User::updateOrCreate(
                ['email' => $official['email']],
                $official
            );
        }
    }
}
