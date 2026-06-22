Add-Type -AssemblyName System.Drawing
$first = "C:\Users\USER\.gemini\antigravity\brain\55b7a09f-b3b8-4fda-bf67-a9324d0b6861\scratch\frame_first.png"
$last = "C:\Users\USER\.gemini\antigravity\brain\55b7a09f-b3b8-4fda-bf67-a9324d0b6861\scratch\frame_last.png"

# Extract first frame (0.0s)
Start-Process -FilePath "ffmpeg" -ArgumentList "-y -ss 00:00:00 -i Robot_scrub.mp4 -frames:v 1 `"$first`"" -NoNewWindow -Wait

# Extract last frame (9.9s)
Start-Process -FilePath "ffmpeg" -ArgumentList "-y -ss 00:00:09.9 -i Robot_scrub.mp4 -frames:v 1 `"$last`"" -NoNewWindow -Wait

if (Test-Path $first) {
    $bmp = New-Object System.Drawing.Bitmap($first)
    $c = $bmp.GetPixel(100, 100)
    $bmp.Dispose()
    Write-Output "First frame (100,100): $($c.R),$($c.G),$($c.B)"
}

if (Test-Path $last) {
    $bmp = New-Object System.Drawing.Bitmap($last)
    $c = $bmp.GetPixel(100, 100)
    $bmp.Dispose()
    Write-Output "Last frame (100,100): $($c.R),$($c.G),$($c.B)"
}
