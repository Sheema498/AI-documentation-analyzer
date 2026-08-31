export interface ExtractedFile {
  text: string;
  name: string;
  size: number;
  type: string;
}

export async function extractTextFromFile(file: File): Promise<ExtractedFile> {
  const name = file.name;
  const size = file.size;
  const type = file.type;

  if (type === 'text/plain' || name.endsWith('.txt')) {
    const text = await file.text();
    return { text, name, size, type };
  }

  if (type === 'text/markdown' || name.endsWith('.md') || name.endsWith('.markdown')) {
    const text = await file.text();
    return { text, name, size, type };
  }

  if (type === 'text/csv' || name.endsWith('.csv')) {
    const text = await file.text();
    return { text, name, size, type };
  }

  if (type === 'application/json' || name.endsWith('.json')) {
    const text = await file.text();
    return { text, name, size, type };
  }

  if (type === 'text/html' || name.endsWith('.html') || name.endsWith('.htm')) {
    const text = await file.text();
    const stripped = stripHtml(text);
    return { text: stripped, name, size, type };
  }

  if (type === 'text/xml' || name.endsWith('.xml')) {
    const text = await file.text();
    const stripped = stripXml(text);
    return { text: stripped, name, size, type };
  }

  if (type.startsWith('text/')) {
    const text = await file.text();
    return { text, name, size, type };
  }

  if (name.endsWith('.pdf')) {
    const text = await extractPdfText(file);
    return { text, name, size, type };
  }

  if (
    name.endsWith('.docx') ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const text = await extractDocxText(file);
    return { text, name, size, type };
  }

  if (name.endsWith('.doc') || type === 'application/msword') {
    const text = await extractDocText(file);
    return { text, name, size, type };
  }

  if (name.endsWith('.rtf') || type === 'application/rtf') {
    const text = await extractRtfText(file);
    return { text, name, size, type };
  }

  try {
    const text = await file.text();
    if (text && text.length > 0) {
      return { text, name, size, type };
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

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let text = '';
  let inTextBlock = false;
  let currentText = '';
  const decoder = new TextDecoder('latin1');

  for (let i = 0; i < bytes.length; i++) {
    const char = decoder.decode(bytes.slice(i, i + 1));
    if (char === '(') {
      inTextBlock = true;
      currentText = '';
      continue;
    }
    if (char === ')') {
      if (inTextBlock) {
        text += currentText + ' ';
        inTextBlock = false;
      }
      continue;
    }
    if (inTextBlock) {
      if (char === '\\') {
        i++;
        const next = decoder.decode(bytes.slice(i, i + 1));
        if (next === 'n' || next === 'r') {
          currentText += '\n';
        } else if (next === '(' || next === ')' || next === '\\') {
          currentText += next;
        }
      } else {
        currentText += char;
      }
    }
  }

  if (text.trim().length < 10) {
    const fullText = decoder.decode(bytes);
    const matches = fullText.match(/BT[\s\S]*?ET/g);
    if (matches) {
      text = matches
        .map((block) => {
          const textMatches = block.match(/\(([^)]*)\)/g);
          if (textMatches) {
            return textMatches.map((m) => m.slice(1, -1)).join(' ');
          }
          return '';
        })
        .join(' ');
    }
  }

  return text.replace(/\s+/g, ' ').trim() || '[Could not extract text from this PDF. The file may be scanned or image-based.]';
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const text = await decompressDocx(arrayBuffer);
  return text;
}

async function decompressDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(arrayBuffer);

  let i = 0;

  while (i < bytes.length - 4) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b) {
      const compressionMethod = bytes[i + 2] | (bytes[i + 3] << 8);
      const compressedSize =
        bytes[i + 18] |
        (bytes[i + 19] << 8) |
        (bytes[i + 20] << 16) |
        (bytes[i + 21] << 24);
      const uncompressedSize =
        bytes[i + 22] |
        (bytes[i + 23] << 8) |
        (bytes[i + 24] << 16) |
        (bytes[i + 25] << 24);

      const nameStart = i + 30;
      const nameLength =
        bytes[i + 26] | (bytes[i + 27] << 8);
      const name = new TextDecoder().decode(bytes.slice(nameStart, nameStart + nameLength));

      const dataStart = nameStart + nameLength;

      if (
        (name.includes('document.xml') || name.includes('word/document')) &&
        compressionMethod === 8
      ) {
        const compressedData = bytes.slice(dataStart, dataStart + compressedSize);
        try {
          const decompressed = inflateRaw(compressedData, uncompressedSize);
          const xmlText = new TextDecoder().decode(decompressed);
          return stripXml(xmlText);
        } catch {
          // skip
        }
      }

      i = dataStart + compressedSize;
    } else {
      i++;
    }
  }

  return '[Could not extract text from this DOCX file.]';
}

