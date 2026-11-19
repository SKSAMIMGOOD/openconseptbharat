Add-Type -AssemblyName System.Drawing

$srcPath = "C:/Users/SK MD SAMIM/.gemini/antigravity/brain/cefa9b74-10e8-4cf9-91f1-775b81601067/.user_uploaded/media_1795068642187_9bf182e2.png"
$projectRoot = (Get-Location).Path
$publicDir = Join-Path $projectRoot "public"
$appDir = Join-Path $projectRoot "src/app"

Write-Host "Reading source image from: $srcPath"
$sourceImg = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Source image size: $($sourceImg.Width) x $($sourceImg.Height)"

# Copy original brand logo to public/tab_logo1.png
Copy-Item -Path $srcPath -Destination (Join-Path $publicDir "tab_logo1.png") -Force
Write-Host "Saved tab_logo1.png to public"

function Resize-Bitmap {
    param(
        [System.Drawing.Bitmap]$source,
        [int]$targetWidth,
        [int]$targetHeight
    )
    $dest = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($source, 0, 0, $targetWidth, $targetHeight)
    $g.Dispose()
    return $dest
}

# Generate PNGs of different sizes
$sizes = @(16, 32, 48, 180, 192, 512)
$bitmaps = @{}

foreach ($size in $sizes) {
    $bmp = Resize-Bitmap -source $sourceImg -targetWidth $size -targetHeight $size
    $bitmaps[$size] = $bmp
}

# Save standard icons
$bitmaps[16].Save((Join-Path $publicDir "favicon-16x16.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bitmaps[32].Save((Join-Path $publicDir "favicon-32x32.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bitmaps[48].Save((Join-Path $publicDir "favicon-48x48.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$bitmaps[32].Save((Join-Path $publicDir "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bitmaps[32].Save((Join-Path $appDir "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$bitmaps[180].Save((Join-Path $publicDir "apple-touch-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bitmaps[180].Save((Join-Path $appDir "apple-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$bitmaps[192].Save((Join-Path $publicDir "icon-192.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bitmaps[512].Save((Join-Path $publicDir "icon-512.png"), [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "Saved PNG icons."

# Generate multi-size ICO file containing 16x16, 32x32, 48x48 PNGs
function Build-Ico {
    param(
        [System.Drawing.Bitmap[]]$images,
        [string]$outputPath
    )
    $pngStreams = @()
    foreach ($img in $images) {
        $ms = New-Object System.IO.MemoryStream
        $img.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngStreams += $ms
    }

    $fs = New-Object System.IO.FileStream($outputPath, [System.IO.FileMode]::Create)
    $bw = New-Object System.IO.BinaryWriter($fs)

    # ICONDIR
    $bw.Write([uint16]0) # Reserved
    $bw.Write([uint16]1) # Type (1 = Icon)
    $bw.Write([uint16]$images.Length) # Image count

    # Calculate offset
    $headerSize = 6 + ($images.Length * 16)
    $offset = $headerSize

    # ICONDIRENTRY for each image
    for ($i = 0; $i -lt $images.Length; $i++) {
        $img = $images[$i]
        $pngBytes = $pngStreams[$i].ToArray()

        $w = if ($img.Width -ge 256) { [byte]0 } else { [byte]$img.Width }
        $h = if ($img.Height -ge 256) { [byte]0 } else { [byte]$img.Height }

        $bw.Write($w) # Width
        $bw.Write($h) # Height
        $bw.Write([byte]0) # Colors
        $bw.Write([byte]0) # Reserved
        $bw.Write([uint16]1) # Color planes
        $bw.Write([uint16]32) # Bits per pixel
        $bw.Write([uint32]$pngBytes.Length) # Size of image data
        $bw.Write([uint32]$offset) # Offset of image data

        $offset += $pngBytes.Length
    }

    # Write actual PNG data
    for ($i = 0; $i -lt $images.Length; $i++) {
        $pngBytes = $pngStreams[$i].ToArray()
        $bw.Write($pngBytes, 0, $pngBytes.Length)
        $pngStreams[$i].Dispose()
    }

    $bw.Flush()
    $bw.Close()
    $fs.Close()
}

$icoImages = @($bitmaps[16], $bitmaps[32], $bitmaps[48])
$publicIcoPath = Join-Path $publicDir "favicon.ico"
$appIcoPath = Join-Path $appDir "favicon.ico"

Build-Ico -images $icoImages -outputPath $publicIcoPath
Copy-Item -Path $publicIcoPath -Destination $appIcoPath -Force
Write-Host "Generated favicon.ico in public and src/app."

# Also generate Open Graph banner (1200x630)
$ogWidth = 1200
$ogHeight = 630
$ogBmp = New-Object System.Drawing.Bitmap($ogWidth, $ogHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$ogGraphics = [System.Drawing.Graphics]::FromImage($ogBmp)
$ogGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$ogGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$ogGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Background: Clean subtle slate/white gradient or sleek card
$rect = New-Object System.Drawing.Rectangle(0, 0, $ogWidth, $ogHeight)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(248, 250, 252), [System.Drawing.Color]::FromArgb(238, 242, 255), [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
$ogGraphics.FillRectangle($bgBrush, $rect)

# Draw central brand logo (scaled nicely to ~160x160)
$logoSize = 160
$logoX = 100
$logoY = ($ogHeight - $logoSize) / 2
$ogGraphics.DrawImage($sourceImg, $logoX, $logoY, $logoSize, $logoSize)

# Draw Brand Name & Headline
$titleFont = New-Object System.Drawing.Font("Segoe UI", 36, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Regular)
$badgeFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)

$titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105))
$brandBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(37, 99, 235))
$emeraldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(5, 150, 105))

$textX = $logoX + $logoSize + 50
$ogGraphics.DrawString("Browser Utility Studio", $badgeFont, $brandBrush, $textX, ($logoY - 10))
$ogGraphics.DrawString("Free Online Tools to Edit, Crop & Print", $titleFont, $titleBrush, $textX, ($logoY + 25))
$ogGraphics.DrawString("100% In-Browser Execution • Zero Server Uploads • Zero Tracking", $subFont, $emeraldBrush, $textX, ($logoY + 115))

$ogGraphics.Dispose()
$ogBmp.Save((Join-Path $publicDir "og-image.png"), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Generated og-image.png in public."

$sourceImg.Dispose()
foreach ($key in $bitmaps.Keys) {
    $bitmaps[$key].Dispose()
}
$ogBmp.Dispose()
Write-Host "All icons generated successfully!"
