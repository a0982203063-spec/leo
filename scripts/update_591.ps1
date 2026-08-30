[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$ConfigFile = Join-Path (Join-Path $ProjectDir "js") "config.js"

$shopId = "45609"
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  正在從 591 抓取黃書恩專屬店鋪的所有最新房屋物件..." -ForegroundColor Yellow
Write-Host "  店鋪代號: $shopId (群義房屋 七期市政店)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$allItems = @()
$firstRow = 0
$totalRows = 50

while ($firstRow -lt $totalRows) {
    $url = "https://bff-house.591.com.tw/v2/web/shop/house/list?module=shop&action=house&respType=json&shop_id=$shopId&type=2&device=pc&firstRow=$firstRow&totalRows=$totalRows"
    try {
        $req = [System.Net.HttpWebRequest]::Create($url)
        $req.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        $req.Headers.Add("device", "pc")
        $req.Timeout = 15000
        $resp = $req.GetResponse()
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream(), [System.Text.Encoding]::UTF8)
        $jsonText = $reader.ReadToEnd()
        $reader.Close()
        $resp.Close()

        $res = $jsonText | ConvertFrom-Json
        if ($res.data -and $res.data.Count -gt 0) {
            $allItems += $res.data
            $firstRow += $res.data.Count
            if ($res.total) { $totalRows = [int]$res.total }
            Write-Host "  -> 已抓取 $firstRow / $totalRows 筆物件..." -ForegroundColor Gray
        } else {
            break
        }
    } catch {
        Write-Host "  抓取 591 失敗：$($_.Exception.Message)" -ForegroundColor Red
        break
    }
}

Write-Host "`n  成功抓取完成！共獲取 $($allItems.Count) 筆 591 物件！" -ForegroundColor Green

$properties = @()
$idx = 1

foreach ($item in $allItems) {
    $sec = [regex]::Replace("$($item.sectionname)", '<[^>]+>', '').Trim()
    $reg = [regex]::Replace("$($item.regionname)", '<[^>]+>', '').Trim()
    $category = "nationwide"
    $categoryName = "全台精選"

    if ($sec -match "西屯") {
        $category = "xitun"
        $categoryName = "西屯七期"
    } elseif ($sec -match "南屯") {
        $category = "nantun"
        $categoryName = "南屯優質"
    } elseif ($sec -match "西區") {
        $category = "west"
        $categoryName = "西區草悟道"
    } elseif ($sec -match "北屯") {
        $category = "beitun"
        $categoryName = "北屯機捷"
    } else {
        $category = "nationwide"
        $categoryName = "$reg$sec"
    }

    $title = "$($item.address_img)"
    if (-not $title -or $title.Length -lt 4) {
        $title = "$($item.photo_alt)"
        $bracketIdx = $title.IndexOf("【")
        if ($bracketIdx -ge 0) {
            $title = $title.Substring($bracketIdx)
        }
    }
    $title = [regex]::Replace($title, '<[^>]+>', '').Trim()

    $price = "$($item.price)".Replace("萬元", "").Replace("萬", "").Trim()

    $unitPrice = ""
    if ($item.perarea_str) {
        $m = [regex]::Match("$($item.perarea_str)", '單價約([\d\.]+)萬')
        if ($m.Success) {
            $unitPrice = $m.Groups[1].Value
        }
    }
    if (-not $unitPrice -and $item.area -and [double]$item.area -gt 0) {
        $pVal = [double]($price.Replace(",", ""))
        $aVal = [double]$item.area
        $unitPrice = [math]::Round($pVal / $aVal, 1).ToString()
    }

    $layout = [regex]::Replace("$($item.layout)", '<[^>]+>', '').Trim()
    if (-not $layout) { $layout = "$($item.room)房" }

    $community = [regex]::Replace("$($item.cases_name)", '<[^>]+>', '').Trim()
    if (-not $community) { $community = "$reg$sec" }
    $location = "$reg$sec $($item.street_name)".Trim()

    $floorInfo = [regex]::Replace("$($item.floorInfo)", '<[^>]+>', '').Replace("樓層：", "").Trim()

    $cover = "$($item.filename)"
    if ($cover) {
        $cover = $cover.Replace("!128x92.jpg", "!800x600.jpg").Replace("!200x200.jpg", "!800x600.jpg")
    } else {
        $cover = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
    }

    $link591 = "https://sale.591.com.tw/home/house/detail/2/$($item.id).html"

    $tags = @()
    if ($sec) { $tags += "$sec" }
    if ($community -and $community -ne "$reg$sec") { $tags += "$community" }
    $kindClean = [regex]::Replace("$($item.kind_name)", '<[^>]+>', '').Trim()
    if ($kindClean) { $tags += "$kindClean" }
    if ($item.houseage -and "$($item.houseage)" -ne "0") { $tags += "屋齡$($item.houseage)年" }

    $propObj = [PSCustomObject]@{
        id = $idx
        postId = "$($item.id)"
        category = $category
        categoryName = $categoryName
        title = $title
        subtitle = "$location・$community・$layout"
        price = $price
        unitPrice = $unitPrice
        layout = $layout
        area = "$($item.area)"
        floor = $floorInfo
        age = "$($item.houseage)"
        community = $community
        location = $location
        tags = $tags
        imageUrl = $cover
        link591 = $link591
        isHot = ($idx -le 6)
    }

    $properties += $propObj
    $idx++
}

$propsJson = $properties | ConvertTo-Json -Depth 5

if (Test-Path $ConfigFile) {
    $configContent = [System.IO.File]::ReadAllText($ConfigFile, [System.Text.Encoding]::UTF8)
    $pattern = '(?s)properties:\s*\[.*?\n\s*\],'
    $replacement = "properties: $propsJson,"
    
    if ($configContent -match $pattern) {
        $newContent = [regex]::Replace($configContent, $pattern, $replacement)
        [System.IO.File]::WriteAllText($ConfigFile, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "  成功更新：$ConfigFile" -ForegroundColor Green
    }
}

$DesktopProject = "C:\Users\user\Desktop\群義房屋-個人形象網頁"
if (Test-Path $DesktopProject) {
    $desktopConfig = Join-Path (Join-Path $DesktopProject "js") "config.js"
    Copy-Item -Path $ConfigFile -Destination $desktopConfig -Force
    Write-Host "  成功同步至桌面：$desktopConfig" -ForegroundColor Green
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  全部 $($properties.Count) 筆 591 物件已全數匯入並同步完畢！" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan