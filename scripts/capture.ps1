$port = 3008
$serverProc = Start-Process -FilePath "npx.cmd" -ArgumentList "next", "start", "-H", "127.0.0.1", "-p", "$port" -PassThru -NoNewWindow

$retries = 30
$connected = $false
while ($retries -gt 0 -and -not $connected) {
    Start-Sleep -Milliseconds 600
    try {
        $res = Invoke-WebRequest -Uri "http://127.0.0.1:$port/tools/photo-studio" -UseBasicParsing -TimeoutSec 2
        if ($res.StatusCode -eq 200) {
            $connected = $true
        }
    } catch {
        $retries--
    }
}

if ($connected) {
    Write-Host "Server connected on port $port. Taking screenshots..."
    $edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    $url = "http://127.0.0.1:$port/tools/photo-studio"

    $desktopPath = "$((Get-Location).Path)\screenshots\phase03c-desktop.png"
    $mobilePath = "$((Get-Location).Path)\screenshots\phase03c-mobile.png"

    & $edge --headless --disable-gpu --window-size=1280,1200 --screenshot="$desktopPath" $url
    & $edge --headless --disable-gpu --window-size=390,844 --screenshot="$mobilePath" $url
    Write-Host "Screenshots captured successfully."
} else {
    Write-Host "Failed to connect to server."
}

Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*$port*" } | Stop-Process -Force -ErrorAction SilentlyContinue
