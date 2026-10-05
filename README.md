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

---

## Details:

#### It is an Intent classification engine.

The project uses a regex‑based extractor, not a scikit‑learn model.  
app/core/extractor.py contains all the pattern logic; no external ML library is imported or trained.



1. Regex implementation

- Number of rules/patterns: ~12
  - free keyword → price = 0
  - price ranges (under, over, <, >) → price BETWEEN …
  - year extraction (19xx or 20xx) → release_date LIKE %year%
  - developer patterns (by, publisher, etc.) → developers LIKE …
  - sorting keywords  
    - cheapest / most expensive → ORDER BY price ASC/DESC  
    - top rated / newest → ORDER BY user_score DESC, ORDER BY release_date DESC

- Unmatched queries: The extractor returns an empty DynamicEntities.  
  In that case the builder generates a default query:

  sql
  SELECT appid, name, price, user_score, developers, release_date
  FROM games
  ORDER BY user_score DESC LIMIT 15;
  

  So every input yields a harmless SELECT statement.



2. Preventing destructive queries

- The DynamicQueryBuilder only constructs SELECT statements; it never creates UPDATE/DELETE or INSERT clauses.
- All parameters are bound (?) and the query is executed via SQLite’s execute_query.  
  No user‑controlled SQL injection path exists.



3. Ambiguous queries

The system does not explicitly detect ambiguity.  
If a phrase could match multiple patterns, the extractor will pick the first matching rule it encounters (order of checks in code).  
No clarification prompt is issued; the generated query reflects that single interpretation.  

(Adding an explicit disambiguation step would require user interaction or a confidence score.)



4. Dataset / schema

- Fixed schema – hard‑coded in DynamicQueryBuilder and SQLite database (~/Projects/SteamBot/games.db).  
  The SELECT list is:

  
  appid, name, price, user_score, developers, release_date
  

  No dynamic table discovery or schema inference is performed.



Summary

- Intent classification → regex pattern matching.  
- Roughly 12 rules; unmatched queries return a default SELECT.  
- Only SELECT statements are generated – destructive queries impossible.  
- Ambiguity not handled; the first match wins.  
- Schema is fixed, hard‑coded to the games table in SQLite.