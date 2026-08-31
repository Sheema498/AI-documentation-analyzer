export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  uniqueWords: number;
  sentences: number;
  paragraphs: number;
  avgWordsPerSentence: number;
  avgCharsPerWord: number;
  avgSentencesPerParagraph: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  longestWord: string;
  longestSentence: string;
}

export interface ReadabilityResult {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFog: number;
  smogIndex: number;
  automatedReadabilityIndex: number;
  colemanLiauIndex: number;
  gradeLevel: string;
  readabilityLabel: string;
  readabilityDescription: string;
}

export interface KeywordResult {
  word: string;
  count: number;
  weight: number;
}

export interface KeyPhraseResult {
  phrase: string;
  score: number;
}

export interface SentimentResult {
  label: SentimentLabel;
  score: number;
  positiveWords: string[];
  negativeWords: string[];
  positiveCount: number;
  negativeCount: number;
  confidence: number;
}

export interface SummaryResult {
  sentences: string[];
  compressionRatio: number;
  originalWordCount: number;
  summaryWordCount: number;
}

export interface LanguageResult {
  language: string;
  confidence: number;
  alternatives: { language: string; score: number }[];
}

export interface SentenceAnalysis {
  text: string;
  index: number;
  wordCount: number;
  sentimentScore: number;
  sentimentLabel: SentimentLabel;
  readabilityScore: number;
}

export interface WordFrequencyBucket {
  range: string;
  count: number;
}

// --- New Documentation Quality Analysis Types ---

export interface DocIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'clarity' | 'completeness' | 'structure' | 'readability' | 'consistency' | 'technical';
  title: string;
  description: string;
  location: string;
  recommendation: string;
}

export interface SectionAnalysis {
  heading: string;
  level: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  problems: string[];
  suggestions: string[];
}

export interface ScoreBreakdown {
  overall: number;
  clarity: number;
  completeness: number;
  structure: number;
  readability: number;
  consistency: number;
  technical: number;
}

export interface DocOverview {
  title: string;
  type: string;
  wordCount: number;
  sectionsCount: number;
  summary: string;
}

export interface DocumentationAnalysis {
  overview: DocOverview;
  score: ScoreBreakdown;
  executiveSummary: string;
  strengths: string[];
  issues: DocIssue[];
  recommendations: string[];
  sections: SectionAnalysis[];
  readabilityAssessment: {
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    readabilityScore: number;
    readabilityLabel: string;
    readabilityDescription: string;
    simplificationAreas: string[];
  };
  analyzedAt: string;
  engineUsed: 'local' | 'gemini';
}

export interface AnalysisResult {
  stats: TextStats;
  readability: ReadabilityResult;
  keywords: KeywordResult[];
  keyPhrases: KeyPhraseResult[];
  sentiment: SentimentResult;
  summary: SummaryResult;
  language: LanguageResult;
  sentenceAnalysis: SentenceAnalysis[];
  wordLengthDistribution: WordFrequencyBucket[];
  sentenceLengthDistribution: WordFrequencyBucket[];
  topWords: { word: string; count: number }[];
  analyzedAt: string;
  docAnalysis?: DocumentationAnalysis; // Make it optional for backward compatibility
}

export interface SavedDocument {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  analysis: AnalysisResult;
}
