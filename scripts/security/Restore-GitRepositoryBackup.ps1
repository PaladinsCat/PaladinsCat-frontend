[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$DestinationPath,
    [string]$RepositoryName = 'paladinscat-frontend',
    [string]$BackupRoot = (Join-Path (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))) 'local\git-backups'),
    [string]$SnapshotRef = 'refs/heads/main'
)

$ErrorActionPreference = 'Stop'
$destination = [IO.Path]::GetFullPath($DestinationPath)
if (Test-Path -LiteralPath $destination) { throw "[git-restore] destination already exists: $destination" }
$backupRepository = Join-Path ([IO.Path]::GetFullPath($BackupRoot)) "$RepositoryName.git"
if (-not (Test-Path -LiteralPath $backupRepository)) { throw "[git-restore] backup repository is missing: $backupRepository" }
$snapshotCommit = & git --git-dir=$backupRepository rev-parse "$SnapshotRef^{commit}"
if ($LASTEXITCODE -ne 0) { throw "[git-restore] snapshot does not exist: $SnapshotRef" }

& git clone --no-hardlinks $backupRepository $destination
if ($LASTEXITCODE -ne 0) { throw '[git-restore] clone failed.' }
& git -C $destination branch recovered-main $snapshotCommit
if ($LASTEXITCODE -ne 0) { throw '[git-restore] could not create recovered-main.' }
& git -C $destination switch recovered-main
if ($LASTEXITCODE -ne 0) { throw '[git-restore] could not switch to recovered-main.' }

Write-Output 'GIT_RESTORE=PASS'
Write-Output "RESTORED_COMMIT=$(& git -C $destination rev-parse HEAD)"
