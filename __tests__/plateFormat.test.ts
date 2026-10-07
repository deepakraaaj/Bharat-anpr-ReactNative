import {formatPlate, isValidPlate, plateCandidates} from '../src/plateFormat';

test('accepts standard and BH-series plates', () => {
  expect(isValidPlate('MH12AB1234')).toBe(true);
  expect(isValidPlate('22BH1234AA')).toBe(true);
  expect(isValidPlate('XX12AB1234')).toBe(false);
});

test('extracts plates from noisy OCR text', () => {
  expect(plateCandidates('IND tn 09 bx 4521')).toContain('TN09BX4521');
  expect(plateCandidates('hello world')).toEqual([]);
});

test('corrects letter/digit confusions by position', () => {
  expect(plateCandidates('KAG5 KC 5877')).toEqual(expect.arrayContaining(['KA05KC5877', 'KA65KC5877']));
  expect(plateCandidates('MH I2 AB I234')).toContain('MH12AB1234');
});

test('formats plates with printed spacing', () => {
  expect(formatPlate('KA05KC5877')).toBe('KA 05 KC 5877');
  expect(formatPlate('22BH1234AA')).toBe('22 BH 1234 AA');
});
