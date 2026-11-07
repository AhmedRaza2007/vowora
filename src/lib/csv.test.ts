import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from './csv';

describe('parseCsv', () => {
  it('parses simple comma-separated rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles CRLF line endings and a trailing newline', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('keeps commas and newlines inside quoted fields', () => {
    expect(parseCsv('name,notes\n"Doe, John","line1\nline2"')).toEqual([
      ['name', 'notes'],
      ['Doe, John', 'line1\nline2'],
    ]);
  });

  it('unescapes doubled quotes', () => {
    expect(parseCsv('a\n"He said ""hi"""')).toEqual([['a'], ['He said "hi"']]);
  });

  it('drops blank lines but preserves empty cells', () => {
    expect(parseCsv('a,b\n\n1,\n,2')).toEqual([
      ['a', 'b'],
      ['1', ''],
      ['', '2'],
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('\n\n')).toEqual([]);
  });
});

describe('toCsv', () => {
  it('joins cells with commas and rows with CRLF', () => {
    expect(toCsv([['a', 'b'], [1, 2]])).toBe('a,b\r\n1,2');
  });

  it('quotes cells containing commas, quotes or newlines', () => {
    expect(toCsv([['Doe, John', 'He said "hi"', 'line1\nline2']])).toBe(
      '"Doe, John","He said ""hi""","line1\nline2"',
    );
  });

  it('renders null and undefined as empty cells', () => {
    expect(toCsv([[null, undefined, 'x']])).toBe(',,x');
  });

  it('round-trips through parseCsv', () => {
    const rows = [
      ['name', 'email', 'notes'],
      ['Aisha', 'a@example.com', 'VIP, table 1'],
      ['Omar', 'o@example.com', 'He said "yes"'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});