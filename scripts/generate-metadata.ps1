# Generate photos.json for the Prologue Cross photo gallery.
#
# The gallery builds every path from the event year (photos.html: basePath =
# `/photos/event-${year}/`), so the year is a parameter here rather than three
# hard-coded strings. The previous version carried the year in four places and
# they had already drifted: the metadata said 2026 while every URL it wrote
# said event-2025, which would have pointed the whole 2026 gallery at the 2025
# folder.
#
# Usage, from the repo root:
#   pwsh scripts/generate-metadata.ps1 -Year 2026 -EventDate 2026-10-18 `
#       -HighResPath "D:\Prologue CX 2026\high-res" `
#       -ThumbnailPath "D:\Prologue CX 2026\thumbnails"
#
# Defaults write into photos/event-<Year>/ in the repo, which is also where the
# files need to sit before they go up to the server.

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^\d{4}$')]
    [string]$Year,

    # Race day, as the gallery reports it. Defaults to the folder's newest photo.
    [ValidatePattern('^\d{4}-\d{2}-\d{2}$')]
    [string]$EventDate,

    [string]$HighResPath,
    [string]$ThumbnailPath,
    [string]$OutputJsonPath
)

$ErrorActionPreference = 'Stop'

$eventRoot = Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'photos') "event-$Year"
if (-not $HighResPath) { $HighResPath = Join-Path $eventRoot 'high-res' }
if (-not $ThumbnailPath) { $ThumbnailPath = Join-Path $eventRoot 'thumbnails' }
if (-not $OutputJsonPath) { $OutputJsonPath = Join-Path $eventRoot 'photos.json' }

Write-Host "===== Prologue Cross Metadata Generator ====="
Write-Host "Year:       $Year"
Write-Host "High-res:   $HighResPath"
Write-Host "Thumbnails: $ThumbnailPath"
Write-Host "Output:     $OutputJsonPath"
Write-Host ""

foreach ($pair in @(@('High-res', $HighResPath), @('Thumbnail', $ThumbnailPath))) {
    if (-not (Test-Path $pair[1])) {
        Write-Host "ERROR: $($pair[0]) folder not found: $($pair[1])" -ForegroundColor Red
        exit 1
    }
}

# Match on extension rather than a -Filter, so a stray .zip or .db sitting in
# the folder is reported instead of silently skipped. A 2025 thumbnails folder
# shipped a stray 874A1140.zip to the server exactly this way.
$imageExtensions = @('.jpg', '.jpeg')
function Get-Images($path, $label) {
    $all = Get-ChildItem -Path $path -File
    $images = $all | Where-Object { $imageExtensions -contains $_.Extension.ToLowerInvariant() } | Sort-Object Name
    $strays = $all | Where-Object { $imageExtensions -notcontains $_.Extension.ToLowerInvariant() }
    foreach ($stray in $strays) {
        Write-Host "  Not an image, ignored in $label`: $($stray.Name)" -ForegroundColor Yellow
    }
    return $images
}

$highResFiles = Get-Images $HighResPath 'high-res'
$thumbnailFiles = Get-Images $ThumbnailPath 'thumbnails'

Write-Host "Found $($highResFiles.Count) high-res photos"
Write-Host "Found $($thumbnailFiles.Count) thumbnails"
Write-Host ""

# Index the thumbnails once. Matching with Where-Object inside the loop made
# this O(n^2), which is felt at ~500 photos.
$thumbnailsByName = @{}
foreach ($thumbnail in $thumbnailFiles) { $thumbnailsByName[$thumbnail.BaseName] = $thumbnail }

$photos = @()
$photoId = 1
$missingThumbnails = @()

foreach ($highResFile in $highResFiles) {
    $thumbnailFile = $thumbnailsByName[$highResFile.BaseName]
    if (-not $thumbnailFile) {
        $missingThumbnails += $highResFile.Name
        continue
    }

    # The old version stamped local time with a literal Z and called it UTC.
    $takenUtc = $highResFile.CreationTimeUtc
    if ($highResFile.LastWriteTimeUtc -lt $takenUtc) { $takenUtc = $highResFile.LastWriteTimeUtc }

    $photos += [ordered]@{
        id            = 'photo_' + $photoId.ToString('000')
        filename      = $highResFile.Name
        thumbnail_url = "/photos/event-$Year/thumbnails/" + $thumbnailFile.Name
        highres_url   = "/photos/event-$Year/high-res/" + $highResFile.Name
        size_bytes    = $highResFile.Length
        date_taken    = $takenUtc.ToString('yyyy-MM-ddTHH:mm:ssZ')
    }
    $photoId++

    if ($photoId % 50 -eq 0) { Write-Host "  Processed $photoId photos..." -ForegroundColor DarkGray }
}

# Both directions are reported. The old script warned about high-res without a
# thumbnail but said nothing about a thumbnail with no high-res behind it, so an
# orphan thumbnail would upload and never be referenced.
$orphanThumbnails = $thumbnailFiles |
    Where-Object { -not ($highResFiles.BaseName -contains $_.BaseName) } |
    ForEach-Object { $_.Name }

foreach ($name in $missingThumbnails) {
    Write-Host "  Warning: no thumbnail for $name - photo excluded" -ForegroundColor Yellow
}
foreach ($name in $orphanThumbnails) {
    Write-Host "  Warning: thumbnail $name has no high-res photo" -ForegroundColor Yellow
}

if ($photos.Count -eq 0) {
    Write-Host "ERROR: no photo matched a thumbnail; nothing written." -ForegroundColor Red
    exit 1
}

if (-not $EventDate) {
    $EventDate = ($photos.date_taken | Sort-Object | Select-Object -Last 1).Substring(0, 10)
    Write-Host ""
    Write-Host "No -EventDate given; using the newest photo's date: $EventDate" -ForegroundColor Yellow
}

$metadata = [ordered]@{
    event     = "Prologue Cyclocross $Year"
    version   = '1.0'
    total     = $photos.Count
    date      = $EventDate
    photos    = $photos
    generated = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
}

New-Item -ItemType Directory -Force -Path (Split-Path $OutputJsonPath -Parent) | Out-Null

# UTF-8 without a BOM: the 2025 file carries one, and JSON.parse chokes on it
# in some readers even though the gallery's fetch happens to cope.
$json = $metadata | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($OutputJsonPath, $json, (New-Object System.Text.UTF8Encoding $false))

Write-Host ""
Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "Generated metadata for $($photos.Count) photos"
Write-Host "Saved to: $OutputJsonPath"
Write-Host ""
Write-Host "Next steps - upload to the web server:"
Write-Host "  high-res photos -> /photos/event-$Year/high-res/"
Write-Host "  thumbnails      -> /photos/event-$Year/thumbnails/"
Write-Host "  photos.json     -> /photos/event-$Year/photos.json"
Write-Host ""
Write-Host "Then add a $Year button to the gallery year picker in photos.html."
