param([Parameter(Mandatory=$true)][string]$Source)
# Deterministic export of the approved square artwork; no artistic image edits.
Add-Type -AssemblyName System.Drawing
$assetDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../netlify-dist/assets'))
$artwork = [System.Drawing.Image]::FromFile([System.IO.Path]::GetFullPath($Source))
try {
  if ($artwork.Width -ne $artwork.Height) { throw 'App icon artwork must be square.' }
  foreach ($variant in @(@('brain-apple-touch-icon.png',180),@('brain-icon-192.png',192),@('brain-icon-512.png',512))) {
    $size = [int]$variant[1]
    $bitmap = New-Object System.Drawing.Bitmap($size,$size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#0a0e1a'))
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.DrawImage($artwork,0,0,$size,$size)
      $bitmap.Save((Join-Path $assetDirectory $variant[0]),[System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
  }
} finally { $artwork.Dispose() }
