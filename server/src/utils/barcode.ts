import { ApiError } from './ApiError';
import logger from './logger';
// Note: For barcode generation, we need a library. We'll use 'bwip-js' or 'jsbarcode'.
// Since we don't have it installed, we'll implement using a simple approach.
// For production, we should install 'bwip-js' or '@barcode-bakery/barcode'.
// We'll use a lightweight library that can generate barcodes as SVG or PNG.
// Since we don't have a library installed, we'll generate a simple barcode representation.
// But to keep it production-ready, we'll use a library that is commonly used.
// We'll assume we have installed 'bwip-js'. We'll implement using that.
// For now, we'll create a placeholder that actually works with bwip-js.
// We'll import bwip-js, but we need to add it to package.json. We'll include it in the package.json later.
// Since we are generating all files, we'll add the dependency to package.json.
// But for now, we'll write the code with the assumption that it's installed.

import bwipjs from 'bwip-js';

export interface BarcodeOptions {
  height?: number;
  width?: number;
  text?: string;
  scale?: number;
  includetext?: boolean;
  textxalign?: 'center' | 'left' | 'right';
}

export const generateBarcode = async (
  data: string,
  type: 'code128' | 'code39' | 'ean13' | 'upc' | 'itf' = 'code128',
  options: BarcodeOptions = {}
): Promise<string> => {
  try {
    const defaultOptions: BarcodeOptions = {
      height: 50,
      width: 200,
      scale: 2,
      includetext: true,
      textxalign: 'center',
      ...options,
    };

    // Generate barcode as PNG buffer
    const buffer = await bwipjs.toBuffer({
      bcid: type,
      text: data,
      height: defaultOptions.height || 50,
      width: defaultOptions.width || 200,
      scale: defaultOptions.scale || 2,
      includetext: defaultOptions.includetext !== false,
      textxalign: defaultOptions.textxalign || 'center',
    });

    // Convert buffer to base64 data URL
    const base64 = buffer.toString('base64');
    const dataURL = `data:image/png;base64,${base64}`;

    return dataURL;
  } catch (error) {
    logger.error('Barcode generation failed:', error);
    // Fallback: generate a simple text-based barcode (not real barcode but for demo)
    // In production, this should throw. But we'll return a placeholder.
    // Actually we should throw.
    throw new ApiError(500, 'Failed to generate barcode');
  }
};

export const generateBarcodeAsBuffer = async (
  data: string,
  type: 'code128' | 'code39' | 'ean13' | 'upc' | 'itf' = 'code128',
  options: BarcodeOptions = {}
): Promise<Buffer> => {
  try {
    const defaultOptions: BarcodeOptions = {
      height: 50,
      width: 200,
      scale: 2,
      includetext: true,
      textxalign: 'center',
      ...options,
    };

    const buffer = await bwipjs.toBuffer({
      bcid: type,
      text: data,
      height: defaultOptions.height || 50,
      width: defaultOptions.width || 200,
      scale: defaultOptions.scale || 2,
      includetext: defaultOptions.includetext !== false,
      textxalign: defaultOptions.textxalign || 'center',
    });

    return buffer;
  } catch (error) {
    logger.error('Barcode buffer generation failed:', error);
    throw new ApiError(500, 'Failed to generate barcode buffer');
  }
};

export const generateBarcodeAsSVG = async (
  data: string,
  type: 'code128' | 'code39' | 'ean13' | 'upc' | 'itf' = 'code128',
  options: BarcodeOptions = {}
): Promise<string> => {
  try {
    const defaultOptions: BarcodeOptions = {
      height: 50,
      width: 200,
      scale: 2,
      includetext: true,
      textxalign: 'center',
      ...options,
    };

    // bwip-js doesn't directly support SVG output, but we can use a different library or convert.
    // For simplicity, we'll use a text-based SVG representation (not real barcode).
    // For production, we can use 'jsbarcode' which supports SVG.
    // We'll implement a simple SVG generator for now.
    // Since we don't want to add another dependency, we'll generate a fake SVG.
    // This is a placeholder. In a real implementation, we'd use a proper library.
    // We'll just throw an error and implement proper SVG generation later.
    // For now, we'll generate a basic SVG with a barcode-like pattern.
    // But we'll use the buffer and convert to SVG? That's complicated.
    // Let's use 'jsbarcode' which generates SVG directly. We'll assume we have it installed.
    // We'll include it in package.json later.
    // For now, we'll just use bwip-js and convert to base64 and embed in SVG.
    // Not ideal but works for demo.
    const buffer = await generateBarcodeAsBuffer(data, type, options);
    const base64 = buffer.toString('base64');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${options.width || 200}" height="${options.height || 50}">
      <image href="data:image/png;base64,${base64}" width="100%" height="100%" />
    </svg>`;
    return svg;
  } catch (error) {
    logger.error('Barcode SVG generation failed:', error);
    throw new ApiError(500, 'Failed to generate barcode SVG');
  }
};

export default {
  generateBarcode,
  generateBarcodeAsBuffer,
  generateBarcodeAsSVG,
};