
# Define input folder containing images
$inputFolder = "C:\Users\dnati\Downloads\ImageBatch"

# Define output folder
$outputFolder = "C:\GitHub\tgn-pwa-links\ScreenShots"
New-Item -ItemType Directory -Force -Path $outputFolder | Out-Null

# Define desired sizes (width x height)
$sizes = @(
    @{Width=640; Height=200},
    @{Width=1200; Height=300},  
    @{Width=720; Height=300},   
    @{Width=1600; Height=400},
    @{Width=640; Height=200}
)

# Choose output format: "jpg", "jpeg", "png", "webp", or "auto"
$outputFormat = "auto"  # Change to desired format or leave as "auto" to match input

# Supported formats
$supportedByDotNet = @("jpg", "jpeg", "png")
$supportedExtensions = @(".jpg", ".jpeg", ".png", ".webp", ".svg")

# Get all image files in the folder
$imageFiles = Get-ChildItem -Path $inputFolder -File | Where-Object { $supportedExtensions -contains $_.Extension.ToLower() }

foreach ($file in $imageFiles) {
    $inputImage = $file.FullName
    $inputExtension = $file.Extension.ToLower().TrimStart('.')

    if ($outputFormat -eq "auto") {
        $finalFormat = $inputExtension
    } else {
        $finalFormat = $outputFormat
    }

    if ($supportedByDotNet -contains $inputExtension -and $supportedByDotNet -contains $finalFormat) {
        Add-Type -AssemblyName System.Drawing
        $original = [System.Drawing.Image]::FromFile($inputImage)

        foreach ($size in $sizes) {
            $newBitmap = New-Object System.Drawing.Bitmap $size.Width, $size.Height
            $graphics = [System.Drawing.Graphics]::FromImage($newBitmap)
            $graphics.DrawImage($original, 0, 0, $size.Width, $size.Height)

            $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
            $outputPath = Join-Path $outputFolder ("${baseName}_${($size.Width)}x${($size.Height)}.$finalFormat")
            switch ($finalFormat) {
                "jpg"   { $newBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Jpeg) }
                "jpeg"  { $newBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Jpeg) }
                "png"   { $newBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png) }
            }

            $graphics.Dispose()
            $newBitmap.Dispose()
        }
        $original.Dispose()
    } else {
        foreach ($size in $sizes) {
            $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
            $outputPath = Join-Path $outputFolder ("${baseName}_${($size.Width)}x${($size.Height)}.$finalFormat")
            magick convert $inputImage -resize "$($size.Width)x$($size.Height)" $outputPath
        }
    }
}

Write-Host "Batch resizing complete. Files saved to $outputFolder"
