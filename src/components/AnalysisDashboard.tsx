import { useState } from 'react';
import type { AnalysisResult, DocIssue } from '@/types';
import { Gauge, HorizontalBar, WordCloud } from './Charts';
import {
  FileText, Sparkles, Clock, Download, Copy, Check, AlertCircle,
  CheckCircle2, Info, Search, ShieldAlert, AlertTriangle, Layers, AlignLeft,
  ChevronDown, ChevronUp, ChevronRight
} from 'lucide-react';

interface AnalysisDashboardProps {
  result: AnalysisResult;
}

type TabType = 'overview' | 'issues' | 'structure' | 'readability';

export function AnalysisDashboard({ result }: AnalysisDashboardProps) {
  const docAnalysis = result.docAnalysis;

  if (!docAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface border border-border rounded-xl shadow-sm">
        <AlertCircle className="w-8 h-8 text-warning mb-2 animate-pulse-custom" />
        <p className="text-sm text-text-secondary">Detailed documentation analysis is not available for this record.</p>
      </div>
    );
  }

  const { overview, score, executiveSummary, strengths, issues, recommendations, sections, readabilityAssessment, engineUsed } = docAnalysis;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);

  // Issues Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'severity' | 'category' | 'location'>('severity');
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  // Copy Summary Action
  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(executiveSummary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  // Copy Full Markdown Analysis Action
  const handleCopyAnalysis = async () => {
    const markdown = `# Documentation Audit Report: ${overview.title}
**Date of Audit:** ${new Date(docAnalysis.analyzedAt).toLocaleDateString()}
**Overall Quality Score:** ${score.overall}/100
**Document Type:** ${overview.type}
**Engine Used:** ${engineUsed === 'gemini' ? 'Gemini AI' : 'Local Rules Engine'}

## Executive Summary
${executiveSummary}

## Key Strengths
${strengths.map(s => `- ${s}`).join('\n')}

## Core Recommendations
${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Detailed Issues Identified (${issues.length})
${issues.map((iss, i) => `
### ${i + 1}. [${iss.severity.toUpperCase()}] ${iss.title}
- **Category:** ${iss.category}
- **Location:** ${iss.location}
- **Problem:** ${iss.description}
- **Recommended Action:** ${iss.recommendation}
`).join('\n')}

## Section Quality Outlines
${sections.map(sec => `- **${sec.heading}** (Level ${sec.level}): Quality is **${sec.quality.toUpperCase()}**
  ${sec.problems.length > 0 ? `Problems: ${sec.problems.join(', ')}` : 'No major issues.'}
  ${sec.suggestions.length > 0 ? `Suggestions: ${sec.suggestions.join(', ')}` : ''}
`).join('\n')}
`;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedAnalysis(true);
      setTimeout(() => setCopiedAnalysis(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  // Download Styled HTML Report
  const handleDownloadReport = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>DocuLint Quality Audit: ${overview.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
      color: #172033;
      line-height: 1.6;
      background-color: #F5F8FC;
      padding: 40px 20px;
      margin: 0;
    }
    .container {
      max-width: 850px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(23, 32, 51, 0.05);
      border: 1px solid #D9E2EF;
    }
    header {
      border-bottom: 2px solid #F1F5F9;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }
    h1 { font-size: 28px; margin: 0 0 8px 0; color: #0F172A; }
    .meta { font-size: 13px; color: #475569; margin: 0; }
    .grid { display: grid; grid-template-columns: 1fr 2fr; gap: 30px; margin-bottom: 30px; }
    .score-card {
      background: #FFFFFF;
      color: #0F172A;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      border: 1px solid #E2E8F0;
    }
    .score-num { font-size: 64px; font-weight: 800; line-height: 1; margin: 15px 0 5px 0; color: #EA580C; }
    .score-label { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748B; }
    .score-bar { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; font-size: 12px; color: #475569; }
    .progress-bg { width: 100%; height: 6px; border-radius: 3px; overflow: hidden; margin-top: 4px; background: #E2E8F0; }
    .progress-fill { height: 100%; background: #EA580C; }
    .card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    h2 { font-size: 18px; margin-top: 0; margin-bottom: 15px; color: #0F172A; border-left: 4px solid #EA580C; padding-left: 10px; }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 10px;
      font-weight: 700;
      border-radius: 9999px;
      text-transform: uppercase;
      margin-right: 6px;
    }
    .badge-critical { background: #FEE2E2; color: #DC2626; }
    .badge-high { background: #FFEDD5; color: #EA580C; }
    .badge-medium { background: #FEF9C3; color: #D97706; }
    .badge-low { background: #FFF7ED; color: #EA580C; }
    .badge-cat { background: #F1F5F9; color: #475569; }
    .issue-item { border-bottom: 1px solid #E2E8F0; padding: 15px 0; }
    .issue-item:last-child { border-bottom: none; }
    .issue-header { display: flex; align-items: center; justify-content: space-between; }
    .issue-title { font-weight: 750; font-size: 15px; color: #0F172A; margin: 0; }
    .issue-meta { font-size: 12px; color: #475569; margin-top: 4px; }
    .issue-desc { font-size: 13.5px; color: #475569; margin: 8px 0; }
    .issue-rec { background: #FFF7ED; border-left: 3px solid #EA580C; padding: 8px 12px; font-size: 13px; color: #0F172A; margin: 4px 0 0 0; }
    ul { padding-left: 20px; margin: 0; }
    li { margin-bottom: 8px; font-size: 14px; color: #475569; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { text-align: left; padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #E2E8F0; }
    th { background: #F1F5F9; color: #475569; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>DocuLint Documentation Quality Audit</h1>
      <p class="meta">Document Name: <strong>${overview.title}</strong> &bull; Generated: ${new Date(docAnalysis.analyzedAt).toLocaleString()} &bull; Auditor: ${engineUsed === 'gemini' ? 'Gemini AI' : 'Local Rules Engine'}</p>
    </header>

    <div class="grid">
      <div class="score-card">
        <div class="score-label">Overall Quality</div>
        <div class="score-num">${score.overall}</div>
        <div style="font-size:12px; color:#64748B;">out of 100 points</div>

        <div style="margin-top:25px; text-align:left;">
          <div class="score-bar">
            <span>Clarity</span><span>${score.clarity}%</span>
          </div>
          <div class="progress-bg"><div class="progress-fill" style="width:${score.clarity}%; background:#EA580C;"></div></div>

          <div class="score-bar" style="margin-top:8px;">
            <span>Completeness</span><span>${score.completeness}%</span>
          </div>
          <div class="progress-bg"><div class="progress-fill" style="width:${score.completeness}%; background:#EA580C;"></div></div>

          <div class="score-bar" style="margin-top:8px;">
            <span>Structure</span><span>${score.structure}%</span>
          </div>
          <div class="progress-bg"><div class="progress-fill" style="width:${score.structure}%; background:#EA580C;"></div></div>

          <div class="score-bar" style="margin-top:8px;">
            <span>Technical Quality</span><span>${score.technical}%</span>
          </div>
          <div class="progress-bg"><div class="progress-fill" style="width:${score.technical}%; background:#EA580C;"></div></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center;">
        <h2>Executive Summary</h2>
        <p style="font-size:14.5px; color:#52627A; line-height:1.7; margin:0;">${executiveSummary}</p>
      </div>
    </div>

    <div class="card">
      <h2>Key Strengths</h2>
      <ul>
        ${strengths.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>

    <div class="card">
      <h2>Top Core Recommendations</h2>
      <ul style="list-style-type: decimal;">
        ${recommendations.map(r => `<li>${r}</li>`).join('')}
      </ul>
    </div>

    <div class="card">
      <h2>Issues Identified (${issues.length})</h2>
      <div style="margin-top:10px;">
        ${issues.map(iss => `
          <div class="issue-item">
            <div class="issue-header">
              <h3 class="issue-title">
                <span class="badge badge-${iss.severity}">${iss.severity}</span>
                <span class="badge badge-cat">${iss.category}</span>
                ${iss.title}
              </h3>
              <span class="meta">${iss.location}</span>
            </div>
            <p class="issue-desc">${iss.description}</p>
            <div class="issue-rec">
              <strong>Recommendation:</strong> ${iss.recommendation}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doculint-audit-${overview.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Severity Counters
  const countSeverity = (sev: string) => issues.filter(i => i.severity === sev).length;

  const filteredIssues = issues
    .filter((iss) => {
      const matchSearch =
        iss.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        iss.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSeverity = severityFilter === 'all' || iss.severity === severityFilter;
      const matchCategory = categoryFilter === 'all' || iss.category === categoryFilter;
      return matchSearch && matchSeverity && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'severity') {
        const priority = { critical: 4, high: 3, medium: 2, low: 1 };
        return priority[b.severity] - priority[a.severity];
      }
      if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      }
      return a.location.localeCompare(b.location);
    });

  return (
    <div className="space-y-6">
      {/* Overview Metadata Bar - Dynamic Theme Color System */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border animate-fade-in shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center flex-shrink-0 p-1.5 shadow-sm">
            <img src="/logo.png" alt="DocuLint" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">{overview.title}</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Type: <span className="text-primary font-bold">{overview.type}</span> &bull; {overview.wordCount} words &bull; {overview.sectionsCount} sections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleCopySummary}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-secondary border border-border hover:bg-surface-hover text-text-secondary hover:text-text-primary text-xs font-semibold transition-all"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSummary ? 'Copied!' : 'Copy Summary'}
          </button>
          <button
            onClick={handleCopyAnalysis}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-secondary border border-border hover:bg-surface-hover text-text-secondary hover:text-text-primary text-xs font-semibold transition-all"
          >
            {copiedAnalysis ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedAnalysis ? 'Copied Report!' : 'Copy Markdown'}
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download HTML Report
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-1 overflow-x-auto scrollbar-hidden">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex-shrink-0 ${
            activeTab === 'overview'
              ? 'border-primary text-primary bg-primary-soft/50'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Overview & Scores
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all relative flex-shrink-0 ${
            activeTab === 'issues'
              ? 'border-primary text-primary bg-primary-soft/50'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Issues Audit
          {issues.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-primary text-white leading-none">
              {issues.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('structure')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex-shrink-0 ${
            activeTab === 'structure'
              ? 'border-primary text-primary bg-primary-soft/50'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Structure Map
        </button>
        <button
          onClick={() => setActiveTab('readability')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex-shrink-0 ${
            activeTab === 'readability'
              ? 'border-primary text-primary bg-primary-soft/50'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <AlignLeft className="w-3.5 h-3.5" />
          Readability & NLP
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Radial score gauge */}
              <div className="p-6 rounded-xl bg-surface border border-border flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-xs text-text-muted font-bold uppercase tracking-wider mb-3">Overall Score</span>
                <Gauge value={score.overall} min={0} max={100} label="" />
                <div className="mt-3 text-xs text-text-muted font-bold">
                  Audited by: <span className="text-primary capitalize">{engineUsed} engine</span>
                </div>
              </div>

              {/* Subscores breakdown */}
              <div className="lg:col-span-2 p-6 rounded-xl bg-surface border border-border space-y-3.5 shadow-sm text-text-primary">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Audits Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5">
                  <HorizontalBar label="Clarity" value={score.clarity} max={100} />
                  <HorizontalBar label="Completeness" value={score.completeness} max={100} />
                  <HorizontalBar label="Structure" value={score.structure} max={100} />
                  <HorizontalBar label="Readability" value={score.readability} max={100} />
                  <HorizontalBar label="Consistency" value={score.consistency} max={100} />
                  <HorizontalBar label="Technical Quality" value={score.technical} max={100} />
                </div>
              </div>
            </div>

            {/* Executive summary */}
            <div className="p-5 rounded-xl bg-surface border border-border border-l-4 border-l-primary shadow-sm text-text-primary">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Executive Summary</h3>
              <p className="text-sm text-text-secondary leading-relaxed font-medium">{executiveSummary}</p>
            </div>

            {/* Strengths & Core Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-surface border border-border shadow-sm text-text-primary">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Key Strengths</h3>
                <div className="space-y-2.5">
                  {strengths.map((str, idx) => (
                    <div key={idx} className="flex gap-2.5 text-xs text-text-secondary leading-relaxed font-medium">
                      <CheckCircle2 className="w-4.5 h-4.5 text-success flex-shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-surface border border-border shadow-sm text-text-primary">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Top Recommendations</h3>
                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-2.5 text-xs text-text-secondary leading-relaxed font-medium">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-soft text-primary border border-primary/20 text-[10px] font-black flex items-center justify-center font-mono">
                        {idx + 1}
                      </div>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ISSUES LIST */}
        {activeTab === 'issues' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search, Filter, Sort controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl bg-surface border border-border shadow-sm">
              {/* Search text input */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search issues by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-surface border border-border text-text-primary placeholder-text-muted/65 focus-ring"
                />
              </div>

              {/* Category dropdown */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-border text-text-primary focus-ring font-bold"
                >
                  <option value="all">All Categories</option>
                  <option value="clarity">Clarity</option>
                  <option value="completeness">Completeness</option>
                  <option value="structure">Structure</option>
                  <option value="readability">Readability</option>
                  <option value="consistency">Consistency</option>
                  <option value="technical">Technical Quality</option>
                </select>
              </div>

              {/* Sort selector */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-border text-text-primary focus-ring font-bold"
                >
                  <option value="severity">Sort by: Severity</option>
                  <option value="category">Sort by: Category</option>
                  <option value="location">Sort by: Location</option>
                </select>
              </div>
            </div>

            {/* Severity filter buttons with count badges */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-text-muted font-bold uppercase tracking-wider mr-1">Severity:</span>
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  severityFilter === 'all'
                    ? 'bg-primary border-primary text-white'
                    : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'
                }`}
              >
                All ({issues.length})
              </button>
              <button
                onClick={() => setSeverityFilter('critical')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  severityFilter === 'critical'
                    ? 'bg-danger border-danger text-white'
                    : 'bg-surface border-border text-text-secondary hover:border-danger/30 hover:text-danger'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-danger" />
                Critical ({countSeverity('critical')})
              </button>
              <button
                onClick={() => setSeverityFilter('high')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  severityFilter === 'high'
                    ? 'bg-warning border-warning text-white'
                    : 'bg-surface border-border text-text-secondary hover:border-warning/30 hover:text-warning'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-warning" />
                High ({countSeverity('high')})
              </button>
              <button
                onClick={() => setSeverityFilter('medium')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  severityFilter === 'medium'
                    ? 'bg-warning/80 border-warning text-white'
                    : 'bg-surface border-border text-text-secondary hover:border-warning/30 hover:text-warning'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-warning" />
                Medium ({countSeverity('medium')})
              </button>
              <button
                onClick={() => setSeverityFilter('low')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  severityFilter === 'low'
                    ? 'bg-primary-soft border-primary/30 text-primary font-black'
                    : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                Low ({countSeverity('low')})
              </button>
            </div>

            {/* List rendered */}
            {filteredIssues.length === 0 ? (
              <div className="p-8 text-center bg-surface border border-border rounded-xl text-text-muted text-sm shadow-sm font-medium">
                No issues match your current search/filter parameters.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredIssues.map((iss) => {
                  const isExpanded = expandedIssueId === iss.id;
                  const severityBadgeClass = 
                    iss.severity === 'critical' ? 'bg-danger/10 border-danger/20 text-danger' :
                    iss.severity === 'high' ? 'bg-warning/10 border-warning/20 text-warning' :
                    iss.severity === 'medium' ? 'bg-warning/10 border-warning/20 text-warning' :
                    'bg-primary-soft border-primary/20 text-primary';

                  return (
                    <div
                      key={iss.id}
                      className={`rounded-xl border transition-all shadow-sm ${
                        isExpanded
                          ? 'bg-surface-hover border-border-strong'
                          : 'bg-surface border-border hover:border-border-strong'
                      }`}
                    >
                      {/* Accordion Trigger */}
                      <button
                        onClick={() => setExpandedIssueId(isExpanded ? null : iss.id)}
                        className="w-full px-4 py-3.5 flex items-start justify-between gap-3 text-left focus:outline-none"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border uppercase leading-none ${severityBadgeClass}`}>
                              {iss.severity}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-surface-secondary text-text-secondary border border-border uppercase leading-none">
                              {iss.category}
                            </span>
                            <span className="text-[10px] text-text-muted truncate">
                              Location: <strong className="text-text-secondary">{iss.location}</strong>
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-text-primary leading-tight">
                            {iss.title}
                          </h4>
                        </div>
                        <div className="flex-shrink-0 self-center text-text-muted hover:text-text-primary">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3 animate-fade-in">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block mb-1">Why it is a problem</span>
                            <p className="text-xs text-text-secondary leading-relaxed font-medium">{iss.description}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-primary-soft border border-primary/10 text-primary">
                            <span className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-1">Recommended Solution</span>
                            <p className="text-xs text-text-primary leading-relaxed font-medium">{iss.recommendation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STRUCTURE MAP */}
        {activeTab === 'structure' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-xl bg-surface border border-border shadow-sm text-text-primary">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Heading Outline Tree</h3>
              <p className="text-xs text-text-muted mb-4">Audited headings structure of the document.</p>
              
              <div className="space-y-1 pl-1">
                {sections.map((sec, idx) => {
                  const indent = sec.level > 1 ? (sec.level - 1) * 20 : 0;
                  const qualityColor = 
                    sec.quality === 'excellent' ? 'text-success bg-success/10 border-success/20' :
                    sec.quality === 'good' ? 'text-primary bg-primary-soft border-primary/20' :
                    sec.quality === 'fair' ? 'text-warning bg-warning/10 border-warning/20' :
                    'text-danger bg-danger/10 border-danger/20';

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 group select-none transition-all py-1"
                      style={{ paddingLeft: `${indent}px` }}
                    >
                      {sec.level > 1 && (
                        <span className="text-text-muted/40 font-mono text-xs select-none">
                          {idx === sections.length - 1 || (sections[idx + 1] && sections[idx + 1].level < sec.level) ? '└──' : '├──'}
                        </span>
                      )}
                      <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-border hover:border-primary/45 hover:bg-surface-hover shadow-sm transition-all">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold text-text-primary leading-tight">{sec.heading}</h4>
                            <p className="text-[10px] text-text-muted mt-0.5">Level {sec.level} &bull; {sec.problems.length} issues identified</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${qualityColor} uppercase`}>
                          {sec.quality}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* In-depth suggestions */}
            <div className="p-5 rounded-xl bg-surface border border-border shadow-sm text-text-primary">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Section Improvements Detailed</h3>
              <div className="space-y-3.5">
                {sections.filter(s => s.suggestions.length > 0).map((sec, idx) => (
                  <div key={idx} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
                    <h4 className="text-xs font-bold text-text-primary mb-1">{sec.heading} (H{sec.level})</h4>
                    <div className="space-y-1 mt-1.5 pl-3 border-l-2 border-border-strong">
                      {sec.suggestions.map((sug, sIdx) => (
                        <p key={sIdx} className="text-xs text-text-secondary flex items-start gap-1 font-medium">
                          <span className="text-primary font-bold">•</span>
                          {sug}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {sections.filter(s => s.suggestions.length > 0).length === 0 && (
                  <p className="text-xs text-text-muted font-medium">All sections passed structural quality outline checks successfully!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: READABILITY & NLP */}
        {activeTab === 'readability' && (
          <div className="space-y-6 animate-fade-in">
            {/* Base Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-surface border border-border text-center shadow-sm">
                <span className="text-[10px] uppercase font-bold text-text-muted block mb-1">Words</span>
                <span className="text-xl font-extrabold text-text-primary">{readabilityAssessment.wordCount}</span>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border text-center shadow-sm">
                <span className="text-[10px] uppercase font-bold text-text-muted block mb-1">Sentences</span>
                <span className="text-xl font-extrabold text-text-primary">{readabilityAssessment.sentenceCount}</span>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border text-center shadow-sm">
                <span className="text-[10px] uppercase font-bold text-text-muted block mb-1">Avg Sentence Length</span>
                <span className="text-xl font-extrabold text-text-primary">{readabilityAssessment.avgSentenceLength.toFixed(1)} words</span>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border text-center shadow-sm">
                <span className="text-[10px] uppercase font-bold text-text-muted block mb-1">Readability Index</span>
                <span className="text-xl font-extrabold text-text-primary">{readabilityAssessment.readabilityScore.toFixed(0)} / 100</span>
              </div>
            </div>

            {/* Reading difficulty explanation */}
            <div className="p-4 rounded-xl bg-surface border border-border border-l-4 border-l-primary flex items-start gap-3 shadow-sm text-text-primary">
              <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-text-primary">
                  Difficulty Level: {readabilityAssessment.readabilityLabel}
                </h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  {readabilityAssessment.readabilityDescription} Documents with higher Flesch Ease values are easier to comprehend, whereas lower scores indicate highly complex wording (often suitable for academic or legal documents).
                </p>
              </div>
            </div>

            {/* Simplification recommendations */}
            {readabilityAssessment.simplificationAreas.length > 0 && (
              <div className="p-4 rounded-xl bg-surface border border-border shadow-sm text-text-primary">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Dense Sentences Requiring Simplification</h3>
                <div className="space-y-2">
                  {readabilityAssessment.simplificationAreas.map((sentence, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-surface-secondary border border-border flex gap-2.5 items-start">
                      <div className="text-xs font-bold font-mono text-text-muted flex-shrink-0 mt-0.5">#{idx + 1}</div>
                      <p className="text-xs text-text-secondary leading-relaxed font-medium italic">"{sentence}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incorporating original keywords/word cloud visualizations */}
            {result.topWords && result.topWords.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Keywords frequencies */}
                {result.keywords && result.keywords.length > 0 && (
                  <div className="p-5 rounded-xl bg-surface border border-border space-y-2.5 shadow-sm text-text-primary">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Top Keywords Freq</h3>
                    {result.keywords.slice(0, 8).map((kw, i) => (
                      <HorizontalBar
                        key={i}
                        label={kw.word}
                        value={kw.count}
                        max={result.keywords[0]?.count || 1}
                      />
                    ))}
                  </div>
                )}

                {/* Word Cloud */}
                <div className="p-5 rounded-xl bg-surface border border-border flex flex-col justify-center shadow-sm text-text-primary">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 text-center">Word Cloud</h3>
                  <div className="flex items-center justify-center p-2">
                    <WordCloud words={result.topWords} maxItems={25} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
