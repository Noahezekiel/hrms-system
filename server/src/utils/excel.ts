import * as XLSX from 'xlsx';
import { ApiError } from './ApiError';
import logger from './logger';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelOptions {
  sheetName?: string;
  columns?: ExcelColumn[];
  dateFormat?: string;
}

export const generateExcelBuffer = (
  data: Record<string, any>[],
  options: ExcelOptions = {}
): Buffer => {
  try {
    const sheetName = options.sheetName || 'Sheet1';
    const columns = options.columns;

    let worksheetData: any[] = [];

    if (columns) {
      const headerRow: string[] = columns.map(col => col.header);
      const dataRows: any[][] = data.map(row => {
        return columns.map(col => {
          const value = row[col.key];
          if (value instanceof Date) {
            return value;
          }
          return value !== undefined && value !== null ? value : '';
        });
      });
      worksheetData = [headerRow, ...dataRows];
    } else {
      if (data.length === 0) {
        return Buffer.from('');
      }
      const headers = Object.keys(data[0]);
      const headerRow = headers;
      const dataRows = data.map(row => headers.map(key => {
        const value = row[key];
        if (value instanceof Date) {
          return value;
        }
        return value !== undefined && value !== null ? value : '';
      }));
      worksheetData = [headerRow, ...dataRows];
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    if (columns) {
      const colWidths = columns.map(col => ({ wch: col.width || 20 }));
      worksheet['!cols'] = colWidths;
    } else if (data.length > 0) {
      const maxWidths = Object.keys(data[0]).map(key => {
        let maxLen = key.length;
        data.forEach(row => {
          const val = String(row[key] !== undefined && row[key] !== null ? row[key] : '');
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
      });
      worksheet['!cols'] = maxWidths;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      bookSST: false,
    });

    return buffer;
  } catch (error) {
    logger.error('Excel generation failed:', error);
    throw new ApiError(500, 'Failed to generate Excel file');
  }
};

export const generateExcelBufferFromRows = (
  rows: any[][],
  options: ExcelOptions = {}
): Buffer => {
  try {
    const sheetName = options.sheetName || 'Sheet1';
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      bookSST: false,
    });
    return buffer;
  } catch (error) {
    logger.error('Excel generation from rows failed:', error);
    throw new ApiError(500, 'Failed to generate Excel file');
  }
};

export const parseExcelBuffer = (buffer: Buffer, options?: { sheetName?: string }): any[] => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = options?.sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData;
  } catch (error) {
    logger.error('Excel parsing failed:', error);
    throw new ApiError(400, 'Failed to parse Excel file');
  }
};

export const parseExcelBufferToRows = (buffer: Buffer, options?: { sheetName?: string }): any[][] => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = options?.sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    return rows as any[][];
  } catch (error) {
    logger.error('Excel parsing to rows failed:', error);
    throw new ApiError(400, 'Failed to parse Excel file');
  }
};

export default {
  generateExcelBuffer,
  generateExcelBufferFromRows,
  parseExcelBuffer,
  parseExcelBufferToRows,
};