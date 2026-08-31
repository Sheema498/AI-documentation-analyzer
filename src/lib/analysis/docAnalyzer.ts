import type { DocumentationAnalysis, DocIssue, SectionAnalysis, ScoreBreakdown } from '@/types';
import { splitSentences, splitParagraphs, tokenize } from '../textUtils';
import { computeReadability } from './readability';

// Helper to generate IDs
function generateId(): string {
  return 'issue_' + Math.random().toString(36).slice(2, 11);
}

// 1. Structural Section Parser
export interface ParsedSection {
  heading: string;
  level: number;
  content: string;
  startIndex: number;
}

export function parseSections(text: string): ParsedSection[] {
  const lines = text.split('\n');
  const sections: ParsedSection[] = [];
  let currentContent: string[] = [];
  let currentHeading = 'Overview';
  let currentLevel = 1;
  let currentStartIndex = 0;

  const commitSection = (nextHeading: string, nextLevel: number, index: number) => {
    const contentText = currentContent.join('\n').trim();
    sections.push({
      heading: currentHeading,
      level: currentLevel,
      content: contentText,
      startIndex: currentStartIndex,
    });
    currentContent = [];
    currentHeading = nextHeading;
    currentLevel = nextLevel;
    currentStartIndex = index;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Markdown Headings
    const mdMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (mdMatch) {
      commitSection(mdMatch[2], mdMatch[1].length, index);
      return;
    }

    // HTML Headings
    const htmlMatch = trimmed.match(/^<h([1-6])>(.*?)<\/h\1>$/i);
    if (htmlMatch) {
      commitSection(htmlMatch[2], parseInt(htmlMatch[1], 10), index);
      return;
    }

    // Standard numbered/capitalized heading check
    // e.g. "1. Introduction", "Section 2. Setup", or uppercase short line (under 60 chars) on a line by itself
    const numberedMatch = trimmed.match(/^((?:[0-9]+\.)+[0-9]*|[A-Z][0-9]*\b|Section\s+[0-9]+|Chapter\s+[0-9]+)\s+([A-Z].*)$/);
    const isUppercaseHeading = trimmed.length > 3 && trimmed.length < 60 && trimmed === trimmed.toUpperCase() && !trimmed.endsWith('.') && !trimmed.includes(',') && !trimmed.includes(' ');
    
    if (numberedMatch) {
      commitSection(trimmed, 2, index);
    } else if (isUppercaseHeading && index > 0 && lines[index - 1].trim() === '' && index < lines.length - 1 && lines[index + 1].trim() === '') {
      commitSection(trimmed, 1, index);
    } else {
      currentContent.push(line);
    }
  });

  // Commit the final section
  const contentText = currentContent.join('\n').trim();
  sections.push({
    heading: currentHeading,
    level: currentLevel,
    content: contentText,
    startIndex: currentStartIndex,
  });

  return sections.filter(s => s.heading !== 'Overview' || s.content.length > 0);
}

// 2. Classify Document Type
export function classifyDocumentType(text: string): string {
  const lowercase = text.toLowerCase();
  const tokens = tokenize(text);
  
  let techPoints = 0;
  let legalPoints = 0;
  let prdPoints = 0;
  let guidePoints = 0;

  const techKeywords = ['npm', 'yarn', 'pip', 'install', 'setup', 'config', 'import', 'function', 'api', 'const', 'git', 'docker', 'database', 'sdk', 'code', 'prerequisites', 'parameters', 'dependency', 'repository'];
  const legalKeywords = ['agreement', 'terms', 'conditions', 'privacy', 'policy', 'liability', 'warrant', 'herein', 'hereinafter', 'license', 'disclaimer', 'intellectual property'];
  const prdKeywords = ['prd', 'product requirements', 'user stories', 'scope', 'deliverables', 'stakeholder', 'functional', 'non-functional', 'out of scope', 'persona', 'roadmap'];
  const guideKeywords = ['how to', 'step by step', 'welcome', 'guide', 'manual', 'user manual', 'tutorial', 'getting started', 'click', 'button', 'screen'];

  techKeywords.forEach(kw => {
    if (lowercase.includes(kw)) techPoints += (lowercase.split(kw).length - 1);
  });
  legalKeywords.forEach(kw => {
    if (lowercase.includes(kw)) legalPoints += (lowercase.split(kw).length - 1) * 2; // Weight legal words
  });
  prdKeywords.forEach(kw => {
    if (lowercase.includes(kw)) prdPoints += (lowercase.split(kw).length - 1) * 2;
  });
  guideKeywords.forEach(kw => {
    if (lowercase.includes(kw)) guidePoints += (lowercase.split(kw).length - 1);
  });

  const max = Math.max(techPoints, legalPoints, prdPoints, guidePoints);
  if (max === 0) return 'General Documentation';
  if (max === techPoints) return 'Technical/Developer Guide';
  if (max === legalPoints) return 'Legal/Policy Document';
  if (max === prdPoints) return 'Product Requirements Document (PRD)';
  return 'User Guide / Manual';
}

