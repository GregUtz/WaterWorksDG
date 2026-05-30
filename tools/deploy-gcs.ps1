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
    exit $LASTEXITCODE
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
    exit $LASTEXITCODE
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
