<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Certificate of Indigency</title>
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
        <h3>CERTIFICATE OF INDIGENCY</h3>
    </div>

    <div class="content">
        <p>This is to certify that <strong>{{ $user->name }}</strong>, residing at <strong>{{ $user->address }}</strong>, is an indigent resident of this barangay.</p>

        <p>This certificate is issued for the purpose of <strong>{{ $request->notes ?? 'various government assistance programs' }}</strong>.</p>

        <p>Issued on: {{ $issued_at }}</p>
    </div>

    <div class="signature">
        <p>___________________________</p>
        <p>Barangay Captain</p>
    </div>
</body>
</html>