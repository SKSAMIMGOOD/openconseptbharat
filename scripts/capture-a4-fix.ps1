$port = 8899
$serverScript = @"
const http = require('http');
const fs = require('fs');
const path = require('path');
http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/scratch/visual-test.html';
  const file = path.join(process.cwd(), reqPath);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found: ' + reqPath);
  }
}).listen($port, '127.0.0.1');
"@

$serverScriptPath = "$((Get-Location).Path)\scratch\server.js"
Set-Content -Path $serverScriptPath -Value $serverScript

$serverProc = Start-Process node -ArgumentList "scratch\server.js" -PassThru -NoNewWindow
Start-Sleep -Seconds 1

$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$out1 = "$((Get-Location).Path)\screenshots\a4-grid-before-after-comparison.png"
$out2 = "$((Get-Location).Path)\screenshots\a4-grid-test-cases-1-2-3.png"

Write-Host "Capturing screenshots..."
& $edge --headless --disable-gpu --window-size=1280,1050 --screenshot="$out1" "http://127.0.0.1:$port/scratch/visual-test.html"
& $edge --headless --disable-gpu --window-size=1280,780 --screenshot="$out2" "http://127.0.0.1:$port/scratch/cases-test.html"

Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue
Write-Host "Done."
