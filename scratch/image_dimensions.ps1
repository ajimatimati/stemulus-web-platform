Add-Type -AssemblyName System.Drawing
$folders = @(
    "c:\Users\USER\OneDrive\Desktop\HTMLCSSJS GEM STEMulus\",
    "c:\Users\USER\OneDrive\Desktop\HTMLCSSJS GEM STEMulus\images\",
    "c:\Users\USER\OneDrive\Desktop\HTMLCSSJS GEM STEMulus\assets\images\"
)

$out = @()
foreach ($folder in $folders) {
    $files = Get-ChildItem $folder -File
    foreach ($file in $files) {
        if ($file.Extension -in @(".png", ".jpg", ".jpeg", ".webp")) {
            try {
                $bmp = New-Object System.Drawing.Bitmap($file.FullName)
                $width = $bmp.Width
                $height = $bmp.Height
                $bmp.Dispose()
                $out += [PSCustomObject]@{
                    Folder = (Split-Path $folder -Leaf)
                    Name = $file.Name
                    SizeKB = [math]::Round($file.Length / 1KB, 1)
                    Width = $width
                    Height = $height
                    Ratio = "$($width)x$($height)"
                }
            } catch {
                # Skip if not an image
            }
        }
    }
}
$out | Format-Table -AutoSize
