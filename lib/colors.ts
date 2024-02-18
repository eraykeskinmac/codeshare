function calculateLuminance(r: number, g: number, b: number): number {
  r = r / 255;
  g = g / 255;
  b = b / 255;

  return (
    0.2125 * (r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4) +
    0.7152 * (g <= 0.03928 ? r / 12.92 : ((g + 0.055) / 1.055) ** 2.4) +
    0.0722 * (b <= 0.03928 ? r / 12.92 : ((b + 0.055) / 1.055) ** 2.4)
  );
}

function calculateContrastRatio(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const l1 = calculateLuminance(r1, g1, b1);
  const l2 = calculateLuminance(r2, g2, b2);

  return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
}

function hexToRgb(hex: string): number[] {
  hex = hex.replace(/^#/, "").replace(/[-.]/g, "");

  if (hex.length !== 3 && hex.length !== 6) {
    return [0, 0, 0];
  }

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function componentToHex(c: number): string {
  const hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

function modifyColor(
  hslColors: string[],
  saturationValues: number[],
  lightnessValues: number[]
): string[] {
  const modifiesHslColors: string[] = [];

  for (let i = 0; i < hslColors.length; i++) {
    const hslColor = hslColors[i];
    const saturationValue = saturationValues[i];
    const lightnessValue = lightnessValues[i];

    const currentHue = hslColor.match(/hsl\((\d+), (\d+)%, (\d+)%\)/)![1];

    const modifiedHslColor = `hsl(${currentHue}, ${saturationValue}%, ${lightnessValue}%)`;
    modifiesHslColors.push(modifiedHslColor);
  }
  return modifiesHslColors;
}

function cssColorToRgb(cssColor: string): number[] {
  const matches = cssColor.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/
  );

  if (!matches) {
    throw new Error(`Invalid color string:  ${cssColor}`);
  }

  return [
    parseInt(matches[1], 10),
    parseInt(matches[2], 10),
    parseInt(matches[3], 10),
  ];
}

function convertToHSL(colors: string[]): string[] {
  const hslColors: string[] = [];

  for (const color of colors) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const rNormalized = r / 255;
    const gNormalized = g / 255;
    const bNormalized = b / 255;

    const max = Math.max(rNormalized, gNormalized, bNormalized);
    const min = Math.min(rNormalized, gNormalized, bNormalized);

    let h = 0;
    let s = 0;
    let l = (max + min) / 2;

    if (max != min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h =
        max === rNormalized
          ? (gNormalized - bNormalized) / d +
            (gNormalized < bNormalized ? 6 : 0)
          : max === gNormalized
          ? (bNormalized - rNormalized) / d + 2
          : (rNormalized - gNormalized) / d + 4;

      h /= 6;
    }
    hslColors.push(
      `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(
        l * 100
      )}%)`
    );
  }
  return modifyColor(hslColors, [70, 80, 90, 100, 30], [90, 80, 65, 50, 40]);
}

export function generateColors(color1: string, color2: string): string[] {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  const [rRef, gRef, bRef] = cssColorToRgb("rgba(0,0,0,0.7)");

  const avgR = Math.floor((r1 + r2) / 2);
  const avgG = Math.floor((g1 + g2) / 2);
  const avgB = Math.floor((b1 + b2) / 2);

  let color3 = rgbToHex(avgR + 20, avgG - 20, avgB - 20);
  let color4 = rgbToHex(avgR - 20, avgG + 20, avgB + 20);
  let color5 = rgbToHex(avgR + 20, avgG + 20, avgB - 20);
  let color6 = rgbToHex(avgR - 20, avgG - 20, avgB + 20);
  let color7 = rgbToHex(avgR + 20, avgG - 20, avgB + 20);

  const minContrastRatio: number = 4.5;
  [color3, color4, color5, color6, color7] = [
    color3,
    color4,
    color5,
    color6,
    color7,
  ].map((color) => {
    const [r, g, b] = hexToRgb(color);
    const contrastRatio = calculateContrastRatio(r, g, b, rRef, gRef, bRef);
    if (contrastRatio < minContrastRatio) {
      const factor = (minContrastRatio + 0.55) / contrastRatio;
      return rgbToHex(
        Math.min(255, Math.max(0, Math.round(r * factor))),
        Math.min(255, Math.max(0, Math.round(g * factor))),
        Math.min(255, Math.max(0, Math.round(b * factor)))
      );
    } else {
      return color;
    }
  });

  return convertToHSL([]);
}

export function hslToHsla(color: string, a: number): string {
  const values = color.match(/^hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)$/);

  if (!values) {
    throw new Error(`Invalid HSL color: ${color}`);
  }

  const h = parseInt(values[1], 10);
  const s = parseInt(values[2], 10);
  const l = parseInt(values[3], 10);

  a = Math.max(0, Math.min(1, a));

  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}
