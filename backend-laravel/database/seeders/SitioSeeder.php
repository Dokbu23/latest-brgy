<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class SitioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sitios = [
            'Canlumon 1',
            'Canlumon 2',
            'Landing 1',
            'Landing 2',
            'Langawin',
            'Banlanga 1',
            'Banlanga 2',
            'Parang',
            'Barubo',
            'Centro',
            'Laiya',
            'Sinampad',
            'Palaypay'
        ];

        // Update existing users to assign them to sitios randomly (for demo purposes)
        $residents = User::where('role', 'resident')->get();
        
        if ($residents->isNotEmpty()) {
            foreach ($residents as $resident) {
                $resident->update([
                    'sitio' => $sitios[array_rand($sitios)]
                ]);
            }
            
            $this->command->info('Updated ' . $residents->count() . ' residents with sitio assignments.');
        }

        // Create sample residents for each sitio
        foreach ($sitios as $sitio) {
            for ($i = 1; $i <= 3; $i++) {
                User::create([
                    'name' => "Resident {$i} - {$sitio}",
                    'email' => strtolower(str_replace(' ', '', $sitio)) . "_resident{$i}@example.com",
                    'password' => bcrypt('password'),
                    'role' => 'resident',
                    'sitio' => $sitio,
                    'barangay' => 'Sample Barangay',
                    'phone' => '09' . rand(100000000, 999999999),
                    'address' => "Sitio {$sitio}, Sample Barangay",
                ]);
            }
        }

        $this->command->info('Created sample residents for all ' . count($sitios) . ' sitios.');
        $this->command->info('Total sitios: ' . implode(', ', $sitios));
    }
}
