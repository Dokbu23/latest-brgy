<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Barangay Document' }}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin: 20px 0; font-size: 14px; }
        .meta { margin-top: 20px; font-size: 13px; color: #555; }
        .signature { margin-top: 60px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>B. Del Mundo</h1>
        <h2>{{ $user->barangay ?? 'Unknown' }}</h2>
        <h3>{{ strtoupper($title ?? 'Barangay Document') }}</h3>
    </div>

    <div class="content">
        <p>This document certifies that <strong>{{ $user->name }}</strong>, residing at <strong>{{ $user->address ?? 'Not specified' }}</strong>, requested the issuance of <strong>{{ $title ?? 'this document' }}</strong>.</p>

        @if(!empty($request->notes))
            <p><strong>Additional Notes / Purpose:</strong> {{ $request->notes }}</p>
        @endif

        <p>Issued on {{ $issued_at }} for any lawful purpose it may serve.</p>
    </div>

    <div class="meta">
        <p>Reference #: {{ str_pad($request->id, 4, '0', STR_PAD_LEFT) }}</p>
        @if(!empty($request->processed_at))
            <p>Processed: {{ \Carbon\Carbon::parse($request->processed_at)->format('F j, Y') }}</p>
        @endif
    </div>

    <div class="signature">
        <p>___________________________</p>
        <p>Barangay Captain</p>
    </div>
</body>
</html>
