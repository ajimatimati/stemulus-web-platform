$file = "c:\Users\USER\OneDrive\Desktop\HTMLCSSJS GEM STEMulus\index.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# 1. Verify #page-content exists and isn't closed yet
$pcOpen  = $content.IndexOf('<div id="page-content">')
$pcClose = $content.IndexOf('</div><!-- /page-content -->')
Write-Host "#page-content opens at: $pcOpen"
Write-Host "#page-content close tag exists: $($pcClose -gt 0)"

# 2. Close #page-content just before </body>
$bodyClose = $content.LastIndexOf('</body>')
Write-Host "</body> at: $bodyClose"

if ($pcClose -lt 0 -and $bodyClose -gt 0) {
    Write-Host "Inserting </div><!-- /page-content --> before </body>..."
    $newContent = $content.Substring(0, $bodyClose) + "`n</div><!-- /page-content -->`n" + $content.Substring($bodyClose)
    [System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
    Write-Host "Done."
} else {
    Write-Host "page-content close already exists or </body> not found."
}

# 3. Remove the conflicting inline nav ScrollTrigger (from old approach)
$file2 = "c:\Users\USER\OneDrive\Desktop\HTMLCSSJS GEM STEMulus\index.html"
$c2 = [System.IO.File]::ReadAllText($file2, [System.Text.Encoding]::UTF8)

$oldNavTrigger = "    // 10. Nav: stays always readable since hero is now bright"
$idx = $c2.IndexOf($oldNavTrigger)
Write-Host "Old nav trigger found at: $idx"

if ($idx -gt 0) {
    # Find the closing }); of this ScrollTrigger block
    $closeIdx = $c2.IndexOf("})`r`n});", $idx)
    if ($closeIdx -lt 0) {
        $closeIdx = $c2.IndexOf("});`r`n</script>", $idx)
    }
    Write-Host "Block ends at: $closeIdx"
}
