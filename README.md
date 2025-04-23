# GeoInsights API

A Node.js backend that gathers environmental data (LST, NDVI, rainfall, flood history, wind & solar, elevation) via Google Earth Engine, enriches it with Vertex AI–generated insights, and serves it to your frontend. Authentication is handled via Firebase.

## Table of Contents

- [Features](#features)  
- [Prerequisites](#prerequisites)  
- [Installation](#installation)  
- [Configuration](#configuration)  
- [Running the Server](#running-the-server)  
- [API Endpoints](#api-endpoints)  
- [Folder Structure](#folder-structure)  
- [Contributing](#contributing)  
- [License](#license)  

## Features

- 🌡️ Fetch Land Surface Temperature (LST)  
- 🌿 Compute NDVI  
- ☔ Retrieve rainfall data  
- 🌊 Access flood history  
- ☀️ Get wind & solar metrics  
- 📏 Calculate elevation differences  
- 🤖 Generate explanatory content via Vertex AI  
- 🔗 Python interoperability (3D models & floor plans)

## Prerequisites

- **Node.js** ≥ 16.x  
- **npm** (bundled with Node.js)  
- A **Firebase** project with service‐account credentials  
- Google Earth Engine access  
- Vertex AI credentials (if using Google Cloud)

## Installation

1. Clone the repo and enter the directory
2. Install dependencies:  
    ```bash
    npm install express cors firebase-admin @google-cloud/vertex-ai
    # plus any other packages, e.g.:
    npm install earthengine-api python-shell child_process
    ```

## Configuration

1. Copy the example config and fill in your keys:  
    ```bash
    cp config/firebaseConfig.example.js config/firebaseConfig.js
    ```
2. In `config/firebaseConfig.js`, set your Firebase credentials.  
3. If needed, create a `.env` at project root:  
    ```env
    PORT=3000
    ORIGIN=http://localhost:5500
    GCP_PROJECT_ID=your-gcp-project
    VERTEX_AI_KEY=...
    ```
4. Ensure your Google Earth Engine token is set up (`earthengine authenticate`).

## Running the Server

```bash
npm start
