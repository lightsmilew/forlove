# ForLove build script (Windows)
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Release = Join-Path $Root "deploy\release"

Write-Host "==> [1/3] Build frontend..."
Set-Location (Join-Path $Root "frontend")
$ViteBin = Join-Path $Root "frontend\node_modules\.bin\vite.cmd"
if (-not (Test-Path $ViteBin)) {
  Write-Host "Installing frontend dependencies..."
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
}
npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed (npm run build)" }

$IndexHtml = Join-Path $Root "frontend\dist\index.html"
if (-not (Test-Path $IndexHtml)) {
  throw "Missing frontend/dist/index.html"
}

Write-Host "==> [2/3] Package backend..."
Set-Location (Join-Path $Root "backend")
& .\mvnw.cmd package -DskipTests

Write-Host "==> [3/3] Copy to deploy/release..."
New-Item -ItemType Directory -Force -Path $Release | Out-Null
Copy-Item (Join-Path $Root "backend\target\forlove-backend-1.0.0.jar") (Join-Path $Release "forlove.jar") -Force
Copy-Item (Join-Path $Root "deploy\start.ps1") (Join-Path $Release "start.ps1") -Force
Copy-Item (Join-Path $Root "deploy\generate-self-signed-cert.ps1") (Join-Path $Release "generate-cert.ps1") -Force

function Copy-ShellScriptWithLf {
  param([string]$Src, [string]$Dst)
  $content = [System.IO.File]::ReadAllText($Src) -replace "`r`n", "`n" -replace "`r", "`n"
  [System.IO.File]::WriteAllText($Dst, $content, [System.Text.UTF8Encoding]::new($false))
}

Copy-ShellScriptWithLf (Join-Path $Root "deploy\start.sh") (Join-Path $Release "start.sh")
Copy-ShellScriptWithLf (Join-Path $Root "deploy\generate-self-signed-cert.sh") (Join-Path $Release "generate-cert.sh")

Write-Host ""
Write-Host "Done: $Release\forlove.jar"
Write-Host "Start: cd deploy\release; .\start.ps1"
