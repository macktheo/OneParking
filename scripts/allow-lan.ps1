# Run this once in an Administrator PowerShell only when LAN ESP access is needed.
$ErrorActionPreference='Stop'
if(!(Get-NetFirewallRule -DisplayName 'OneParking HTTPS LAN' -ErrorAction SilentlyContinue)){
 New-NetFirewallRule -DisplayName 'OneParking HTTPS LAN' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8443 -Profile Private -RemoteAddress LocalSubnet | Out-Null
}
Write-Host 'HTTPS8443 allowed on private local subnet; database/phpMyAdmin stay loopback-only.'
