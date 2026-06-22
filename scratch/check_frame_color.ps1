Add-Type -AssemblyName System.Drawing
$file = "C:\Users\USER\.gemini\antigravity\brain\55b7a09f-b3b8-4fda-bf67-a9324d0b6861\scratch\frame.png"
if (Test-Path $file) {
    $bmp = New-Object System.Drawing.Bitmap($file)
    $c1 = $bmp.GetPixel(100, 100)
    $c2 = $bmp.GetPixel(960, 50)
    $c3 = $bmp.GetPixel(1800, 500)
    $c4 = $bmp.GetPixel(100, 540)
    $bmp.Dispose()
    Write-Output "c1 (100,100): $($c1.R),$($c1.G),$($c1.B)"
    Write-Output "c2 (960,50): $($c2.R),$($c2.G),$($c2.B)"
    Write-Output "c3 (1800,500): $($c3.R),$($c3.G),$($c3.B)"
    Write-Output "c4 (100,540): $($c4.R),$($c4.G),$($c4.B)"
} else {
    Write-Output "File does not exist"
}
