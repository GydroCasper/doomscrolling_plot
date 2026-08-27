# Doomscrolling Plot

Web scraper that monitors changes across multiple data sources and generates diffs when data updates.

## What it does

1. Fetches data from configured URLs (HTML pages or JSON APIs)
2. Extracts specific content using CSS selectors or JSON paths
3. Compares against previous snapshots stored in Cloud Firestore
4. Saves diffs to Cloud Firestore when changes are detected

## Data sources

Currently tracking:
- **Financial**: Mortgage rates, interest rates, currency exchange (USD/RUB), stock indices (IMOEX), Bitcoin, Brent oil
- **Economic**: US/Russia GDP growth, inflation rates, employment
- **Real estate**: Housing prices (Redfin data for MA regions)
- **Demographics**: Vital statistics for 150+ countries from Wikipedia (birth rates, death rates, population)

## Setup

```bash
npm install
npm run build
```

### Firestore storage

Create a Cloud Firestore database in your Firebase project, then authenticate the
backend with Application Default Credentials. For local development, set these
environment variables before running the scraper or API server:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
export FIREBASE_PROJECT_ID="your-firebase-project-id"
```

The service-account file is a secret and should stay outside this repository.
Snapshots are stored in the `snapshots` collection with one document per source.
The document is overwritten only when that source changes.

Diffs are stored in the `diffs` collection. Each document contains the source ID,
the generated timestamp, and the unified diff text. The API reads and deletes
diffs directly in Firestore, so it does not depend on local disk persistence.

Before the first Firestore-backed run, import the existing local baseline once:

```bash
npm run migrate:snapshots
npm run migrate:diffs
```

After a successful import, `snapshots.json` and `diffs/` are no longer read or
written by the application. Keep or remove the old local data as a backup
according to your needs. Both migration commands are safe to run again: existing
Firestore documents are overwritten using deterministic IDs.

After deploying the reviewed/unreviewed diff grouping, mark pre-existing Firestore diffs as reviewed once:

```bash
npm run migrate:reviewed-diffs
```

The migration only updates documents that do not have a `reviewedAt` field, so it is safe to run again. It records the review time as August 26, 2026 at midnight in `America/New_York` (`2026-08-26T04:00:00Z`). New diffs are stored with `reviewedAt: null` until they are explicitly marked as reviewed in the UI.

## Usage

**Run scraper once:**
```bash
npx tsx src/index.ts
```

**Launch frontend + API server together:**
```bash
npm run dev
```

**Launch API server** (port 3001):
```bash
npx tsx src/server.ts
```

**Launch frontend** (Vite dev server):
```bash
cd ui
npm install   # first time only
npm run dev
```

## Configuration

Edit `config.json` to add/modify data sources:

```json
{
  "id": "unique-id",
  "url": "https://example.com/data",
  "match": {
    "selector": "table tr:last-child",
    "extract": "html"
  }
}
```

### Match options

**HTML extraction:**
- `selector` - CSS/jQuery selector
- `extract` - `"html"` or `"text"`
- `filters` - Optional HTML cleanup filters. `cleanWikipediaMarkup` removes generated `id` attributes, inline `style` attributes, and superscript elements from selected Wikipedia content.

**JSON extraction:**
- `extract` - `"json"`
- `jsonPath` - Path to data (e.g., `"data[0].value"`, `"items[*].{name,price}"`)

**Transformers:**
- `percentChangeLastTwo` - Calculate % change between last two values
- `percentChangeDifferentDay` - Calculate % change between different dates

## Output

- Firestore `snapshots` collection - Current state of all data sources
- Firestore `diffs` collection - Timestamped diffs when changes are detected

## Dependencies

- `cheerio` - HTML parsing
- `undici` - HTTP client
- `diff` - Diff generation
