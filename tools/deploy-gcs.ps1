[CmdletBinding()]
param(
    [string]$Bucket = "gs://www.waterworksdg.com",
    [switch]$Deploy,
    [switch]$Delete,
    [switch]$UseGsutil
)

$ErrorActionPreference = "Stop"

function Test-Command {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$excludePattern = "(^|[\\/])\.git([\\/]|$)|(^|[\\/])tools([\\/]|$)|(^|[\\/])server\..*\.log$|(^|[\\/])\.gitignore$|(^|[\\/])README\.md$|(^|[\\/])test1?\.html$"

Write-Host "WaterWorksDG deploy"
Write-Host "Source: $repoRoot"
Write-Host "Target: $Bucket"

if (-not $Deploy) {
    Write-Host "Mode: dry run. Add -Deploy to upload changes."
}
elseif ($Delete) {
    Write-Host "Mode: deploy with destination cleanup."
}
else {
    Write-Host "Mode: deploy."
}

if (-not $UseGsutil -and (Test-Command "gcloud")) {
    $args = @(
        "storage",
        "rsync",
        ".",
        $Bucket,
        "--recursive",
        "--exclude=$excludePattern"
    )

    if (-not $Deploy) {
        $args += "--dry-run"
    }

    if ($Deploy -and $Delete) {
        $args += "--delete-unmatched-destination-objects"
    }

    & gcloud @args
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0 -and $Deploy) {
        Write-Host "Setting no-cache metadata on HTML files."
        & gcloud storage objects update "$Bucket/*.html" --cache-control="no-cache, max-age=0, must-revalidate"
        $exitCode = $LASTEXITCODE
    }

    if ($exitCode -eq 0 -and $Deploy) {
        Write-Host "Setting no-cache metadata on actively iterated assets."
        & gcloud storage objects update "$Bucket/styles/*.css" --cache-control="no-cache, max-age=0, must-revalidate"
        $exitCode = $LASTEXITCODE
    }

    if ($exitCode -eq 0 -and $Deploy) {
        & gcloud storage objects update "$Bucket/scripts/*.js" --cache-control="no-cache, max-age=0, must-revalidate"
        $exitCode = $LASTEXITCODE
    }

    if ($exitCode -eq 0 -and $Deploy) {
        & gcloud storage objects update "$Bucket/images/brand/*.svg" --cache-control="no-cache, max-age=0, must-revalidate"
        $exitCode = $LASTEXITCODE
    }

    exit $exitCode
}

if (Test-Command "gsutil") {
    $args = @(
        "-m",
        "rsync",
        "-r",
        "-x",
        $excludePattern
    )

    if (-not $Deploy) {
        $args += "-n"
    }

    if ($Deploy -and $Delete) {
        $args += "-d"
    }

    $args += @(".", $Bucket)

    & gsutil @args
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0 -and $Deploy) {
        Write-Host "Setting no-cache metadata on HTML files."
        & gsutil -m setmeta -h "Cache-Control:no-cache, max-age=0, must-revalidate" "$Bucket/*.html"
        $exitCode = $LASTEXITCODE
    }

    if ($exitCode -eq 0 -and $Deploy) {
        Write-Host "Setting no-cache metadata on actively iterated assets."
        & gsutil -m setmeta -h "Cache-Control:no-cache, max-age=0, must-revalidate" "$Bucket/styles/*.css"
        $exitCode = $LASTEXITCODE
    }

    if ($exitCode -eq 0 -and $Deploy) {
        & gsutil -m setmeta -h "Cache-Control:no-cache, max-age=0, must-revalidate" "$Bucket/scripts/*.js"
        $exitCode = $LASTEXITCODE
    }

    if ($exitCode -eq 0 -and $Deploy) {
        & gsutil -m setmeta -h "Cache-Control:no-cache, max-age=0, must-revalidate" "$Bucket/images/brand/*.svg"
        $exitCode = $LASTEXITCODE
    }

    exit $exitCode
}

$message = @"
Google Cloud CLI was not found.

Install the Google Cloud CLI, then authenticate:
  gcloud auth login

After that, preview the live sync:
  .\tools\deploy-gcs.ps1

When the preview looks right, deploy:
  .\tools\deploy-gcs.ps1 -Deploy
"@

Write-Host $message -ForegroundColor Red
exit 1
