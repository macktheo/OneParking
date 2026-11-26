param([switch]$ResetAdminPassword)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
function Run([string]$Exe,[string[]]$ArgList){& $Exe @ArgList;if($LASTEXITCODE -ne 0){throw "$Exe failed ($LASTEXITCODE)"}}
Run 'python' @('-m','pip','install','-r',(Join-Path $PSScriptRoot 'requirements.txt'))
Run 'python' @('-X','utf8',(Join-Path $PSScriptRoot 'init_local.py'))
Run 'docker' @('compose','--project-name','oneparking','--env-file',(Join-Path $root 'infra/.env'),'-f',(Join-Path $root 'infra/compose.yaml'),'up','-d','--wait','mysql','phpmyadmin')
Run 'docker' @('compose','--project-name','oneparking','--env-file',(Join-Path $root 'infra/.env'),'-f',(Join-Path $root 'infra/compose.yaml'),'exec','-T','mysql','sh','-c','MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot < /docker-entrypoint-initdb.d/01-test-databases.sql')
Set-Location (Join-Path $root 'backend')
Run 'composer' @('install','--no-interaction')
Run 'php' @('artisan','config:clear')
if((Get-Content -LiteralPath '.env' -Raw) -notmatch '(?m)^APP_KEY=base64:.+$'){Run 'php' @('artisan','key:generate')}
Run 'php' @('artisan','migrate','--force')
Run 'php' @('artisan','db:seed','--force')
Run 'npm.cmd' @('ci')
Run 'npm.cmd' @('run','build')
if($ResetAdminPassword){Run 'php' @('artisan','parking:admin-password')}
Write-Host 'Ready. Run scripts/start.ps1. To choose an admin password: php artisan parking:admin-password from backend.'
