import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Configure CDN worker path for browser-based execution
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

export interface ExtractedFile {
  text: string;
  name: string;
  size: number;
  type: string;
  pagesCount?: number;
}

export async function extractTextFromFile(file: File): Promise<ExtractedFile> {
  const name = file.name;
  const size = file.size;
  const type = file.type;

  // 1. TXT support - direct reading
  if (type === 'text/plain' || name.endsWith('.txt')) {
    const text = await file.text();
    if (!text.trim()) {
      throw new Error('The text file is empty.');
    }
    return { text, name, size, type, pagesCount: Math.ceil(text.split(/\s+/).length / 400) };
  }

  // 2. Markdown support - direct reading
  if (type === 'text/markdown' || name.endsWith('.md') || name.endsWith('.markdown')) {
    const text = await file.text();
    if (!text.trim()) {
      throw new Error('The markdown file is empty.');
    }
    return { text, name, size, type, pagesCount: Math.ceil(text.split(/\s+/).length / 400) };
  }

  if (type === 'text/csv' || name.endsWith('.csv')) {
    const text = await file.text();
    return { text, name, size, type, pagesCount: 1 };
  }

  if (type === 'application/json' || name.endsWith('.json')) {
    const text = await file.text();
    return { text, name, size, type, pagesCount: 1 };
  }

  if (type === 'text/html' || name.endsWith('.html') || name.endsWith('.htm')) {
    const text = await file.text();
    const stripped = stripHtml(text);
    return { text: stripped, name, size, type, pagesCount: Math.ceil(stripped.split(/\s+/).length / 400) };
  }

  if (type === 'text/xml' || name.endsWith('.xml')) {
    const text = await file.text();
    const stripped = stripXml(text);
    return { text: stripped, name, size, type, pagesCount: Math.ceil(stripped.split(/\s+/).length / 400) };
  }

  if (type.startsWith('text/')) {
    const text = await file.text();
    return { text, name, size, type, pagesCount: Math.ceil(text.split(/\s+/).length / 400) };
  }

  // 3. PDF Support - using pdfjs-dist
  if (name.endsWith('.pdf') || type === 'application/pdf') {
    const result = await extractPdfText(file);
    return { text: result.text, name, size, type, pagesCount: result.pagesCount };
  }

  // 4. DOCX Support - using jszip
  if (
    name.endsWith('.docx') ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const text = await extractDocxText(file);
    return { text, name, size, type, pagesCount: Math.ceil(text.split(/\s+/).length / 400) };
  }

  if (name.endsWith('.doc') || type === 'application/msword') {
    const text = await extractDocText(file);
    return { text, name, size, type, pagesCount: Math.ceil(text.split(/\s+/).length / 400) };
  }

  if (name.endsWith('.rtf') || type === 'application/rtf') {
    const text = await extractRtfText(file);
    return { text, name, size, type, pagesCount: Math.ceil(text.split(/\s+/).length / 400) };
  }

  try {
    const text = await file.text();
    if (text && text.length > 0) {
      return { text, name, size, type, pagesCount: Math.ceil(text.split(/\s+/).length / 400) };
    }
  } catch {
    // fall through
  }

  throw new Error(`Unsupported file type: ${name}`);
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim();
}

function stripXml(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractPdfText(file: File): Promise<{ text: string; pagesCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let textPages: string[] = [];
    let hasSelectableText = false;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      if (pageText.trim().length > 3) {
        hasSelectableText = true;
      }
      textPages.push(`[Page ${pageNum}]\n${pageText}`);
    }

    if (!hasSelectableText) {
      throw new Error('This PDF contains only scanned images and has no selectable text. Please upload a PDF with select/copyable text.');
    }

    return {
      text: textPages.join('\n\n'),
      pagesCount: pdf.numPages
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to parse or extract text from this PDF file. The document may be corrupted.');
  }
}

async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      throw new Error('This DOCX file is missing document.xml content. It might be corrupted.');
    }
    const xmlText = await docXmlFile.async('text');
    
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    const parserError = doc.getElementsByTagName('parsererror')[0];
    if (parserError) {
      throw new Error('XML parsing failed on this DOCX file. It might be malformed.');
    }

    const body = doc.getElementsByTagName('w:body')[0];
    if (!body) {
      throw new Error('Document body missing in word/document.xml.');
    }

    let paragraphs: string[] = [];
    const childNodes = body.childNodes;
    
    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      const nodeName = child.nodeName;

      if (nodeName === 'w:p') {
        const text = extractParagraphText(child);
        if (text) paragraphs.push(text);
      } else if (nodeName === 'w:tbl') {
        const text = extractTableText(child);
        if (text) paragraphs.push(text);
      }
    }

    const fullText = paragraphs.join('\n\n');
    if (!fullText.trim()) {
      throw new Error('The DOCX file was successfully parsed but contained no text.');
    }

    return fullText;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to extract text from this DOCX file.');
  }
}

function extractParagraphText(pNode: Node): string {
  let prefix = '';
  const childNodes = pNode.childNodes;
  
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i];
    if (child.nodeName === 'w:pPr') {
      const pPrChildren = child.childNodes;
      for (let j = 0; j < pPrChildren.length; j++) {
        if (pPrChildren[j].nodeName === 'w:pStyle') {
          const styleVal = (pPrChildren[j] as Element).getAttribute('w:val');
          if (styleVal && styleVal.toLowerCase().startsWith('heading')) {
            const levelMatch = styleVal.match(/\d+/);
            const level = levelMatch ? parseInt(levelMatch[0], 10) : 1;
            prefix = '#'.repeat(level) + ' ';
          }
        }
      }
    }
  }

  let text = '';
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i];
    if (child.nodeName === 'w:r') {
      const rChildren = child.childNodes;
      for (let j = 0; j < rChildren.length; j++) {
        const rChild = rChildren[j];
        if (rChild.nodeName === 'w:t') {
          text += rChild.textContent || '';
        } else if (rChild.nodeName === 'w:br') {
          text += '\n';
        }
      }
    }
  }

  return text.trim() ? prefix + text.trim() : '';
}

function extractTableText(tblNode: Node): string {
  const childNodes = tblNode.childNodes;
  let rows: string[] = [];
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i];
    if (child.nodeName === 'w:tr') {
      const trChildren = child.childNodes;
      let cells: string[] = [];
      for (let j = 0; j < trChildren.length; j++) {
        const trChild = trChildren[j];
        if (trChild.nodeName === 'w:tc') {
          const tcChildren = trChild.childNodes;
          let cellText = '';
          for (let k = 0; k < tcChildren.length; k++) {
            if (tcChildren[k].nodeName === 'w:p') {
              const pText = extractParagraphText(tcChildren[k]);
              if (pText) cellText += (cellText ? '\n' : '') + pText;
            }
          }
          cells.push(cellText);
        }
      }
      if (cells.length > 0) {
        rows.push('| ' + cells.join(' | ') + ' |');
      }
    }
  }
  return rows.join('\n');
}

async function extractDocText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('latin1');
  const raw = decoder.decode(bytes);

  const textMatch = raw.match(/[\x20-\x7E\r\n]{4,}/g);
  if (textMatch) {
    return textMatch
      .filter((t) => !t.includes('WordDocument') && !t.includes('0Table'))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  throw new Error('Could not extract text from this DOC file. Convert to DOCX or TXT format.');
}

async function extractRtfText(file: File): Promise<string> {
  const text = await file.text();
  const parsed = text
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\'[0-9a-fA-F]{2}/g, '')
    .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!parsed) {
    throw new Error('Could not extract text from this RTF file.');
  }
  return parsed;
}
