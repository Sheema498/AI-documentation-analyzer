import { describe, it, expect } from 'vitest';
import { parseSections, classifyDocumentType, analyzeDocumentLocally } from '../docAnalyzer';

describe('docAnalyzer structural parser', () => {
  it('should parse markdown headings correctly', () => {
    const text = `# Section 1\nSome description text.\n## Subsection 1.1\nMore content here.`;
    const sections = parseSections(text);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe('Section 1');
    expect(sections[0].level).toBe(1);
    expect(sections[0].content).toBe('Some description text.');
    expect(sections[1].heading).toBe('Subsection 1.1');
    expect(sections[1].level).toBe(2);
    expect(sections[1].content).toBe('More content here.');
  });
});

describe('docAnalyzer document classifier', () => {
  it('should classify technical manuals correctly', () => {
    const text = `How to build the repository: npm install, npm run, and import credentials.`;
    const docType = classifyDocumentType(text);
    expect(docType).toBe('Technical/Developer Guide');
  });

  it('should classify PRD documents correctly', () => {
    const text = `This is a product requirements document detailing user stories and functional scope of the feature.`;
    const docType = classifyDocumentType(text);
    expect(docType).toBe('Product Requirements Document (PRD)');
  });
});

describe('docAnalyzer quality audits', () => {
  it('should audit empty and missing sections', () => {
    const text = `# Introduction\nThis is a short intro.\n# Setup`;
    const analysis = analyzeDocumentLocally(text, 'Test Doc');
    expect(analysis.score.overall).toBeLessThan(100);
    
    const emptySetup = analysis.issues.find(i => i.title.includes('Empty section'));
    expect(emptySetup).toBeDefined();
    expect(emptySetup?.location).toBe('Setup');
  });

  it('should detect spelling terminology inconsistencies', () => {
    const text = `# Overview\nThis frontend requires some front-end changes.`;
    const analysis = analyzeDocumentLocally(text, 'Spelling Doc');
    const spellingIssue = analysis.issues.find(i => i.category === 'consistency');
    expect(spellingIssue).toBeDefined();
    expect(spellingIssue?.title).toContain('Inconsistent terms');
  });
});
