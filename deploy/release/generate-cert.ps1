# Generate self-signed HTTPS cert for public IP (built-in Spring Boot SSL)
# Usage: .\generate-self-signed-cert.ps1 -Ip 123.45.67.89

param(
    [Parameter(Mandatory = $true)]
    [string]$Ip
)

$ErrorActionPreference = "Stop"

function Get-OpenSslExe {
  $cmd = Get-Command openssl -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $candidates = @(
    "C:\Program Files\Git\usr\bin\openssl.exe",
    "C:\Program Files\OpenSSL-Win64\bin\openssl.exe",
    "C:\Program Files\OpenSSL-Win32\bin\openssl.exe"
  )
  foreach ($path in $candidates) {
    if (Test-Path $path) { return $path }
  }
  return $null
}

$OpenSsl = Get-OpenSslExe
if (-not $OpenSsl) {
  throw @"
OpenSSL not found. Install one of:
  winget install ShiningLight.OpenSSL.Light
  winget install Git.Git   (includes openssl in Git\usr\bin)
Then reopen PowerShell and retry.
"@
}

$ScriptDir = $PSScriptRoot
if (Test-Path (Join-Path $ScriptDir "forlove.jar")) {
  $Dir = Join-Path $ScriptDir "certs"
} else {
  $Dir = Join-Path $ScriptDir "release\certs"
}
New-Item -ItemType Directory -Force -Path $Dir | Out-Null

$Key = Join-Path $Dir "forlove.key"
$Crt = Join-Path $Dir "forlove.crt"
$Cfg = Join-Path $Dir "openssl.cnf"

@"
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
CN = ForLove

[v3_req]
subjectAltName = IP:$Ip
"@ | Set-Content -Path $Cfg -Encoding ASCII

& $OpenSsl req -x509 -nodes -days 825 -newkey rsa:2048 `
  -keyout $Key -out $Crt -config $Cfg -extensions v3_req

if ($LASTEXITCODE -ne 0) {
  throw "OpenSSL failed to generate certificate (exit code $LASTEXITCODE)"
}

Write-Host ""
Write-Host "Certificate created:"
Write-Host "  $Crt"
Write-Host "  $Key"
Write-Host ""
Write-Host "Start (admin required for port 443):"
if (Test-Path (Join-Path $ScriptDir "forlove.jar")) {
  Write-Host "  .\start.ps1"
} else {
  Write-Host "  cd deploy\release; .\start.ps1"
}
Write-Host ""
Write-Host "Visit: https://${Ip}/"
Write-Host "Trust the self-signed cert in your browser on first visit, then GPS will work."
