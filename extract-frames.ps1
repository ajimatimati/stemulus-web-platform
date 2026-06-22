Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName WindowsBase

$videoPath = 'C:\Users\USER\Downloads\2026-05-30 23-02-48.mp4'
$outputDir = 'C:\Users\USER\Downloads\scrub_frames'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$player = New-Object System.Windows.Media.MediaPlayer
$player.ScrubbingEnabled = $true
$player.Open([Uri]::new($videoPath))
Start-Sleep -Seconds 3

$duration = $player.NaturalDuration.TimeSpan.TotalSeconds
Write-Host "Duration: $duration seconds | W: $($player.NaturalVideoWidth) H: $($player.NaturalVideoHeight)"

$timestamps = @(0, 3, 6, 9, 12, 15, 18, 21, 24, 27)

foreach ($t in $timestamps) {
    $player.Position = [TimeSpan]::FromSeconds($t)
    Start-Sleep -Milliseconds 1000
    
    $W = 1280; $H = 720
    $drawingVisual = New-Object System.Windows.Media.DrawingVisual
    $dc = $drawingVisual.RenderOpen()
    $videoDrawing = New-Object System.Windows.Media.VideoDrawing
    $videoDrawing.Player = $player
    $videoDrawing.Rect = [System.Windows.Rect]::new(0, 0, $W, $H)
    $dc.DrawDrawing($videoDrawing)
    $dc.Close()
    
    $renderBitmap = New-Object System.Windows.Media.Imaging.RenderTargetBitmap($W, $H, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
    $renderBitmap.Render($drawingVisual)
    
    $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($renderBitmap))
    
    $outPath = Join-Path $outputDir "frame_${t}s.png"
    $stream = [System.IO.File]::OpenWrite($outPath)
    $encoder.Save($stream)
    $stream.Close()
    Write-Host "Saved frame at ${t}s -> $outPath"
}

$player.Close()
Write-Host "All frames extracted."
