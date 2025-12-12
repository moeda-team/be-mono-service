import { convertValue } from '@/utils/common/convert_uom';

// Simple smoke tests for unit conversion helper

describe('convertValue', () => {
  it('converts metres to centimetres', () => {
    expect(convertValue(1, 'm', 'cm')).toBe(100);
  });

  it('throws a friendly error on invalid conversion', () => {
    expect(() => convertValue(1, 'm', 'invalid' as any)).toThrow(
      'Invalid unit conversion: m to invalid',
    );
  });
});
