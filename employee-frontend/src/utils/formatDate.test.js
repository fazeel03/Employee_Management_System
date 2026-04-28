import { describe, it, expect } from 'vitest';

// Simple utility function to test
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('formatDate', () => {
  it('formats date correctly', () => {
    const result = formatDate('2024-01-15');
    expect(result).toBe('2024-01-15');
  });

  it('handles invalid date', () => {
    const result = formatDate(null);
    expect(result).toBe('');
  });

  it('handles empty string', () => {
    const result = formatDate('');
    expect(result).toBe('');
  });

  it('formats date with time correctly', () => {
    const result = formatDate('2024-01-15T10:30:00');
    expect(result).toBe('2024-01-15');
  });
});
