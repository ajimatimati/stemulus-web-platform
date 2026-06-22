# Extract all image assets referenced in HTML and CSS files

$workspace = "c:\Users\USER\OneDrive\Desktop\HTMLCSSJS GEM STEMulus"
$images = @{}

# Helper to register an image reference
function Register-Image($src, $file, $sourceType) {
    if (-not $images.ContainsKey($src)) {
        $images[$src] = @{
            "src" = $src
            "referenced_in" = @()
            "source_type" = $sourceType
        }
    }
    # Add if not already present
    $ref = "$file ($sourceType)"
    if ($images[$src].referenced_in -notcontains $ref) {
        $images[$src].referenced_in += $ref
    }
}

# 1. Scan HTML files for img tags and inline styles
Get-ChildItem -Path $workspace -Filter *.html | ForEach-Object {
    $file = $_.Name
    $content = Get-Content $_.FullName -Raw
    
    # Match <img ... src="path" ...>
    $imgMatches = [regex]::Matches($content, '<img[^>]+src=["'']([^"'']+)["''][^>]*>')
    foreach ($m in $imgMatches) {
        $src = $m.Groups[1].Value
        Register-Image $src $file "HTML Img Tag"
    }

    # Match background-image: url(...) in style attributes
    $urlMatches = [regex]::Matches($content, 'url\(["'']?([^'"\)]+\.(?:png|jpg|jpeg|svg|webp|gif))["'']?\)')
    foreach ($m in $urlMatches) {
        $src = $m.Groups[1].Value
        Register-Image $src $file "HTML inline / CSS style"
    }
}

# 2. Scan CSS files for url(...)
Get-ChildItem -Path $workspace -Filter *.css | ForEach-Object {
    $file = $_.Name
    $content = Get-Content $_.FullName -Raw
    
    $urlMatches = [regex]::Matches($content, 'url\(["'']?([^'"\)]+\.(?:png|jpg|jpeg|svg|webp|gif))["'']?\)')
    foreach ($m in $urlMatches) {
        $src = $m.Groups[1].Value
        Register-Image $src $file "CSS file"
    }
}

# Output to JSON
$outputObj = @()
foreach ($key in $images.Keys) {
    $outputObj += $images[$key]
}

$outputObj | ConvertTo-Json -Depth 5 | Set-Content -Path "$workspace\scratch\images_audit.json"
Write-Host "Extracted $($images.Count) unique image assets."
