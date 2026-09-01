import { CheckCircle2, ShieldCheck, AlertCircle, Sparkles, Code, FileText, HelpCircle, ArrowLeft } from 'lucide-react';

interface AboutViewProps {
  onBack: () => void;
}

export function AboutView({ onBack }: AboutViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="DocuLint Logo" className="w-6 h-6 object-contain" />
          <h2 className="text-lg font-bold text-text-primary">About & Quality Guidelines</h2>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Analyzer
        </button>
      </div>

      {/* Intro */}
      <div className="p-5 rounded-xl bg-surface border border-border space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <img src="/logo.png" alt="DocuLint" className="w-5 h-5 object-contain" />
          What is DocuLint QA Auditor?
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          DocuLint is a professional quality assurance tool for product, technical, and corporate documentation. It scans drafts for structural gaps, missing sections, readability issues, spelling variants, and unformatted code blocks. It runs completely inside your browser, ensuring absolute privacy.
        </p>
      </div>

      {/* Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-surface border border-border space-y-2.5 shadow-sm">
          <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            1. Documentation Completeness
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            Checks if standard sections (like Installation, Setup, Troubleshooting, FAQ, or Liability clauses) exist based on the detected document type. 
          </p>
          <div className="text-[11px] text-text-secondary bg-surface-secondary border border-border p-2.5 rounded">
            <strong>Applicability Rule:</strong> Expected sections are dynamically selected based on the document category (e.g. installation steps are not required for a Legal Agreement).
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-border space-y-2.5 shadow-sm">
          <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            2. Readability & Tone
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            Identifies sentences with more than 25 words, computes Flesch-Kincaid readability indices, scans for passive voice usage, and highlights subjective buzzwords like "simply" or "easy".
          </p>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-border space-y-2.5 shadow-sm">
          <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            3. Technical Accuracy
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            Finds terminal commands (such as <code>npm install</code>, <code>git clone</code>) left as raw paragraphs instead of formatted in markdown code blocks. Validates that setup steps are paired with prerequisites.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-border space-y-2.5 shadow-sm">
          <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            4. Layout & Consistency
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            Checks for interchangeable terminology variants (e.g. mixing <code>frontend</code> and <code>front-end</code>, or <code>setup</code> and <code>set up</code>) and identifies duplicate section headings.
          </p>
        </div>
      </div>

      {/* Engines */}
      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-sm font-bold text-text-primary">How the Engines Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-surface border border-border space-y-2 shadow-sm">
            <h4 className="text-xs font-bold text-text-primary">Local Rules Engine</h4>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Runs locally and instantly. Uses deterministic regex matching, parsing heuristics, syllable indexes, and dictionary databases. Highly consistent and 100% private.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface border border-border space-y-2 shadow-sm">
            <h4 className="text-xs font-bold text-text-primary">Gemini AI Engine</h4>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Sends the text securely to Google Gemini APIs using your browser-supplied key. Provides deep linguistic understanding, semantic reviews, and translates non-English files into English analyses.
            </p>
          </div>
        </div>
      </div>

      {/* Limitations & Privacy */}
      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5 text-warning">
          <AlertCircle className="w-4 h-4 text-warning" />
          System Constraints & Privacy
        </h3>
        <ul className="list-disc pl-5 text-xs text-text-secondary space-y-2 leading-relaxed">
          <li><strong>Image PDF Scanning:</strong> The PDF extractor reads font glyph text blocks. It cannot read scanned text or image-based PDFs without OCR.</li>
          <li><strong>Sensitive Credentials:</strong> Do not save API keys in version control. Keys are stored only in your local browser storage.</li>
          <li><strong>Language translations:</strong> If a document is in Spanish, Telugu, Hindi, or another language, both the local and AI audits analyze content meaning and output reports in English only.</li>
        </ul>
      </div>
    </div>
  );
}
