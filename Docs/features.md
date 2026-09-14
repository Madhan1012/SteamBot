# Suggested Search & Regex Features

Below are concrete enhancements you can add to the search/regex engine in **SteamBot**.  Each feature is described with its purpose, a short example, and why it helps.

| # | Feature | What it does | Why it helps |
|---|---------|--------------|--------------|
| 1 | **Fuzzy‑matching with trigram similarity** | Use SQLite’s built‑in `similarity()` (via FTS5 or a custom UDF) to rank results by edit distance. <br>Example: "title ~ 'doom'" → top matches even if the user typed *doom* incorrectly.* | Makes the UI tolerant of typos and partial words. |
| 2 | **Full‑text search (FTS5)** | Create an FTS virtual table for `name`, `developers`, `publishers`, `tags`. Use `MATCH` instead of `LIKE`. <br>Example: `SELECT * FROM games_fts WHERE games_fts MATCH 'action OR shooter'`. | Faster, more flexible text queries and supports phrase matching. |
| 3 | **Regex support via user‑defined UDF** | Register a `REGEXP` function in SQLite that wraps Python’s `re.search()`. <br>Example: `WHERE name REGEXP '^.*-demo$'`. | Lets users craft powerful patterns (lookaheads, groups) while still running inside SQL. |
| 4 | **Boolean logic & grouping** | Extend the NLP parser to understand `(A AND B) OR C` and translate into nested `AND/OR` clauses with parentheses. <br>Example: "action games from 2019 NOT free" → WHERE genres LIKE '%Action%' AND release_date >= '2019-01-01' AND price > 0`. | Gives users fine‑grained control over complex filters. |
| 5 | **Negation / NOT clauses** | Allow the user to prefix terms with “not” or “exclude”. <br>Example: "price under $30 exclude indie" → WHERE price < 30 AND genres NOT LIKE '%Indie%'`. | Avoids unwanted categories without separate UI controls. |
| 6 | **Range queries for numeric/date fields** | Parse phrases like “between $10 and $50” or “released after 2018”. Translate into SQL `BETWEEN` or comparison operators. <br>Example: "price between 5 and 20" → price BETWEEN 5 AND 20`. | Enables precise filtering on price, release date, user_score, etc. |
| 7 | **Relevance scoring & custom ranking** | Use SQLite’s `fts5_matchinfo()` or a custom UDF to compute a relevance score that can be used in `ORDER BY`. <br>Example: `ORDER BY rank ASC`. | Makes search results feel more natural by surfacing the most relevant games first. |
| 8 | **Aggregations & groupings** | Allow queries like “average price per genre” or “count of free games”. Translate into `GROUP BY` and aggregate functions. <br>Example: `SELECT genres, AVG(price) FROM games GROUP BY genres`. | Adds analytical capabilities useful for dashboards or data‑driven insights. |
| 9 | **Autocomplete & suggestion** | As the user types, run a lightweight query to return top N matches (`LIMIT 5`) and show them in a dropdown. <br>Example: `SELECT name FROM games WHERE name LIKE 'doom%' LIMIT 5`. | Improves UX by guiding users toward valid terms. |
|10 | **Synonym mapping** | Maintain a small synonym table (e.g., “FPS” → “shooter”). When parsing, replace synonyms before building the SQL. <br>Example: "shooter games" → `genres LIKE '%Action%' OR genres LIKE '%Shooter%'`. | Helps users who use different terminology to find the same set of games. |

## Implementation hints
- **FTS5**:
  ```sql
  CREATE VIRTUAL TABLE games_fts USING fts5(name, developers, publishers, tags, content='games', content_rowid='rowid');
  ```
  Keep it synced with your main table via triggers or rebuild after each data load.
- **REGEXP UDF** (Python side):
  ```python
  def regexp(pattern, value):
      return re.search(pattern, value) is not None

  conn.create_function("REGEXP", 2, regexp)
  ```
- **Trigram similarity**:
  ```sql
  SELECT * FROM games WHERE similarity(name, ?) > 0.3 ORDER BY similarity DESC;
  ```
  (Requires the `trigram` extension or a custom similarity UDF.)

Feel free to mix and match these ideas—most of them can be added incrementally without touching the existing NLP pipeline.

## Client‑Side (React) Enhancements

Below are practical features you can add to the React front‑end of SteamBot.  They focus on improving UX, performance, and data presentation while staying lightweight.

| # | Feature | What it does | Why it helps |
|---|---------|--------------|--------------|
| 1 | **Virtualized Table (react-window)** | Render only visible rows of the result table. <br>Example: `FixedSizeList` for thousands of games. | Keeps scrolling smooth even with large datasets. |
| 2 | **Infinite Scrolling / Pagination** | Load more results on demand instead of a full page refresh. <br>API call: `/games?offset=100&limit=50`. | Reduces initial load time and bandwidth; feels snappy. |
| 3 | **Client‑Side Caching with SWR/React Query** | Cache API responses and automatically revalidate on focus or background intervals. | Faster repeat queries, less server load, offline resilience. |
| 4 | **Dark / Light Theme Toggle (Tailwind CSS JIT)** | Persist user preference in localStorage and toggle Tailwind’s `dark:` variants. | Improves accessibility & user comfort. |
| 5 | **Debounced Search Input** | Debounce input changes before sending the query to avoid flooding the API. <br>Use `lodash.debounce` or custom hook. | Reduces unnecessary network traffic, prevents race conditions. |
| 6 | **Error Boundary + Retry Button** | Wrap critical components in an error boundary that shows a friendly message and offers a retry. | Provides graceful degradation on transient failures. |
| 7 | **Responsive Grid for Game Cards** | Use Tailwind’s grid utilities to display game thumbnails on mobile/tablet/desktop. <br>Include hover effects, tooltips. | Enhances visual appeal and usability across devices. |
| 8 | **Client‑Side Filtering UI** | Add multi‑select dropdowns (e.g., genres, publishers) that build query params locally before hitting the API. | Lets users tweak filters instantly without re‑parsing natural language each time. |
| 9 | **Export to CSV / JSON** | Provide a button that triggers `response.clone().blob()` and downloads the data. | Useful for power‑users wanting offline analysis. |
|10 | **Graph Visualization** | Render data‑driven charts (e.g., average price per genre) using Recharts or Chart.js. | Provides instant visual insights into game trends and metrics. |
|11 | **Accessibility Improvements** | Add ARIA roles, focus management on modal dialogs, and keyboard navigation for tables. | Makes the app usable by screen readers and users with motor impairments. |

### Implementation Tips

- **Virtualization**: `react-window` or `react-virtualized` – wrap your `<Table>` component.
- **Infinite Scroll**: Combine `IntersectionObserver` with a “Load More” button hidden until the last row is near the viewport.
- **SWR/React Query**: Use `useSWR('/games?query=...', fetcher)`; set `refreshInterval` to 30000 for background updates.
- **Dark Mode**: Toggle Tailwind’s `dark:` classes by adding/removing `class="dark"` on `<html>`.
- **Debounce Hook**:
  ```tsx
  const useDebounced = (value, delay) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced;
  };
  ```
- **Export**:
  ```tsx
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  ```
- **Accessibility**: Use `role="table"`, `aria-rowindex`, and ensure keyboard focus order is logical.

Feel free to cherry‑pick the ones that match your roadmap. They integrate cleanly with the existing React + Tailwind stack without major refactors.