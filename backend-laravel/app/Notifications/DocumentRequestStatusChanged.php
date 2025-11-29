<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;
use App\Models\DocumentRequest;

class DocumentRequestStatusChanged extends Notification
{
    use Queueable;

    protected $request;

    public function __construct(DocumentRequest $request)
    {
        $this->request = $request;
    }

    public function via($notifiable)
    {
        // Use mail channel here; database storage is handled explicitly via the Notification model
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $r = $this->request;
        return (new MailMessage)
                    ->subject('Your document request status updated')
                    ->greeting('Hello ' . ($notifiable->name ?? 'Resident'))
                    ->line("Your request for: {$r->type} has been updated to: {$r->status}.")
                    ->line($r->notes ?? '')
                    ->action('View Requests', url('/'))
                    ->line('Thank you for using our barangay services.');
    }

    public function toDatabase($notifiable)
    {
        $r = $this->request;
        return [
            'request_id' => $r->id,
            'type' => $r->type,
            'status' => $r->status,
            'notes' => $r->notes,
        ];
    }
}