// 3. Expected Sections by Document Type
function getExpectedSections(docType: string): { name: string; keys: string[] }[] {
  switch (docType) {
    case 'Technical/Developer Guide':
      return [
        { name: 'Introduction', keys: ['intro', 'about', 'overview', 'purpose'] },
        { name: 'Prerequisites / Requirements', keys: ['prereq', 'require', 'dependency', 'dependencies'] },
        { name: 'Installation & Setup', keys: ['install', 'setup', 'get started', 'getting started'] },
        { name: 'Usage instructions', keys: ['usage', 'how to use', 'run', 'execute'] },
        { name: 'Configuration', keys: ['config', 'environ', 'parameter', 'options', 'setting'] },
        { name: 'Examples', keys: ['example', 'tutorial', 'sample', 'demo'] },
        { name: 'Troubleshooting', keys: ['trouble', 'debug', 'error', 'issue'] },
        { name: 'References / Resources', keys: ['reference', 'link', 'source', 'resource'] },
      ];
    case 'Product Requirements Document (PRD)':
      return [
        { name: 'Introduction', keys: ['intro', 'overview', 'about'] },
        { name: 'Purpose / Goals', keys: ['purpose', 'goal', 'objective', 'target'] },
        { name: 'Scope', keys: ['scope', 'boundaries', 'out of scope', 'deliverable'] },
        { name: 'Requirements', keys: ['require', 'functional', 'non-functional', 'user story', 'stories'] },
        { name: 'Conclusion / Roadmap', keys: ['conclusion', 'next step', 'roadmap', 'future'] },
      ];
    case 'User Guide / Manual':
      return [
        { name: 'Introduction', keys: ['intro', 'welcome', 'overview'] },
        { name: 'Purpose', keys: ['purpose', 'goal', 'why'] },
        { name: 'Usage Instructions', keys: ['usage', 'how to', 'step', 'instruction', 'guide'] },
        { name: 'Troubleshooting', keys: ['trouble', 'solve', 'help', 'debug'] },
        { name: 'FAQs', keys: ['faq', 'frequently', 'question'] },
        { name: 'Conclusion', keys: ['conclusion', 'support', 'contact'] },
      ];
    case 'Legal/Policy Document':
      return [
        { name: 'Introduction / Parties', keys: ['intro', 'agreement', 'parties', 'purpose'] },
        { name: 'Terms & Conditions', keys: ['term', 'condition', 'provision'] },
        { name: 'Privacy & Data Protection', keys: ['privacy', 'data', 'security', 'information'] },
        { name: 'Liability & Warranties', keys: ['liabil', 'warrant', 'indemnity', 'disclaim'] },
        { name: 'Conclusion / Signatures', keys: ['conclusion', 'termination', 'governing', 'signature'] },
      ];
    default:
      return [
        { name: 'Introduction', keys: ['intro', 'overview', 'about'] },
        { name: 'Purpose', keys: ['purpose', 'goal', 'objective'] },
        { name: 'Conclusion', keys: ['conclusion', 'summary', 'final'] },
      ];
  }
}

