// ============================================================
// Word Report Generator — Professional quarterly financial report
// ============================================================

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Footer,
  PageNumber,
  ShadingType,
  VerticalAlign,
  TableLayoutType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { ReportData } from './reportData';
import { fmtAmt, fmtPct } from './reportData';
import { formatDate } from './helpers';
import { QUARTER_LABELS } from './constants';

// ── Brand hex colours ──
const NAVY = '1B2A4A';
const GOLD = 'D4A843';
const GREEN = '2D8B55';
const RED = 'E85D4A';
const LIGHT_GRAY = 'F5F5F5';
const WHITE = 'FFFFFF';

// ── Helpers ──
function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 120 },
    children: [
      new TextRun({ text, bold: true, color: NAVY, size: level === HeadingLevel.HEADING_1 ? 28 : 24, font: 'Calibri' }),
    ],
  });
}

function goldRule(): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, color: GOLD, size: 6 },
    },
    children: [],
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

function textParagraph(text: string, opts?: { bold?: boolean; italic?: boolean; color?: string; size?: number }): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        italics: opts?.italic,
        color: opts?.color || '374151',
        size: opts?.size || 20,
        font: 'Calibri',
      }),
    ],
  });
}

function tableCell(text: string, opts?: { bold?: boolean; color?: string; bgColor?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }): TableCell {
  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    shading: opts?.bgColor ? { type: ShadingType.SOLID, color: opts.bgColor, fill: opts.bgColor } : undefined,
    children: [
      new Paragraph({
        alignment: opts?.align || AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            bold: opts?.bold,
            color: opts?.color || '374151',
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function headerCell(text: string, bgColor: string = NAVY): TableCell {
  return tableCell(text, { bold: true, color: WHITE, bgColor });
}

function buildTable(headers: string[], rows: string[][], headerBg: string = NAVY): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.AUTOFIT,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h) => headerCell(h, headerBg)),
      }),
      ...rows.map((row, i) =>
        new TableRow({
          children: row.map((cell, ci) =>
            tableCell(cell, {
              bgColor: i % 2 === 1 ? LIGHT_GRAY : undefined,
              bold: ci === row.length - 1 ? false : undefined, // amounts
              align: ci === row.length - 1 ? AlignmentType.RIGHT : AlignmentType.LEFT,
            })
          ),
        })
      ),
    ],
  });
}

