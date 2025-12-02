<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Business Permit</title>
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

        <h3>BUSINESS PERMIT</h3>
    </div>

    <div class="content">
        <p>This permit is granted to <strong>{{ $user->name }}</strong>, owner of the business located at <strong>{{ $user->address }}</strong>, to operate in this barangay.</p>

        <p>Business Type: <strong>{{ $request->notes ?? 'Not specified' }}</strong></p>

        <p>This permit is valid for one year from the date of issuance.</p>

        <p>Issued on: {{ $issued_at }}</p>
    </div>

    <div class="signature">
        <p>___________________________</p>
        <p>Barangay Captain</p>
    </div>
</body>
</html>