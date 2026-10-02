Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot "..\Picture5.png"
$targetPath = Join-Path $PSScriptRoot "..\app.ico"

$bmp = [System.Drawing.Bitmap]::FromFile($sourcePath)
$resized = New-Object System.Drawing.Bitmap 64, 64
$gfx = [System.Drawing.Graphics]::FromImage($resized)
$gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gfx.DrawImage($bmp, 0, 0, 64, 64)
$gfx.Dispose()

$hIcon = $resized.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream $targetPath, ([System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

$resized.Dispose()
$bmp.Dispose()

Write-Host "Created app.ico successfully"
