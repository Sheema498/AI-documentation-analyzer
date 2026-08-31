import type { SentimentResult, SentimentLabel } from '@/types';
import { tokenize, round } from '../textUtils';

const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
  'happy', 'joy', 'love', 'like', 'best', 'better', 'beautiful',
  'brilliant', 'awesome', 'perfect', 'positive', 'success', 'successful',
  'win', 'winning', 'gain', 'benefit', 'beneficial', 'improve', 'improved',
  'improvement', 'progress', 'progress', 'advantage', 'advantageous',
  'delight', 'delightful', 'pleased', 'pleasure', 'enjoy', 'enjoyable',
  'favorable', 'fortunate', 'luck', 'lucky', 'hope', 'hopeful', 'optimistic',
  'enthusiastic', 'excited', 'exciting', 'thrilled', 'grateful', 'thankful',
  'appreciate', 'appreciation', 'admire', 'admirable', 'respect', 'proud',
  'confidence', 'confident', 'strong', 'strength', 'powerful', 'effective',
  'efficient', 'productive', 'creative', 'innovative', 'inspiring',
  'inspired', 'motivated', 'passionate', 'dedicated', 'committed',
  'reliable', 'trustworthy', 'honest', 'sincere', 'genuine', 'authentic',
  'kind', 'generous', 'compassionate', 'caring', 'warm', 'friendly',
  'supportive', 'encouraging', 'helpful', 'thoughtful', 'considerate',
  'smart', 'clever', 'wise', 'intelligent', 'brilliant', 'talented',
  'skilled', 'capable', 'competent', 'expert', 'professional', 'quality',
  'superior', 'premium', 'outstanding', 'remarkable', 'exceptional',
  'extraordinary', 'magnificent', 'splendid', 'glorious', 'victorious',
  'triumphant', 'celebrate', 'celebration', 'achievement', 'accomplish',
  'accomplishment', 'reward', 'rewarding', 'satisfying', 'satisfied',
  'fulfilled', 'content', 'peaceful', 'calm', 'serene', 'harmonious',
  'vibrant', 'energetic', 'dynamic', 'lively', 'flourishing', 'thriving',
  'blossom', 'bloom', 'shine', 'glow', 'radiant', 'luminous', 'bright',
  'sunny', 'clear', 'fresh', 'pure', 'clean', 'pristine', 'immaculate',
  'elegant', 'graceful', 'refined', 'sophisticated', 'charming',
  'captivating', 'mesmerizing', 'breathtaking', 'stunning', 'gorgeous',
  'handsome', 'attractive', 'appealing', 'inviting', 'welcoming',
  'comfortable', 'cozy', 'pleasant', 'lovely', 'adorable', 'precious',
  'valuable', 'invaluable', 'worthy', 'deserving', 'merit', 'commendable',
  'praiseworthy', 'laudable', 'noble', 'honorable', 'virtuous', 'righteous',
  'fair', 'just', 'equitable', 'balanced', 'moderate', 'reasonable',
  'sensible', 'logical', 'rational', 'sound', 'valid', 'legitimate',
  'proper', 'appropriate', 'fitting', 'suitable', 'ideal', 'optimal',
  'optimum', 'peak', 'prime', 'top', 'leading', 'foremost', 'premier',
  'first-rate', 'world-class', 'unparalleled', 'unmatched', 'unsurpassed',
  'supreme', 'ultimate', 'paramount', 'crucial', 'vital', 'essential',
  'indispensable', 'necessary', 'needed', 'wanted', 'desired', 'coveted',
  'sought', 'popular', 'beloved', 'cherished', 'treasured', 'prized',
  'acclaimed', 'celebrated', 'renowned', 'famous', 'distinguished',
  'eminent', 'prominent', 'illustrious', 'notable', 'noteworthy',
  'significant', 'meaningful', 'impactful', 'profound', 'deep', 'rich',
  'abundant', 'plentiful', 'bountiful', 'generous', 'ample', 'sufficient',
  'yes', 'agree', 'agreed', 'support', 'endorse', 'approve', 'approval',
  'recommend', 'recommended', 'favor', 'favorable', 'pro', 'yay',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'horrible', 'awful', 'worst', 'worse', 'wretched',
  'hate', 'hated', 'dislike', 'disgust', 'disgusting', 'gross', 'nasty',
  'ugly', 'hideous', 'repulsive', 'revolting', 'offensive', 'obnoxious',
  'unpleasant', 'displeasing', 'disagreeable', 'troublesome', 'annoying',
  'irritating', 'frustrating', 'aggravating', 'exasperating', 'vexing',
  'bothersome', 'nuisance', 'pest', 'pain', 'painful', 'ache', 'aching',
  'sore', 'hurt', 'hurts', 'injury', 'injured', 'wound', 'wounded',
  'suffer', 'suffering', 'agony', 'anguish', 'torment', 'torture',
  'miserable', 'depressed', 'depression', 'sad', 'sorrow', 'sorrowful',
  'grief', 'grieving', 'mourn', 'mourning', 'lament', 'weep', 'crying',
  'tears', 'despair', 'hopeless', 'helpless', 'powerless', 'weak',
  'weakness', 'feeble', 'fragile', 'brittle', 'broken', 'shattered',
  'destroyed', 'destruction', 'ruin', 'ruined', 'wrecked', 'damaged',
  'harm', 'harmful', 'damage', 'dangerous', 'perilous', 'hazardous',
  'risky', 'unsafe', 'threat', 'threatening', 'menace', 'menacing',
  'fear', 'fearful', 'afraid', 'scared', 'terrified', 'frightened',
  'panic', 'anxiety', 'anxious', 'nervous', 'worried', 'dread', 'dreadful',
  'alarm', 'alarmed', 'distress', 'distressed', 'trouble', 'troubled',
  'problem', 'problematic', 'difficulty', 'difficult', 'hard', 'tough',
  'challenging', 'demanding', 'exhausting', 'tiring', 'fatigue',
  'exhausted', 'drained', 'depleted', 'empty', 'void', 'hollow',
  'lonely', 'loneliness', 'isolated', 'abandoned', 'rejected', 'excluded',
  'unwanted', 'unloved', 'unappreciated', 'ignored', 'neglected',
  'forgotten', 'lost', 'losing', 'loss', 'defeat', 'defeated', 'fail',
  'failure', 'failed', 'failing', 'unsuccessful', 'ineffective',
  'useless', 'worthless', 'pointless', 'meaningless', 'futile', 'vain',
  'hopeless', 'desperate', 'crisis', 'disaster', 'catastrophe',
  'tragedy', 'tragic', 'catastrophic', 'calamity', 'misfortune',
  'unlucky', 'unfortunate', 'regret', 'regretful', 'remorse', 'guilt',
  'guilty', 'ashamed', 'shame', 'shameful', 'embarrassed', 'embarrassing',
  'humiliated', 'humiliating', 'insulted', 'insulting', 'offended',
  'disrespected', 'mocked', 'ridiculed', 'scorned', 'despised',
  'disgraced', 'dishonored', 'discredited', 'defamed', 'slandered',
  'accused', 'blamed', 'condemned', 'criticized', 'condemned',
  'rejected', 'denied', 'refused', 'forbidden', 'prohibited', 'banned',
  'blocked', 'stopped', 'hindered', 'obstructed', 'impeded', 'delayed',
  'late', 'tardy', 'overdue', 'expired', 'obsolete', 'outdated',
  'stale', 'rotten', 'spoiled', 'corrupted', 'corrupt', 'tainted',
  'polluted', 'contaminated', 'infected', 'diseased', 'sick', 'ill',
  'unwell', 'fever', 'cough', 'virus', 'bacteria', 'plague', 'epidemic',
  'pandemic', 'outbreak', 'contagion', 'toxic', 'poison', 'poisonous',
  'venom', 'venomous', 'fatal', 'lethal', 'deadly', 'mortal', 'death',
  'dead', 'dying', 'kill', 'killed', 'killing', 'murder', 'murdered',
  'violence', 'violent', 'brutal', 'brutality', 'savage', 'ferocious',
  'fierce', 'hostile', 'aggressive', 'angry', 'anger', 'rage', 'furious',
  'enraged', 'wrath', 'wrathful', 'indignant', 'outraged', 'resentful',
  'bitter', 'hostile', 'spiteful', 'vindictive', 'malicious', 'cruel',
  'cruelty', 'evil', 'wicked', 'sinister', 'villainous', 'diabolical',
  'demonic', 'monstrous', 'beastly', 'inhuman', 'heartless', 'ruthless',
  'merciless', 'unforgiving', 'stingy', 'greedy', 'selfish', 'narcissistic',
  'arrogant', 'conceited', 'vain', 'pompous', 'pretentious', 'snobbish',
  'elitist', 'supremacist', 'discriminatory', 'prejudiced', 'biased',
  'unfair', 'unjust', 'inequitable', 'corrupt', 'fraud', 'fraudulent',
  'scam', 'cheat', 'cheated', 'deceive', 'deceived', 'deception',
  'lie', 'liar', 'false', 'fake', 'phony', 'sham', 'hoax', 'trick',
  'tricked', 'manipulated', 'manipulative', 'exploited', 'exploitative',
  'oppressed', 'oppression', 'tyranny', 'tyrant', 'dictator', 'dictatorial',
  'authoritarian', 'totalitarian', 'suppressive', 'repressive', 'censored',
  'silenced', 'muzzled', 'gagged', 'trapped', 'stuck', 'confined',
  'imprisoned', 'jailed', 'captive', 'hostage', 'slave', 'enslaved',
  'poor', 'poverty', 'destitute', 'needy', 'beggar', 'homeless',
  'starving', 'hungry', 'malnourished', 'famine', 'drought', 'flood',
  'earthquake', 'hurricane', 'tornado', 'tsunami', 'avalanche',
  'landslide', 'wildfire', 'eruption', 'collapse', 'crash', 'collision',
  'wreck', 'debris', 'rubble', 'wasteland', 'desert', 'barren',
  'infertile', 'sterile', 'lifeless', 'dull', 'boring', 'tedious',
  'monotonous', 'repetitive', 'mundane', 'ordinary', 'mediocre',
  'average', 'subpar', 'inferior', 'second-rate', 'low-quality',
  'shoddy', 'flimsy', 'defective', 'faulty', 'flawed', 'imperfect',
  'blemished', 'tainted', 'suspect', 'questionable', 'dubious',
  'suspicious', 'no', 'not', 'never', 'none', 'nothing', 'nobody',
  'nowhere', 'neither', 'nor', 'cannot', 'won\'t', 'don\'t', 'doesn\'t',
  'didn\'t', 'isn\'t', 'wasn\'t', 'aren\'t', 'weren\'t', 'haven\'t',
  'hasn\'t', 'hadn\'t', 'shouldn\'t', 'wouldn\'t', 'couldn\'t',
  'disagree', 'oppose', 'opposed', 'against', 'anti', 'reject',
  'denial', 'refusal', 'veto', 'block', 'ban', 'nay',
]);

