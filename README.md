# SteamBot

A minimal, high-performance natural language query interface for Steam game datasets. Converts user prompts into clean SQL queries over a structured local SQLite database and presents results in a monochrome, responsive interface.

---

## Features

* **Natural Language Parsing**: Extracts price bounds (`under $50`, `over $20`), release years, sorting directives (`cheapest`, `top rated`), and developer/publisher names using rule-based entity extraction.
* **SQLite Core**: Replaced heavy CSV in-memory loads with a local, indexed SQLite engine (`games.db`) for sub-second query latency.
* **Sanitized Pipeline**: Cleansed and aligned dataset schema, removing header shifts and redundant columns.
* **Minimal Frontend**: Dark/Light mode interface featuring tabular result views and distinct chat message structures.

---

## Schema Overview

The database engine queries a single table named `games` with the following clean attributes:

| Column | Type | Description |
| --- | --- | --- |
| `appid` | `INTEGER` | Unique Steam application ID (Primary Key) |
| `name` | `TEXT` | Game title |
| `release_date` | `TEXT` | Launch date |
| `price` | `REAL` | Current price in USD |
| `user_score` | `TEXT` | Metacritic/User review reference URL |
| `developers` | `TEXT` | Studio or primary developer |
| `publishers` | `TEXT` | Publishing entity |
| `categories` | `TEXT` | Feature flags (e.g., Single-player, Controller support) |
| `genres` | `TEXT` | Primary classifications (e.g., Action, Indie) |
| `tags` | `TEXT` | User-defined tags |

---

## Tech Stack

* **Backend**: Python, FastAPI, SQLite3, Pandas (Data cleaning pipeline)
* **Frontend**: React, Tailwind CSS
* **Database**: SQLite3 (`games.db`)

---

## Setup & Running

### 1. Generate the Database

Run the pipeline notebook or script to clean the raw CSV and generate the SQLite database file inside the working directory:

```bash
jupyter execute make_db.ipynb
```

### 2. Start the Backend API

```bash
uvicorn main:app --reload --port 8000
```

### 3. Start the Client

```bash
npm install
npm run dev
```