# ForLove start script (Windows, optional built-in HTTPS)
$ErrorActionPreference = "Stop"

$Dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Jar = Join-Path $Dir "forlove.jar"
$CertDir = Join-Path $Dir "certs"
$Crt = Join-Path $CertDir "forlove.crt"
$Key = Join-Path $CertDir "forlove.key"

if (-not (Test-Path $Jar)) {
  throw "forlove.jar not found. Run deploy\build.ps1 first."
}

Set-Location $Dir
New-Item -ItemType Directory -Force -Path "data", "uploads", "logs" | Out-Null

$javaArgs = @("-jar", $Jar)
$appArgs = @()

if ((Test-Path $Crt) -and (Test-Path $Key)) {
  $HttpsPort = if ($env:HTTPS_PORT) { $env:HTTPS_PORT } else { "443" }
  $appArgs = @(
    "--server.port=$HttpsPort",
    "--server.ssl.enabled=true",
    "--server.ssl.certificate=file:$Crt",
    "--server.ssl.certificate-private-key=file:$Key"
  )
  $HttpRedirect = if ($null -ne $env:HTTP_REDIRECT) { $env:HTTP_REDIRECT } else { "80" }
  if ($HttpsPort -eq "443" -and $HttpRedirect -and $HttpRedirect -ne "0") {
    $appArgs += "--forlove.ssl.http-redirect-port=$HttpRedirect"
  }
  Write-Host "ForLove starting (HTTPS) on port $HttpsPort ..."
  Write-Host "Open: https://localhost${HttpsPort}/"
  if ($HttpsPort -eq "443") {
    Write-Host "  (port 443 can be omitted; trust self-signed cert on first visit)"
  }
} else {
  $Port = if ($env:PORT) { $env:PORT } else { "80" }
  $appArgs = @("--server.port=$Port")
  Write-Host "ForLove starting (HTTP) on port $Port ..."
  Write-Host "Open: http://localhost:$Port/"
  Write-Host ""
  Write-Host "Tip: GPS on public IP needs HTTPS. Generate certs then restart:"
  Write-Host "  ..\generate-self-signed-cert.ps1 -Ip YOUR_PUBLIC_IP"
}

Write-Host ""
& java @javaArgs @appArgs @args
