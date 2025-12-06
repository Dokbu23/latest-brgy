<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use App\Models\DocumentRequest;
use App\Models\User;
use App\Notifications\DocumentRequestStatusChanged;
use Illuminate\Support\Facades\Notification;
use App\Models\Notification as DbNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use Carbon\Carbon;

class DocumentRequestController extends BaseController
{
    protected array $documentTypeAliases = [
        'certificate_indigency' => 'certificate_of_indigency',
        'certificate_of_indigency' => 'certificate_of_indigency',
        'residency_cert' => 'certificate_of_residency',
        'certificate_of_residency' => 'certificate_of_residency',
        'good_moral' => 'good_moral_certificate',
        'good_moral_certificate' => 'good_moral_certificate',
        'birth_cert' => 'birth_certificate',
        'birth_certificate' => 'birth_certificate',
        'death_cert' => 'death_certificate',
        'death_certificate' => 'death_certificate',
        'blotter_cert' => 'blotter_certificate',
        'blotter_certificate' => 'blotter_certificate',
    ];

    protected array $documentTitleOverrides = [
        'barangay_clearance' => 'Barangay Clearance',
        'certificate_of_indigency' => 'Certificate of Indigency',
        'certificate_of_residency' => 'Certificate of Residency',
        'good_moral_certificate' => 'Certificate of Good Moral Character',
        'business_permit' => 'Business Permit',
        'permit_fiesta' => 'Permit to Fiesta',
        'permit_to_fiesta' => 'Permit to Fiesta',
        'birth_certificate' => 'Birth Certificate',
        'death_certificate' => 'Death Certificate',
        'blotter_certificate' => 'Blotter Certificate',
        'other' => 'Custom Document',
    ];

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    // List requests: secretary sees all; resident sees own
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'secretary' || $user->role === 'admin') {
            $requests = DocumentRequest::with('user', 'assignee')->orderBy('created_at', 'desc')->paginate(20);
        } else {
            $requests = DocumentRequest::with('assignee')->where('user_id', $user->id)->orderBy('created_at', 'desc')->paginate(20);
        }

        return response()->json(['data' => $requests]);
    }

    // Return list of secretaries for assignment (admin, resident, or secretary can access)
    public function secretaries(Request $request)
    {
        $user = $request->user();
        
        // Allow authenticated users to see secretaries
        $secs = User::where('role', 'secretary')->select('id', 'name', 'email')->get();
        return response()->json(['data' => $secs]);
    }

    // Resident creates a new request
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'type' => 'required|string|max:191',
            'notes' => 'nullable|string',
        ]);

        // Check if user has used their free request
        $amount = 0;
        $isPaid = true;
        
        if ($user->free_requests_used < 1) {
            // First request is free
            $amount = 0;
            $user->increment('free_requests_used');
        } else {
            // Subsequent requests cost 50 pesos
            $amount = 50.00;
            
            // Check wallet balance
            if ($user->wallet_balance < $amount) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Insufficient wallet balance. Please top up your wallet.',
                    'wallet_balance' => $user->wallet_balance,
                    'required_amount' => $amount
                ], 402);
            }
            
            // Deduct from wallet
            $user->decrement('wallet_balance', $amount);
        }

        // Set expiration to 30 days from approval
        $expiresAt = Carbon::now()->addDays(30);

        $req = DocumentRequest::create([
            'user_id' => $user->id,
            'type' => $validated['type'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
            'is_paid' => $isPaid,
            'amount' => $amount,
            'download_count' => 0,
            'max_downloads' => 3,
            'expires_at' => $expiresAt,
        ]);

        // Notify all secretaries about new document request
        try {
            $secretaries = User::where('role', 'secretary')->get();
            $title = $this->resolveDocumentTitle($req->type);
            
            foreach ($secretaries as $secretary) {
                DbNotification::create([
                    'type' => 'new_document_request',
                    'notifiable_type' => 'App\\Models\\User',
                    'notifiable_id' => $secretary->id,
                    'data' => [
                        'title' => 'New Document Request',
                        'message' => "{$user->name} requested a {$title}",
                        'request_id' => $req->id,
                        'requester_name' => $user->name,
                        'document_type' => $title,
                        'urgency' => $req->urgency,
                    ],
                    'read_at' => null,
                ]);
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['data' => $req], 201);
    }

    // Secretary/Admin updates status: approve/reject and optionally assign
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!in_array($user->role, ['secretary', 'admin'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,approved,rejected',
            'assigned_to' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        $req = DocumentRequest::findOrFail($id);
        $oldStatus = $req->status;
        $req->status = $validated['status'];
        if (array_key_exists('assigned_to', $validated)) {
            $req->assigned_to = $validated['assigned_to'];
        }
        if (isset($validated['notes'])) {
            $req->notes = $validated['notes'];
        }
        if ($validated['status'] !== 'pending') {
            $req->processed_at = now();
        }
        $req->save();

        // Send notification to requesting user when status changes
        if ($oldStatus !== $req->status) {
            try {
                $req->refresh();
                if ($req->user) {
                    // create DB notification record using the Eloquent model
                    try {
                        DbNotification::create([
                            'type' => 'document_request_status_changed',
                            'notifiable_type' => 'App\\Models\\User',
                            'notifiable_id' => $req->user->id,
                            'data' => [
                                'title' => 'Request ' . ucfirst($req->status),
                                'message' => "Your request for {$req->type} has been updated to: {$req->status}.",
                                'request_id' => $req->id,
                                'status' => $req->status,
                                'notes' => $req->notes ?? null,
                            ],
                            'read_at' => null,
                        ]);
                    } catch (\Throwable $e) {
                        report($e);
                    }

                    // still send mail notification via the Notification system
                    try {
                        Notification::send($req->user, new DocumentRequestStatusChanged($req));
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }
            } catch (\Throwable $e) {
                // don't break on notification failure
                report($e);
            }
        }

        return response()->json(['data' => $req]);
    }

    // Download the approved document
    public function download(Request $request, $id)
    {
        $user = $request->user();
        $req = DocumentRequest::with('user')->findOrFail($id);

        // Check if approved
        if ($req->status !== 'approved') {
            return response()->json(['message' => 'Document not approved yet'], 403);
        }

        // Check permission: owner or admin/secretary
        if ($req->user_id !== $user->id && !in_array($user->role, ['admin', 'secretary'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Check if document has expired
        if ($req->expires_at && Carbon::parse($req->expires_at)->isPast()) {
            return response()->json(['message' => 'Document has expired'], 403);
        }

        // Check download limit (only for residents, not admin/secretary)
        if ($req->user_id === $user->id) {
            if ($req->download_count >= $req->max_downloads) {
                return response()->json(['message' => 'Download limit reached (3 downloads maximum)'], 403);
            }
            
            // Increment download count
            $req->increment('download_count');
        }

        $format = $request->query('format', 'pdf');
        $data = [
            'request' => $req,
            'user' => $req->user,
            'issued_at' => now()->format('F j, Y'),
            'title' => $this->resolveDocumentTitle($req->type),
        ];

        if ($format === 'docx') {
            return $this->generateDocx($req, $data);
        }

        return $this->generatePdf($req, $data);
    }

    private function generatePdf($req, $data)
    {
        $view = $this->resolveDocumentView($req->type);
        $pdf = Pdf::loadView($view, $data);

        $filename = str_replace(' ', '_', strtolower($this->resolveDocumentTitle($req->type))) . '.pdf';
        return $pdf->download($filename);
    }

    private function generateDocx($req, $data)
    {
        $phpWord = new PhpWord();
        $section = $phpWord->addSection();
        $title = $this->resolveDocumentTitle($req->type);

        // Add content based on type
        $section->addText('B. Del Mundo', ['bold' => true, 'size' => 14], ['alignment' => 'center']);
        $section->addText('Barangay ' . ($data['user']->barangay ?? 'Unknown'), ['bold' => true, 'size' => 12], ['alignment' => 'center']);
        $section->addText(strtoupper($title), ['bold' => true, 'size' => 16], ['alignment' => 'center']);
        $section->addTextBreak(2);

        $content = $this->getDocumentContent($req, $data);
        $section->addText($content);
        $section->addTextBreak(2);

        $section->addText('Issued on: ' . $data['issued_at']);
        $section->addTextBreak(3);

        $section->addText('___________________________', [], ['alignment' => 'center']);
        $section->addText('Barangay Captain', [], ['alignment' => 'center']);

        $fileName = str_replace(' ', '_', strtolower($title)) . '.docx';
        $tempFile = tempnam(sys_get_temp_dir(), 'docx');
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempFile);

        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }

    private function getDocumentContent($req, $data)
    {
        $user = $data['user'];
        $slug = $this->normalizeDocumentSlug($req->type);
        $title = $this->resolveDocumentTitle($req->type);
        $notes = $req->notes ?: 'Not specified';

        switch ($slug) {
            case 'barangay_clearance':
                return "This is to certify that {$user->name}, residing at {$user->address}, is a resident of this barangay and has no derogatory record on file.\n\nThis clearance is issued upon request.";
            case 'certificate_of_residency':
                $birth = $user->birthdate ? 'born on ' . Carbon::parse($user->birthdate)->format('F j, Y') : '';
                return "This is to certify that {$user->name}, of legal age, {$birth}, and a resident of {$user->address}, has been residing in this barangay for the required period.\n\nThis certificate is issued upon request.";
            case 'business_permit':
                return "This permit is granted to {$user->name}, owner of the business located at {$user->address}, to operate in this barangay.\n\nBusiness Type: {$notes}\n\nThis permit is valid for one year from the date of issuance.";
            case 'certificate_of_indigency':
                $purpose = $req->notes ?: 'various government assistance programs';
                return "This is to certify that {$user->name}, residing at {$user->address}, is an indigent resident of this barangay.\n\nThis certificate is issued for the purpose of {$purpose}.";
            case 'good_moral_certificate':
                return "This is to certify that {$user->name} is a resident in good standing of Barangay {$user->barangay} and is known to have exhibited good moral character.\n\nIssued upon request.";
            case 'permit_fiesta':
            case 'permit_to_fiesta':
                return "This permit authorizes {$user->name} to conduct community festivities at {$user->address}.\n\nThe holder is expected to observe barangay ordinances and maintain peace and order.";
            case 'birth_certificate':
                return "This document records the birth of {$user->name}.\n\nRegistered address: {$user->address}.";
            case 'death_certificate':
                return "This document records the passing of {$user->name}.\n\nDetails: {$notes}.";
            case 'blotter_certificate':
                return "This certifies that {$user->name} has blotter record details as follows: {$notes}.";
            default:
                return "{$title} issued to {$user->name}, residing at {$user->address}.\n\nAdditional Notes: {$notes}.";
        }
    }

    private function normalizeDocumentSlug(string $type): string
    {
        $slug = strtolower(trim($type));
        $slug = str_replace(' ', '_', $slug);

        return $this->documentTypeAliases[$slug] ?? $slug;
    }

    private function resolveDocumentTitle(string $type): string
    {
        $slug = $this->normalizeDocumentSlug($type);
        return $this->documentTitleOverrides[$slug] ?? ucwords(str_replace('_', ' ', $slug));
    }

    private function resolveDocumentView(string $type): string
    {
        $slug = $this->normalizeDocumentSlug($type);
        $view = 'documents.' . $slug;

        if (!View::exists($view)) {
            return 'documents.generic';
        }

        return $view;
    }
}