// 4. Local Rules-Based Auditor
export function analyzeDocumentLocally(text: string, title: string): DocumentationAnalysis {
  const wordCount = tokenize(text).length;
  const sentences = splitSentences(text);
  const sentenceCount = sentences.length;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const sections = parseSections(text);
  const docType = classifyDocumentType(text);

  const issues: DocIssue[] = [];
  const expected = getExpectedSections(docType);

  // A. Completeness Check
  const checkedExpected = expected.map(exp => {
    const matchingSection = sections.find(sec => {
      const headingLower = sec.heading.toLowerCase();
      return exp.keys.some(key => headingLower.includes(key));
    });

    if (matchingSection) {
      const sectionWords = tokenize(matchingSection.content).length;
      if (sectionWords < 50 && matchingSection.content.length > 0) {
        issues.push({
          id: generateId(),
          severity: 'medium',
          category: 'completeness',
          title: `Brief expected section: ${exp.name}`,
          description: `The "${matchingSection.heading}" section is very short (${sectionWords} words). Important details or context might be missing.`,
          location: matchingSection.heading,
          recommendation: `Expand the "${matchingSection.heading}" section with more descriptive paragraphs, examples, or structural steps to improve completeness.`,
        });
        return { exp, status: 'brief', section: matchingSection };
      }
      return { exp, status: 'present', section: matchingSection };
    } else {
      // Missing section
      issues.push({
        id: generateId(),
        severity: docType === 'Technical/Developer Guide' || docType === 'Legal/Policy Document' ? 'high' : 'medium',
        category: 'completeness',
        title: `Missing section: ${exp.name}`,
        description: `This document appears to be a "${docType}" but is missing an explicit "${exp.name}" section, which is highly expected.`,
        location: 'Entire Document',
        recommendation: `Add a new section titled "${exp.name}" to cover this critical area of the documentation.`,
      });
      return { exp, status: 'missing', section: null };
    }
  });

  // B. Structure Check (Headings Hierarchy & Empty Sections)
  sections.forEach((sec, idx) => {
    const secWords = tokenize(sec.content).length;
    if (secWords === 0) {
      issues.push({
        id: generateId(),
        severity: 'high',
        category: 'structure',
        title: `Empty section: ${sec.heading}`,
        description: `The heading "${sec.heading}" exists but has no content underneath it.`,
        location: sec.heading,
        recommendation: `Add content to the "${sec.heading}" section, or merge/remove it if it is redundant.`,
      });
    }

    // Check duplicate headings
    const duplicates = sections.filter((s, i) => s.heading.toLowerCase() === sec.heading.toLowerCase() && i !== idx);
    if (duplicates.length > 0 && idx === sections.indexOf(sec)) {
      issues.push({
        id: generateId(),
        severity: 'medium',
        category: 'structure',
        title: `Duplicate heading name: ${sec.heading}`,
        description: `Multiple headings share the exact name "${sec.heading}". This creates confusion in navigation.`,
        location: sec.heading,
        recommendation: `Rename duplicates (e.g. adding parent context) to make headings unique.`,
      });
    }
  });

  // C. Readability Audits
  const longSentences: string[] = [];
  const passiveVoiceRegex = /\b(is|was|were|be|been|being|are|am)\s+([a-z]+ed|written|taken|seen|done|run|built|chosen|shown|given|held|made|paid|put|sent|set)\b/i;
  let passiveVoiceCount = 0;
  
  // Ambiguous words list
  const ambiguousWords = ['obviously', 'simply', 'just', 'easy', 'things', 'stuff', 'actually', 'basically', 'quickly'];
  const detectedAmbiguousWords = new Map<string, number>();

  sentences.forEach(s => {
    const words = tokenize(s);
    if (words.length > 25) {
      longSentences.push(s);
    }
    if (passiveVoiceRegex.test(s)) {
      passiveVoiceCount++;
    }
    words.forEach(w => {
      if (ambiguousWords.includes(w)) {
        detectedAmbiguousWords.set(w, (detectedAmbiguousWords.get(w) || 0) + 1);
      }
    });
  });

  // Long sentences warning
  if (longSentences.length > 0) {
    const percentage = Math.round((longSentences.length / sentenceCount) * 100) || 0;
    if (percentage > 10) {
      issues.push({
        id: generateId(),
        severity: 'medium',
        category: 'readability',
        title: 'High density of long sentences',
        description: `${percentage}% of your sentences (${longSentences.length}) have more than 25 words. Long sentences increase reading fatigue.`,
        location: 'Paragraphs',
        recommendation: 'Break complex sentences into two or more smaller, punchy sentences. Aim for an average of 15-20 words per sentence.',
      });
    }
  }

  // Passive voice warning
  if (passiveVoiceCount > 0 && sentenceCount > 0) {
    const percentage = Math.round((passiveVoiceCount / sentenceCount) * 100);
    if (percentage > 25) {
      issues.push({
        id: generateId(),
        severity: 'low',
        category: 'clarity',
        title: 'Frequent passive voice usage',
        description: `Approximately ${percentage}% of your sentences use passive voice (e.g. "was created", "is configured"). Passive voice hides the actor and makes instructions feel clinical.`,
        location: 'Style',
        recommendation: 'Refactor instructions to use active verbs. E.g. replace "The configuration is loaded by the application" with "The application loads the configuration".',
      });
    }
  }

  // Ambiguous terms
  if (detectedAmbiguousWords.size > 0) {
    const list = [...detectedAmbiguousWords.keys()].slice(0, 3).map(w => `"${w}"`).join(', ');
    issues.push({
      id: generateId(),
      severity: 'low',
      category: 'clarity',
      title: 'Ambiguous or colloquial wording',
      description: `Detected vague or subjective terms like ${list}. Subjective words like "simply" or "easy" can frustrate readers when things don't work as expected.`,
      location: 'Terminology',
      recommendation: 'Replace vague terms with precise, factual details. E.g. instead of "simply run", use "run". Instead of "easy setup", specify the estimated setup time.',
    });
  }

  // D. Technical Quality Check (for Technical docs)
  if (docType === 'Technical/Developer Guide') {
    // Check if CLI commands are unformatted
    const unformattedCliPattern = /^\s*(\$\s+)?(npm\s+install|git\s+clone|docker\s+run|pip\s+install|yarn\s+add|make\s+|cargo\s+build)\b/im;
    const lines = text.split('\n');
    let unformattedCommandsCount = 0;
    lines.forEach(l => {
      if (unformattedCliPattern.test(l) && !l.includes('`') && !l.startsWith('    ') && !l.startsWith('\t')) {
        unformattedCommandsCount++;
      }
    });

    if (unformattedCommandsCount > 0) {
      issues.push({
        id: generateId(),
        severity: 'medium',
        category: 'technical',
        title: 'Unformatted terminal commands',
        description: `Found ${unformattedCommandsCount} command lines (e.g. npm install) that are not formatted as code blocks. This makes it hard to distinguish commands from normal text.`,
        location: 'Code Blocks',
        recommendation: 'Wrap terminal commands in triple-backticks code blocks (```bash ... ```) or inline backticks (`command`).',
      });
    }

    // Check prerequisites placement
    const hasPrereq = checkedExpected.find(c => c.exp.name === 'Prerequisites / Requirements' && c.status === 'present');
    const hasInstall = checkedExpected.find(c => c.exp.name === 'Installation & Setup' && c.status === 'present');
    if (hasInstall && !hasPrereq) {
      issues.push({
        id: generateId(),
        severity: 'medium',
        category: 'technical',
        title: 'Prerequisites undefined before installation',
        description: 'You have detailed installation and setup instructions, but did not define pre-requisite software, system requirements, or dependencies.',
        location: 'Installation',
        recommendation: 'Add a "Prerequisites" subsection before the installation steps listing needed packages (e.g., Node.js version, Python dependency lists, OS constraints).',
      });
    }

    // Check examples
    const hasConfig = checkedExpected.find(c => c.exp.name === 'Configuration' && c.status === 'present');
    const hasExamples = checkedExpected.find(c => c.exp.name === 'Examples' && c.status === 'present');
    if (hasConfig && !hasExamples) {
      issues.push({
        id: generateId(),
        severity: 'medium',
        category: 'technical',
        title: 'Configuration missing concrete examples',
        description: 'The document details configuration parameters or settings but lacks a concrete example showing a complete configuration file (JSON, YAML, .env).',
        location: 'Configuration',
        recommendation: 'Insert a short, copy-pasteable configuration file sample illustrating typical settings.',
      });
    }
  }

  // E. Terminology Consistency check
  const inconsistencyPairs = [
    { term1: 'frontend', term2: 'front-end' },
    { term1: 'backend', term2: 'back-end' },
    { term1: 'setup', term2: 'set up' }, // setup (noun), set up (verb) - but checking raw swaps
    { term1: 'website', term2: 'web site' },
    { term1: 'login', term2: 'log in' },
  ];

  inconsistencyPairs.forEach(pair => {
    const count1 = (lowercaseMatches(text, pair.term1));
    const count2 = (lowercaseMatches(text, pair.term2));
    if (count1 >= 1 && count2 >= 1) {
      issues.push({
        id: generateId(),
        severity: 'medium',
        category: 'consistency',
        title: `Inconsistent terms: "${pair.term1}" vs "${pair.term2}"`,
        description: `Both spellings "${pair.term1}" (${count1} times) and "${pair.term2}" (${count2} times) are used. Documentation should be spelling-consistent.`,
        location: 'Spelling',
        recommendation: `Standardize on one variant. We recommend using "${pair.term1}" consistently throughout.`,
      });
    }
  });

  // F. Score Calculation
  // We compute sub-scores for Clarity, Completeness, Structure, Readability, Consistency, Technical
  let clarityScore = 100;
  let completenessScore = 100;
  let structureScore = 100;
  let readabilityScore = 100;
  let consistencyScore = 100;
  let technicalScore = 100;

  issues.forEach(iss => {
    const penalty = iss.severity === 'critical' ? 15 : iss.severity === 'high' ? 10 : iss.severity === 'medium' ? 5 : 2;
    if (iss.category === 'clarity') clarityScore -= penalty;
    if (iss.category === 'completeness') completenessScore -= penalty;
    if (iss.category === 'structure') structureScore -= penalty;
    if (iss.category === 'readability') readabilityScore -= penalty;
    if (iss.category === 'consistency') consistencyScore -= penalty;
    if (iss.category === 'technical') technicalScore -= penalty;
  });

  // Incorporate Flesch readability into Readability score
  const fleschResult = computeReadability(text);
  const fleschEase = fleschResult.fleschReadingEase;
  // If readability calculation was valid, adjust readability score
  if (wordCount > 5) {
    // Flesh ease 60-100 is great, below 60 starts dropping score
    const readabilityPenalty = Math.max(0, (60 - fleschEase) * 0.5);
    readabilityScore = Math.max(30, Math.round(readabilityScore - readabilityPenalty));
  }

  // Clamp subscores
  clarityScore = Math.max(30, Math.min(100, clarityScore));
  completenessScore = Math.max(20, Math.min(100, completenessScore));
  structureScore = Math.max(40, Math.min(100, structureScore));
  readabilityScore = Math.max(30, Math.min(100, readabilityScore));
  consistencyScore = Math.max(50, Math.min(100, consistencyScore));
  technicalScore = Math.max(40, Math.min(100, technicalScore));

  const overall = Math.round((clarityScore + completenessScore + structureScore + readabilityScore + consistencyScore + technicalScore) / 6);

  const scores: ScoreBreakdown = {
    overall,
    clarity: clarityScore,
    completeness: completenessScore,
    structure: structureScore,
    readability: readabilityScore,
    consistency: consistencyScore,
    technical: technicalScore,
  };

  // G. Section Assessment
  const sectionsAnalysis: SectionAnalysis[] = sections.map(sec => {
    const secText = sec.content;
    const secWords = tokenize(secText).length;
    const secIssues = issues.filter(i => i.location === sec.heading);
    
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    if (secIssues.some(i => i.severity === 'critical' || i.severity === 'high') || secIssues.length > 2) {
      quality = 'poor';
    } else if (secIssues.length > 0) {
      quality = 'fair';
    } else if (secWords < 40 && secText.length > 0) {
      quality = 'good'; // simple but sparse
    }

    return {
      heading: sec.heading,
      level: sec.level,
      quality,
      problems: secIssues.map(i => i.title),
      suggestions: secIssues.map(i => i.recommendation),
    };
  });

  // H. Strengths and Summaries
  const strengths: string[] = [];
  if (completenessScore > 85) strengths.push('Excellent coverage of expected documentation structures.');
  if (readabilityScore > 80) strengths.push('Highly accessible readability and sentences are structured cleanly.');
  if (consistencyScore > 90) strengths.push('Consistent terminology and spelling variants across sections.');
  if (clarityScore > 85) strengths.push('Direct, active voice usage with concise descriptive writing.');
  if (strengths.length === 0) {
    strengths.push('The document establishes a clear heading outline.');
    strengths.push('Provides standard informational text sections.');
  }

  const recommendations = issues
    .sort((a, b) => {
      const rank = { critical: 4, high: 3, medium: 2, low: 1 };
      return rank[b.severity] - rank[a.severity];
    })
    .slice(0, 5)
    .map(i => i.recommendation);

  if (recommendations.length === 0) {
    recommendations.push('Keep maintaining the document quality standards as new features are documented.');
  }

  const executiveSummary = `This document is classified as a "${docType}" with a total of ${wordCount} words and ${sections.length} parsed sections. It achieved an overall quality score of ${overall}/100. ${
    issues.length === 0
      ? 'The documentation is highly structured, easy to read, and fully complete with no quality issues detected.'
      : `We detected ${issues.length} quality concerns ranging from ${issues.filter(i => i.severity === 'critical' || i.severity === 'high').length} high-severity issues to ${issues.filter(i => i.severity === 'low').length} minor adjustments. The principal recommendations include resolving ${issues[0]?.title.toLowerCase()} and verifying structural completeness.`
  }`;

  return {
    overview: {
      title: title || 'Untitled Document',
      type: docType,
      wordCount,
      sectionsCount: sections.length,
      summary: executiveSummary.slice(0, 150) + '...',
    },
    score: scores,
    executiveSummary,
    strengths,
    issues,
    recommendations,
    sections: sectionsAnalysis,
    readabilityAssessment: {
      wordCount,
      sentenceCount,
      avgSentenceLength,
      readabilityScore: fleschResult.fleschReadingEase,
      readabilityLabel: fleschResult.readabilityLabel,
      readabilityDescription: fleschResult.readabilityDescription,
      simplificationAreas: longSentences.slice(0, 6),
    },
    analyzedAt: new Date().toISOString(),
    engineUsed: 'local',
  };
}

