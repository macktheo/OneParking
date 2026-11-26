$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
Set-Location (Join-Path $projectRoot 'backend')
$dbSettings=@{}
foreach($line in Get-Content -LiteralPath (Join-Path $projectRoot 'infra/.env')){if($line -match '^([A-Z_]+)=(.*)$'){$dbSettings[$matches[1]]=$matches[2]}}
$env:DB_CONNECTION='mysql';$env:DB_HOST='127.0.0.1';$env:DB_PORT='13307';$env:DB_DATABASE='oneparking_test';$env:DB_USERNAME='oneparking';$env:DB_PASSWORD=$dbSettings['MYSQL_PASSWORD']
try{php artisan test --compact;if($LASTEXITCODE -ne 0){throw 'MySQL tests failed'}}finally{foreach($key in @('DB_CONNECTION','DB_HOST','DB_PORT','DB_DATABASE','DB_USERNAME','DB_PASSWORD')){[Environment]::SetEnvironmentVariable($key,$null,'Process')}}
