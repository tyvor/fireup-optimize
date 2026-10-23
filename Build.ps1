$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$fireupSource = Join-Path $PSScriptRoot 'extension'
$fireupManifest = Get-Content -LiteralPath (Join-Path $fireupSource 'manifest.json') -Raw | ConvertFrom-Json
$fireupDist = Join-Path $PSScriptRoot 'dist'
New-Item -ItemType Directory -Force -Path $fireupDist | Out-Null
$fireupTarget = Join-Path $fireupDist "FireUp-$($fireupManifest.version)-unsigned.xpi"
if (Test-Path -LiteralPath $fireupTarget) { Remove-Item -LiteralPath $fireupTarget }
[System.IO.Compression.ZipFile]::CreateFromDirectory($fireupSource, $fireupTarget)
Write-Output $fireupTarget
