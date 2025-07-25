import convert, { Unit } from 'convert-units';

export function convertValue(value: number, from: Unit, to: Unit): number {
  try {
    return convert(value).from(from).to(to);
  } catch (error) {
    throw new Error(`Invalid unit conversion: ${from} to ${to}`);
  }
}
