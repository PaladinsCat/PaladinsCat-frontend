<#
.SYNOPSIS
Starts the local Next development server with its same-origin API proxy.
refs: documents/06-reference/frontend-design-system.md
#>
[CmdletBinding()]
param(
  [int]$Port = 3000,
  [string]$TargetApi = 'https://paladinscat.com/api',
  [ValidatePattern('^\.next[-a-zA-Z0-9]*$')]
  [string]$DistDir = '.next-dev-proxy',
  [switch]$OpenBrowser,
  [switch]$LocalAuthBypass,
  [string]$ApiKeyFile = ''
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
if ($LocalAuthBypass) { $startInfo.Arguments += " --hostname 127.0.0.1" }
$startInfo.WorkingDirectory = $frontendRoot
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true
$startInfo.Environment['NEXT_PUBLIC_API_URL'] = '/api'
$startInfo.Environment['NEXT_SERVER_API_URL'] = $TargetApi.TrimEnd('/')
$startInfo.Environment['NEXT_DIST_DIR'] = $DistDir
$startInfo.Environment['BROWSER'] = 'none'
$startInfo.Environment['NEXT_PUBLIC_LOCAL_AUTH_BYPASS'] = $(if ($LocalAuthBypass) { '1' } else { '0' })

# Local-auth bypass: the target backend requires either an OIDC session or a
# developer credential. With no local OIDC session, requests would 401 and the
# data pages stay blank. So we start a loopback-only key-injecting proxy
# (scripts/paladinscat-dev-api-proxy.mjs) on 127.0.0.1:3001 that forwards each
# request to the real backend with a read-only developer credential injected as
# x-api-key (and any Authorization header stripped). The dev proxy's
# NEXT_SERVER_API_URL is pointed at that key-injector instead of the backend.
# The credential is read from a local runtime file (never committed).
$apiKeyFile = $ApiKeyFile
$keyInjectorPort = 3001
$keyInjector = $null
if ($LocalAuthBypass) {
  if (-not $apiKeyFile) {
    $apiKeyFile = "C:\Users\nabi\PaladinsCat\local\runtime\developer-api\issued\pc_live_f94bf61a04cf4f87a6996a65b8cbfbb7.txt"
  }
  if (-not (Test-Path -LiteralPath $apiKeyFile -PathType Leaf)) {
    throw "API key file not found at $apiKeyFile; pass -ApiKeyFile <path> to a valid issued developer credential."
  }
  # Point the key-injector at the backend ORIGIN (it prepends /api itself).
  $targetOrigin = $TargetApi -replace '/api$',''
  $keyInjector = Join-Path $PSScriptRoot 'paladinscat-dev-api-proxy.mjs'
  $node = (Get-Command node -ErrorAction Stop).Source
  $ki = [System.Diagnostics.ProcessStartInfo]::new()
  $ki.FileName = $node
  $ki.Arguments = "`"$keyInjector`""
  $ki.WorkingDirectory = $frontendRoot
  $ki.UseShellExecute = $false
  $ki.CreateNoWindow = $true
  $ki.Environment['PALADINSCAT_DEV_PROXY_PORT'] = "$keyInjectorPort"
  $ki.Environment['PALADINSCAT_DEV_PROXY_TARGET'] = $targetOrigin.TrimEnd('/')
  $ki.Environment['PALADINSCAT_DEV_PROXY_API_KEY_FILE'] = $apiKeyFile
  $keyInjectorProcess = [System.Diagnostics.Process]::Start($ki)
  # Wait for the key-injector to listen before the dev proxy starts using it.
  $deadline = (Get-Date).AddSeconds(15)
  while (-not (Get-NetTCPConnection -LocalPort $keyInjectorPort -State Listen -ErrorAction SilentlyContinue)) {
    if ((Get-Date) -gt $deadline) { throw "Key-injector did not start on port $keyInjectorPort." }
    Start-Sleep -Milliseconds 200
  }
  $startInfo.Environment['NEXT_SERVER_API_URL'] = "http://127.0.0.1:$keyInjectorPort"
}

$process = [System.Diagnostics.Process]::Start($startInfo)
Write-Output "DEV_PROXY_PID=$($process.Id)"
Write-Output "DEV_PROXY_URL=http://localhost:$Port"
Write-Output "DEV_PROXY_API=$($startInfo.Environment['NEXT_SERVER_API_URL'])"
if ($OpenBrowser) { Start-Process "http://localhost:$Port" }