function inflateRaw(data: Uint8Array, expectedSize: number): Uint8Array {
  const result = new Uint8Array(expectedSize);
  let pos = 0;
  let outPos = 0;
  let bitBuffer = 0;
  let bitsInBuffer = 0;

  function readBits(n: number): number {
    while (bitsInBuffer < n) {
      if (pos >= data.length) throw new Error('Unexpected end of data');
      bitBuffer |= data[pos++] << bitsInBuffer;
      bitsInBuffer += 8;
    }
    const result = bitBuffer & ((1 << n) - 1);
    bitBuffer >>= n;
    bitsInBuffer -= n;
    return result;
  }

  function readHuffman(lengths: number[], maxBits: number): number {
    const codes: { code: number; length: number; symbol: number }[] = [];
    for (let i = 0; i < lengths.length; i++) {
      if (lengths[i] > 0) {
        codes.push({ code: 0, length: lengths[i], symbol: i });
      }
    }
    codes.sort((a, b) => a.length - b.length || a.symbol - b.symbol);

    let code = 0;
    let len = 0;
    for (const c of codes) {
      while (len < c.length) {
        code <<= 1;
        len++;
      }
      c.code = code;
      code++;
    }

    let value = 0;
    let bitsRead = 0;
    while (bitsRead < maxBits) {
      value = (value << 1) | readBits(1);
      bitsRead++;
      for (const c of codes) {
        if (c.length === bitsRead && c.code === value) {
          return c.symbol;
        }
      }
    }
    throw new Error('Invalid Huffman code');
  }

  const lengthExtra = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const lengthBase = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  const distExtra = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  const distBase = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];

  const order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

  let isFinal = false;
  while (!isFinal) {
    isFinal = readBits(1) === 1;
    const blockType = readBits(2);

    if (blockType === 0) {
      bitsInBuffer = 0;
      bitBuffer = 0;
      const len = data[pos] | (data[pos + 1] << 8);
      pos += 4;
      for (let i = 0; i < len; i++) {
        result[outPos++] = data[pos++];
      }
    } else if (blockType === 1) {
      const litLengths = new Array(288).fill(0);
      for (let i = 0; i < 144; i++) litLengths[i] = 8;
      for (let i = 144; i < 256; i++) litLengths[i] = 9;
      for (let i = 256; i < 280; i++) litLengths[i] = 7;
      for (let i = 280; i < 288; i++) litLengths[i] = 8;
      const distLengths = new Array(30).fill(5);

      while (true) {
        const symbol = readHuffman(litLengths, 15);
        if (symbol < 256) {
          result[outPos++] = symbol;
        } else if (symbol === 256) {
          break;
        } else {
          const lenIdx = symbol - 257;
          const length = lengthBase[lenIdx] + readBits(lengthExtra[lenIdx]);
          const distSymbol = readHuffman(distLengths, 15);
          const dist = distBase[distSymbol] + readBits(distExtra[distSymbol]);
          for (let i = 0; i < length; i++) {
            result[outPos] = result[outPos - dist];
            outPos++;
          }
        }
      }
    } else if (blockType === 2) {
      const hlit = readBits(5) + 257;
      const hdist = readBits(5) + 1;
      const hclen = readBits(4) + 4;

      const clLengths = new Array(19).fill(0);
      for (let i = 0; i < hclen; i++) {
        clLengths[order[i]] = readBits(3);
      }

      const allLengths: number[] = [];
      while (allLengths.length < hlit + hdist) {
        const symbol = readHuffman(clLengths, 7);
        if (symbol < 16) {
          allLengths.push(symbol);
        } else if (symbol === 16) {
          const count = readBits(2) + 3;
          const prev = allLengths[allLengths.length - 1];
          for (let i = 0; i < count; i++) allLengths.push(prev);
        } else if (symbol === 17) {
          const count = readBits(3) + 3;
          for (let i = 0; i < count; i++) allLengths.push(0);
        } else {
          const count = readBits(7) + 11;
          for (let i = 0; i < count; i++) allLengths.push(0);
        }
      }

      const litLengths = allLengths.slice(0, hlit);
      const distLengths = allLengths.slice(hlit);

      while (true) {
        const symbol = readHuffman(litLengths, 15);
        if (symbol < 256) {
          result[outPos++] = symbol;
        } else if (symbol === 256) {
          break;
        } else {
          const lenIdx = symbol - 257;
          const length = lengthBase[lenIdx] + readBits(lengthExtra[lenIdx]);
          const distSymbol = readHuffman(distLengths, 15);
          const dist = distBase[distSymbol] + readBits(distExtra[distSymbol]);
          for (let i = 0; i < length; i++) {
            result[outPos] = result[outPos - dist];
            outPos++;
          }
        }
      }
    } else {
      throw new Error('Invalid block type');
    }
  }

  return result.slice(0, outPos);
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

  return '[Could not extract text from this DOC file. Try converting to DOCX or TXT format.]';
}

async function extractRtfText(file: File): Promise<string> {
  const text = await file.text();
  return text
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\'[0-9a-fA-F]{2}/g, '')
    .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
