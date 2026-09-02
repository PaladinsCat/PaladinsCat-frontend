<#
.SYNOPSIS
Starts the local Next development server with its same-origin API proxy.
#>
[CmdletBinding()]
param(
  [int]$Port = 3000,
  [string]$TargetApi = 'https://paladinscat.com/api',
  [switch]$OpenBrowser
)

$ErrorActionPreference = 'Stop'
$frontendRoot = Split-Path -Parent $PSScriptRoot
$nextPackage = Join-Path $frontendRoot 'node_modules\next\package.json'
if (-not (Test-Path -LiteralPath $nextPackage -PathType Leaf)) {
  throw "Frontend dependencies are not installed at $frontendRoot. Run npm ci first."
}
if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
  throw "Port $Port is already in use; the launcher will not replace another process."
}

$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$startInfo = [System.Diagnostics.ProcessStartInfo]::new()
$startInfo.FileName = $npm
$startInfo.Arguments = "run dev -- --port $Port"
$startInfo.WorkingDirectory = $frontendRoot
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true
$startInfo.Environment['NEXT_PUBLIC_API_URL'] = '/api'
$startInfo.Environment['NEXT_SERVER_API_URL'] = $TargetApi.TrimEnd('/')
$startInfo.Environment['NEXT_DIST_DIR'] = '.next-dev-proxy'
$startInfo.Environment['BROWSER'] = 'none'

$process = [System.Diagnostics.Process]::Start($startInfo)
Write-Output "DEV_PROXY_PID=$($process.Id)"
Write-Output "DEV_PROXY_URL=http://127.0.0.1:$Port"
Write-Output "DEV_PROXY_API=$($startInfo.Environment['NEXT_SERVER_API_URL'])"
if ($OpenBrowser) { Start-Process "http://127.0.0.1:$Port" }
