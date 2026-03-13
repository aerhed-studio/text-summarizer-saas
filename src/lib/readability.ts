export function fleschKincaid(text: string): { score: number; label: string } {
  // Handle edge cases
  if (!text || text.trim() === "") {
    return { score: 0, label: "Very Confusing" };
  }

  // Split into sentences (periods, exclamation marks, question marks)
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length === 0) {
    return { score: 0, label: "Very Confusing" };
  }

  // Split into words
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) {
    return { score: 0, label: "Very Confusing" };
  }

  // Count syllables
  let syllableCount = 0;
  const vowels = /[aeiouy]/i;

  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();

    if (cleanWord.length === 0) continue;

    let syllables = 0;
    let prevWasVowel = false;

    for (let i = 0; i < cleanWord.length; i++) {
      const isVowel = vowels.test(cleanWord[i]);

      if (isVowel && !prevWasVowel) {
        syllables++;
      }

      prevWasVowel = isVowel;
    }

    // Handle silent 'e'
    if (cleanWord.endsWith('e') && syllables > 1) {
      syllables--;
    }

    // Every word has at least one syllable
    syllableCount += Math.max(1, syllables);
  }

  // Calculate Flesch-Kincaid score
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllableCount / words.length;

  let score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  // Clamp score to 0-100 range
  score = Math.max(0, Math.min(100, score));

  // Determine label
  let label = "Very Confusing";
  if (score >= 90) label = "Very Easy";
  else if (score >= 80) label = "Easy";
  else if (score >= 70) label = "Fairly Easy";
  else if (score >= 60) label = "Standard";
  else if (score >= 50) label = "Fairly Difficult";
  else if (score >= 30) label = "Difficult";
  else label = "Very Confusing";

  return { score, label };
}
