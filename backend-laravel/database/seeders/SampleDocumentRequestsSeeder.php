<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\DocumentRequest;
use Carbon\Carbon;

class SampleDocumentRequestsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get residents from B. Del Mundo barangay
        $residents = User::where('barangay', 'B. Del Mundo')
            ->where('role', 'resident')
            ->get();

        if ($residents->isEmpty()) {
            $this->command->info('No residents found. Creating sample resident...');
            $resident = User::create([
                'name' => 'Sample Resident',
                'email' => 'resident@sample.com',
                'password' => bcrypt('password123'),
                'role' => 'resident',
                'barangay' => 'B. Del Mundo',
                'phone' => '09123456789',
                'address' => 'Sample Address, B. Del Mundo',
            ]);
            $residents = collect([$resident]);
        }

        $documentTypes = [
            'barangay_clearance',
            'certificate_of_indigency',
            'certificate_of_residency',
            'good_moral_certificate',
            'business_permit',
            'barangay_id',
            'certificate_of_employment',
        ];

        $statuses = ['pending', 'approved', 'rejected'];

        // Create sample requests for the last 7 days
        foreach ($residents->take(5) as $resident) {
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                
                // Create 1-3 requests per day
                $requestCount = rand(1, 3);
                
                for ($j = 0; $j < $requestCount; $j++) {
                    $type = $documentTypes[array_rand($documentTypes)];
                    $amount = rand(0, 1) ? rand(50, 200) : 0; // 50% chance of paid request
                    
                    DocumentRequest::create([
                        'user_id' => $resident->id,
                        'type' => $type,
                        'status' => $statuses[array_rand($statuses)],
                        'amount' => $amount,
                        'is_paid' => $amount > 0,
                        'notes' => 'Sample request for testing',
                        'created_at' => $date->addHours(rand(8, 17))->addMinutes(rand(0, 59)),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $this->command->info('Sample document requests created successfully!');
    }
}
