import QRCode from 'qrcode';
import { ApiError } from './ApiError';
import logger from './logger';

export const generateQRCode = async (data: string, options?: QRCode.QRCodeToDataURLOptions): Promise<string> => {
  try {
    const defaultOptions: QRCode.QRCodeToDataURLOptions = {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      ...options,
    };

    const qrCodeDataURL = await QRCode.toDataURL(data, defaultOptions);
    return qrCodeDataURL;
  } catch (error) {
    logger.error('QR Code generation failed:', error);
    throw new ApiError(500, 'Failed to generate QR code');
  }
};

export const generateQRCodeAsBuffer = async (data: string, options?: QRCode.QRCodeToBufferOptions): Promise<Buffer> => {
  try {
    const defaultOptions: QRCode.QRCodeToBufferOptions = {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      ...options,
    };

    const buffer = await QRCode.toBuffer(data, defaultOptions);
    return buffer;
  } catch (error) {
    logger.error('QR Code buffer generation failed:', error);
    throw new ApiError(500, 'Failed to generate QR code buffer');
  }
};

export const generateQRCodeAsSVG = async (data: string, options?: QRCode.QRCodeToStringOptions): Promise<string> => {
  try {
    const defaultOptions: QRCode.QRCodeToStringOptions = {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      ...options,
    };

    const svg = await QRCode.toString(data, defaultOptions);
    return svg;
  } catch (error) {
    logger.error('QR Code SVG generation failed:', error);
    throw new ApiError(500, 'Failed to generate QR code SVG');
  }
};

export default {
  generateQRCode,
  generateQRCodeAsBuffer,
  generateQRCodeAsSVG,
};