const NEGATORS = new Set([
  'not', 'no', 'never', 'none', 'nobody', 'nothing', 'nowhere',
  'neither', 'nor', 'cannot', "don't", "doesn't", "didn't", "isn't",
  "wasn't", "aren't", "weren't", "haven't", "hasn't", "hadn't",
  "shouldn't", "wouldn't", "couldn't", "hardly", "scarcely", "barely",
]);

const INTENSIFIERS = new Set([
  'very', 'extremely', 'really', 'so', 'too', 'quite', 'incredibly',
  'remarkably', 'exceptionally', 'particularly', 'especially',
  'absolutely', 'completely', 'totally', 'utterly', 'thoroughly',
]);

export function analyzeSentiment(text: string): SentimentResult {
  const words = tokenize(text);
  let positiveScore = 0;
  let negativeScore = 0;
  const positiveWords: string[] = [];
  const negativeWords: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = i > 0 ? words[i - 1] : '';
    const prevPrevWord = i > 1 ? words[i - 2] : '';

    let multiplier = 1;
    if (NEGATORS.has(prevWord)) multiplier = -1;
    if (INTENSIFIERS.has(prevWord)) multiplier *= 1.5;
    if (INTENSIFIERS.has(prevPrevWord) && NEGATORS.has(prevWord)) multiplier = -1.5;

    if (POSITIVE_WORDS.has(word)) {
      const score = 1 * multiplier;
      if (score > 0) {
        positiveScore += score;
        positiveWords.push(word);
      } else {
        negativeScore += Math.abs(score);
        negativeWords.push(word);
      }
    } else if (NEGATIVE_WORDS.has(word)) {
      const score = 1 * multiplier;
      if (score > 0) {
        negativeScore += score;
        negativeWords.push(word);
      } else {
        positiveScore += Math.abs(score);
        positiveWords.push(word);
      }
    }
  }

  const totalSentimentWords = positiveScore + negativeScore;
  const score = totalSentimentWords > 0
    ? round((positiveScore - negativeScore) / totalSentimentWords, 3)
    : 0;

  let label: SentimentLabel;
  if (score > 0.15) label = 'positive';
  else if (score < -0.15) label = 'negative';
  else label = 'neutral';

  const confidence = totalSentimentWords > 0
    ? round(Math.min(Math.abs(score) + 0.3, 1), 2)
    : 0.5;

  return {
    label,
    score,
    positiveWords,
    negativeWords,
    positiveCount: positiveWords.length,
    negativeCount: negativeWords.length,
    confidence,
  };
}
