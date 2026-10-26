# Generate photos.json for the Prologue Cross photo gallery.
#
# The gallery builds every path from the event year (photos.html: basePath =
# `/photos/event-${year}/`), so the year is a parameter here rather than three
# hard-coded strings. The previous version carried the year in four places and
# they had already drifted: the metadata said 2026 while every URL it wrote
# said event-2025, which would have pointed the whole 2026 gallery at the 2025
# folder.
#
# Usage, from the repo root. This is the 2026 gallery as published: a
# photographer left out of -Photographers leaves their photos uncredited.
#   pwsh scripts/generate-metadata.ps1 -Year 2026 -EventDate 2026-10-18 `
#       -Photographers @{ 'R6II' = 'Jamie Gonzalez'; 'IMG_' = 'Marija Gonzalez Najera';
#                         'Prologue-CX-2026-' = 'Jeff Faulds' } `
#       -PhotographerLinks @{ 'Jeff Faulds' = 'https://fauldsphotography.com/index.php/prologue-cx-2026/' }
#
# Defaults write into photos/event-<Year>/ in the repo, which is also where the
# files need to sit before they go up to the server.
#
# Bib tags, when the year has them, sit beside photos.json as bibs.json:
#   { "R6II0603.jpg": { "5": "number" }, "IMG_8071.jpg": { "204": "kit" } }
# "number" means the bib was read in the photo; "kit" means the number is hidden
# and the rider was matched by kit to a photo where it was read. They are merged
# into each photo here, so regenerating photos.json never drops them.
#
# Beside them, bib_sizes.json gives how much of the frame each tagged rider
# fills, 0 to 1, so the gallery can pick a rider's close-ups:
#   { "R6II0603.jpg": { "5": 0.183 } }
#
# Race results, when the year has them, sit beside it as results.json:
#   { "results": { "204": { "race": "Master Women 35+", "place": 1, ... } },
#     "same_rider": [["240", "289"]] }
# Bib numbers only, never names. They are copied to the top of photos.json.
#
# A camera that wrote no capture time leaves its photos' times to times.json,
# beside photos.json: { "Prologue-CX-2026-27.jpg": "2026-10-18T18:15:00Z" }.
# Those times are estimates, worked out from the riders in each photo and the
# order the photographer numbered them, so the photo is marked time_estimated
# and the gallery places it in its race without claiming a clock time.

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
    [string]$OutputJsonPath,

    # Who shot what, keyed by filename prefix. Each camera names its files its
    # own way, so the prefix is the most reliable credit there is: one of the
    # two 2026 cameras exported with its EXIF artist field blanked.
    [hashtable]$Photographers = @{},

    # A photographer's own gallery, keyed by their name; the credit links to it.
    [hashtable]$PhotographerLinks = @{},

    [string]$BibsPath,

    [string]$SizesPath,

    [string]$ResultsPath,

    [string]$TimesPath
)

$ErrorActionPreference = 'Stop'

$eventRoot = Join-Path (Join-Path (Split-Path $PSScriptRoot -Parent) 'photos') "event-$Year"
if (-not $HighResPath) { $HighResPath = Join-Path $eventRoot 'high-res' }
if (-not $ThumbnailPath) { $ThumbnailPath = Join-Path $eventRoot 'thumbnails' }
if (-not $OutputJsonPath) { $OutputJsonPath = Join-Path $eventRoot 'photos.json' }
if (-not $BibsPath) { $BibsPath = Join-Path $eventRoot 'bibs.json' }

if (-not $ResultsPath) { $ResultsPath = Join-Path $eventRoot 'results.json' }
$raceResults = $null
if (Test-Path $ResultsPath) {
    $raceResults = Get-Content $ResultsPath -Raw | ConvertFrom-Json -AsHashtable
}

$bibs = @{}
if (Test-Path $BibsPath) {
    $bibs = Get-Content $BibsPath -Raw | ConvertFrom-Json -AsHashtable
}

if (-not $SizesPath) { $SizesPath = Join-Path $eventRoot 'bib_sizes.json' }
$sizes = @{}
if (Test-Path $SizesPath) {
    $sizes = Get-Content $SizesPath -Raw | ConvertFrom-Json -AsHashtable
}

