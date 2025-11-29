<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Certificate of Residency</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin: 20px 0; }
        .signature { margin-top: 50px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>B. Del Mundo</h1>
        <h2>{{ $user->barangay ?? 'Unknown' }}</h2>
        <h3>CERTIFICATE OF RESIDENCY</h3>
    </div>

    <div class="content">
        <p>This is to certify that <strong>{{ $user->name }}</strong>, of legal age, {{ $user->birthdate ? 'born on ' . \Carbon\Carbon::parse($user->birthdate)->format('F j, Y') : '' }}, and a resident of <strong>{{ $user->address }}</strong>, has been residing in this barangay for the required period.</p>

        <p>This certificate is issued upon request for <strong>{{ $request->type }}</strong>.</p>

        <p>Issued on: {{ $issued_at }}</p>
    </div>

    <div class="signature">
        <p>___________________________</p>
        <p>Barangay Captain</p>
    </div>
</body>
</html>