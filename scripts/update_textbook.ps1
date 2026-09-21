# ==============================================================================
# 教育部教育雲國小各版本生字詞彙與 150 條常用成語自動採集更新腳本
# scripts/update_textbook.ps1
#
# 功能亮點：
# 1. 自動爬取教育部教育百科近 3 年 (113~115 學年度) 國小 1~6 年級三大版本 (康軒、南一、翰林) 課文生字。
# 2. 自動執行「每課取最新年度覆蓋演算法」(Latest-Year Resolution)，保證考題 100% 取自最新教材。
# 3. 自動爬取教育部官方國小低、中、高年級 150 條常用成語與全字注音。
# 4. 輸出 data/textbook_data.js 與 data/idiom_list_150.js，供前端即時出題與列印。
# 5. 支援本機手動執行與 GitHub Actions 排程全自動定期維護。
# ==============================================================================

param(
    [string[]]$Publishers = @("康軒版", "南一版", "翰林版"),
    [int[]]$Grades = @(1, 2, 3, 4, 5, 6),
    [string[]]$Semesters = @("115_2", "115_1", "114_2", "114_1", "113_2", "113_1"),
    [string]$OutputDir = "$PSScriptRoot\..\data"
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$client = New-Object System.Net.WebClient
$client.Encoding = [System.Text.Encoding]::UTF8
$client.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host " 🚀 啟動國語文生字庫與國小成語定期維護更新程式" -ForegroundColor Cyan
Write-Host " 涵蓋範圍：113~115 學年度 ｜ 國小 1~6 年級 ｜ 康軒・南一・翰林三大版本" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 任務 1：爬取教育部國小低、中、高年級 150 條常用成語
# ------------------------------------------------------------------------------
Write-Host "`n[1/3] 正在擷取教育部官方國小低、中、高年級 150 條常用成語..." -ForegroundColor Yellow
$idiomsUrl = "https://pedia.cloud.edu.tw/Home/IdiomList"
$idiomList = [System.Collections.Generic.List[PSCustomObject]]::new()

try {
    $idiomsHtml = $client.DownloadString($idiomsUrl)
    
    $gradeSections = @(
        @{ Id = "idl-1"; Level = "low"; LevelText = "低年級" },
        @{ Id = "idl-2"; Level = "mid"; LevelText = "中年級" },
        @{ Id = "idl-3"; Level = "high"; LevelText = "高年級" }
    )

    foreach ($sec in $gradeSections) {
        $secStart = $idiomsHtml.IndexOf('id="' + $sec.Id + '"')
        if ($secStart -gt 0) {
            $nextSec = $idiomsHtml.IndexOf('id="idl-', $secStart + 10)
            $secBlock = if ($nextSec -gt $secStart) { $idiomsHtml.Substring($secStart, $nextSec - $secStart) } else { $idiomsHtml.Substring($secStart) }
            
            # 擷取每個成語區塊
            $itemMatches = [regex]::Matches($secBlock, '<a[^>]*GoContent="([^"]+)"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>')
            foreach ($im in $itemMatches) {
                $word = $im.Groups[1].Value.Trim()
                $detailHref = "https://pedia.cloud.edu.tw" + $im.Groups[2].Value.Trim()
                $rubyHtml = $im.Groups[3].Value

                # 擷取逐字注音
                $rubyMatches = [regex]::Matches($rubyHtml, '<ruby>\s*([^<\s]+)\s*<rt>\s*([^<\s]+)\s*</rt>\s*</ruby>')
                $zhuyinParts = [System.Collections.Generic.List[string]]::new()
                $charObjs = [System.Collections.Generic.List[PSCustomObject]]::new()
                
                foreach ($rm in $rubyMatches) {
                    $c = $rm.Groups[1].Value.Trim()
                    $z = $rm.Groups[2].Value.Trim()
                    $zhuyinParts.Add($z)
                    $charObjs.Add([PSCustomObject]@{ char = $c; zhuyin = $z })
                }
                
                $fullZhuyin = $zhuyinParts -join " "

                $idiomList.Add([PSCustomObject]@{
                    word = $word
                    level = $sec.Level
                    levelText = $sec.LevelText
                    zhuyin = $fullZhuyin
                    chars = $charObjs
                    detailUrl = $detailHref
                })
            }
            Write-Host "  -> $($sec.LevelText)常用成語完成：$($itemMatches.Count) 則" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  ⚠️ 成語列表爬取出現異常: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "✅ 國小常用成語採集完畢，共收錄 $($idiomList.Count) 則成語。" -ForegroundColor Green


# ------------------------------------------------------------------------------
# 任務 2：掃描近 3 年 (113~115) 課次清單並執行「每課取最新年度覆蓋演算法」
# ------------------------------------------------------------------------------
Write-Host "`n[2/3] 正在掃描近 3 年各版本課次索引並執行最新版本解析 (Latest-Year Resolution)..." -ForegroundColor Yellow

function Parse-Lesson-Number {
    param([string]$title, [int]$fallbackIndex)
    if ($title -match '第([一二三四五六七八九十百\d]+)課') {
        $cn = $matches[1]
        $map = @{
            '一'=1; '二'=2; '三'=3; '四'=4; '五'=5;
            '六'=6; '七'=7; '八'=8; '九'=9; '十'=10;
            '十一'=11; '十二'=12; '十三'=13; '十四'=14; '十五'=15;
            '1'=1; '2'=2; '3'=3; '4'=4; '5'=5;
            '6'=6; '7'=7; '8'=8; '9'=9; '10'=10;
            '11'=11; '12'=12; '13'=13; '14'=14; '15'=15
        }
        if ($map.ContainsKey($cn)) { return $map[$cn] }
    }
    return $fallbackIndex
}

# 儲存每課的最新版本課次：Key = "${press}_G${grade}_S${semester}_L${lessonNum}"
$activeLessonMap = [System.Collections.Generic.Dictionary[string, PSCustomObject]]::new()
$scannedLessonCount = 0

# 將學年度按由小到大遍歷（113 -> 114 -> 115），新年度會直接覆蓋舊年度
$sortedSemesters = $Semesters | Sort-Object

foreach ($sem in $sortedSemesters) {
    $parts = $sem.Split('_')
    $acadYear = [int]$parts[0]
    $semesterNum = [int]$parts[1]
    
    foreach ($press in $Publishers) {
        $encPress = [System.Uri]::EscapeDataString($press)
        foreach ($grade in $Grades) {
            $listUrl = "https://pedia.cloud.edu.tw/Bookmark/TextWord?category=%E5%9C%8B%E8%AA%9E&year=$sem&degree=$grade&press=$encPress"
            try {
                $html = $client.DownloadString($listUrl)
                $lMatches = [regex]::Matches($html, 'class="textname[^"]*" id="([^"]+)">\s*<strong>([^<]+)</strong>')
                
                $idx = 1
                foreach ($lm in $lMatches) {
                    $textId = $lm.Groups[1].Value.Trim()
                    $rawTitle = $lm.Groups[2].Value.Trim()
                    $lessonNum = Parse-Lesson-Number -title $rawTitle -fallbackIndex $idx
                    
                    $cleanTitle = $rawTitle -replace '^第[一二三四五六七八九十百\d]+課[：:\s]*', ''
                    if ([string]::IsNullOrWhiteSpace($cleanTitle)) { $cleanTitle = $rawTitle }

                    $key = "${press}_G${grade}_S${semesterNum}_L${lessonNum}"
                    
                    # 最新覆蓋策略：新學年度自動覆蓋舊學年度
                    $activeLessonMap[$key] = [PSCustomObject]@{
                        key = $key
                        textId = $textId
                        press = $press
                        grade = $grade
                        semester = $semesterNum
                        lessonNum = $lessonNum
                        rawTitle = $rawTitle
                        cleanTitle = $cleanTitle
                        academicYear = $acadYear
                        semString = $sem
                    }
                    $scannedLessonCount++
                    $idx++
                }
            } catch {
                # 某些未來學期若尚無資料則平滑略過
            }
        }
    }
}

Write-Host "  -> 累計掃描課次：$scannedLessonCount 筆，經最新年度解析後鎖定活性課次：$($activeLessonMap.Count) 課。" -ForegroundColor Green


# ------------------------------------------------------------------------------
# 任務 3：批次爬取各活性課次之生字與詞彙資料
# ------------------------------------------------------------------------------
Write-Host "`n[3/3] 正在批次爬取各活性課次生字與詞彙資料 (共 $($activeLessonMap.Count) 課)..." -ForegroundColor Yellow

$textbookStructure = @{}
foreach ($p in $Publishers) {
    $textbookStructure[$p] = @{}
    foreach ($g in $Grades) {
        $textbookStructure[$p]["$g"] = @{
            "1" = @{ latestYear = 0; lessons = @() }
            "2" = @{ latestYear = 0; lessons = @() }
        }
    }
}

$lessonList = $activeLessonMap.Values | Sort-Object press, grade, semester, lessonNum
$currentProgress = 0
$totalLessons = $lessonList.Count
$totalWordCount = 0

foreach ($les in $lessonList) {
    $currentProgress++
    if ($currentProgress % 30 -eq 0 -or $currentProgress -eq $totalLessons) {
        Write-Host "  -> 進度：$currentProgress / $totalLessons (已採集 $totalWordCount 筆生字詞彙)..." -ForegroundColor Cyan
    }

    $wordsUrl = "https://pedia.cloud.edu.tw/Bookmark/TCollection?TextNameId=" + $les.textId
    $lessonWords = [System.Collections.Generic.List[PSCustomObject]]::new()

    try {
        $wHtml = $client.DownloadString($wordsUrl)
        $wMatches = [regex]::Matches($wHtml, '<tr>\s*<td class="type[^"]*">\s*<span>([^<]+)</span>\s*</td>\s*<td class="word_class[^"]*"><a[^>]*>([^<]+)</a></td>\s*<td class="desc">([^<]*)</td>\s*</tr>')
        
        foreach ($wm in $wMatches) {
            $wType = $wm.Groups[1].Value.Trim()
            $wWord = $wm.Groups[2].Value.Trim()
            $wDesc = $wm.Groups[3].Value.Trim()

            if (-not [string]::IsNullOrWhiteSpace($wWord)) {
                $lessonWords.Add([PSCustomObject]@{
                    type = $wType
                    word = $wWord
                    desc = $wDesc
                })
                $totalWordCount++
            }
        }
    } catch {
        # 網路偶發性延遲重試一次
        Start-Sleep -Milliseconds 300
        try {
            $wHtml = $client.DownloadString($wordsUrl)
            $wMatches = [regex]::Matches($wHtml, '<tr>\s*<td class="type[^"]*">\s*<span>([^<]+)</span>\s*</td>\s*<td class="word_class[^"]*"><a[^>]*>([^<]+)</a></td>\s*<td class="desc">([^<]*)</td>\s*</tr>')
            foreach ($wm in $wMatches) {
                $lessonWords.Add([PSCustomObject]@{
                    type = $wm.Groups[1].Value.Trim()
                    word = $wm.Groups[2].Value.Trim()
                    desc = $wm.Groups[3].Value.Trim()
                })
                $totalWordCount++
            }
        } catch {}
    }

    # 封裝入教材結構樹
    $lesObj = @{
        lessonNum = $les.lessonNum
        lessonTitle = $les.cleanTitle
        rawTitle = $les.rawTitle
        academicYear = $les.academicYear
        textId = $les.textId
        words = $lessonWords
    }

    $curBranch = $textbookStructure[$les.press]["$($les.grade)"]["$($les.semester)"]
    $curBranch.lessons += $lesObj
    if ($les.academicYear -gt $curBranch.latestYear) {
        $curBranch.latestYear = $les.academicYear
    }
}


# ------------------------------------------------------------------------------
# 任務 4：輸出結構化前端資料集 (.js)
# ------------------------------------------------------------------------------
Write-Host "`n[4/4] 正在匯出資料集至前端目錄..." -ForegroundColor Yellow

$timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

# 1. 匯出 data/idiom_list_150.js
$idiomsJson = $idiomList | ConvertTo-Json -Depth 5 -Compress
$idiomsJsContent = @"
/**
 * 教育部官方國小低、中、高年級常用成語 150 則
 * 自動產生時間: $timestamp
 */
window.IDIOM_150_LIST = $idiomsJson;
"@
$idiomsFilePath = Join-Path $OutputDir "idiom_list_150.js"
[System.IO.File]::WriteAllText($idiomsFilePath, $idiomsJsContent, [System.Text.Encoding]::UTF8)
Write-Host "  -> 已產出常用成語檔案：$idiomsFilePath ($($idiomList.Count) 則)" -ForegroundColor Green

# 2. 匯出 data/textbook_data.js
$textbookMetadata = @{
    version = (Get-Date).ToString("yyyyMMdd")
    updatedAt = $timestamp
    totalLessons = $activeLessonMap.Count
    totalWords = $totalWordCount
    publishers = $Publishers
    grades = $Grades
    curriculum = $textbookStructure
}
$textbookJson = $textbookMetadata | ConvertTo-Json -Depth 8 -Compress
$textbookJsContent = @"
/**
 * 教育部教育百科國小各版本生字詞彙庫 (康軒、南一、翰林 1~6 年級)
 * 每課自動取最新年度覆蓋 (Latest-Year Resolution)
 * 自動產生時間: $timestamp
 * 活性課次: $($activeLessonMap.Count) 課 ｜ 總生字詞彙: $totalWordCount 筆
 */
window.TEXTBOOK_DATA = $textbookJson;
"@
$textbookFilePath = Join-Path $OutputDir "textbook_data.js"
[System.IO.File]::WriteAllText($textbookFilePath, $textbookJsContent, [System.Text.Encoding]::UTF8)
Write-Host "  -> 已產出教材生字庫檔案：$textbookFilePath (共 $totalWordCount 筆生字詞彙)" -ForegroundColor Green

Write-Host "`n====================================================================" -ForegroundColor Cyan
Write-Host " 🎉 教科書生字詞彙與常用成語更新成功！" -ForegroundColor Cyan
Write-Host " 總計活性課次：$($activeLessonMap.Count) 課 ｜ 總生字詞彙數：$totalWordCount 筆" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
