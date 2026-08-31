import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Sparkles, X, Loader2, AlertCircle } from 'lucide-react';
import { extractTextFromFile } from '@/lib/fileExtractor';

interface DocumentInputProps {
  onAnalyze: (text: string, title: string) => void;
  isAnalyzing: boolean;
}

const SAMPLE_TEXTS: { title: string; text: string }[] = [
  {
    title: 'Climate Change',
    text: `Climate change represents one of the most significant challenges facing humanity today. The Earth's average temperature has risen approximately 1.1 degrees Celsius since the late nineteenth century, primarily due to human activities such as burning fossil fuels, deforestation, and industrial processes. These activities release greenhouse gases like carbon dioxide and methane into the atmosphere, trapping heat and altering global weather patterns.

The consequences of climate change are far-reaching and devastating. Rising sea levels threaten coastal communities, while extreme weather events including hurricanes, droughts, and floods have become more frequent and severe. Ecosystems are being disrupted, with many species facing extinction as their habitats change faster than they can adapt. Agricultural systems are under stress, with crop yields becoming less predictable and food security emerging as a major concern.

However, there is hope. Renewable energy technologies have advanced dramatically, with solar and wind power becoming increasingly cost-competitive with fossil fuels. Electric vehicles are gaining market share, and energy efficiency improvements are reducing overall consumption. International agreements like the Paris Accord have united nations in commitment to limit global warming. Individual actions, from reducing meat consumption to using public transportation, also contribute meaningfully to mitigation efforts.

The transition to a sustainable future requires collective action at every level. Governments must implement policies that incentivize clean energy and penalize pollution. Businesses must innovate and adopt sustainable practices. And individuals must make conscious choices that reduce their carbon footprint. Together, we can address this challenge and build a more resilient world for future generations.`,
  },
  {
    title: 'Technology & Society',
    text: `Technology has fundamentally transformed the way we live, work, and interact with one another. From the invention of the wheel to the development of artificial intelligence, technological progress has been the defining characteristic of human civilization. Today, we stand at the precipice of a new era, one in which machines can learn, reason, and create in ways that were once the exclusive domain of human intelligence.

The benefits of technological advancement are undeniable. Medical technology has extended human lifespans and improved quality of life for millions. Communication technologies have connected people across vast distances, making the world smaller and more accessible. Agricultural technology has increased food production to feed a growing global population. And digital technology has democratized access to information, empowering individuals with knowledge that was once available only to the privileged few.

Yet technology also presents significant challenges. Social media platforms, while connecting people, have also contributed to polarization, misinformation, and mental health issues. Automation threatens to displace millions of workers, requiring massive retraining and economic adjustment. Privacy concerns have escalated as personal data becomes a commodity. And the environmental impact of technology, from energy-hungry data centers to electronic waste, cannot be ignored.

The key to navigating these challenges lies in responsible innovation. We must develop technologies that serve human needs while minimizing harm. This requires thoughtful regulation, ethical frameworks, and inclusive decision-making processes. It requires considering not just what technology can do, but what it should do. And it requires ensuring that the benefits of technological progress are shared equitably across society.

As we look to the future, we must embrace a balanced approach to technology. Innovation should be guided by human values, not just market forces. Technology should augment human capabilities, not replace them. And progress should be measured not just in economic terms, but in terms of human flourishing and planetary health.`,
  },
  {
    title: 'The Art of Writing',
    text: `Writing is both a craft and an art form. It is the practice of capturing thoughts, ideas, and emotions in words and arranging them in ways that inform, persuade, or inspire. Good writing is clear, concise, and compelling. Great writing transcends mere communication to become an experience that moves the reader.

The foundation of good writing is clarity. A writer must know what they want to say and say it directly. This does not mean writing should be simplistic. Rather, it means that complexity should serve understanding, not obscure it. Every word should earn its place on the page. Every sentence should advance the writer's purpose. Every paragraph should build upon the last to create a coherent whole.

Concision is the partner of clarity. The most powerful writing often uses the fewest words. This does not mean that all writing should be short. It means that writing should be no longer than it needs to be. Cut unnecessary adverbs. Eliminate redundant phrases. Choose strong verbs over weak ones modified by adverbs. Trust your reader to understand implication without over-explanation.

Compelling writing engages the reader on multiple levels. It uses vivid language to create images in the mind. It varies sentence structure to maintain rhythm and interest. It employs rhetorical devices like metaphor, analogy, and parallelism to deepen meaning. And it maintains a consistent voice that reflects the writer's personality and purpose.

Revision is where good writing becomes great. The first draft is for the writer. Subsequent drafts are for the reader. Read your work aloud to catch awkward phrasing. Cut what does not serve the whole. Rearrange for better flow. And always, always proofread. The difference between amateur and professional writing is often found in the revision process.`,
  },
];

