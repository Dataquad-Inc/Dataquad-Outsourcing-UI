const countryCodes = [
  { code: "+91", label: "IND", maxLength: 10, format: [4, 3, 3] },
  { code: "+1", label: "USA", maxLength: 10, format: [3, 3, 4] },
  { code: "+86", label: "CHN", maxLength: 11, format: [3, 4, 4] },
  { code: "+62", label: "IDN", maxLength: 10, format: [4, 3, 3] },
  { code: "+55", label: "BRA", maxLength: 11, format: [2, 5, 4] },
  { code: "+92", label: "PAK", maxLength: 10, format: [3, 3, 4] },
  { code: "+880", label: "BGD", maxLength: 10, format: [3, 3, 4] },
  { code: "+234", label: "NGA", maxLength: 10, format: [3, 3, 4] },
  { code: "+44", label: "UK", maxLength: 10, format: [5, 3, 2] },
  { code: "+81", label: "JPN", maxLength: 10, format: [3, 3, 4] },
];

/**
 * Formats a phone number based on the defined countryCodes
 * @param {string} input - Raw input like +919999999999 or 919999999999
 * @returns {string} Formatted number or original if invalid
 */
export default function formatPhoneNumber(input) {
  // Remove all non-digit and '+' chars
  const cleaned = input.replace(/[^\d+]/g, '');

  // Try to match country code from longest to shortest
  const matched = countryCodes
    .sort((a, b) => b.code.length - a.code.length)
    .find(({ code }) => cleaned.startsWith(code.replace('+', '')) || cleaned.startsWith(code));

  if (!matched) return input;

  const code = matched.code;
  const codeDigits = code.replace('+', '');
  let rest = cleaned.replace(/^(\+)?/, '');

  if (rest.startsWith(codeDigits)) {
    rest = rest.slice(codeDigits.length);
  }

  // Handle leading 0 (e.g., 09999999999)
  if (rest.startsWith('0') && rest.length > matched.maxLength) {
    rest = rest.slice(1);
  }

  // Ensure correct local number length
  if (rest.length !== matched.maxLength) return input;

  const [a, b, c] = matched.format;
  const formatted =
    rest.slice(0, a) +
    ' ' +
    rest.slice(a, a + b) +
    ' ' +
    rest.slice(a + b, a + b + c);

  return `${code} ${formatted}`;
}
