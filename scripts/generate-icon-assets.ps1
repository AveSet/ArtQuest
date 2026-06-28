# Generates tray PNG, renderer favicon/brand PNG, and Windows multi-size ICO from a source PNG.
param(
  [string]$Source = ''
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
if (-not $Source) {
  $Source = 'C:\Users\AveSet\.cursor\projects\d-artquest\assets\artquest-tray-icon.png'
}
if (-not (Test-Path $Source)) {
  throw "Source icon not found: $Source"
}

$resourcesDir = Join-Path $root 'resources'
$buildDir = Join-Path $root 'build'
$rendererAssets = Join-Path $root 'src\renderer\assets'

foreach ($d in @($resourcesDir, $buildDir, $rendererAssets)) {
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
}

Add-Type -AssemblyName System.Drawing

function Get-CenteredSquarePngBytes {
  param(
    [System.Drawing.Image]$Image,
    [int]$OutSize
  )

  $side = [Math]::Min($Image.Width, $Image.Height)
  $x = [int](($Image.Width - $side) / 2)
  $y = [int](($Image.Height - $side) / 2)

  $bmp = New-Object System.Drawing.Bitmap $OutSize, $OutSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.Clear([System.Drawing.Color]::Transparent)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

      $dest = New-Object System.Drawing.Rectangle 0, 0, $OutSize, $OutSize
      $srcRect = New-Object System.Drawing.Rectangle $x, $y, $side, $side
      $g.DrawImage($Image, $dest, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    } finally {
      $g.Dispose()
    }

    $ms = New-Object System.IO.MemoryStream
    try {
      $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
      return $ms.ToArray()
    } finally {
      $ms.Dispose()
    }
  } finally {
    $bmp.Dispose()
  }
}

function Write-WindowsIco {
  param(
    [byte[][]]$PngChunks,
    [int[]]$Sizes
  )

  $stream = New-Object System.IO.MemoryStream
  $w = New-Object System.IO.BinaryWriter($stream)

  # ICONDIR
  $w.Write([UInt16]0)
  $w.Write([UInt16]1)
  $w.Write([UInt16]$PngChunks.Length)

  $headerSize = 6 + (16 * $PngChunks.Length)
  $offset = [uint32]$headerSize

  for ($i = 0; $i -lt $PngChunks.Length; $i++) {
    $dim = $Sizes[$i]
    $bWidth = [byte]($(if ($dim -ge 256) { 0 } else { $dim }))
    $bHeight = [byte]($(if ($dim -ge 256) { 0 } else { $dim }))
    $w.Write($bWidth)
    $w.Write($bHeight)
    $w.Write([byte]0)
    $w.Write([byte]0)
    $w.Write([UInt16]1)
    $w.Write([UInt16]32)
    $w.Write([UInt32]$PngChunks[$i].Length)
    $w.Write($offset)
    $offset = $offset + [uint32]$PngChunks[$i].Length
  }

  foreach ($chunk in $PngChunks) {
    $w.Write($chunk)
  }

  $w.Flush()
  $bytes = $stream.ToArray()
  $w.Dispose()
  $stream.Dispose()
  return $bytes
}

$img = [System.Drawing.Bitmap]::FromFile($Source)
try {
  $tray = Get-CenteredSquarePngBytes -Image $img -OutSize 64
  $icon256 = Get-CenteredSquarePngBytes -Image $img -OutSize 256
  $brand = Get-CenteredSquarePngBytes -Image $img -OutSize 128

  [System.IO.File]::WriteAllBytes((Join-Path $resourcesDir 'tray.png'), $tray)
  [System.IO.File]::WriteAllBytes((Join-Path $buildDir 'icon.png'), $icon256)
  [System.IO.File]::WriteAllBytes((Join-Path $rendererAssets 'artquest-icon.png'), $brand)

  $sizes = @(16, 24, 32, 48, 64, 128, 256)
  $chunks = foreach ($s in $sizes) {
    [byte[]](Get-CenteredSquarePngBytes -Image $img -OutSize $s)
  }

  $icoBytes = Write-WindowsIco -PngChunks $chunks -Sizes $sizes
  [System.IO.File]::WriteAllBytes((Join-Path $buildDir 'icon.ico'), $icoBytes)
} finally {
  $img.Dispose()
}

Write-Host 'OK:'
Write-Host "  $(Join-Path $resourcesDir 'tray.png')"
Write-Host "  $(Join-Path $buildDir 'icon.png')"
Write-Host "  $(Join-Path $buildDir 'icon.ico')"
Write-Host "  $(Join-Path $rendererAssets 'artquest-icon.png')"
