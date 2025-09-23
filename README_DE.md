# Hack The Pool - Beispielanwendungen

[![Hack The Pool](https://info.kulturpool.at/content/images/size/w2000/2025/09/Hack-the-Pool-2025-Banner--780-x-430-px-.png)](https://info.kulturpool.at/hack-the-pool)

Eine Sammlung interaktiver Webanwendungen zur kreativen Erkundung und Visualisierung von Kulturdaten aus der Kulturpool-API. Die Beispiele zeigen verschiedene Ansätze für die Arbeit mit Kulturerbe-Bildern und -Daten.

## Überblick

Dieses Repository enthält folgende Webanwendungen:

- **Automated Summaries**: KI-gestützte Kultursuche mit automatischen Zusammenfassungen
- **Fullscreen Shuffle**: Immersive Vollbild-Diashow von Kulturbildern
- **Color Sort**: Datenvisualisierung zur Farbanalyse von Kulturbildern
- **Cluster Subjects**: Netzwerkvisualisierung thematischer Verbindungen
- **Wikidata Connect**: Verknüpfung von Kulturobjekten mit Wikidata

Alle Anwendungen nutzen die [Kulturpool API](https://www.kulturpool.at/) für den Zugang zu Österreichs Kulturerbe-Sammlung.

## Schnellstart

Jede Anwendung ist eigenständig und kann direkt im Webbrowser geöffnet werden:

1. Repository klonen oder herunterladen
2. In ein Projektverzeichnis navigieren
3. `index.html` im Webbrowser öffnen
4. Den spezifischen Anweisungen der jeweiligen Anwendung folgen

## Projektstruktur

```
hackathon-examples/
├── automated-summaries/    # KI-gestützte Kultursuche
├── fullscreen-shuffle/     # Immersive Bildpräsentation
├── color-sort/             # Farbbasierte Visualisierung
├── cluster-subjects/       # Thematische Netzwerk-Analyse
├── wikidata-connect/       # Wikidata-Verknüpfung
├── year-guessing-game/     # Ein einfaches Ratespiel
└── README.md              # Diese Datei
```

## Anwendungen

### Automated Summaries
Intelligente Suchoberfläche mit KI-gestützten Erklärungen für Kulturobjekte. Durchsuchen Sie Österreichs Kultursammlung und erhalten Sie automatisch generierte Zusammenfassungen in verständlicher Sprache.

**Features**: Natürlichsprachliche Suche, KI-Zusammenfassungen, detaillierte Metadaten, responsive Gestaltung

**Nutzung**: `automated-summaries/index.html` im Browser öffnen. Optional: OpenRouter API-Schlüssel für KI-Funktionen hinzufügen.

### Fullscreen Shuffle
Immersive Vollbild-Diashow, die schnell durch saisonale Kulturbilder wechselt. Ideal für digitale Anzeigen oder als Bildschirmschoner.

**Features**: Schnelle Bildfolge (250ms), saisonale Inhalte, Vollbilderlebnis, Keyboard-Steuerung

**Nutzung**: `fullscreen-shuffle/index.html` öffnen, "Start Image Shuffle" klicken. Escape-Taste zum Beenden.

### Color Sort
Datenvisualisierung zur Analyse dominanter Farben in Kulturbildern. Sortiert bis zu 1000 Bilder nach Farbton, Helligkeit oder Sättigung.

**Features**: Großdatenanalyse, Farbextraktion, D3.js-Visualisierung, interaktive Sortierung

**Nutzung**: `color-sort/index.html` öffnen, "Load 1000 Random Images" klicken, 2-5 Minuten warten.

### Cluster Subjects
Netzwerkvisualisierung thematischer Verbindungen zwischen Kulturobjekten mit Force-Directed Layout.

**Features**: Automatische Positionierung verwandter Objekte, interaktive Navigation, Canvas-Rendering

**Nutzung**: `cluster-subjects/index.html` öffnen, Simulation stabilisieren lassen, Netzwerk erkunden.

### Wikidata Connect
Verknüpfung von Kulturpool-Objekten mit Wikidata durch Vocabulary-Mapping (GND, VIAF, Getty, etc.).

**Features**: URI-Extraktion, SPARQL-Generierung, Linked Open Data, Vue.js-Interface

**Nutzung**: `wikidata-connect/index.html` öffnen, Objekte anklicken, Wikidata-Verbindungen erkunden.

### Year Guessing Game
Können Sie erraten wann ein Objekt hergestellt wurde? Finden Sie es heraus in diesem kleinen Spiel!

**Features**: Abrufen eines zufälligen Objekts über die Search-API und nutzung der Daten

**Nutzung**: `year-guessing-game/index.html` öffnen, warten bis das Objekt geladen ist und einfach losraten.

## API-Information

Alle Anwendungen nutzen die **Kulturpool API**:
- **URL**: `https://api.kulturpool.at/search/`
- **Kein API-Schlüssel erforderlich**
- **Format**: JSON mit strukturierten Metadaten

Wichtige Parameter: `q` (Suchbegriff), `filter_by` (Filter), `per_page` (Anzahl), `sort_by` (Sortierung)

## Technische Anforderungen

- Moderne Browser mit ES6+-Unterstützung
- JavaScript aktiviert
- CORS-Unterstützung für API-Anfragen
- Kein Build-Prozess oder Node.js erforderlich
- Externe Bibliotheken über CDN geladen

## Einsatzbereiche

* **Bildung**: Lehre über Kulturerbe und Datenvisualisierung
* **Kulturinstitutionen**: Digitale Displays und Sammlungsanalyse
* **Entwicklung**: Referenzimplementierungen für Kultur-APIs