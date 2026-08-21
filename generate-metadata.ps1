# Generate photos.json metadata for Prologue Cross photo gallery
# This script creates the JSON file needed by the website

# =================================================================
# EDIT THESE PATHS TO MATCH YOUR FOLDERS:
# =================================================================
$highResPath = "Z:\Prologue CX 2026\Prologue CX 2026"
$thumbnailPath = "Z:\Prologue CX 2026\Prologue CX 2026 Thumbnails"
$outputJsonPath = "Z:\Prologue CX 2026\photos.json"

Write-Host "===== Prologue Cross Metadata Generator ====="
Write-Host ""

# Check if folders exist
if (-not (Test-Path $highResPath)) {
    Write-Host "ERROR: High-res folder not found: $highResPath" -ForegroundColor Red
    exit
}

if (-not (Test-Path $thumbnailPath)) {
    Write-Host "ERROR: Thumbnail folder not found: $thumbnailPath" -ForegroundColor Red
    exit
}

# Get all image files from both folders
$highResFiles = Get-ChildItem -Path $highResPath -Filter "*.jpg" -File | Sort-Object Name
$thumbnailFiles = Get-ChildItem -Path $thumbnailPath -Filter "*.jpg" -File | Sort-Object Name

Write-Host "Found $($highResFiles.Count) high-res photos"
Write-Host "Found $($thumbnailFiles.Count) thumbnails"

# Create photo metadata array
$photos = @()
$photoId = 1

foreach ($highResFile in $highResFiles) {
    # Try to find matching thumbnail
    $thumbnailFile = $thumbnailFiles | Where-Object { $_.BaseName -eq $highResFile.BaseName }
    
    if ($thumbnailFile) {
        $photo = @{
            id = "photo_" + $photoId.ToString("000")
            filename = $highResFile.Name
            thumbnail_url = "/photos/event-2026/thumbnails/" + $thumbnailFile.Name
            highres_url = "/photos/event-2026/high-res/" + $highResFile.Name
            size_bytes = $highResFile.Length
            date_taken = $highResFile.CreationTime.ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
        $photos += $photo
        $photoId++
        
        if ($photoId % 50 -eq 0) {
            Write-Host "  Processed $photoId photos..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Warning: No thumbnail found for $($highResFile.Name)" -ForegroundColor Yellow
    }
}

# Create final JSON structure
$metadata = @{
    event = "Prologue Cyclocross 2026"
    date = "2026-09-21"
    total = $photos.Count
    generated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    version = "1.0"
    photos = $photos
}

# Convert to JSON and save
$jsonContent = $metadata | ConvertTo-Json -Depth 3 -Compress:$false
$jsonContent | Out-File -FilePath $outputJsonPath -Encoding UTF8

Write-Host ""
Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "Generated metadata for $($photos.Count) photos"
Write-Host "Saved to: $outputJsonPath"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Upload your high-res photos to: /photos/event-2026/high-res/"
Write-Host "2. Upload your thumbnails to: /photos/event-2026/thumbnails/"
Write-Host "3. Upload photos.json to: /photos/event-2026/photos.json"
Write-Host ""
Write-Host "Then your photo gallery will be ready!"