// 5. Gemini AI Service (Browser Fetch)
export async function analyzeDocumentWithGemini(text: string, title: string, apiKey: string): Promise<DocumentationAnalysis> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are a professional technical documentation auditor and code reviewer.
Analyze the provided document text for structural consistency, readability, technical accuracy, and content completeness.
Produce a comprehensive documentation quality analysis.
THE ANALYSIS REPORT AND ALL CONTENTS (summary, issues, strengths, suggestions) MUST BE WRITTEN ENTIRELY IN ENGLISH.
If the uploaded document contains other languages (e.g. Spanish, Telugu, Hindi, French, German, Chinese, Hinglish, etc.), you must read and extract the text, analyze it, and output the final JSON report ONLY IN ENGLISH.

Your response must be a single, valid JSON object matching the following TypeScript interfaces. Do not include markdown code block formatting (such as \`\`\`json ... \`\`\`), do not include any preamble or extra text - return strictly the raw JSON object.

interface DocIssue {
  id: string; // unique short string like "issue-1"
  severity: "critical" | "high" | "medium" | "low";
  category: "clarity" | "completeness" | "structure" | "readability" | "consistency" | "technical";
  title: string;
  description: string; // why it is a problem
  location: string; // section name or line details
  recommendation: string; // concrete fix suggestion
}

interface SectionAnalysis {
  heading: string;
  level: number;
  quality: "excellent" | "good" | "fair" | "poor";
  problems: string[];
  suggestions: string[];
}

interface ScoreBreakdown {
  overall: number; // 0 to 100 based on actual analysis
  clarity: number; // 0 to 100
  completeness: number; // 0 to 100
  structure: number; // 0 to 100
  readability: number; // 0 to 100
  consistency: number; // 0 to 100
  technical: number; // 0 to 100
}

interface DocumentationAnalysis {
  overview: {
    title: string;
    type: string; // "Technical/Developer Guide" | "Product Requirements Document (PRD)" | "User Guide / Manual" | "Legal/Policy Document" | "General Documentation"
    wordCount: number;
    sectionsCount: number;
    summary: string; // concise document summary (1-2 sentences)
  };
  score: ScoreBreakdown;
  executiveSummary: string; // Detailed professional summary of quality findings
  strengths: string[]; // List of 2-5 strengths
  issues: DocIssue[];
  recommendations: string[]; // List of top 3-6 recommendations
  sections: SectionAnalysis[];
  readabilityAssessment: {
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    readabilityScore: number; // 0-100 score
    readabilityLabel: string;
    readabilityDescription: string;
    simplificationAreas: string[]; // list of exact sentences from the text that are too dense and should be simplified
  };
}

Make sure scores are realistic. Critical issues (e.g. missing basic setup details in dev guide, or missing liability clauses in legal docs) should lower the score.
If there are no code snippets in a technical setup doc, note it.

Document Title: ${title}
Document Content:
${text}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText || response.statusText}`);
  }

  const resJson = await response.json();
  let responseText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error('Empty response from Gemini API.');
  }

  // Clean markdown JSON delimiters if present
  responseText = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    const analysis = JSON.parse(responseText) as DocumentationAnalysis;
    analysis.analyzedAt = new Date().toISOString();
    analysis.engineUsed = 'gemini';
    return analysis;
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', responseText, err);
    throw new Error('Gemini API did not return valid JSON matching the analysis schema.');
  }
}

// Help count matches
function lowercaseMatches(text: string, search: string): number {
  const lowercase = text.toLowerCase();
  const searchLower = search.toLowerCase();
  if (!searchLower) return 0;
  return lowercase.split(searchLower).length - 1;
}
