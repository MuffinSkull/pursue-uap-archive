# Publishes this folder to a new PUBLIC GitHub repository (requires GitHub CLI + login).
# Usage:
#   .\scripts\publish-github.ps1
#   .\scripts\publish-github.ps1 -RepoName "my-ufo-viewer"
param(
  [string] $RepoName = "pursue-uap-archive"
)

$ErrorActionPreference = "Stop"
$gh = "${env:ProgramFiles}\GitHub CLI\gh.exe"
if (-not (Test-Path $gh)) {
  Write-Error "GitHub CLI not found at $gh. Install: winget install GitHub.cli"
}

& $gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host @"

Not logged in to GitHub. Run this once, then re-run this script:

  & `"$gh`" auth login --hostname github.com --git-protocol https --web

Open https://github.com/login/device and enter the one-time code shown.

"@
  exit 1
}

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "Creating public repo '$RepoName' and pushing from: $root"
& $gh repo create $RepoName --public --source . --remote origin --push --description "PURSUE UAP / UFO Release 01 browser — React, Three.js, Framer Motion"

if ($LASTEXITCODE -eq 0) {
  $apiUrl = & $gh repo view --json url -q 2>$null
  if ($apiUrl) { Write-Host "Repository: $apiUrl" }
}
