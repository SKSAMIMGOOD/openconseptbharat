$port = 3012
$serverProc = Start-Process -FilePath "npx.cmd" -ArgumentList "next", "start", "-H", "127.0.0.1", "-p", "$port" -PassThru -NoNewWindow

$retries = 35
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
    Write-Host "Server connected on port $port. Capturing Phase 03D screenshots..."
    $edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    
    $urlStudio = "http://127.0.0.1:$port/tools/photo-studio"
    $urlSheet = "http://127.0.0.1:$port/tools/photo-studio?tab=sheet"
    $urlMulti = "http://127.0.0.1:$port/tools/multiple-photo-maker"

    $desktopPath = "$((Get-Location).Path)\screenshots\phase03d-desktop.png"
    $mobilePath = "$((Get-Location).Path)\screenshots\phase03d-mobile.png"
    $sheetDesktopPath = "$((Get-Location).Path)\screenshots\phase03d-sheet-desktop.png"
    $sheetMobilePath = "$((Get-Location).Path)\screenshots\phase03d-sheet-mobile.png"
    $multiPath = "$((Get-Location).Path)\screenshots\phase03d-multiple-maker.png"

    & $edge --headless --disable-gpu --window-size=1280,1200 --screenshot="$desktopPath" $urlStudio
    & $edge --headless --disable-gpu --window-size=390,844 --screenshot="$mobilePath" $urlStudio
    & $edge --headless --disable-gpu --window-size=1280,1200 --screenshot="$sheetDesktopPath" $urlSheet
    & $edge --headless --disable-gpu --window-size=390,844 --screenshot="$sheetMobilePath" $urlSheet
    & $edge --headless --disable-gpu --window-size=1280,1000 --screenshot="$multiPath" $urlMulti

    Write-Host "Screenshots captured successfully."
} else {
    Write-Host "Failed to connect to server on port $port."
}

Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*$port*" } | Stop-Process -Force -ErrorAction SilentlyContinue
