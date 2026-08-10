import { ApiError } from './ApiError';
import logger from './logger';

// Note: This uses bwip-js for barcode generation.
// Install with: npm install bwip-js --save

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
    const opts: BarcodeOptions = {
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
      height: opts.height || 50,
      width: opts.width || 200,
      scale: opts.scale || 2,
      includetext: opts.includetext !== false,
      textxalign: opts.textxalign || 'center',
    });

    const base64 = buffer.toString('base64');
    const dataURL = `data:image/png;base64,${base64}`;
    return dataURL;
  } catch (error) {
    logger.error('Barcode generation failed:', error);
    throw new ApiError(500, 'Failed to generate barcode');
  }
};

export const generateBarcodeAsBuffer = async (
  data: string,
  type: 'code128' | 'code39' | 'ean13' | 'upc' | 'itf' = 'code128',
  options: BarcodeOptions = {}
): Promise<Buffer> => {
  try {
    const opts: BarcodeOptions = {
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
      height: opts.height || 50,
      width: opts.width || 200,
      scale: opts.scale || 2,
      includetext: opts.includetext !== false,
      textxalign: opts.textxalign || 'center',
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
    // bwip-js doesn't support SVG natively, so we generate PNG and embed in SVG
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