import PDFDocument from 'pdfkit';
import fs from 'fs';
import logger from './logger';

export interface PDFOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  fontSize?: number;
  fontColor?: string;
  margin?: number;
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid' | [number, number];
  orientation?: 'portrait' | 'landscape';
  logo?: string;
}

export interface TableColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export class PDFGenerator {
  private doc: PDFKit.PDFDocument;
  private options: PDFOptions;

  constructor(options: PDFOptions = {}) {
    this.options = {
      title: 'HRMS Report',
      author: 'HRMS System',
      subject: 'Generated Report',
      creator: 'HRMS',
      fontSize: 12,
      fontColor: '#000000',
      margin: 50,
      pageSize: 'A4',
      orientation: 'portrait',
      ...options,
    };

    const pageSize = this.options.pageSize || 'A4';
    const orientation = this.options.orientation || 'portrait';

    this.doc = new PDFDocument({
      size: pageSize,
      layout: orientation,
      margin: this.options.margin || 50,
      info: {
        Title: this.options.title,
        Author: this.options.author,
        Subject: this.options.subject,
        Creator: this.options.creator,
        Keywords: this.options.keywords?.join(', '),
      },
    });
  }

  addHeader(title: string, subtitle?: string): void {
    const pageWidth = this.doc.page.width;
    const margin = this.options.margin || 50;

    if (this.options.logo) {
      try {
        const logoPath = this.options.logo;
        const logoWidth = 60;
        const logoHeight = 60;
        this.doc.image(logoPath, margin, this.doc.y, {
          fit: [logoWidth, logoHeight],
        });
      } catch (error) {
        logger.warn('Could not add logo to PDF:', error);
      }
    }

    this.doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1a202c')
      .text(title, margin, this.doc.y + 10, {
        align: 'center',
        width: pageWidth - margin * 2,
      });

    if (subtitle) {
      this.doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#4a5568')
        .text(subtitle, margin, this.doc.y + 10, {
          align: 'center',
          width: pageWidth - margin * 2,
        });
    }

    this.doc.moveDown(1);

    this.doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(margin, this.doc.y)
      .lineTo(pageWidth - margin, this.doc.y)
      .stroke();

    this.doc.moveDown(1);
  }

  addText(text: string, options?: { fontSize?: number; color?: string; align?: 'left' | 'center' | 'right'; bold?: boolean }) {
    const fontSize = options?.fontSize || this.options.fontSize || 12;
    const color = options?.color || this.options.fontColor || '#000000';
    const align = options?.align || 'left';
    const bold = options?.bold || false;

    const margin = this.options.margin || 50;
    const pageWidth = this.doc.page.width;

    this.doc
      .fontSize(fontSize)
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(color)
      .text(text, margin, this.doc.y, {
        align,
        width: pageWidth - margin * 2,
      });
  }

