# 修复权重脚本
$content = Get-Content '_MEI64162\quanzhong.JSON' -Raw
$content = $content -replace '"权重": 10', '"权重": 1'
$content = $content -replace '"权重": 5', '"权重": 1'
$content = $content -replace '"权重": 0', '"权重": 1'
$content = $content -replace '"权重": null', '"权重": 1'
Set-Content '_MEI64162\quanzhong.JSON' -Value $content

$content = Get-Content '_MEI216562\quanzhong.JSON' -Raw
$content = $content -replace '"权重": 10', '"权重": 1'
$content = $content -replace '"权重": 5', '"权重": 1'
$content = $content -replace '"权重": 0', '"权重": 1'
$content = $content -replace '"权重": null', '"权重": 1'
Set-Content '_MEI216562\quanzhong.JSON' -Value $content

Write-Host "权重修复完成"