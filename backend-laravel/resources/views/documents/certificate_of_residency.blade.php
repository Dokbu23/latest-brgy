<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Certificate of Residency</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            color: white;
            text-align: center;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .header h3 {
            margin: 5px 0 0 0;
            font-size: 18px;
            opacity: 0.9;
        }
        .content {
            background: white;
            padding: 30px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .signature {
            margin-top: 50px;
            text-align: center;
        }
        .footer {
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            color: white;
            text-align: center;
            padding: 15px;
            margin-top: 30px;
            border-radius: 8px;
            font-size: 12px;
        }
        .footer p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Republic of the Philippines</h1>
        <h1>Province of [Province]</h1>
        <h1>Municipality of [Municipality]</h1>
        <h1>Barangay B. Del Mundo</h1>
        <h3>OFFICE OF THE BARANGAY CAPTAIN</h3>
    </div>

    <div class="content">
        <h2 style="text-align: center; color: #8b5cf6; margin-bottom: 30px;">CERTIFICATE OF RESIDENCY</h2>

        <p>This is to certify that <strong>{{ $user->name }}</strong>, of legal age, {{ $user->birthdate ? 'born on ' . \Carbon\Carbon::parse($user->birthdate)->format('F j, Y') : '' }}, and a resident of <strong>{{ $user->address }}</strong>, has been residing in this barangay for the required period.</p>

        @if(!empty($request->notes))
            <p>This certificate is issued upon request for the purpose of <strong>{{ $request->notes }}</strong>.</p>
        @else
            <p>This certificate is issued upon request.</p>
        @endif

        <p>Issued on: {{ $issued_at }}</p>
    </div>

    <div class="signature">
        <p>___________________________</p>
        <p>Barangay Captain</p>
    </div>

    <div class="footer">
        <p>This document is issued by Barangay B. Del Mundo and is valid for [duration] from date of issuance.</p>
        <p>For verification, contact Barangay Hall at [contact information]</p>
        <p>Document ID: {{ $request->id }} | Issued: {{ $issued_at }}</p>
    </div>
</body>
</html>