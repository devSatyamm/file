export interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  factor: number; // Factor to base unit (e.g., meters for length)
  offset?: number; // For temperature (e.g. Celsius to Kelvin)
}

export interface UnitCategory {
  id: string;
  name: string;
  baseUnit: string;
  units: UnitDefinition[];
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    name: 'Length',
    baseUnit: 'm',
    units: [
      { id: 'm', name: 'Meter', symbol: 'm', factor: 1 },
      { id: 'km', name: 'Kilometer', symbol: 'km', factor: 1000 },
      { id: 'cm', name: 'Centimeter', symbol: 'cm', factor: 0.01 },
      { id: 'mm', name: 'Millimeter', symbol: 'mm', factor: 0.001 },
      { id: 'mi', name: 'Mile', symbol: 'mi', factor: 1609.344 },
      { id: 'yd', name: 'Yard', symbol: 'yd', factor: 0.9144 },
      { id: 'ft', name: 'Foot', symbol: 'ft', factor: 0.3048 },
      { id: 'in', name: 'Inch', symbol: 'in', factor: 0.0254 },
      { id: 'nmi', name: 'Nautical Mile', symbol: 'NM', factor: 1852 },
    ],
  },
  {
    id: 'weight',
    name: 'Weight / Mass',
    baseUnit: 'kg',
    units: [
      { id: 'kg', name: 'Kilogram', symbol: 'kg', factor: 1 },
      { id: 'g', name: 'Gram', symbol: 'g', factor: 0.001 },
      { id: 'mg', name: 'Milligram', symbol: 'mg', factor: 0.000001 },
      { id: 'lb', name: 'Pound', symbol: 'lb', factor: 0.45359237 },
      { id: 'oz', name: 'Ounce', symbol: 'oz', factor: 0.028349523125 },
      { id: 'st', name: 'Stone', symbol: 'st', factor: 6.35029318 },
      { id: 't', name: 'Metric Ton', symbol: 't', factor: 1000 },
      { id: 'ton_us', name: 'Short Ton (US)', symbol: 'ton', factor: 907.18474 },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    baseUnit: 'c',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', factor: 1 },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', factor: 1 },
      { id: 'k', name: 'Kelvin', symbol: 'K', factor: 1 },
    ],
  },
  {
    id: 'data',
    name: 'Data Storage',
    baseUnit: 'b',
    units: [
      { id: 'b', name: 'Byte', symbol: 'B', factor: 1 },
      { id: 'kb', name: 'Kilobyte (KB)', symbol: 'KB', factor: 1000 },
      { id: 'mb', name: 'Megabyte (MB)', symbol: 'MB', factor: 1000000 },
      { id: 'gb', name: 'Gigabyte (GB)', symbol: 'GB', factor: 1000000000 },
      { id: 'tb', name: 'Terabyte (TB)', symbol: 'TB', factor: 1000000000000 },
      { id: 'pb', name: 'Petabyte (PB)', symbol: 'PB', factor: 1000000000000000 },
      { id: 'kib', name: 'Kibibyte (KiB)', symbol: 'KiB', factor: 1024 },
      { id: 'mib', name: 'Mebibyte (MiB)', symbol: 'MiB', factor: 1048576 },
      { id: 'gib', name: 'Gibibyte (GiB)', symbol: 'GiB', factor: 1073741824 },
      { id: 'tib', name: 'Tebibyte (TiB)', symbol: 'TiB', factor: 1099511627776 },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    baseUnit: 'sq_m',
    units: [
      { id: 'sq_m', name: 'Square Meter', symbol: 'm²', factor: 1 },
      { id: 'sq_km', name: 'Square Kilometer', symbol: 'km²', factor: 1000000 },
      { id: 'sq_ft', name: 'Square Foot', symbol: 'ft²', factor: 0.09290304 },
      { id: 'sq_yd', name: 'Square Yard', symbol: 'yd²', factor: 0.83612736 },
      { id: 'sq_mi', name: 'Square Mile', symbol: 'mi²', factor: 2589988.110336 },
      { id: 'ha', name: 'Hectare', symbol: 'ha', factor: 10000 },
      { id: 'ac', name: 'Acre', symbol: 'ac', factor: 4046.8564224 },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    baseUnit: 'l',
    units: [
      { id: 'l', name: 'Liter', symbol: 'L', factor: 1 },
      { id: 'ml', name: 'Milliliter', symbol: 'mL', factor: 0.001 },
      { id: 'cu_m', name: 'Cubic Meter', symbol: 'm³', factor: 1000 },
      { id: 'gal_us', name: 'Gallon (US)', symbol: 'gal', factor: 3.785411784 },
      { id: 'qt_us', name: 'Quart (US)', symbol: 'qt', factor: 0.946352946 },
      { id: 'pt_us', name: 'Pint (US)', symbol: 'pt', factor: 0.473176473 },
      { id: 'cup_us', name: 'Cup (US)', symbol: 'cup', factor: 0.2365882365 },
      { id: 'fl_oz', name: 'Fluid Ounce (US)', symbol: 'fl oz', factor: 0.0295735295625 },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    baseUnit: 'mps',
    units: [
      { id: 'mps', name: 'Meters per Second', symbol: 'm/s', factor: 1 },
      { id: 'kph', name: 'Kilometers per Hour', symbol: 'km/h', factor: 0.2777777777777778 },
      { id: 'mph', name: 'Miles per Hour', symbol: 'mph', factor: 0.44704 },
      { id: 'knot', name: 'Knot', symbol: 'kn', factor: 0.5144444444444445 },
      { id: 'mach', name: 'Mach (at sea level)', symbol: 'Ma', factor: 340.29 },
    ],
  },
  {
    id: 'time',
    name: 'Time',
    baseUnit: 's',
    units: [
      { id: 'ms', name: 'Millisecond', symbol: 'ms', factor: 0.001 },
      { id: 's', name: 'Second', symbol: 's', factor: 1 },
      { id: 'min', name: 'Minute', symbol: 'min', factor: 60 },
      { id: 'h', name: 'Hour', symbol: 'h', factor: 3600 },
      { id: 'd', name: 'Day', symbol: 'd', factor: 86400 },
      { id: 'wk', name: 'Week', symbol: 'wk', factor: 604800 },
      { id: 'mo', name: 'Month (30 days)', symbol: 'mo', factor: 2592000 },
      { id: 'yr', name: 'Year (365 days)', symbol: 'yr', factor: 31536000 },
    ],
  },
  {
    id: 'pressure',
    name: 'Pressure',
    baseUnit: 'pa',
    units: [
      { id: 'pa', name: 'Pascal', symbol: 'Pa', factor: 1 },
      { id: 'kpa', name: 'Kilopascal', symbol: 'kPa', factor: 1000 },
      { id: 'bar', name: 'Bar', symbol: 'bar', factor: 100000 },
      { id: 'psi', name: 'Pounds per Sq Inch', symbol: 'psi', factor: 6894.75729 },
      { id: 'atm', name: 'Standard Atmosphere', symbol: 'atm', factor: 101325 },
      { id: 'mmhg', name: 'Millimeter of Mercury', symbol: 'mmHg', factor: 133.322387415 },
    ],
  },
  {
    id: 'energy',
    name: 'Energy',
    baseUnit: 'j',
    units: [
      { id: 'j', name: 'Joule', symbol: 'J', factor: 1 },
      { id: 'kj', name: 'Kilojoule', symbol: 'kJ', factor: 1000 },
      { id: 'cal', name: 'Calorie', symbol: 'cal', factor: 4.184 },
      { id: 'kcal', name: 'Kilocalorie (Food cal)', symbol: 'kcal', factor: 4184 },
      { id: 'wh', name: 'Watt-hour', symbol: 'Wh', factor: 3600 },
      { id: 'kwh', name: 'Kilowatt-hour', symbol: 'kWh', factor: 3600000 },
      { id: 'btu', name: 'British Thermal Unit', symbol: 'BTU', factor: 1055.06 },
    ],
  },
];

export class UnitConverterService {
  public static convert(
    value: number,
    fromUnitId: string,
    toUnitId: string,
    categoryId: string
  ): number {
    if (isNaN(value)) return 0;
    if (fromUnitId === toUnitId) return value;

    const cat = UNIT_CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return value;

    // Special case: Temperature
    if (categoryId === 'temperature') {
      let celsius = value;
      if (fromUnitId === 'f') {
        celsius = ((value - 32) * 5) / 9;
      } else if (fromUnitId === 'k') {
        celsius = value - 273.15;
      }

      if (toUnitId === 'c') return celsius;
      if (toUnitId === 'f') return (celsius * 9) / 5 + 32;
      if (toUnitId === 'k') return celsius + 273.15;
      return celsius;
    }

    const fromUnit = cat.units.find((u) => u.id === fromUnitId);
    const toUnit = cat.units.find((u) => u.id === toUnitId);

    if (!fromUnit || !toUnit) return value;

    // Convert to base unit, then to target unit
    const baseValue = value * fromUnit.factor;
    return baseValue / toUnit.factor;
  }
}