if (-not $TimesPath) { $TimesPath = Join-Path $eventRoot 'times.json' }
$estimatedTimes = @{}
if (Test-Path $TimesPath) {
    # -DateKind String keeps each time as written; otherwise ConvertFrom-Json
    # turns it into a local DateTime.
    $estimatedTimes = Get-Content $TimesPath -Raw | ConvertFrom-Json -AsHashtable -DateKind String
}

Write-Host "===== Prologue Cross Metadata Generator ====="
Write-Host "Year:       $Year"
Write-Host "High-res:   $HighResPath"
Write-Host "Thumbnails: $ThumbnailPath"
Write-Host "Output:     $OutputJsonPath"
Write-Host "Bib tags:   $(if ($bibs.Count) { "$BibsPath ($($bibs.Count) photos)" } else { 'none' })"
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
$uncredited = @()
$creditCounts = [ordered]@{}

function Get-Photographer($name) {
    foreach ($prefix in $Photographers.Keys) {
        if ($name.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $Photographers[$prefix]
        }
    }
    return $null
}

foreach ($highResFile in $highResFiles) {
    $thumbnailFile = $thumbnailsByName[$highResFile.BaseName]
    if (-not $thumbnailFile) {
        $missingThumbnails += $highResFile.Name
        continue
    }

    # The old version stamped local time with a literal Z and called it UTC.
    $takenUtc = $highResFile.CreationTimeUtc
    if ($highResFile.LastWriteTimeUtc -lt $takenUtc) { $takenUtc = $highResFile.LastWriteTimeUtc }
    $estimated = $estimatedTimes.ContainsKey($highResFile.Name)
    if ($estimated) {
        $takenUtc = [DateTimeOffset]::Parse($estimatedTimes[$highResFile.Name]).UtcDateTime
    }

    $photo = [ordered]@{
        id            = 'photo_' + $photoId.ToString('000')
        filename      = $highResFile.Name
        thumbnail_url = "/photos/event-$Year/thumbnails/" + $thumbnailFile.Name
        highres_url   = "/photos/event-$Year/high-res/" + $highResFile.Name
        size_bytes    = $highResFile.Length
        date_taken    = $takenUtc.ToString('yyyy-MM-ddTHH:mm:ssZ')
    }
    if ($estimated) { $photo.time_estimated = $true }
    $photographer = Get-Photographer $highResFile.Name
    if ($photographer) {
        $photo.photographer = $photographer
        $creditCounts[$photographer] = 1 + [int]$creditCounts[$photographer]
    } elseif ($Photographers.Count) {
        $uncredited += $highResFile.Name
    }
    if ($bibs.ContainsKey($highResFile.Name)) { $photo.bibs = $bibs[$highResFile.Name] }
    if ($sizes.ContainsKey($highResFile.Name)) { $photo.sizes = $sizes[$highResFile.Name] }
    $photos += $photo
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
foreach ($name in $bibs.Keys | Where-Object { -not ($highResFiles.Name -contains $_) }) {
    Write-Host "  Warning: bibs.json tags $name, which is not in high-res" -ForegroundColor Yellow
}
foreach ($name in $estimatedTimes.Keys | Where-Object { -not ($highResFiles.Name -contains $_) }) {
    Write-Host "  Warning: times.json times $name, which is not in high-res" -ForegroundColor Yellow
}
foreach ($name in $uncredited) {
    Write-Host "  Warning: no -Photographers prefix matches $name - photo uncredited" -ForegroundColor Yellow
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
    # Busiest photographer first, which is the order the gallery credits them in.
    photographers = @($creditCounts.GetEnumerator() | Sort-Object Value -Descending |
        ForEach-Object {
            $credit = [ordered]@{ name = $_.Key; photos = $_.Value }
            if ($PhotographerLinks.ContainsKey($_.Key)) { $credit.url = $PhotographerLinks[$_.Key] }
            $credit
        })
    photos    = $photos
    generated = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
}
if ($raceResults) {
    $metadata.results = $raceResults.results
    $metadata.same_rider = $raceResults.same_rider
}

New-Item -ItemType Directory -Force -Path (Split-Path $OutputJsonPath -Parent) | Out-Null

# UTF-8 without a BOM: the 2025 file carries one, and JSON.parse chokes on it
# in some readers even though the gallery's fetch happens to cope.
$json = $metadata | ConvertTo-Json -Depth 6
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
