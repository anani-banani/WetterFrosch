# Buddel Wetter — Setup (Vercel)

## 1. GitHub

1. Neues Repo anlegen, z. B. `GartenwetterWidget`.
2. Diesen kompletten Ordner hochladen. **Wichtig für Vercel**: die Funktion
   muss in einem Ordner **`api/`** direkt im Repo-Root liegen — Vercel
   erkennt jede Datei in `api/` automatisch als eigene Route
   (`api/get-weather.js` → `/api/get-weather`). Kein `netlify.toml` mehr
   nötig, dafür `vercel.json`.

Struktur sollte so aussehen:

```
GartenwetterWidget/
├── api/
│   └── get-weather.js
├── vercel.json
└── widget.html
```

## 2. Vercel

1. "Add New..." → "Project" → das GitHub-Repo importieren.
2. Framework Preset: **Other** (kein Build-Step nötig, reines statisches
   Projekt + eine Serverless Function).
3. Root Directory: leer lassen / Repo-Root.
4. Deploy klicken.
5. Danach ist die Funktion erreichbar unter:
   `https://DEIN-PROJEKT.vercel.app/api/get-weather`
6. Kurz im Browser aufrufen und prüfen, ob JSON mit Wetterdaten kommt.
   Falls wieder 404: Vercel-Dashboard → Deployments → "Functions" Tab
   prüfen, ob `get-weather` dort als Function gelistet ist. Wenn nicht,
   liegt `api/get-weather.js` vermutlich nicht im Repo-Root.

## 3. Widget-URL eintragen

In `widget.html` ist bereits `/api/get-weather` (relativer Pfad) eingetragen.
Das funktioniert automatisch, **sobald `widget.html` von derselben
Vercel-Domain ausgeliefert wird**. Da du es aber per Copy-Paste in einen
Notion HTML-Block einfügst (andere Origin!), musst du die absolute URL
eintragen:

```js
const FUNCTION_URL = "https://DEIN-PROJEKT.vercel.app/api/get-weather";
```

CORS ist in der Funktion bereits freigeschaltet (`Access-Control-Allow-Origin: *`),
das war vermutlich auch nicht das 404-Problem, aber gehört für den
Notion-Fall dazu.

## 4. Schrift ergänzen

Den bestehenden `@font-face`-Block (PP Pangaia, Base64) aus einem deiner
anderen Widgets in `widget.html` an der markierten Stelle einfügen.

## 5. In Notion einfügen

Kompletten (angepassten) Inhalt von `widget.html` in einen HTML-Block in
Notion einfügen.
