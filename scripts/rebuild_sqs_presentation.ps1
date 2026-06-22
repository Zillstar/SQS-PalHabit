$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$outPath = Join-Path $repo "SQS_v2_tech.pptx"
$diagramDir = Join-Path $repo "docs\02-architecture\diagrams\mermaid"

function Rgb($hex) {
    $h = $hex.TrimStart("#")
    $r = [Convert]::ToInt32($h.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($h.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($h.Substring(4, 2), 16)
    return $r + ($g * 256) + ($b * 65536)
}

$C = @{
    Ink      = Rgb "#101820"
    Muted    = Rgb "#5E6B78"
    Paper    = Rgb "#F3F7F9"
    White    = Rgb "#FFFFFF"
    Teal     = Rgb "#007C89"
    Teal2    = Rgb "#101820"
    Green    = Rgb "#16804A"
    Mint     = Rgb "#DDF7E8"
    Amber    = Rgb "#B76A00"
    AmberBg  = Rgb "#FFF0C2"
    Rose     = Rgb "#B83265"
    RoseBg   = Rgb "#FFE1EC"
    Blue     = Rgb "#005CB9"
    BlueBg   = Rgb "#DCEEFF"
    Line     = Rgb "#C8D7DE"
    Soft     = Rgb "#E5EFF2"
    Cyan     = Rgb "#00A7B5"
    Dark     = Rgb "#111827"
    Rail     = Rgb "#0E2B34"
}

$msoFalse = 0
$msoTrue = -1
$ppLayoutBlank = 12
$msoShapeRectangle = 1
$msoShapeRoundedRectangle = 5
$msoShapeOval = 9
$msoShapeRightArrow = 33
$msoShapeChevron = 52
$msoLine = 9
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

function Add-Text($slide, $text, $x, $y, $w, $h, $size = 18, $color = $C.Ink, $bold = $false, $align = $msoAlignLeft) {
    $shape = $slide.Shapes.AddTextbox(1, $x, $y, $w, $h)
    $shape.TextFrame2.MarginLeft = 0
    $shape.TextFrame2.MarginRight = 0
    $shape.TextFrame2.MarginTop = 0
    $shape.TextFrame2.MarginBottom = 0
    $shape.TextFrame2.WordWrap = $msoTrue
    $tr = $shape.TextFrame2.TextRange
    $tr.Text = $text
    $tr.Font.Name = "Aptos"
    $tr.Font.Size = $size
    $tr.Font.Fill.ForeColor.RGB = $color
    if ($bold) { $tr.Font.Bold = $msoTrue } else { $tr.Font.Bold = $msoFalse }
    $tr.ParagraphFormat.Alignment = $align
    return $shape
}

function Add-Title($slide, $title, $kicker = "") {
    if ($kicker -ne "") {
        $chip = $slide.Shapes.AddShape($msoShapeRectangle, 68, 32, 8, 14)
        Set-Fill $chip $C.Cyan | Out-Null
        $chip.Line.Visible = $msoFalse
        $k = Add-Text $slide ("// " + $kicker) 84 30 320 20 9 $C.Teal $true
        $k.TextFrame2.TextRange.Font.Name = "Cascadia Mono"
    }
    Add-Text $slide $title 68 62 820 52 31 $C.Ink $true | Out-Null
}

function Add-Footer($slide, $num) {
    $meta = Add-Text $slide "SQS // PokeHabit // Quality Evidence" 68 502 290 16 8 $C.Muted $false
    $meta.TextFrame2.TextRange.Font.Name = "Cascadia Mono"
    $page = Add-Text $slide ("SLIDE {0:00}" -f $num) 838 502 66 16 8 $C.Muted $false $msoAlignCenter
    $page.TextFrame2.TextRange.Font.Name = "Cascadia Mono"
    $line = $slide.Shapes.AddLine(68, 492, 904, 492)
    Set-Line $line $C.Line 1 | Out-Null
}

function Add-Base($slide, $num, $section = "") {
    $bg = $slide.Shapes.AddShape($msoShapeRectangle, 0, 0, 960, 540)
    Set-Fill $bg $C.Paper | Out-Null
    $bg.Line.Visible = $msoFalse
    $bg.ZOrder(1)

    for ($x = 80; $x -le 900; $x += 80) {
        $grid = $slide.Shapes.AddLine($x, 28, $x, 486)
        Set-Line $grid $C.Line 1 0.72 | Out-Null
    }
    for ($y = 64; $y -le 464; $y += 80) {
        $grid = $slide.Shapes.AddLine(54, $y, 912, $y)
        Set-Line $grid $C.Line 1 0.78 | Out-Null
    }

    $rail = $slide.Shapes.AddShape($msoShapeRectangle, 0, 0, 44, 540)
    Set-Fill $rail $C.Rail | Out-Null
    $rail.Line.Visible = $msoFalse
    $bar = $slide.Shapes.AddShape($msoShapeRectangle, 44, 0, 4, 540)
    Set-Fill $bar $C.Cyan | Out-Null
    $bar.Line.Visible = $msoFalse
    Add-Text $slide "SQS" 8 32 28 18 8 $C.White $true $msoAlignCenter | Out-Null
    Add-Text $slide "QA" 8 472 28 18 8 $C.Cyan $true $msoAlignCenter | Out-Null

    $top = Add-Text $slide "BUILD // TEST // ARCHITECTURE // SECURITY" 610 28 294 16 8 $C.Muted $false $msoAlignRight
    $top.TextFrame2.TextRange.Font.Name = "Cascadia Mono"
    if ($section -ne "") {
        Add-Text $slide $section 68 24 240 16 9 $C.Teal $true | Out-Null
    }
    Add-Footer $slide $num
}

function Add-Card($slide, $x, $y, $w, $h, $fill, $line = $C.Line, $radius = $msoShapeRoundedRectangle) {
    $shape = $slide.Shapes.AddShape($radius, $x, $y, $w, $h)
    Set-Fill $shape $fill | Out-Null
    Set-Line $shape $line 1 | Out-Null
    $shape.Shadow.Visible = $msoTrue
    $shape.Shadow.ForeColor.RGB = Rgb "#8AA6B0"
    $shape.Shadow.Transparency = 0.72
    $shape.Shadow.Blur = 10
    $shape.Shadow.OffsetX = 1.5
    $shape.Shadow.OffsetY = 2
    return $shape
}

function Add-CardText($slide, $text, $x, $y, $w, $h, $fill, $color = $C.Ink, $size = 18, $bold = $true, $align = $msoAlignCenter) {
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
    if ($bold) { $tr.Font.Bold = $msoTrue }
    $tr.ParagraphFormat.Alignment = $align
    return $shape
}

function Add-Bullets($slide, $items, $x, $y, $w, $size = 18, $gap = 40, $color = $C.Ink) {
    $yy = $y
    foreach ($item in $items) {
        Add-Text $slide "•" $x $yy 18 22 $size $C.Teal $true | Out-Null
        Add-Text $slide $item ($x + 24) $yy $w 34 $size $color $false | Out-Null
        $yy += $gap
    }
}

function Add-StepRow($slide, $items, $x, $y, $w, $h, $fills) {
    $count = $items.Count
    $gap = 12
    $boxW = ($w - ($gap * ($count - 1))) / $count
    for ($i = 0; $i -lt $count; $i++) {
        $fill = $fills[$i % $fills.Count]
        Add-CardText $slide $items[$i] ($x + ($boxW + $gap) * $i) $y $boxW $h $fill $C.Ink 15 $true | Out-Null
        if ($i -lt $count - 1) {
            Add-Text $slide ">" ($x + ($boxW + $gap) * $i + $boxW + 1) ($y + 22) 12 18 16 $C.Muted $true $msoAlignCenter | Out-Null
        }
    }
}

function Add-IconCircle($slide, $label, $caption, $x, $y, $color) {
    $circle = $slide.Shapes.AddShape($msoShapeOval, $x, $y, 70, 70)
    Set-Fill $circle $C.White | Out-Null
    Set-Line $circle $color 2 | Out-Null
    Add-Text $slide $label ($x + 4) ($y + 18) 62 30 22 $color $true $msoAlignCenter | Out-Null
    Add-Text $slide $caption ($x - 38) ($y + 82) 146 44 11 $C.Ink $false $msoAlignCenter | Out-Null
}

function Add-DiagramOrFallback($slide, $relativeName, $title, $caption, $fallbackItems) {
    Add-Title $slide $title "ARCHITEKTUR"
    $path = Join-Path $diagramDir $relativeName
    if (Test-Path $path) {
        try {
            $pic = $slide.Shapes.AddPicture((Resolve-Path $path), $msoFalse, $msoTrue, 78, 132, 804, 286)
            Set-Line $pic $C.Line 1 | Out-Null
        } catch {
            $x = 104
            foreach ($item in $fallbackItems) {
                Add-CardText $slide $item $x 194 176 88 $C.White $C.Ink 16 $true | Out-Null
                $x += 205
            }
        }
    }
    Add-CardText $slide $caption 112 432 736 40 $C.Soft $C.Teal 15 $true | Out-Null
}

function Add-Slide($presentation, $num, $section = "") {
    $slide = $presentation.Slides.Add($num, $ppLayoutBlank)
    Add-Base $slide $num ""
    return $slide
}

$pp = New-Object -ComObject PowerPoint.Application
$pp.Visible = $msoTrue
$pres = $pp.Presentations.Add($msoTrue)
$pres.PageSetup.SlideWidth = 960
$pres.PageSetup.SlideHeight = 540

# 1
$s = Add-Slide $pres 1 ""
Add-Text $s "PokeHabit" 72 92 500 66 48 $C.Ink $true | Out-Null
Add-Text $s "Qualitätssicherung einer gamifizierten Self-Care-App" 76 166 660 38 24 $C.Teal $true | Out-Null
Add-Text $s "Software Qualitätssicherheit" 78 220 350 26 16 $C.Muted | Out-Null
Add-Text $s "Analena Freiberger · Caroline Kriebel · Sophie Gigl" 78 252 540 22 14 $C.Ink | Out-Null
Add-CardText $s "Self-Care" 612 102 190 52 $C.Mint $C.Green 18 $true | Out-Null
Add-CardText $s "XP + Level" 690 176 178 52 $C.BlueBg $C.Blue 18 $true | Out-Null
Add-CardText $s "Tests" 604 250 150 52 $C.AmberBg $C.Amber 18 $true | Out-Null
Add-CardText $s "Quality Gate" 708 324 190 52 $C.RoseBg $C.Rose 18 $true | Out-Null
Add-Footer $s 1

# 2
$s = Add-Slide $pres 2 "PRODUKT"
Add-Title $s "Dashboard: Self-Care wird messbar" "PRODUKT"
Add-Card $s 84 132 792 298 $C.White | Out-Null
Add-Text $s "PokeHabit Dashboard" 112 154 250 24 17 $C.Ink $true | Out-Null
Add-CardText $s "4/5`nQuests" 112 200 118 78 $C.BlueBg $C.Blue 18 $true | Out-Null
Add-CardText $s "1.500 ml`nWasser" 246 200 118 78 $C.Mint $C.Green 18 $true | Out-Null
Add-CardText $s "Level 7`nPokémon" 380 200 118 78 $C.AmberBg $C.Amber 18 $true | Out-Null
Add-CardText $s "Wetter-Szene`nBerlin, klar" 514 200 152 78 $C.Soft $C.Teal 17 $true | Out-Null
Add-CardText $s "Quality Score 82 %" 690 200 144 78 $C.RoseBg $C.Rose 17 $true | Out-Null
Add-StepRow $s @("Login", "Tasks", "Wasser", "Fortschritt") 134 328 692 50 @($C.Mint, $C.BlueBg, $C.AmberBg, $C.Soft)
Add-Text $s "Demo-Narrativ: anmelden, Tagesquests bearbeiten, Wasser tracken, Fortschritt und Wetterwelt sehen." 112 442 720 26 16 $C.Muted | Out-Null

# 3
$s = Add-Slide $pres 3 "PRODUKT"
Add-Title $s "Was macht PokeHabit?" "PRODUKT"
Add-StepRow $s @("Login / Registrierung", "Dashboard", "Quest + Wasser", "XP, Level, Pokémon") 78 150 804 64 @($C.Mint, $C.BlueBg, $C.AmberBg, $C.RoseBg)
Add-Bullets $s @(
    "Nutzer registrieren sich und melden sich an.",
    "Tägliche Aufgaben und Wassertracking erzeugen Fortschritt.",
    "XP, Level und Pokémon-Fortschritt machen Self-Care sichtbar.",
    "Dashboard zeigt Tasks, Wasser, Pokémon und Wetter-Szene."
) 118 250 680 18 42
Add-CardText $s "Demo-Pfad: https://localhost:3000    Demo / password123" 158 444 644 44 $C.Teal $C.White 16 $true | Out-Null

# 4
$s = Add-Slide $pres 4 "QUALITÄT"
Add-Title $s "Qualität ist projektspezifisch definiert" "QUALITÄT"
Add-Text $s "Qualität heißt nicht fehlerfrei, sondern für diesen Anwendungskontext geeignet." 82 126 760 30 18 $C.Muted | Out-Null
$labels = @(
    @("Funktionalität", "Login, Tasks, Wasser, Fortschritt", $C.Mint, $C.Green),
    @("Security", "geschützte Endpunkte, Passwort-Hashing", $C.BlueBg, $C.Blue),
    @("Wartbarkeit", "Schichtung, ArchUnit", $C.AmberBg, $C.Amber),
    @("Benutzbarkeit", "Dashboard, Docker-Start", $C.RoseBg, $C.Rose)
)
$x = 82
foreach ($l in $labels) {
    Add-CardText $s $l[0] $x 188 180 54 $l[2] $l[3] 16 $true | Out-Null
    Add-Text $s $l[1] $x 254 180 48 13 $C.Ink $false $msoAlignCenter | Out-Null
    $x += 210
}
Add-StepRow $s @("ISO 25010", "Kano", "GQM", "Nachweis") 126 374 708 54 @($C.Mint, $C.White, $C.White, $C.Soft)
Add-Text $s "Nachweis: ReadTheDocs / 04-quality / iso-25010" 110 454 740 18 12 $C.Muted $false $msoAlignCenter | Out-Null

# 5
$s = Add-Slide $pres 5 "QUALITÄT"
Add-Title $s "Von Soll-Werten zu Ist-Werten" "QUALITÄT"
Add-Text $s "Coverage-Ziel und Quality Gate übersetzen Qualitätsansprüche in prüfbare Kriterien." 82 124 760 28 18 $C.Muted | Out-Null
Add-CardText $s "> 80 % Coverage" 92 190 190 70 $C.Mint $C.Green 18 $true | Out-Null
Add-CardText $s "0 kritische Bugs" 300 190 190 70 $C.BlueBg $C.Blue 18 $true | Out-Null
Add-CardText $s "0 kritische Vulnerabilities" 508 190 190 70 $C.RoseBg $C.Rose 17 $true | Out-Null
Add-CardText $s "geringe Duplikation" 716 190 150 70 $C.AmberBg $C.Amber 17 $true | Out-Null
Add-Bullets $s @(
    "keine blockierenden Code-Smells",
    "grüne CI als Merge-Voraussetzung",
    "Abweichungen blockieren den Merge"
) 146 306 600 17 38
Add-CardText $s "Quality Gate" 260 438 440 46 $C.Teal $C.White 20 $true | Out-Null

# 6
$s = Add-Slide $pres 6 "TESTS"
Add-Title $s "Tests auf mehreren Ebenen statt nur E2E" "TESTS"
Add-CardText $s "Playwright E2E" 350 144 260 50 $C.RoseBg $C.Rose 18 $true | Out-Null
Add-CardText $s "ArchUnit" 296 206 368 56 $C.AmberBg $C.Amber 20 $true | Out-Null
Add-CardText $s "Integration / Controller / Security" 228 276 504 62 $C.BlueBg $C.Blue 20 $true | Out-Null
Add-CardText $s "Unit: Services, Fachlogik, Komponenten" 152 354 656 70 $C.Mint $C.Green 20 $true | Out-Null
Add-Text $s "Breite Basis: viele schnelle Tests. Spitze: wenige teure End-to-End-Flows." 168 454 624 24 15 $C.Muted $false $msoAlignCenter | Out-Null

# 7
$s = Add-Slide $pres 7 "NACHWEIS"
Add-Title $s "Qualität sichtbar und reproduzierbar machen" "NACHWEIS"
$steps = @(
    "Start über Docker Compose mit Quality-Profil",
    "Quality Hub unter http://localhost:8088",
    "Backend-Tests mit JaCoCo",
    "Checkstyle und SpotBugs",
    "Frontend: Typecheck, Unit-Tests, Coverage, ESLint",
    "npm Security",
    "optionaler Playwright-E2E-Flow",
    "CI über GitHub Actions"
)
$y = 132
for ($i = 0; $i -lt $steps.Count; $i++) {
    $fill = @($C.Soft, $C.BlueBg, $C.Mint, $C.AmberBg)[$i % 4]
    Add-CardText $s ("{0}. {1}" -f ($i + 1), $steps[$i]) 110 $y 740 34 $fill $C.Ink 15 $true $msoAlignLeft | Out-Null
    $y += 40
}

# 8
$s = Add-Slide $pres 8 "ARCHITEKTUR"
Add-Title $s "Klare Systemgrenzen durch C4" "ARCHITEKTUR"
Add-CardText $s "C1: Nutzer, PokeHabit und externe Systeme" 118 142 724 56 $C.RoseBg $C.Rose 20 $true $msoAlignLeft | Out-Null
Add-CardText $s "C2: Angular-Frontend, Spring-Boot-Backend, PostgreSQL, Quality Hub, Open-Meteo" 118 212 724 62 $C.AmberBg $C.Amber 19 $true $msoAlignLeft | Out-Null
Add-CardText $s "C3: Backend-Komponenten für Auth, User-State, Tasks, Pokémon-Fortschritt und Wetterintegration" 118 292 724 62 $C.Mint $C.Green 18 $true $msoAlignLeft | Out-Null
Add-CardText $s "PokeAPI ist nicht Teil des normalen Laufzeitpfads; Pokémon-Stammdaten liegen in PostgreSQL." 118 372 724 62 $C.Soft $C.Teal 18 $true $msoAlignLeft | Out-Null

# 9-12
$s = Add-Slide $pres 9 "ARCHITEKTUR"
Add-DiagramOrFallback $s "c4-level-1-system-context.svg" "C4 Level 1: System Context" "Fokus: PokeHabit grenzt Nutzer, Wetterdienst und Produktivitäts-App voneinander ab." @("Nutzer", "PokeHabit", "Open-Meteo")
$s = Add-Slide $pres 10 "ARCHITEKTUR"
Add-DiagramOrFallback $s "c4-level-2-container.svg" "C4 Level 2: Container" "Fokus: Frontend, Backend, Datenbank und Qualitätswerkzeuge mit klaren Verantwortlichkeiten." @("Angular", "Spring Boot", "PostgreSQL", "Quality Hub")
$s = Add-Slide $pres 11 "ARCHITEKTUR"
Add-DiagramOrFallback $s "c4-level-3-backend-components.svg" "C4 Level 3: Backend-Komponenten" "Fokus: Controller, Services, Persistence und externe Adapter bleiben trennbar." @("Controller", "Services", "Repositories", "Adapter")
$s = Add-Slide $pres 12 "ARCHITEKTUR"
Add-DiagramOrFallback $s "c4-frontend-components.svg" "C4 Level 3: Frontend-Komponenten" "Fokus: Dashboard, State, Services und UI-Komponenten bilden getrennte Verantwortungen." @("Pages", "State", "Services", "UI")

# 13
$s = Add-Slide $pres 13 "ARCHITEKTUR"
Add-Title $s "Vereinfachte hexagonale Architektur" "ARCHITEKTUR"
Add-Bullets $s @(
    "Fachlogik bleibt unabhängig von REST, DB und Fremdsystemen.",
    "Externe Dienste werden gekapselt.",
    "Architekturregeln werden mit ArchUnit gegen unbeabsichtigte Abhängigkeiten abgesichert."
) 90 132 760 17 42
Add-StepRow $s @("Eingehende Adapter`nREST Controller", "Application`nServices / Use Cases", "Core / Domain`nTasks, Wasser, Pokémon", "Ausgehende Adapter`nPostgreSQL") 72 344 816 74 @($C.BlueBg, $C.White, $C.Mint, $C.AmberBg)

# 14
$s = Add-Slide $pres 14 "SECURITY"
Add-Title $s "Öffentliche und geschützte Endpunkte" "SECURITY"
Add-CardText $s "Öffentlicher Endpunkt: GET /api/tasks" 126 132 708 56 $C.Teal $C.White 20 $true | Out-Null
Add-IconCircle $s "1" "Nutzerbezogene Aktionen sind sessiongeschützt." 124 256 $C.Blue
Add-IconCircle $s "2" "Passwörter werden gehasht gespeichert." 328 256 $C.Green
Add-IconCircle $s "3" "Login-Schutz gegen wiederholte Fehlversuche." 532 256 $C.Rose
Add-IconCircle $s "4" "Tests prüfen geschützte Endpunkte ohne Session." 736 256 $C.Teal

# 15
$s = Add-Slide $pres 15 "WETTER"
Add-Title $s "Wetterdaten robust anbinden" "WETTER"
$weather = @(
    "Nutzer gibt nur einen Stadtnamen ein.",
    "Backend löst Stadt über Open-Meteo Geocoding auf.",
    "Backend ruft Forecast-Daten ab: Temperatur, Wettercode, Tag/Nacht.",
    "Frontend übersetzt den Snapshot in eine Wetter-Szene.",
    "Gespeicherter Ort wird lokal gespeichert und regelmäßig aktualisiert."
)
$y = 136
for ($i = 0; $i -lt $weather.Count; $i++) {
    $fill = @($C.RoseBg, $C.BlueBg, $C.Soft, $C.Mint, $C.AmberBg)[$i]
    Add-CardText $s $weather[$i] 126 $y 708 52 $fill $C.Ink 17 $true $msoAlignLeft | Out-Null
    $y += 64
}

# 16
$s = Add-Slide $pres 16 "WETTER"
Add-Title $s "Resilienz beim Wetter-Feature" "WETTER"
Add-CardText $s "Implementiert" 92 136 350 44 $C.Mint $C.Green 19 $true | Out-Null
Add-Bullets $s @(
    "Verbindungsaufbau: Timeout 2 Sekunden",
    "Einzelner Request: Timeout 4 Sekunden",
    "ungültige Daten: fachliche Default-Werte",
    "Open-Meteo-Fehler: kontrollierte 502-Antwort"
) 110 204 330 15 38
Add-CardText $s "Sinnvolle Erweiterungen" 520 136 350 44 $C.AmberBg $C.Amber 19 $true | Out-Null
Add-Bullets $s @(
    "Caching externer Wetterdaten",
    "Retry mit Backoff",
    "Circuit Breaker",
    "Monitoring und Alerting"
) 538 204 330 15 38
Add-Text $s "Diese Erweiterungen sind bewusst als Grenzen dokumentiert, nicht als produktiv implementiert." 150 448 660 28 15 $C.Muted $false $msoAlignCenter | Out-Null

# 17
$s = Add-Slide $pres 17 "NACHVOLLZIEHBARKEIT"
Add-Title $s "Qualität ist auch Nachvollziehbarkeit" "NACHVOLLZIEHBARKEIT"
Add-Bullets $s @(
    "Architektur ist in arc42 mit Kontext-, Baustein-, Laufzeit- und Verteilungssicht beschrieben.",
    "ADRs dokumentieren zentrale Entscheidungen.",
    "Testkonzept und Testpyramide sind dokumentiert.",
    "Bekannte Grenzen sind dokumentiert."
) 92 132 720 17 42
Add-StepRow $s @("ReadTheDocs", "arc42", "C4", "ADRs", "Testkonzept", "Quality Reports") 84 376 792 58 @($C.Soft, $C.Mint, $C.BlueBg, $C.RoseBg, $C.AmberBg, $C.Soft)

# 18
$s = Add-Slide $pres 18 "GRENZEN"
Add-Title $s "Was ist noch nicht produktionsfertig?" "GRENZEN"
$todo = @(
    "Deployment-Hardening",
    "Monitoring und Alerting",
    "Backups und Secrets-Management",
    "Caching externer Wetterdaten",
    "Retry und Circuit Breaker",
    "Last- und Browser-Matrix-Tests",
    "umfangreichere Tageshistorie"
)
$x = 82; $y = 142
for ($i = 0; $i -lt $todo.Count; $i++) {
    $fill = @($C.RoseBg, $C.BlueBg, $C.AmberBg, $C.Mint, $C.Soft)[$i % 5]
    Add-CardText $s $todo[$i] $x $y 236 64 $fill $C.Ink 15 $true | Out-Null
    $x += 280
    if ($x -gt 700) { $x = 82; $y += 92 }
}
Add-Text $s "Wichtig: nicht verschwiegen, sondern explizit als Grenze und nächster Schritt benannt." 130 452 700 24 15 $C.Muted $false $msoAlignCenter | Out-Null

# 19
$s = Add-Slide $pres 19 "FAZIT"
Add-Title $s "Softwarequalität sichtbar nachgewiesen" "FAZIT"
$evidence = @(
    "funktionierende App",
    "definierte Qualitätsziele",
    "automatisierte Tests",
    "statische Analyse und Coverage",
    "Security-Checks",
    "Architekturtests",
    "Docker-Start und Quality Hub",
    "dokumentierte Architektur und Grenzen"
)
$y = 134
foreach ($item in $evidence) {
    Add-CardText $s $item 128 $y 704 34 $C.Teal $C.White 16 $true $msoAlignLeft | Out-Null
    $y += 40
}
Add-Text $s "Danke." 382 466 200 34 24 $C.Ink $true $msoAlignCenter | Out-Null

if (Test-Path $outPath) {
    Remove-Item -LiteralPath $outPath -Force
}
$pres.SaveAs($outPath)
$pres.Close()
$pp.Quit()

Write-Host $outPath