export function DocumentInput({ onAnalyze, isAnalyzing }: DocumentInputProps) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setIsExtracting(true);
    setFileName(file.name);
    try {
      const extracted = await extractTextFromFile(file);
      setText(extracted.text);
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
      setFileName('');
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = () => {
    if (text.trim().length < 10) {
      setError('Please enter at least 10 characters of text to analyze.');
      return;
    }
    setError('');
    onAnalyze(text, title || 'Untitled Document');
  };

  const loadSample = (sample: { title: string; text: string }) => {
    setText(sample.text);
    setTitle(sample.title);
    setError('');
    setFileName('');
  };

  const clearAll = () => {
    setText('');
    setTitle('');
    setFileName('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 mb-4">
          <Sparkles className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-2">AI Document Analyzer</h1>
        <p className="text-slate-400 max-w-lg mx-auto">
          Paste text or upload a document to get instant insights: readability, sentiment,
          keywords, summary, language detection, and detailed statistics.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 mb-4 ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".txt,.md,.csv,.json,.html,.htm,.xml,.pdf,.docx,.doc,.rtf,text/*"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isExtracting || isAnalyzing}
          className="w-full px-6 py-8 flex flex-col items-center gap-3 text-center disabled:opacity-50"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin-slow" />
              <span className="text-sm text-slate-400">Extracting text from {fileName}...</span>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-500" />
              <div>
                <span className="text-sm font-medium text-slate-300">
                  Drop a file here or click to browse
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Supports TXT, PDF, DOCX, DOC, RTF, HTML, MD, CSV, JSON, XML
                </p>
              </div>
            </>
          )}
        </button>
      </div>

      {fileName && !isExtracting && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 mb-4 animate-slide-up">
          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-sm text-slate-300 flex-1 truncate">{fileName}</span>
          <button onClick={() => { setFileName(''); }} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Title Input */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Document title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isAnalyzing}
          className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-200 placeholder-slate-500 text-sm focus-ring transition-all"
        />
      </div>

      {/* Text Area */}
      <div className="relative mb-4">
        <textarea
          placeholder="Paste or type your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isAnalyzing}
          rows={10}
          className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-200 placeholder-slate-500 text-sm leading-relaxed resize-y focus-ring transition-all scrollbar-hidden"
        />
        {text && (
          <span className="absolute bottom-3 right-3 text-xs text-slate-500 font-mono bg-slate-900/80 px-2 py-1 rounded">
            {text.length.toLocaleString()} chars
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4 animate-slide-up">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || text.trim().length < 10}
          className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium text-sm hover:from-blue-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin-slow" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze Document
            </>
          )}
        </button>
        {(text || title) && (
          <button
            onClick={clearAll}
            disabled={isAnalyzing}
            className="px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-40 transition-all text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sample texts */}
      <div className="border-t border-slate-800 pt-6">
        <p className="text-xs text-slate-500 mb-3 text-center">Or try a sample document:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {SAMPLE_TEXTS.map((sample) => (
            <button
              key={sample.title}
              onClick={() => loadSample(sample)}
              disabled={isAnalyzing}
              className="px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10 disabled:opacity-40 transition-all text-xs font-medium"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