  addTable(columns: TableColumn[], rows: Record<string, any>[], options?: { headerColor?: string; rowColor?: string; altRowColor?: string }) {
    const margin = this.options.margin || 50;
    const pageWidth = this.doc.page.width;
    const availableWidth = pageWidth - margin * 2;

    let totalWidth = 0;
    let undefinedCount = 0;
    columns.forEach(col => {
      if (col.width) {
        totalWidth += col.width;
      } else {
        undefinedCount++;
      }
    });

    const remainingWidth = availableWidth - totalWidth;
    const defaultWidth = undefinedCount > 0 ? remainingWidth / undefinedCount : 0;

    const columnWidths = columns.map(col => {
      if (col.width) return col.width;
      return Math.max(defaultWidth, 60);
    });

    const totalWidthSum = columnWidths.reduce((a, b) => a + b, 0);
    if (totalWidthSum > availableWidth) {
      const scale = availableWidth / totalWidthSum;
      for (let i = 0; i < columnWidths.length; i++) {
        columnWidths[i] *= scale;
      }
    }

    const headerColor = options?.headerColor || '#2d3748';
    const rowColor = options?.rowColor || '#f7fafc';
    const altRowColor = options?.altRowColor || '#edf2f7';

    let xPos = margin;
    const headerHeight = 30;
    const rowHeight = 25;

    this.doc
      .fillColor(headerColor)
      .rect(xPos, this.doc.y, availableWidth, headerHeight)
      .fill();

    this.doc.fillColor('#ffffff');
    columns.forEach((col, index) => {
      const width = columnWidths[index];
      this.doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(
          col.header,
          xPos + 5,
          this.doc.y + 8,
          {
            width: width - 10,
            align: col.align || 'left',
          }
        );
      xPos += width;
    });

    this.doc.y += headerHeight;

    rows.forEach((row, rowIndex) => {
      const isEven = rowIndex % 2 === 0;
      const bgColor = isEven ? rowColor : altRowColor;

      if (this.doc.y + rowHeight > this.doc.page.height - margin) {
        this.doc.addPage();
        this.addTableHeader(columns, columnWidths, headerColor);
      }

      const yPos = this.doc.y;
      this.doc
        .fillColor(bgColor)
        .rect(margin, yPos, availableWidth, rowHeight)
        .fill();

      this.doc.fillColor('#2d3748');
      xPos = margin;
      columns.forEach((col, index) => {
        const width = columnWidths[index];
        const value = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '';
        this.doc
          .fontSize(9)
          .font('Helvetica')
          .text(
            value,
            xPos + 5,
            yPos + 7,
            {
              width: width - 10,
              align: col.align || 'left',
            }
          );
        xPos += width;
      });

      this.doc.y += rowHeight;
    });
  }

  private addTableHeader(columns: TableColumn[], columnWidths: number[], headerColor: string) {
    const margin = this.options.margin || 50;
    const availableWidth = this.doc.page.width - margin * 2;
    let xPos = margin;

    this.doc
      .fillColor(headerColor)
      .rect(xPos, this.doc.y, availableWidth, 30)
      .fill();

    this.doc.fillColor('#ffffff');
    columns.forEach((col, index) => {
      const width = columnWidths[index];
      this.doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(
          col.header,
          xPos + 5,
          this.doc.y + 8,
          {
            width: width - 10,
            align: col.align || 'left',
          }
        );
      xPos += width;
    });

    this.doc.y += 30;
  }

  addFooter(text?: string): void {
    const margin = this.options.margin || 50;
    const pageWidth = this.doc.page.width;

    this.doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#a0aec0')
      .text(
        text || `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        margin,
        this.doc.page.height - margin,
        {
          align: 'center',
          width: pageWidth - margin * 2,
        }
      );
  }

  addPageBreak(): void {
    this.doc.addPage();
  }

  addImage(imagePath: string, width?: number, height?: number): void {
    try {
      this.doc.image(imagePath, {
        fit: [width || 200, height || 200],
        align: 'center',
        valign: 'center',
      });
      this.doc.moveDown(1);
    } catch (error) {
      logger.warn('Could not add image to PDF:', error);
    }
  }

  addQRCode(qrCodeDataURL: string, width?: number, height?: number): void {
    try {
      const imageBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
      this.doc.image(imageBuffer, {
        fit: [width || 150, height || 150],
        align: 'center',
        valign: 'center',
      });
      this.doc.moveDown(1);
    } catch (error) {
      logger.warn('Could not add QR code to PDF:', error);
    }
  }

  generateBuffer(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        this.doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        this.doc.on('end', () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);
        this.doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  generateStream(): NodeJS.ReadableStream {
    return this.doc;
  }

  async saveToFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const writeStream = fs.createWriteStream(filePath);
        this.doc.pipe(writeStream);
        this.doc.end();
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const generatePDF = async (
  content: (doc: PDFGenerator) => void,
  options?: PDFOptions
): Promise<Buffer> => {
  const generator = new PDFGenerator(options);
  content(generator);
  const buffer = await generator.generateBuffer();
  return buffer;
};

export default {
  PDFGenerator,
  generatePDF,
};