[CmdletBinding()]
param(
    [string]$RepositoryRoot = (Join-Path $PSScriptRoot '..\..'),
    [string]$BackupRoot,
    [AllowEmptyString()][string]$RemoteMainCommit = ''
)

$ErrorActionPreference = 'Stop'
function Fail([string]$Message) { throw "[git-backup] $Message" }
function Invoke-Git([string[]]$Arguments) {
    & git @Arguments
    if ($LASTEXITCODE -ne 0) { Fail "git $($Arguments -join ' ') failed." }
}

$repository = [IO.Path]::GetFullPath($RepositoryRoot)
if (-not (Test-Path -LiteralPath (Join-Path $repository '.git'))) { Fail "not a Git worktree: $repository" }
if (-not $BackupRoot) { $BackupRoot = Join-Path (Split-Path -Parent $repository) 'local\git-backups' }
$backupRootPath = [IO.Path]::GetFullPath($BackupRoot)
if ($backupRootPath.StartsWith($repository + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    Fail 'backup root must be outside the source repository.'
}

$backupRepository = Join-Path $backupRootPath "$(Split-Path -Leaf $repository).git"
New-Item -ItemType Directory -Force -Path $backupRootPath | Out-Null
if (-not (Test-Path -LiteralPath $backupRepository)) {
    Invoke-Git @('clone', '--mirror', '--no-hardlinks', $repository, $backupRepository)
} else {
    $isBare = & git --git-dir=$backupRepository rev-parse --is-bare-repository
    if ($LASTEXITCODE -ne 0 -or $isBare -ne 'true') { Fail "backup target is not a bare repository: $backupRepository" }
    Invoke-Git @("--git-dir=$backupRepository", 'fetch', $repository, '+refs/heads/*:refs/heads/*', '+refs/tags/*:refs/tags/*')
}

$stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
$localMain = & git -C $repository rev-parse refs/heads/main
if ($LASTEXITCODE -ne 0) { Fail 'local main branch is missing.' }
Invoke-Git @("--git-dir=$backupRepository", 'update-ref', "refs/snapshots/local-main/$stamp", $localMain)
$zero = '0000000000000000000000000000000000000000'
if ($RemoteMainCommit -and $RemoteMainCommit -ne $zero) {
    & git --git-dir=$backupRepository cat-file -e "$RemoteMainCommit^{commit}"
    if ($LASTEXITCODE -ne 0) { Fail "remote main commit is absent from backup: $RemoteMainCommit" }
    Invoke-Git @("--git-dir=$backupRepository", 'update-ref', "refs/snapshots/origin-main/$stamp", $RemoteMainCommit)
}

Write-Output 'GIT_BACKUP=PASS'
Write-Output "BACKUP_REPOSITORY=$backupRepository"
Write-Output "LOCAL_MAIN_SNAPSHOT=refs/snapshots/local-main/$stamp"
