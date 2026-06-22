# prepare-deploy.ps1
# Prepares the project for Netlify Drop by creating a clean 'dist' folder using Robocopy.

# Define source and destination
$sourceDir = Get-Location
$distDir = Join-Path $sourceDir "dist"

# 1. Clean up previous build
if (Test-Path $distDir) {
    Write-Host "Cleaning existing dist folder..." -ForegroundColor Yellow
    try {
        Remove-Item -Path $distDir -Recurse -Force -ErrorAction Stop
    } catch {
        Write-Host "Error: Could not remove existing dist folder. Ensure no files are open." -ForegroundColor Red
        exit
    }
}

# 2. Create dist folder
New-Item -ItemType Directory -Path $distDir | Out-Null
Write-Host "Created dist folder at $distDir" -ForegroundColor Green

# 3. Use Robocopy for robust copying and exclusion
Write-Host "Copying files using Robocopy..." -ForegroundColor Cyan

# Define exclusions as arrays
$excludeDirs = @(".git", ".vscode", ".gemini", "dist", "node_modules", "tools", "bin", "obj")
$excludeFiles = @("prepare-deploy.ps1", "package.json", "package-lock.json", "*.md", "*.sql", ".DS_Store", "Thumbs.db", "desktop.ini", "*.log", "*.ps1", "netlify.toml")

# Execute Robocopy directly using the call operator (&)
# /A-:SH removes System and Hidden attributes from copied files
& robocopy $sourceDir $distDir /E /XD $excludeDirs /XF $excludeFiles /R:0 /W:0 /NFL /NDL /NJH /NJS /A-:SH

# Check Robocopy Exit Code
if ($LASTEXITCODE -ge 8) {
    Write-Host "`nRobocopy encountered errors (Exit Code: $LASTEXITCODE)." -ForegroundColor Red
    exit
}

# 4. Fix Case Sensitivity (Index.html -> index.html)
# Netlify is case-sensitive. Index.html might not be served as the default page.
$indexPath = Join-Path $distDir "Index.html"
if (Test-Path $indexPath) {
    Write-Host "Renaming Index.html to index.html for case-sensitivity..." -ForegroundColor Yellow
    Rename-Item -Path $indexPath -NewName "index.html"
}

Write-Host "`nBuild complete!" -ForegroundColor Green
Write-Host "The 'dist' folder is ready for Netlify Drop." -ForegroundColor White
