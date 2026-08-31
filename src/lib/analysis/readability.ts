import type { ReadabilityResult } from '@/types';
import { tokenize, splitSentences, countSyllables, countComplexWords, round } from '../textUtils';

export function computeReadability(text: string): ReadabilityResult {
  const words = tokenize(text);
  const sentences = splitSentences(text);
  const wordCount = Math.max(words.length, 1);
  const sentenceCount = Math.max(sentences.length, 1);
  const charCount = text.replace(/\s/g, '').length;

  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const complexWordCount = countComplexWords(text);

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / wordCount;
  const charsPerWord = charCount / wordCount;

  const fleschReadingEase = round(
    206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord,
  1,
  );
  const fleschKincaidGrade = round(
    0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59,
    1,
  );
  const gunningFog = round(
    0.4 * (wordsPerSentence + (complexWordCount / wordCount) * 100),
    1,
  );
  const smogIndex = round(
    1.043 * Math.sqrt(complexWordCount * (30 / sentenceCount)) + 3.1291,
    1,
  );
  const automatedReadabilityIndex = round(
    4.71 * charsPerWord + 0.5 * wordsPerSentence - 21.43,
    1,
  );
  const colemanLiauIndex = round(
    0.0588 * (charsPerWord * 100) - 0.296 * (sentenceCount / wordCount * 100) - 15.8,
    1,
  );

  const avgGrade = round(
    (fleschKincaidGrade + gunningFog + smogIndex + automatedReadabilityIndex + colemanLiauIndex) / 5,
    1,
  );

  const { gradeLevel, label, description } = interpretGrade(avgGrade, fleschReadingEase);

  return {
    fleschReadingEase,
    fleschKincaidGrade,
    gunningFog,
    smogIndex,
    automatedReadabilityIndex,
    colemanLiauIndex,
    gradeLevel,
    readabilityLabel: label,
    readabilityDescription: description,
  };
}

function interpretGrade(grade: number, flesch: number): {
  gradeLevel: string;
  label: string;
  description: string;
} {
  let gradeLevel: string;
  if (grade < 1) gradeLevel = 'Kindergarten';
  else if (grade < 6) gradeLevel = `Grade ${Math.ceil(grade)}`;
  else if (grade < 9) gradeLevel = 'Middle School';
  else if (grade < 13) gradeLevel = 'High School';
  else if (grade < 16) gradeLevel = 'College';
  else gradeLevel = 'Graduate';

  let label: string;
  let description: string;

  if (flesch >= 90) {
    label = 'Very Easy';
    description = 'Easily understood by an average 11-year-old student.';
  } else if (flesch >= 80) {
    label = 'Easy';
    description = 'Conversational English for consumers.';
  } else if (flesch >= 70) {
    label = 'Fairly Easy';
    description = 'Fairly easy to read, suitable for general audiences.';
  } else if (flesch >= 60) {
    label = 'Standard';
    description = 'Plain English, understood by 13- to 15-year-old students.';
  } else if (flesch >= 50) {
    label = 'Fairly Difficult';
    description = 'Fairly difficult to read, suitable for high school students.';
  } else if (flesch >= 30) {
    label = 'Difficult';
    description = 'Difficult to read, best for college students.';
  } else {
    label = 'Very Difficult';
    description = 'Very difficult to read, best for university graduates.';
  }

  return { gradeLevel, label, description };
}
