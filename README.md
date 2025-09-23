# Hack The Pool - Example Applications

[![Hack The Pool](https://info.kulturpool.at/content/images/size/w2000/2025/09/Hack-the-Pool-2025-Banner--780-x-430-px-.png)](https://info.kulturpool.at/hack-the-pool)

A collection of interactive web applications for creative exploration and visualization of cultural data from Austria's Kulturpool API. These examples demonstrate various approaches to working with cultural heritage images and data.

## Overview

This repository contains the following web applications:

- **Automated Summaries**: AI-powered cultural search with automatic summaries
- **Fullscreen Shuffle**: Immersive fullscreen slideshow of cultural images
- **Color Sort**: Data visualization for color analysis of cultural images
- **Cluster Subjects**: Network visualization of thematic connections
- **Wikidata Connect**: Linking cultural objects with Wikidata

All applications use the [Kulturpool API](https://www.kulturpool.at/) to access Austria's cultural heritage collection.

## Quick Start

Each application is self-contained and can be opened directly in a web browser:

1. Clone or download the repository
2. Navigate to any project directory
3. Open `index.html` in your web browser
4. Follow the specific instructions for each application

## Project Structure

```
hackathon-examples/
├── automated-summaries/    # AI-powered cultural search
├── fullscreen-shuffle/     # Immersive image presentation
├── color-sort/             # Color-based visualization
├── cluster-subjects/       # Thematic network analysis
├── wikidata-connect/       # Wikidata linking
├── year-guessing-game/     # A simple year guessing game
└── README.md              # This file
```

## Applications

### Automated Summaries
Intelligent search interface with AI-powered explanations for cultural objects. Search through Austria's cultural collection and receive automatically generated summaries in accessible language.

**Features**: Natural language search, AI summaries, detailed metadata, responsive design

**Usage**: Open `automated-summaries/index.html` in browser. Optional: Add OpenRouter API key for AI functionality.

### Fullscreen Shuffle
Immersive fullscreen slideshow that rapidly cycles through seasonal cultural images. Ideal for digital displays or as a screensaver.

**Features**: Fast image sequence (250ms), seasonal content, fullscreen experience, keyboard controls

**Usage**: Open `fullscreen-shuffle/index.html`, click "Start Image Shuffle". Press Escape to exit.

### Color Sort
Data visualization for analyzing dominant colors in cultural images. Sorts up to 1000 images by hue, brightness, or saturation.

**Features**: Large-scale data analysis, color extraction, D3.js visualization, interactive sorting

**Usage**: Open `color-sort/index.html`, click "Load 1000 Random Images", wait 2-5 minutes.

### Cluster Subjects
Network visualization of thematic connections between cultural objects using force-directed layout.

**Features**: Automatic positioning of related objects, interactive navigation, canvas rendering

**Usage**: Open `cluster-subjects/index.html`, let simulation stabilize, explore the network.

### Wikidata Connect
Links Kulturpool objects with Wikidata through vocabulary mapping (GND, VIAF, Getty, etc.).

**Features**: URI extraction, SPARQL generation, Linked Open Data, Vue.js interface

**Usage**: Open `wikidata-connect/index.html`, click objects, explore Wikidata connections.

### Year Guessing Game
Can you guess the year an object was created? Find out in this small game!

**Features**: Retrieving a random object from the search API and using the data

**Usage**: Open `year-guessing-game/index.html`, wait for an object to load and enter your best guess

## API Information

All applications use the **Kulturpool API**:
- **URL**: `https://api.kulturpool.at/search/`
- **No API key required**
- **Format**: JSON with structured metadata

Key parameters: `q` (search term), `filter_by` (filter), `per_page` (count), `sort_by` (sorting)

## Technical Requirements

- Modern browsers with ES6+ support
- JavaScript enabled
- CORS support for API requests
- No build process or Node.js required
- External libraries loaded via CDN

## Use Cases

* **Education**: Teaching about cultural heritage and data visualization
* **Cultural Institutions**: Digital displays and collection analysis
* **Development**: Reference implementations for cultural APIs
