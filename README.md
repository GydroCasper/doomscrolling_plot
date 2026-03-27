# Doomscrolling Plot

Web scraper that monitors changes across multiple data sources and generates diffs when data updates.

## What it does

1. Fetches data from configured URLs (HTML pages or JSON APIs)
2. Extracts specific content using CSS selectors or JSON paths
3. Compares against previous snapshots
4. Saves diffs when changes are detected

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

**JSON extraction:**
- `extract` - `"json"`
- `jsonPath` - Path to data (e.g., `"data[0].value"`, `"items[*].{name,price}"`)

**Transformers:**
- `percentChangeLastTwo` - Calculate % change between last two values
- `percentChangeDifferentDay` - Calculate % change between different dates

## Output

- `snapshots.json` - Current state of all data sources
- `diffs/` - Timestamped diff files when changes are detected

## Dependencies

- `cheerio` - HTML parsing
- `undici` - HTTP client
- `diff` - Diff generation
