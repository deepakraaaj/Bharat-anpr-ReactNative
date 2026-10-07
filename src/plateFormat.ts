const stateCodes = new Set([
  'AN', 'AP', 'AR', 'AS', 'BR', 'CG', 'CH', 'DD', 'DL', 'DN', 'GA', 'GJ', 'HP', 'HR', 'JH', 'JK',
  'KA', 'KL', 'LA', 'LD', 'MH', 'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'OR', 'PB', 'PY', 'RJ', 'SK',
  'TN', 'TR', 'TS', 'TG', 'UK', 'UP', 'WB',
]);
const standard = /^([A-Z]{2})([0-9]{1,2})([A-Z]{1,3})([0-9]{4})$/;
const bharat = /^[0-9]{2}BH[0-9]{4}[A-Z]{2}$/;

export const normalize = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const isValidPlate = (value: string) => {
  if (bharat.test(value)) return true;
  const match = standard.exec(value);
  return match !== null && stateCodes.has(match[1]);
};

// Position-based OCR fixes, matching the Kotlin app's OcrErrorCorrector. 'G' is read for both 6 and
// the narrow 0 used on many plates, so both readings are offered and the user picks one.
const toDigit: Record<string, string[]> = {O: ['0'], Q: ['0'], U: ['0'], D: ['0'], I: ['1'], L: ['4'], Z: ['2'], S: ['5'], G: ['0', '6'], B: ['8']};
const toLetter: Record<string, string> = {'0': 'O', '1': 'I', '2': 'Z', '5': 'S', '6': 'G', '8': 'B'};

/** Expands a pattern of D (digit) / A (letter) slots into every corrected reading of value. */
function applyPattern(value: string, pattern: string): string[] {
  let results = [''];
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    const options = pattern[i] === 'D' ? toDigit[c] ?? [c] : [toLetter[c] ?? c];
    results = results.flatMap(prefix => options.map(option => prefix + option));
  }
  return results;
}

export function corrections(value: string): string[] {
  if (value.length === 10 && value.slice(2, 4) === 'BH') return applyPattern(value, 'DDAADDDDAA');
  if (value.length < 9 || value.length > 11) return [value];
  return applyPattern(value, 'AADD' + 'A'.repeat(value.length - 8) + 'DDDD');
}

/** Every valid Indian plate found in raw OCR text, including 9–11 character substrings. */
export function plateCandidates(raw: string): string[] {
  const text = normalize(raw);
  const values = [text];
  for (let length = 11; length >= 9; length--) {
    for (let start = 0; start + length <= text.length; start++) values.push(text.slice(start, start + length));
  }
  return [...new Set(values.flatMap(value => [value, ...corrections(value)]))].filter(isValidPlate);
}

/** Spaces a validated plate the way it is printed: "KA 05 KC 5877", "22 BH 1234 AA". */
export function formatPlate(value: string): string {
  const bh = /^([0-9]{2})(BH)([0-9]{4})([A-Z]{2})$/.exec(value);
  const match = bh ?? standard.exec(value);
  return match ? match.slice(1).join(' ') : value;
}
