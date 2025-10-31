
# Set the root path
$rootPath = "C:\GitHub\tgn-pwa-links"

# Folders to include
$includeFolders = @("dev-dist", "dist", "public", "src")

# Folders to exclude
$excludeFolders = @(".git", "node_modules")

# Output file
$outputFile = "PWA-Tree.txt"

# Clear the output file if it exists
if (Test-Path $outputFile) {
    Remove-Item $outputFile
}

function Show-Tree {
    param (
        [string]$Path,
        [int]$Indent = 0
    )

    $items = Get-ChildItem -Path $Path -Force | Where-Object {
        $excludeFolders -notcontains $_.Name
    }

    foreach ($item in $items) {
        $prefix = " " * ($Indent * 2)
        if ($item.PSIsContainer) {
            Add-Content -Path $outputFile -Value "$prefix📁 $($item.Name)"
            Show-Tree -Path $item.FullName -Indent ($Indent + 1)
        } else {
            Add-Content -Path $outputFile -Value "$prefix📄 $($item.Name)"
        }
    }
}

foreach ($folder in $includeFolders) {
    $fullPath = Join-Path $rootPath $folder
    if (Test-Path $fullPath) {
        Add-Content -Path $outputFile -Value "`n$folder"
        Show-Tree -Path $fullPath
    } else {
        Add-Content -Path $outputFile -Value "`n$folder not found."
    }
}
