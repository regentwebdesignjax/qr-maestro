export function formatPhone(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') return '';

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // Handle various lengths
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    // Handle +1 or 1 prefix for US numbers
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 11) {
    // Non-US 11 digit number
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length > 11) {
    // International number with country code
    return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
  } else if (digits.length > 0) {
    // Partial or non-standard number, return as-is
    return phoneNumber;
  }

  return '';
}
