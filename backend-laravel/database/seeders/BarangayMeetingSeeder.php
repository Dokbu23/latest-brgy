<?php

namespace Database\Seeders;

use App\Models\BarangayMeeting;
use App\Models\User;
use Illuminate\Database\Seeder;

class BarangayMeetingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get a captain or admin user as the creator
        $captain = User::whereIn('role', ['barangay_captain', 'admin'])->first();
        
        if (!$captain) {
            $this->command->warn('No captain or admin user found. Skipping meeting seeder.');
            return;
        }

        $meetings = [
            [
                'title' => 'Monthly Barangay Officials Meeting',
                'description' => 'Regular monthly meeting to discuss barangay affairs and upcoming projects.',
                'meeting_type' => 'officials_only',
                'meeting_datetime' => now()->addDays(7)->setTime(14, 0),
                'location' => 'Barangay Hall - Conference Room',
                'agenda' => "1. Review of previous month's activities\n2. Budget allocation discussion\n3. New project proposals\n4. Any other business",
                'notes' => 'Please bring your monthly reports.',
                'status' => 'scheduled',
                'created_by' => $captain->id,
            ],
            [
                'title' => 'Community Health and Safety Assembly',
                'description' => 'Public meeting to discuss health initiatives and safety protocols in the barangay.',
                'meeting_type' => 'public',
                'meeting_datetime' => now()->addDays(14)->setTime(16, 0),
                'location' => 'Barangay Covered Court',
                'agenda' => "1. Health update from barangay health center\n2. Safety measures and protocols\n3. Community concerns and feedback\n4. Q&A session",
                'notes' => 'Open to all residents. Free health check-up available after the meeting.',
                'status' => 'scheduled',
                'created_by' => $captain->id,
            ],
            [
                'title' => 'Residents General Assembly',
                'description' => 'Quarterly meeting with all residents to present barangay updates and gather feedback.',
                'meeting_type' => 'residents',
                'meeting_datetime' => now()->addDays(21)->setTime(18, 0),
                'location' => 'Barangay Multi-Purpose Hall',
                'agenda' => "1. State of the Barangay address\n2. Infrastructure projects update\n3. Budget transparency report\n4. Resident concerns and suggestions",
                'notes' => 'All residents are encouraged to attend.',
                'status' => 'scheduled',
                'created_by' => $captain->id,
            ],
            [
                'title' => 'Emergency Preparedness Briefing',
                'description' => 'Emergency meeting to discuss disaster preparedness and emergency response protocols.',
                'meeting_type' => 'emergency',
                'meeting_datetime' => now()->addDays(3)->setTime(10, 0),
                'location' => 'Barangay Emergency Operations Center',
                'agenda' => "1. Weather advisory and flood preparedness\n2. Evacuation procedures review\n3. Emergency contact information update\n4. Relief goods inventory",
                'notes' => 'URGENT: All officials and residents must attend.',
                'status' => 'scheduled',
                'created_by' => $captain->id,
            ],
            [
                'title' => 'Budget Planning Workshop',
                'description' => 'Closed meeting for barangay officials to plan next year\'s budget.',
                'meeting_type' => 'officials_only',
                'meeting_datetime' => now()->addDays(10)->setTime(9, 0),
                'location' => 'Barangay Hall - Office of the Captain',
                'agenda' => "1. Review of current year's expenditures\n2. Next year's projected revenue\n3. Priority projects and allocations\n4. Financial planning strategies",
                'notes' => 'Bring financial reports and project proposals.',
                'status' => 'scheduled',
                'created_by' => $captain->id,
            ],
            // Past meeting for reference
            [
                'title' => 'New Year Planning Session',
                'description' => 'Planning session held at the start of the year.',
                'meeting_type' => 'officials_only',
                'meeting_datetime' => now()->subDays(30)->setTime(14, 0),
                'location' => 'Barangay Hall',
                'agenda' => 'Year 2025 planning and goal setting',
                'notes' => 'Successfully completed.',
                'status' => 'completed',
                'created_by' => $captain->id,
            ],
        ];

        foreach ($meetings as $meeting) {
            BarangayMeeting::create($meeting);
        }

        $this->command->info('Barangay meetings seeded successfully!');
    }
}
