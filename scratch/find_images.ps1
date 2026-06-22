$images = @()
$htmlFiles = Get-ChildItem -Recurse -Include *.html -Path "c:\Users\USER\OneDrive\Desktop\HTMLCSSJS GEM STEMulus"
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    $matches = [regex]::Matches($content, '<img\s+[^>]*src=["'']([^"'']+)["'']')
    foreach ($m in $matches) {
        $images += [PSCustomObject]@{
            File = $file.Name
            Src  = $m.Groups[1].Value
        }
    }
}
$images | Group-Object Src | ForEach-Object {
    [PSCustomObject]@{
        Src = $_.Name
        Occurrences = $_.Count
        UsedIn = ($_.Group | ForEach-Object { $_.File } | Select-Object -Unique) -join ", "
    }
} | Format-Table -AutoSize
