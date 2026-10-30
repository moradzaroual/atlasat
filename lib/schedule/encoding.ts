const CP1252_SPECIALS: ReadonlyArray<[number, number]> = [
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88], [0x2030, 0x89], [0x0160, 0x8a],
  [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92],
  [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b], [0x0153, 0x9c],
  [0x017e, 0x9e], [0x0178, 0x9f],
];

const CP1252_REVERSE = new Map(CP1252_SPECIALS);

/**
 * Repairs UTF-8 text that was decoded as Windows-1252 somewhere upstream
 * (for example "AlavÃ©s" or "ðŸ“º"). Returns the input unchanged when it is not
 * double-encoded.
 */
export function repairEncoding(value: string): string {
  if (!/[\u0080-\u00ff\u0152-\u0178\u2013-\u2122]/.test(value)) return value;

  const bytes: number[] = [];
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const byte = CP1252_REVERSE.get(code) ?? code;
    if (byte > 0xff) return value;
    bytes.push(byte);
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
  } catch {
    return value;
  }
}
