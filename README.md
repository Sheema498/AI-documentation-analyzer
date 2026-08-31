# DocuLint Documentation Auditor

DocuLint is a client-side documentation audit tool for technical manuals, API guides, READMEs, and product requirements documents.

A modern, client-side web application for comprehensive text and document analysis. Analyze any text for sentiment, readability, keywords, key phrases, language detection, summaries, and detailed statistics — all running entirely in the browser.

## Features

- **Text & Document Input** — Paste text or upload files (PDF, DOCX, TXT, etc.)
- **Sentiment Analysis** — Positive / Neutral / Negative classification with confidence and matched words
- **Readability Metrics** — Flesch Reading Ease, Flesch-Kincaid Grade, Gunning Fog, SMOG, ARI, Coleman-Liau
- **Keyword & Key-Phrase Extraction** — Frequency-weighted terms and multi-word phrases
- **Language Detection** — Automatic language identification with confidence scores
- **Auto-Summarization** — Extractive summary with compression ratio
- **Detailed Statistics** — Word/sentence/paragraph counts, reading & speaking time estimates, length distributions
- **History Panel** — Save analyses locally and revisit previous documents
- **Beautiful Dashboard** — Charts, animated counters, and responsive UI built with React + Tailwind CSS

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **Vitest** + **Testing Library** for unit tests and coverage
- **Lucide React** for icons

## Prerequisites

- Node.js 18+ (recommended 20+)
- npm 9+ (or yarn / pnpm)

## Installation

```bash
# Clone the repository (or extract the zip)
cd document-text-analyzer

# Install dependencies
npm install
```

## Development

```bash
# Start the development server (http://localhost:5173)
npm run dev
```

## Build

```bash
# Type-check and produce production build in dist/
npm run build

# Preview the production build locally
npm run preview
```

## Testing

```bash
# Run unit tests once
npm test

# Watch mode
npm run test:watch

# Generate coverage report (HTML + text)
npm run test:coverage
```

Coverage focuses on the pure analysis libraries under `src/lib/`.

## Project Structure

```
src/
├── components/          # React UI components (Dashboard, Charts, Input, History…)
├── lib/
│   ├── analysis/        # Core analysis engines (sentiment, readability, keywords…)
│   ├── fileExtractor.ts # Client-side file text extraction
│   ├── storage.ts       # Local history persistence
│   └── textUtils.ts     # Tokenization and helpers
├── test/                # Test setup
├── types.ts             # Shared TypeScript interfaces
├── App.tsx              # Main application
└── main.tsx             # Entry point
```

## Usage

1. Open the app in your browser.
2. Paste text or drop a document into the input area.
3. Click **Analyze**.
4. Explore the interactive dashboard: stats, sentiment gauge, readability scores, keyword cloud, summary, and charts.
5. Optionally save the analysis to local history for later review.

### Choosing an audit engine

The **Local Rules Engine** works offline and does not require an API key. Use it for fast checks of structure, readability, and consistency.

For contextual feedback, open **Audit Settings & AI Engine**, select **Gemini AI Engine**, and provide a Gemini API key. The key remains in your browser storage and is sent directly to Google's API only when an audit runs.

## Scripts Reference

| Script            | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start Vite dev server                |
| `npm run build`   | Production build                     |
| `npm run preview` | Serve the production build           |
| `npm run lint`    | ESLint check                         |
| `npm run typecheck` | TypeScript type checking           |
| `npm test`        | Run Vitest unit tests                |
| `npm run test:coverage` | Tests + coverage report         |

## License

MIT
