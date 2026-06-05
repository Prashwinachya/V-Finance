<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>VFinance</title>
        @if ($useDevServer)
            <script type="module" src="{{ $devServerUrl }}/@vite/client"></script>
            <script type="module" src="{{ $devServerUrl }}/src/main.jsx"></script>
        @elseif ($entry)
            @foreach (($entry['css'] ?? []) as $cssFile)
                <link rel="stylesheet" href="{{ asset('vfinance/'.$cssFile) }}">
            @endforeach
            <script type="module" src="{{ asset('vfinance/'.$entry['file']) }}"></script>
        @endif
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>