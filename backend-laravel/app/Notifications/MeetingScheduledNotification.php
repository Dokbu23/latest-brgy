<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MeetingScheduledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $meetingData;

    /**
     * Create a new notification instance.
     */
    public function __construct($meetingData)
    {
        $this->meetingData = $meetingData;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $action = $this->meetingData['is_update'] ? 'Updated' : 'Scheduled';
        $meetingType = $this->getMeetingTypeLabel($this->meetingData['meeting_type']);

        return (new MailMessage)
            ->subject("Meeting {$action}: {$this->meetingData['title']}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("A {$meetingType} has been {$action}.")
            ->line("**Meeting Title:** {$this->meetingData['title']}")
            ->line("**Date & Time:** {$this->meetingData['meeting_datetime']}")
            ->line("**Location:** {$this->meetingData['location']}")
            ->action('View Meeting Details', url("/meetings/{$this->meetingData['meeting_id']}"))
            ->line('Please make sure to attend on time.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        $action = $this->meetingData['is_update'] ? 'updated' : 'scheduled';
        $meetingType = $this->getMeetingTypeLabel($this->meetingData['meeting_type']);

        return [
            'type' => 'meeting_' . $action,
            'title' => "Meeting {$action}: {$this->meetingData['title']}",
            'message' => "A {$meetingType} has been {$action} for {$this->meetingData['meeting_datetime']} at {$this->meetingData['location']}",
            'data' => [
                'meeting_id' => $this->meetingData['meeting_id'],
                'meeting_type' => $this->meetingData['meeting_type'],
                'meeting_datetime' => $this->meetingData['meeting_datetime'],
                'location' => $this->meetingData['location'],
            ]
        ];
    }

    /**
     * Get human-readable meeting type label
     */
    private function getMeetingTypeLabel($type): string
    {
        return match($type) {
            'officials_only' => 'Barangay Officials Meeting',
            'public' => 'Public Meeting',
            'residents' => 'Residents Meeting',
            'emergency' => 'Emergency Meeting',
            default => 'Meeting'
        };
    }
}