export async function generateWord(data: ReportData): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  // ════════════════════════════════════════════
  // TITLE & HEADER
  // ════════════════════════════════════════════
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: data.organization, bold: true, color: NAVY, size: 40, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: 'Quarterly Financial Report', color: GOLD, size: 26, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({ text: `${data.quarterLabel} ${data.year}`, bold: true, color: NAVY, size: 24, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: `Generated: ${formatDate(data.generatedAt)}`, color: '6B7280', size: 16, font: 'Calibri', italics: true }),
      ],
    }),
    goldRule()
  );

  // ════════════════════════════════════════════
  // EXECUTIVE SUMMARY
  // ════════════════════════════════════════════
  children.push(heading('Executive Summary'), goldRule());

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.AUTOFIT,
      rows: [
        new TableRow({
          children: [
            tableCell('Total Receipts', { bold: true, color: '6B7280' }),
            tableCell(fmtAmt(data.totalReceipts), { bold: true, color: GREEN, align: AlignmentType.RIGHT }),
            tableCell('Total Payments', { bold: true, color: '6B7280' }),
            tableCell(fmtAmt(data.totalPayments), { bold: true, color: RED, align: AlignmentType.RIGHT }),
          ],
        }),
        new TableRow({
          children: [
            tableCell('Net Balance', { bold: true, color: '6B7280' }),
            tableCell((data.netBalance >= 0 ? '+' : '') + fmtAmt(data.netBalance), {
              bold: true,
              color: data.netBalance >= 0 ? GREEN : RED,
              align: AlignmentType.RIGHT,
            }),
            tableCell('Total Transactions', { bold: true, color: '6B7280' }),
            tableCell(String(data.totalTransactions), { bold: true, color: NAVY, align: AlignmentType.RIGHT }),
          ],
        }),
      ],
    })
  );
  children.push(emptyLine());

  // ── Quarterly comparison ──
  if (data.advanced.receiptGrowthVsPrevQ !== null) {
    const prevQ = data.quarter === 1 ? 4 : data.quarter - 1;
    const prevY = data.quarter === 1 ? data.year - 1 : data.year;
    children.push(
      heading(`Comparison with ${QUARTER_LABELS[prevQ]} ${prevY}`, HeadingLevel.HEADING_2),
      textParagraph(
        `Receipts: ${fmtAmt(data.advanced.prevQReceipts)} → ${fmtAmt(data.totalReceipts)}  (${fmtPct(data.advanced.receiptGrowthVsPrevQ)})`
      ),
      textParagraph(
        `Payments: ${fmtAmt(data.advanced.prevQPayments)} → ${fmtAmt(data.totalPayments)}  (${fmtPct(data.advanced.paymentGrowthVsPrevQ)})`
      ),
      emptyLine()
    );
  }

  // ── Key Metrics ──
  children.push(heading('Key Metrics', HeadingLevel.HEADING_2));
  children.push(
    buildTable(
      ['Metric', 'Value'],
      [
        ['Average Transaction', fmtAmt(data.advanced.avgTransactionSize)],
        ['Average Receipt', fmtAmt(data.advanced.avgReceiptSize)],
        ['Average Payment', fmtAmt(data.advanced.avgPaymentSize)],
        ['Median Transaction', fmtAmt(data.advanced.medianTransaction)],
        ['Operating Ratio', `${(data.advanced.operatingRatio * 100).toFixed(1)}%`],
        ['Busiest Month', data.advanced.busyMonth],
        ['Quietest Month', data.advanced.quietMonth],
        ['Financial Status', data.advanced.surplusDeficit === 'surplus' ? 'SURPLUS' : data.advanced.surplusDeficit === 'deficit' ? 'DEFICIT' : 'BALANCED'],
      ]
    )
  );
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // MONTHLY BREAKDOWN
  // ════════════════════════════════════════════
  children.push(heading('Monthly Breakdown'), goldRule());
  children.push(
    buildTable(
      ['Month', 'Receipts', 'Payments', 'Net', 'Transactions'],
      data.monthlyBreakdown.map((m) => [
        m.month,
        fmtAmt(m.receipts),
        fmtAmt(m.payments),
        (m.net >= 0 ? '+' : '') + fmtAmt(m.net),
        String(m.txnCount),
      ])
    )
  );
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // RECEIPTS ANALYSIS
  // ════════════════════════════════════════════
  children.push(heading('Receipts Analysis'), goldRule());
  if (data.receiptsByCategory.length > 0) {
    children.push(
      buildTable(
        ['Category', 'Amount', 'Transactions', '% of Total'],
        [
          ...data.receiptsByCategory.map((c) => [
            c.label,
            fmtAmt(c.amount),
            String(c.count),
            `${c.percentage.toFixed(1)}%`,
          ]),
          ['TOTAL', fmtAmt(data.totalReceipts), String(data.receiptCount), '100%'],
        ],
        GREEN
      )
    );
  }
  if (data.advanced.largestReceipt) {
    children.push(
      textParagraph(
        `Largest receipt: ${fmtAmt(data.advanced.largestReceipt.amount)} — ${data.advanced.largestReceipt.description} (${formatDate(data.advanced.largestReceipt.date)})`,
        { italic: true, color: '6B7280' }
      )
    );
  }
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // PAYMENTS ANALYSIS
  // ════════════════════════════════════════════
  children.push(heading('Payments Analysis'), goldRule());
  if (data.paymentsByCategory.length > 0) {
    children.push(
      buildTable(
        ['Category', 'Amount', 'Transactions', '% of Total'],
        [
          ...data.paymentsByCategory.map((c) => [
            c.label,
            fmtAmt(c.amount),
            String(c.count),
            `${c.percentage.toFixed(1)}%`,
          ]),
          ['TOTAL', fmtAmt(data.totalPayments), String(data.paymentCount), '100%'],
        ],
        RED
      )
    );
  }
  if (data.advanced.largestPayment) {
    children.push(
      textParagraph(
        `Largest payment: ${fmtAmt(data.advanced.largestPayment.amount)} — ${data.advanced.largestPayment.description} (${formatDate(data.advanced.largestPayment.date)})`,
        { italic: true, color: '6B7280' }
      )
    );
  }
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // CIRCUIT PERFORMANCE
  // ════════════════════════════════════════════
  if (data.circuitBreakdown.length > 0) {
    children.push(heading('Circuit Performance'), goldRule());
    children.push(
      buildTable(
        ['Circuit', 'Receipts', 'Payments', 'Net', 'Transactions'],
        data.circuitBreakdown.map((c) => [
          c.name,
          fmtAmt(c.receipts),
          fmtAmt(c.payments),
          (c.net >= 0 ? '+' : '') + fmtAmt(c.net),
          String(c.txnCount),
        ])
      )
    );
    children.push(emptyLine());
  }

  // ════════════════════════════════════════════
  // TRANSACTION LEDGER
  // ════════════════════════════════════════════
  children.push(heading('Transaction Ledger — Receipts'), goldRule());
  if (data.allReceipts.length > 0) {
    children.push(
      buildTable(
        ['Date', 'Description', 'Category', 'Amount'],
        data.allReceipts.map((t) => [
          formatDate(t.date),
          t.description,
          data.receiptsByCategory.find((c) => c.category === t.category)?.label || t.category,
          fmtAmt(t.amount),
        ]),
        GREEN
      )
    );
  }
  children.push(emptyLine());

  children.push(heading('Transaction Ledger — Payments'), goldRule());
  if (data.allPayments.length > 0) {
    children.push(
      buildTable(
        ['Date', 'Description', 'Category', 'Amount'],
        data.allPayments.map((t) => [
          formatDate(t.date),
          t.description,
          data.paymentsByCategory.find((c) => c.category === t.category)?.label || t.category,
          fmtAmt(t.amount),
        ]),
        RED
      )
    );
  }

  // ════════════════════════════════════════════
  // BUILD DOCUMENT
  // ════════════════════════════════════════════
  const doc = new Document({
    creator: data.organization,
    title: `${data.organization} — ${data.quarterLabel} ${data.year} Financial Report`,
    description: 'Quarterly financial report generated by Martha Virtual Assistant',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${data.organization} — Confidential Financial Report  |  Page `, color: '6B7280', size: 14, font: 'Calibri' }),
                  new TextRun({ children: [PageNumber.CURRENT], color: '6B7280', size: 14, font: 'Calibri' }),
                  new TextRun({ text: ' of ', color: '6B7280', size: 14, font: 'Calibri' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], color: '6B7280', size: 14, font: 'Calibri' }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  // Generate and save
  const { Packer } = await import('docx');
  const blob = await Packer.toBlob(doc);
  const filename = `${data.organization.replace(/\s/g, '-')}-${data.quarterLabel.replace(/\s/g, '-')}-${data.year}-Report.docx`;
  saveAs(blob, filename);
}
