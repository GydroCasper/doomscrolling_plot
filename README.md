# Doomscrolling Plot

Web scraper that monitors changes across multiple data sources and generates diffs when data updates.

## What it does

1. Fetches data from configured URLs (HTML pages or JSON APIs)
2. Extracts specific content using CSS selectors or JSON paths
3. Compares against previous snapshots stored in Cloud Firestore
4. Saves diffs to Cloud Firestore when changes are detected

## Run lock

Crawler runs acquire `crawlerMetadata/runLock` in a Firestore transaction.
The lock expires one hour after acquisition, using Firestore's clock. A new run
can replace an expired lock immediately; no Firestore TTL policy is needed.
Normal completion releases the lock only if it still belongs to that run.
The old `grabber.lock` file is no longer used and can be deleted.
The lease is not renewed: a run lasting longer than an hour may overlap a new run.

The standalone crawler has a 45-minute overall timeout, including Firestore
operations and shutdown. If it remains alive beyond that deadline, it logs a
timestamped error and exits with code 124 so it cannot block later scheduled
runs. The timeout does not wait for network cleanup; any remaining Firestore
lock expires at its original one-hour deadline. Normal runs exit without waiting
for the timer. This timeout is enforced while Node's event loop is responsive;
time spent with the Mac asleep can delay its execution until wake.

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

Source configurations are stored in the `sources` collection. The document ID
is the source ID; the document fields contain `url`, `match`, and any optional
fetch settings used by the crawler.

Update-period markers are stored in the `lastChanges` collection with one
document per source. They prevent daily and monthly sources from being fetched
again after they have already changed during the current period.

Diffs are stored in the `diffs` collection. Each document contains the source ID,
the generated timestamp, and the unified diff text. The API reads and deletes
diffs directly in Firestore, so it does not depend on local disk persistence.

The completion time of the latest crawler run is stored in the
`crawlerMetadata/status` document and shown in the UI header.

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

To build the scraper, load the local `.env.local` file, and run it once:

```bash
npm run crawler:local
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

### Firebase Hosting

The static authenticated UI is deployed from `ui/dist` to the Firebase project
configured in `.firebaserc`. Build and deploy it with:

```bash
npm run hosting:deploy
```

The deploy build is tied to the exact Git commit from which it was produced.
The command refuses to deploy while the Git working tree has uncommitted changes.
The build information is logged in the browser console, and the full hash is
available from `/version.json` on the deployed Hosting site. Compare it with the
local checkout using `git rev-parse HEAD`. Regular local builds are still allowed
from a dirty working tree and are explicitly labeled `dirty`.

The UI build reads its Firebase Web configuration from `ui/.env.local`. Keep
that file local; it is ignored by Git. Firebase Hosting serves the static app,
while access to Firestore data remains controlled by Firebase Authentication
and Firestore Security Rules.

## Scheduled runs on macOS

The repository includes a user LaunchAgent template at
`launchd/com.gydrocasper.doomscrolling-plot-crawler.plist`. It runs the complete
crawler at these times in the current macOS time zone:

- 07:00
- 09:00
- 11:00
- 13:00
- 16:00
- 18:00
- 21:00
- 22:00

Before installing it, create `.env.local` from `.env.example` and set the local
Firebase project ID and credential-file path. Keep the credential file outside
the repository. A dedicated directory under the user's home directory is
preferable to macOS privacy-protected directories such as Downloads, Documents,
or Desktop, which a background LaunchAgent might not be allowed to read.

The plist contains absolute paths. Update its `WorkingDirectory`, npm path, and
log paths if the repository or Node.js installation is located elsewhere.

Install and register the LaunchAgent:

```bash
mkdir -p "$HOME/Library/LaunchAgents"
cp launchd/com.gydrocasper.doomscrolling-plot-crawler.plist \
  "$HOME/Library/LaunchAgents/"
launchctl bootstrap \
  "gui/$(id -u)" \
  "$HOME/Library/LaunchAgents/com.gydrocasper.doomscrolling-plot-crawler.plist"
```

Inspect the installed schedule:

```bash
/usr/libexec/PlistBuddy \
  -c "Print :StartCalendarInterval" \
  "$HOME/Library/LaunchAgents/com.gydrocasper.doomscrolling-plot-crawler.plist"
