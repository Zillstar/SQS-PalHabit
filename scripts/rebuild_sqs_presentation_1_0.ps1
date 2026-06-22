$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$outPath = Join-Path $repo "SQS_praesi_1_0_cover.pptx"
$diagramDir = Join-Path $repo "docs\02-architecture\diagrams\mermaid"

function Rgb($hex) {
    $h = $hex.TrimStart("#")
    $r = [Convert]::ToInt32($h.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($h.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($h.Substring(4, 2), 16)
    return $r + ($g * 256) + ($b * 65536)
}

$C = @{
    Ink       = Rgb "#111827"
    Muted     = Rgb "#5B6773"
    Paper     = Rgb "#F4F8FA"
    White     = Rgb "#FFFFFF"
    Rail      = Rgb "#0B2C35"
    Teal      = Rgb "#007C89"
    Cyan      = Rgb "#00A7B5"
    Blue      = Rgb "#075985"
    BlueBg    = Rgb "#DFF2FF"
    Green     = Rgb "#166534"
    GreenBg   = Rgb "#DCFCE7"
    Amber     = Rgb "#A16207"
    AmberBg   = Rgb "#FEF3C7"
    Rose      = Rgb "#BE185D"
    RoseBg    = Rgb "#FCE7F3"
    SlateBg   = Rgb "#E7EEF2"
    Line      = Rgb "#C9D7DE"
    Dark      = Rgb "#102027"
}

$msoFalse = 0
$msoTrue = -1
$ppLayoutBlank = 12
$msoShapeRectangle = 1
$msoShapeRoundedRectangle = 5
$msoShapeOval = 9
$msoAlignLeft = 1
$msoAlignCenter = 2
$msoAlignRight = 3
$msoAnchorMiddle = 3

function Set-Fill($shape, $color, $transparency = 0) {
    $shape.Fill.Visible = $msoTrue
    $shape.Fill.ForeColor.RGB = $color
    $shape.Fill.Transparency = [single]$transparency
}

function Set-Line($shape, $color, $weight = 1, $transparency = 0) {
    $shape.Line.Visible = $msoTrue
    $shape.Line.ForeColor.RGB = $color
    $shape.Line.Weight = [single]$weight
    $shape.Line.Transparency = [single]$transparency
}

function Add-Text($slide, $text, $x, $y, $w, $h, $size = 18, $color = $C.Ink, $bold = $false, $align = $msoAlignLeft, $font = "Aptos") {
    $shape = $slide.Shapes.AddTextbox(1, $x, $y, $w, $h)
    $shape.TextFrame2.MarginLeft = 0
    $shape.TextFrame2.MarginRight = 0
    $shape.TextFrame2.MarginTop = 0
    $shape.TextFrame2.MarginBottom = 0
    $shape.TextFrame2.WordWrap = $msoTrue
    $tr = $shape.TextFrame2.TextRange
    $tr.Text = $text
    $tr.Font.Name = $font
    $tr.Font.Size = $size
    $tr.Font.Fill.ForeColor.RGB = $color
    if ($bold) { $tr.Font.Bold = $msoTrue } else { $tr.Font.Bold = $msoFalse }
    $tr.ParagraphFormat.Alignment = $align
    return $shape
}

function Add-Card($slide, $x, $y, $w, $h, $fill = $C.White, $line = $C.Line) {
    $shape = $slide.Shapes.AddShape($msoShapeRoundedRectangle, $x, $y, $w, $h)
    Set-Fill $shape $fill | Out-Null
    Set-Line $shape $line 1 | Out-Null
    $shape.Shadow.Visible = $msoTrue
    $shape.Shadow.ForeColor.RGB = Rgb "#7C97A2"
    $shape.Shadow.Transparency = 0.76
    $shape.Shadow.Blur = 10
    $shape.Shadow.OffsetX = 1.4
    $shape.Shadow.OffsetY = 2
    return $shape
}

function Add-CardText($slide, $text, $x, $y, $w, $h, $fill, $color = $C.Ink, $size = 17, $bold = $true, $align = $msoAlignCenter) {
    $shape = Add-Card $slide $x $y $w $h $fill
    $shape.TextFrame2.MarginLeft = 12
    $shape.TextFrame2.MarginRight = 12
    $shape.TextFrame2.MarginTop = 6
    $shape.TextFrame2.MarginBottom = 6
    $shape.TextFrame2.VerticalAnchor = $msoAnchorMiddle
    $tr = $shape.TextFrame2.TextRange
    $tr.Text = $text
    $tr.Font.Name = "Aptos"
    $tr.Font.Size = $size
    $tr.Font.Fill.ForeColor.RGB = $color
    if ($bold) { $tr.Font.Bold = $msoTrue } else { $tr.Font.Bold = $msoFalse }
    $tr.ParagraphFormat.Alignment = $align
    return $shape
}

function Add-Base($slide, $num) {
    $bg = $slide.Shapes.AddShape($msoShapeRectangle, 0, 0, 960, 540)
    Set-Fill $bg $C.Paper | Out-Null
    $bg.Line.Visible = $msoFalse
    $bg.ZOrder(1)

    for ($x = 96; $x -le 896; $x += 96) {
        $line = $slide.Shapes.AddLine($x, 36, $x, 486)
        Set-Line $line $C.Line 1 0.78 | Out-Null
    }
    for ($y = 84; $y -le 468; $y += 96) {
        $line = $slide.Shapes.AddLine(60, $y, 912, $y)
        Set-Line $line $C.Line 1 0.82 | Out-Null
    }

    $rail = $slide.Shapes.AddShape($msoShapeRectangle, 0, 0, 44, 540)
    Set-Fill $rail $C.Rail | Out-Null
    $rail.Line.Visible = $msoFalse
    $accent = $slide.Shapes.AddShape($msoShapeRectangle, 44, 0, 4, 540)
    Set-Fill $accent $C.Cyan | Out-Null
    $accent.Line.Visible = $msoFalse

    Add-Text $slide "SQS" 9 38 26 16 8 $C.White $true $msoAlignCenter "Cascadia Mono" | Out-Null
    Add-Text $slide "QA" 9 472 26 16 8 $C.Cyan $true $msoAlignCenter "Cascadia Mono" | Out-Null
    Add-Text $slide "PokeHabit // Software Qualitätssicherung" 68 502 310 16 8 $C.Muted $false $msoAlignLeft "Cascadia Mono" | Out-Null
    Add-Text $slide ("SLIDE {0:00}" -f $num) 836 502 70 16 8 $C.Muted $false $msoAlignCenter "Cascadia Mono" | Out-Null
    $footer = $slide.Shapes.AddLine(68, 492, 906, 492)
    Set-Line $footer $C.Line 1 | Out-Null
}

function Add-Title($slide, $title, $kicker) {
    $chip = $slide.Shapes.AddShape($msoShapeRectangle, 68, 36, 8, 14)
    Set-Fill $chip $C.Cyan | Out-Null
    $chip.Line.Visible = $msoFalse
    Add-Text $slide ("// " + $kicker) 84 33 330 18 9 $C.Teal $true $msoAlignLeft "Cascadia Mono" | Out-Null
    Add-Text $slide $title 68 72 820 48 30 $C.Ink $true | Out-Null
}

function Add-Bullets($slide, $items, $x, $y, $w, $size = 17, $gap = 40) {
    $yy = $y
    foreach ($item in $items) {
        Add-Text $slide "•" $x $yy 18 22 $size $C.Teal $true | Out-Null
        Add-Text $slide $item ($x + 28) $yy $w 34 $size $C.Ink $false | Out-Null
        $yy += $gap
    }
}

function Add-Stage($slide, $n, $title, $body, $x, $y, $fill, $color) {
    Add-CardText $slide $n $x $y 46 46 $fill $color 18 $true | Out-Null
    Add-Text $slide $title ($x + 60) ($y - 2) 230 22 16 $C.Ink $true | Out-Null
    Add-Text $slide $body ($x + 60) ($y + 25) 250 44 12 $C.Muted $false | Out-Null
}

function Add-Metric($slide, $label, $value, $x, $y, $fill, $color) {
    Add-Card $slide $x $y 186 88 $fill | Out-Null
    Add-Text $slide $value ($x + 14) ($y + 13) 158 42 18 $color $true $msoAlignCenter | Out-Null
    Add-Text $slide $label ($x + 14) ($y + 60) 158 18 10 $C.Muted $false $msoAlignCenter "Cascadia Mono" | Out-Null
}

function Add-Diagram($slide, $relativeName, $x, $y, $w, $h) {
    $path = Join-Path $diagramDir $relativeName
    if (Test-Path $path) {
        $pic = $slide.Shapes.AddPicture((Resolve-Path $path), $msoFalse, $msoTrue, $x, $y, $w, $h)
        Set-Line $pic $C.Line 1 | Out-Null
        return $pic
    }
    Add-CardText $slide "Diagramm nicht gefunden" $x $y $w $h $C.SlateBg $C.Muted 18 $true | Out-Null
}

function Add-Slide($presentation, $num) {
    $slide = $presentation.Slides.Add($num, $ppLayoutBlank)
    Add-Base $slide $num
    return $slide
}

$pp = New-Object -ComObject PowerPoint.Application
$pp.Visible = $msoTrue
$pres = $pp.Presentations.Add($msoTrue)
$pres.PageSetup.SlideWidth = 960
$pres.PageSetup.SlideHeight = 540

# 1
$s = Add-Slide $pres 1
$cover = $s.Shapes.AddShape($msoShapeRectangle, 48, 0, 912, 540)
Set-Fill $cover $C.Dark | Out-Null
$cover.Line.Visible = $msoFalse

for ($x = 96; $x -le 912; $x += 96) {
    $line = $s.Shapes.AddLine($x, 0, $x, 540)
    Set-Line $line (Rgb "#31505A") 1 0.56 | Out-Null
}
for ($y = 60; $y -le 480; $y += 60) {
    $line = $s.Shapes.AddLine(48, $y, 960, $y)
    Set-Line $line (Rgb "#31505A") 1 0.68 | Out-Null
}

$glow = $s.Shapes.AddShape($msoShapeOval, 620, 66, 360, 360)
Set-Fill $glow $C.Teal 0.72 | Out-Null
$glow.Line.Visible = $msoFalse
$glow.Shadow.Visible = $msoTrue
$glow.Shadow.ForeColor.RGB = $C.Cyan
$glow.Shadow.Transparency = 0.45
$glow.Shadow.Blur = 34

Add-Text $s "// SOFTWARE QUALITÄTSSICHERHEIT" 86 56 360 18 10 $C.Cyan $true $msoAlignLeft "Cascadia Mono" | Out-Null
Add-Text $s "PokeHabit" 84 124 520 66 52 $C.White $true | Out-Null
Add-Text $s "Qualitätssicherung sichtbar nachgewiesen" 88 196 690 34 25 $C.Cyan $true | Out-Null
Add-Text $s "Angular · Spring Boot · PostgreSQL · Quality Hub" 90 252 560 24 15 (Rgb "#B9C7CE") $false $msoAlignLeft "Cascadia Mono" | Out-Null
Add-Text $s "Analena Freiberger · Caroline Kriebel · Sophie Gigl" 90 296 560 22 14 $C.White | Out-Null

Add-CardText $s "DEMO" 676 126 160 44 (Rgb "#123E52") $C.Cyan 15 $true | Out-Null
Add-CardText $s "SECURITY" 620 192 160 44 (Rgb "#4B1834") (Rgb "#FF8ABD") 15 $true | Out-Null
Add-CardText $s "ARCHITEKTUR" 704 258 178 44 (Rgb "#17442A") (Rgb "#8EF0B3") 15 $true | Out-Null
Add-CardText $s "QUALITY GATE" 632 324 204 44 (Rgb "#563A10") (Rgb "#FFD166") 15 $true | Out-Null

Add-Text $s "BUILD 1.0 // MORGEN PRÄSENTIERBAR" 88 448 360 18 10 $C.Cyan $true $msoAlignLeft "Cascadia Mono" | Out-Null
Add-Text $s "SQS // PokeHabit // Quality Evidence" 88 502 310 16 8 (Rgb "#B9C7CE") $false $msoAlignLeft "Cascadia Mono" | Out-Null
Add-Text $s "SLIDE 01" 836 502 70 16 8 (Rgb "#B9C7CE") $false $msoAlignCenter "Cascadia Mono" | Out-Null

# 2
$s = Add-Slide $pres 2
Add-Title $s "Roter Faden der Präsentation" "AGENDA"
Add-Stage $s "1" "App zeigen" "Login, Dashboard, Quest, Wasser, Pokémon-Fortschritt" 108 156 $C.BlueBg $C.Blue
Add-Stage $s "2" "Schnittstellen erklären" "öffentliche API, geschützte Endpunkte, Session, Hashing" 488 156 $C.RoseBg $C.Rose
Add-Stage $s "3" "Architektur begründen" "C4, Backend-Komponenten, externe Dienste" 108 286 $C.GreenBg $C.Green
Add-Stage $s "4" "Qualität belegen" "Tests, Coverage-Ziele, statische Analyse, Quality Hub" 488 286 $C.AmberBg $C.Amber
Add-Text $s "Kernaussage: Qualität wird nicht nur behauptet, sondern reproduzierbar geprüft." 150 438 660 24 17 $C.Teal $true $msoAlignCenter | Out-Null

# 3
$s = Add-Slide $pres 3
Add-Title $s "Was PokeHabit fachlich tut" "PRODUKT"
Add-Bullets $s @(
    "Nutzer registrieren sich oder melden sich an.",
    "Tägliche Quests und Wassertracking erzeugen sichtbaren Fortschritt.",
    "XP, Level und Pokémon-Entwicklung machen Self-Care spielerisch.",
    "Die Wetter-Szene reagiert auf echte Wetterdaten über Open-Meteo."
) 112 148 680 18 44
Add-CardText $s "Live-Demo statt Screenshot: App öffnen, Quest abschließen, Wasser hinzufügen, Fortschritt zeigen." 120 404 720 54 $C.SlateBg $C.Teal 16 $true | Out-Null

# 4
$s = Add-Slide $pres 4
Add-Title $s "Demo-Fahrplan für morgen" "DEMO"
Add-CardText $s "http://localhost:3000" 96 148 250 54 $C.BlueBg $C.Blue 18 $true | Out-Null
Add-CardText $s "demo / password123" 356 148 250 54 $C.GreenBg $C.Green 18 $true | Out-Null
Add-CardText $s "Quality Hub: :8088" 616 148 250 54 $C.AmberBg $C.Amber 18 $true | Out-Null
Add-Bullets $s @(
    "Login oder Registrierung zeigen.",
    "Dashboard lädt Nutzerzustand aus dem Backend.",
    "Quest und Wasser ändern Persistenz und Fortschritt.",
    "Fallback: Wenn Docker hängt, Quality Hub und C4-Doku zeigen."
) 130 250 660 17 40

# 5
$s = Add-Slide $pres 5
Add-Title $s "Qualitätsziele sind messbar formuliert" "QUALITÄT"
Add-Metric $s "Funktionalität" "User-Flows" 92 150 $C.BlueBg $C.Blue
Add-Metric $s "Security" "Session + Hashing" 286 150 $C.RoseBg $C.Rose
Add-Metric $s "Wartbarkeit" "Schichten + Regeln" 480 150 $C.GreenBg $C.Green
Add-Metric $s "Testbarkeit" "Coverage-Ziel" 674 150 $C.AmberBg $C.Amber
Add-Bullets $s @(
    "ISO 25010 dient als Ordnungssystem, nicht als Selbstzweck.",
    "GQM übersetzt Ziele in prüfbare Kriterien.",
    "Quality Gate macht Abweichungen sichtbar."
) 128 294 650 18 42

# 6
$s = Add-Slide $pres 6
Add-Title $s "API und Security: öffentlich vs. geschützt" "SECURITY"
Add-CardText $s "Öffentlich: GET /api/tasks" 118 142 318 58 $C.BlueBg $C.Blue 19 $true | Out-Null
Add-CardText $s "Geschützt: Nutzerzustand, Wasser, Quest-Fortschritt" 512 142 318 58 $C.RoseBg $C.Rose 18 $true | Out-Null
Add-Bullets $s @(
    "Nutzerbezogene Aktionen laufen über serverseitige Session.",
    "Passwörter werden nicht im Klartext gespeichert.",
    "Tests prüfen unauthentifizierte Requests und Auth-Flows.",
    "npm Security ergänzt den technischen Sicherheitsnachweis."
) 132 258 690 17 40

# 7
$s = Add-Slide $pres 7
Add-Title $s "Wetterintegration ist gekapselt" "EXTERNER SERVICE"
Add-CardText $s "Frontend" 104 174 160 54 $C.BlueBg $C.Blue 18 $true | Out-Null
Add-Text $s ">" 280 188 20 24 18 $C.Muted $true $msoAlignCenter | Out-Null
Add-CardText $s "Backend WeatherService" 316 174 230 54 $C.GreenBg $C.Green 18 $true | Out-Null
Add-Text $s ">" 564 188 20 24 18 $C.Muted $true $msoAlignCenter | Out-Null
Add-CardText $s "Open-Meteo" 600 174 180 54 $C.AmberBg $C.Amber 18 $true | Out-Null
Add-Bullets $s @(
    "Frontend spricht die eigene Backend-API an, nicht direkt den Wetterdienst.",
    "Backend löst Stadt auf und lädt Forecast-Daten.",
    "Timeouts, fachliche Defaults und Fehlerantworten halten die Kern-App nutzbar."
) 118 294 700 17 42

# 8
$s = Add-Slide $pres 8
Add-Title $s "C4: Systemgrenzen sichtbar machen" "ARCHITEKTUR"
Add-Diagram $s "c4-level-2-container.svg" 90 146 780 270 | Out-Null
Add-CardText $s "Container-Sicht: Angular-Frontend, Spring-Boot-Backend, PostgreSQL, Quality Hub und Open-Meteo sind klar getrennt." 130 438 700 38 $C.SlateBg $C.Teal 14 $true | Out-Null

# 9
$s = Add-Slide $pres 9
Add-Title $s "Backend: Regeln statt Bauchgefühl" "ARCHITEKTUR"
Add-Diagram $s "c4-level-3-backend-components.svg" 90 142 780 270 | Out-Null
Add-CardText $s "Controller, Services, Repository, Security und externe Adapter haben getrennte Verantwortlichkeiten. ArchUnit schützt diese Regeln." 130 438 700 38 $C.GreenBg $C.Green 14 $true | Out-Null

# 10
$s = Add-Slide $pres 10
Add-Title $s "Testpyramide: viele schnelle Tests, wenige teure Flows" "TESTS"
Add-CardText $s "Playwright E2E" 360 148 240 48 $C.RoseBg $C.Rose 18 $true | Out-Null
Add-CardText $s "ArchUnit + Security" 300 216 360 54 $C.AmberBg $C.Amber 19 $true | Out-Null
Add-CardText $s "Integration / Controller" 234 294 492 58 $C.BlueBg $C.Blue 19 $true | Out-Null
Add-CardText $s "Unit: Services, Fachlogik, Komponenten" 160 382 640 62 $C.GreenBg $C.Green 20 $true | Out-Null

# 11
$s = Add-Slide $pres 11
Add-Title $s "Quality Hub bündelt den Nachweis" "QUALITY GATE"
Add-CardText $s "1  Backend verify + JaCoCo" 98 148 250 54 $C.BlueBg $C.Blue 15 $true $msoAlignLeft | Out-Null
Add-CardText $s "2  Checkstyle + SpotBugs" 356 148 250 54 $C.GreenBg $C.Green 15 $true $msoAlignLeft | Out-Null
Add-CardText $s "3  Frontend Typecheck" 614 148 250 54 $C.AmberBg $C.Amber 15 $true $msoAlignLeft | Out-Null
Add-CardText $s "4  Unit Tests + Coverage" 98 238 250 54 $C.GreenBg $C.Green 15 $true $msoAlignLeft | Out-Null
Add-CardText $s "5  ESLint + npm Security" 356 238 250 54 $C.RoseBg $C.Rose 15 $true $msoAlignLeft | Out-Null
Add-CardText $s "6  Playwright User Flow" 614 238 250 54 $C.BlueBg $C.Blue 15 $true $msoAlignLeft | Out-Null
Add-CardText $s "Reports, Logs und Artefakte landen im Quality Hub auf Port 8088." 158 346 644 52 $C.SlateBg $C.Teal 18 $true | Out-Null
Add-Text $s "Der E2E-Check ist sichtbar, aber im Runner bewusst nicht gate-pflichtig, falls die Docker-App beim Start noch nicht erreichbar ist." 156 426 648 34 13 $C.Muted $false $msoAlignCenter | Out-Null

# 12
$s = Add-Slide $pres 12
Add-Title $s "Nachvollziehbarkeit: Doku ist Teil der Qualität" "DOKU"
Add-Metric $s "Architektur" "arc42" 104 152 $C.BlueBg $C.Blue
Add-Metric $s "Entscheidungen" "ADRs" 300 152 $C.GreenBg $C.Green
Add-Metric $s "Sichten" "C4" 496 152 $C.AmberBg $C.Amber
Add-Metric $s "Nachweise" "Quality Docs" 692 152 $C.RoseBg $C.Rose
Add-Bullets $s @(
    "Kontext-, Baustein-, Laufzeit- und Verteilungssicht sind dokumentiert.",
    "Architekturentscheidungen sind als ADRs nachvollziehbar.",
    "Qualitätskonzept, Metriken, Security-Hotspots und Risiken liegen in der Doku."
) 124 298 700 17 42

# 13
$s = Add-Slide $pres 13
Add-Title $s "Was bewusst noch nicht produktionsfertig ist" "GRENZEN"
Add-CardText $s "Deployment-Hardening" 100 154 230 58 $C.RoseBg $C.Rose 17 $true | Out-Null
Add-CardText $s "Monitoring + Alerting" 366 154 230 58 $C.BlueBg $C.Blue 17 $true | Out-Null
Add-CardText $s "Backups + Secrets" 632 154 230 58 $C.AmberBg $C.Amber 17 $true | Out-Null
Add-CardText $s "Tageshistorie" 100 254 230 58 $C.GreenBg $C.Green 17 $true | Out-Null
Add-CardText $s "Caching externer APIs" 366 254 230 58 $C.SlateBg $C.Teal 17 $true | Out-Null
Add-CardText $s "CI/CD statt lokalem Hub" 632 254 230 58 $C.BlueBg $C.Blue 17 $true | Out-Null
Add-Text $s "Wichtig: Diese Punkte werden nicht versteckt, sondern als technische Schulden und nächste Schritte benannt." 130 408 700 34 16 $C.Muted $false $msoAlignCenter | Out-Null

# 14
$s = Add-Slide $pres 14
Add-Title $s "Fazit: Qualität ist sichtbar nachgewiesen" "ABSCHLUSS"
Add-Bullets $s @(
    "Die App erfüllt den zentralen Self-Care-Flow.",
    "Security, externe Dienste und Architekturgrenzen sind begründet.",
    "Tests, statische Analyse, Coverage-Ziele und Quality Hub machen den Nachweis reproduzierbar.",
    "Risiken und technische Schulden sind transparent dokumentiert."
) 132 148 690 17 52
Add-CardText $s "PokeHabit ist keine perfekte Produktiv-App, aber ein sauber nachweisbares Softwarequalitäts-Projekt." 138 404 684 56 $C.Teal $C.White 18 $true | Out-Null

if (Test-Path $outPath) {
    Remove-Item -LiteralPath $outPath -Force
}
$pres.SaveAs($outPath)
$pres.Close()
$pp.Quit()

Write-Host $outPath
