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
        'clearance' => 'barangay_clearance',
        'barangay_clearance' => 'barangay_clearance',
    ];

    protected array $documentTitleOverrides = [
        'barangay_clearance' => 'Barangay Clearance',
        'certificate_of_indigency' => 'Certificate of Indigency',
        'certificate_of_residency' => 'Certificate of Residency',
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
            'max_downloads' => 1,
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
                return response()->json(['message' => "Download limit reached ({$req->max_downloads} downloads maximum)"], 403);
            }
            
            // Increment download count
            $req->increment('download_count');
            $req->refresh();

            // If we've reached or exceeded the max downloads, expire the document immediately
            if ($req->download_count >= $req->max_downloads) {
                $req->expires_at = now();
                $req->save();
            }
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

        // Header with violet styling (simulated with text formatting)
        $headerText = $section->addTextRun(['alignment' => 'center']);
        $headerText->addText('Republic of the Philippines', ['bold' => true, 'size' => 12, 'color' => '8B5CF6']);
        $section->addTextBreak(1);
        $headerText = $section->addTextRun(['alignment' => 'center']);
        $headerText->addText('Province of [Province]', ['bold' => true, 'size' => 12, 'color' => '8B5CF6']);
        $section->addTextBreak(1);
        $headerText = $section->addTextRun(['alignment' => 'center']);
        $headerText->addText('Municipality of [Municipality]', ['bold' => true, 'size' => 12, 'color' => '8B5CF6']);
        $section->addTextBreak(1);
        $headerText = $section->addTextRun(['alignment' => 'center']);
        $headerText->addText('Barangay B. Del Mundo', ['bold' => true, 'size' => 14, 'color' => '8B5CF6']);
        $section->addTextBreak(1);
        $headerText = $section->addTextRun(['alignment' => 'center']);
        $headerText->addText('OFFICE OF THE BARANGAY CAPTAIN', ['bold' => true, 'size' => 11, 'color' => 'A855F7']);
        $section->addTextBreak(2);

        $title = $this->resolveDocumentTitle($req->type);
        $section->addText(strtoupper($title), ['bold' => true, 'size' => 16, 'color' => '8B5CF6'], ['alignment' => 'center']);
        $section->addTextBreak(2);

        $content = $this->getDocumentContent($req, $data);
        $section->addText($content);
        $section->addTextBreak(2);

        $section->addText('Issued on: ' . $data['issued_at']);
        $section->addTextBreak(3);

        $section->addText('___________________________', [], ['alignment' => 'center']);
        $section->addText('Barangay Captain', [], ['alignment' => 'center']);
        $section->addTextBreak(2);

        // Footer with violet styling
        $footerText = $section->addTextRun(['alignment' => 'center']);
        $footerText->addText('This document is issued by Barangay B. Del Mundo and is valid for [duration] from date of issuance.', ['size' => 9, 'color' => '8B5CF6']);
        $section->addTextBreak(1);
        $footerText = $section->addTextRun(['alignment' => 'center']);
        $footerText->addText('For verification, contact Barangay Hall at [contact information]', ['size' => 9, 'color' => '8B5CF6']);
        $section->addTextBreak(1);
        $footerText = $section->addTextRun(['alignment' => 'center']);
        $footerText->addText('Document ID: ' . $req->id . ' | Issued: ' . $data['issued_at'], ['size' => 9, 'color' => '8B5CF6']);

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
            case 'certificate_of_indigency':
                $purpose = $req->notes ?: 'various government assistance programs';
                return "This is to certify that {$user->name}, residing at {$user->address}, is an indigent resident of this barangay.\n\nThis certificate is issued for the purpose of {$purpose}.";
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