```

Inspect the registered job state:

```bash
launchctl print \
  "gui/$(id -u)/com.gydrocasper.doomscrolling-plot-crawler" \
  | grep -E "state =|runs =|last exit code"
```

Trigger a run manually through `launchd`:

```bash
launchctl kickstart \
  "gui/$(id -u)/com.gydrocasper.doomscrolling-plot-crawler"
```

The LaunchAgent writes output to `.crawler-stdout.log` and errors to
`.crawler-stderr.log` in the project directory. Both files are ignored by Git.

If the Mac is asleep at a scheduled time, macOS normally runs the calendar job
after the computer wakes. Runs missed while the Mac is powered off are not
replayed individually.

## Configuration

Add or modify documents in the Firestore `sources` collection. Use the unique
source ID as the document ID. A minimal source document contains:

```json
{
  "url": "https://example.com/data",
  "match": {
    "selector": "table tr:last-child",
    "extract": "html"
  }
}
```

### Suppressing small numeric changes

Add a top-level `changeFilter` field to the relevant Firestore `sources` document.
For USD/RUB, use:

```json
{
  "changeFilter": {
    "type": "numericThreshold",
    "minChange": 1,
    "roundTo": 1
  }
}
```

The crawler rounds both the saved and incoming values down to a multiple of `roundTo`
using `Math.floor`, then suppresses differences strictly below `minChange`. Thus
90.40 → 90.60 is suppressed, while 90.60 → 91.00 is shown. Both settings must be positive,
finite numbers. Omit `roundTo` to compare unrounded values. Each source can use
its own settings; sources without a filter retain their existing behavior.

The filter accepts plain numbers (decimal dot or comma) and transformer output
such as `90.40 (+1.25%)`; the parenthesized text does not affect comparison.
Unrecognized formats are not suppressed. Original text is preserved in diffs.
Suppressed updates do not overwrite the saved snapshot or advance daily/monthly
markers, so small movements accumulate against the last accepted snapshot.
The initial snapshot is always saved. Existing diffs are not changed.

These settings must be added to Firestore to enable filtering; local backup
configuration files are not used by the crawler.

Rounding always uses `Math.floor`.
The backup configuration uses these settings; add the same top-level
`changeFilter` map to each corresponding document in `sources`:

| Source document | type | minChange | roundTo |
| --- | --- | --- | --- |
| `usdrub-rate` | `numericThreshold` | 1 | 1 |
| `brent-crude-oil-usd` | `numericThreshold` | 1 | 1 |
| `bitcoin-usd` | `numericThreshold` | 1000 | 1000 |
| `imoex-index` | `numericThreshold` | 100 | 100 |

Bitcoin 95400 → 95900 is suppressed, while 95900 → 96000 is shown.
IMOEX 3240 → 3250 is suppressed, while 3299 → 3300 is shown (3200 → 3300).

### Extraction options

**HTML extraction:**
- `selector` - CSS/jQuery selector
- `extract` - `"html"` or `"text"`
- `filters` - Optional HTML cleanup filters. `cleanWikipediaMarkup` removes generated `id` attributes, inline `style` attributes, and superscript elements from selected Wikipedia content.
  `removeDataId` removes only `data-id` attributes from selected elements and their descendants. Enable it with `"filters": ["removeDataId"]` in the `match` field of the Firestore source document `us-interest-rate-first-row`. Dates and rate values remain in the diff. Existing snapshots retain their attributes until the next update, so the first run can show their removal.

**JSON extraction:**
- `extract` - `"json"`
- `jsonPath` - Path to data (e.g., `"data[0].value"`, `"items[*].{name,price}"`)

**Transformers:**
- `percentChangeLastTwo` - Calculate % change between last two values
- `percentChangeDifferentDay` - Calculate % change between different dates

## Output

- Firestore `sources` collection - Crawler source configuration
- Firestore `lastChanges` collection - Last detected change period per source
- Firestore `snapshots` collection - Current state of all data sources
- Firestore `diffs` collection - Timestamped diffs when changes are detected

## Dependencies

- `cheerio` - HTML parsing
- `undici` - HTTP client
- `diff` - Diff generation
