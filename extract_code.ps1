$jsonText = Get-Content -Path 'C:\Users\bkia.net\.gemini\antigravity\scratch\found_doPost_line.json' -Raw
Write-Host "Raw Text Length: $($jsonText.Length)"
Write-Host "Raw Text Snippet: $($jsonText.Substring(0, 500))"
