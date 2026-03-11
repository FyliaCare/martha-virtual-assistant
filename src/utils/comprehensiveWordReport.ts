// ============================================================
// Comprehensive Word Report Generator — Full-period financial report
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
import { Packer } from 'docx';
import { saveAs } from 'file-saver';
import { formatDate } from './helpers';
import { ORGANIZATION_NAME, CURRENCY_SYMBOL } from './constants';
import type { Transaction } from '../types';

// ── Brand colours ──
const NAVY = '1B2A4A';
const GOLD = 'D4A843';
const GREEN = '2D8B55';
const RED = 'E85D4A';
const LIGHT_GRAY = 'F5F5F5';
const WHITE = 'FFFFFF';

const fmtAmt = (n: number) => `${CURRENCY_SYMBOL}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface ComprehensiveReportInput {
  quarterlyTrend: { period: string; receipts: number; payments: number; net: number; txnCount: number }[];
  cumulativeData: { period: string; cumulative: number }[];
  circuitPerformance: { name: string; receipts: number; payments: number; net: number; txnCount: number }[];
  outstandingDebts: { circuit: string; amount: number; notes: string }[];
  totalDebt: number;
  receiptCategories: { name: string; value: number }[];
  paymentCategories: { name: string; value: number }[];
  yearlySummary: { year: number; receipts: number; payments: number; net: number; txnCount: number }[];
  topReceipts: Transaction[];
  topPayments: Transaction[];
  inventorySummary: { name: string; stock: number; costPrice: number; sellingPrice: number; stockValue: number; lowStock: boolean }[];
  totalStockValue: number;
  handbookDistribution: { circuit: string; quantity: number }[];
  grandReceipts: number;
  grandPayments: number;
  grandBalance: number;
  totalTransactions: number;
}

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
    border: { bottom: { style: BorderStyle.SINGLE, color: GOLD, size: 6 } },
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

function tCell(text: string, opts?: { bold?: boolean; color?: string; bgColor?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }): TableCell {
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

function hCell(text: string, bg: string = NAVY): TableCell {
  return tCell(text, { bold: true, color: WHITE, bgColor: bg });
}

function buildTable(headers: string[], rows: string[][], headerBg: string = NAVY): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.AUTOFIT,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h) => hCell(h, headerBg)),
      }),
      ...rows.map((row, i) =>
        new TableRow({
          children: row.map((cell, ci) =>
            tCell(cell, {
              bgColor: i % 2 === 1 ? LIGHT_GRAY : undefined,
              align: ci >= 1 && !isNaN(parseFloat(cell.replace(/[€,+%]/g, ''))) ? AlignmentType.RIGHT : AlignmentType.LEFT,
            })
          ),
        })
      ),
    ],
  });
}

export async function generateComprehensiveWord(data: ComprehensiveReportInput): Promise<void> {
  const children: (Paragraph | Table)[] = [];
  const now = new Date().toISOString().slice(0, 10);

  // ════════════════════════════════════════════
  // TITLE
  // ════════════════════════════════════════════
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: ORGANIZATION_NAME, bold: true, color: NAVY, size: 44, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: 'Comprehensive Financial Report', color: GOLD, size: 28, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text: 'Q4 2023 – Q1 2026', bold: true, color: NAVY, size: 24, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: `Generated: ${formatDate(now)}`, color: '6B7280', size: 16, font: 'Calibri', italics: true })],
    }),
    goldRule(),
    emptyLine()
  );

  // ════════════════════════════════════════════
  // 1. EXECUTIVE SUMMARY
  // ════════════════════════════════════════════
  children.push(heading('1. Executive Summary'), goldRule());
  children.push(
    textParagraph(
      `This report covers the complete financial history of the ${ORGANIZATION_NAME} from October 2023 (Q4) through March 2026 (Q1), ` +
      `encompassing ${data.totalTransactions} transactions across ${data.circuitPerformance.length} circuits in ${data.quarterlyTrend.length} quarters.`
    ),
    emptyLine()
  );
  children.push(
    buildTable(
      ['Metric', 'Value'],
      [
        ['Total Receipts', fmtAmt(data.grandReceipts)],
        ['Total Payments', fmtAmt(data.grandPayments)],
        ['Net Balance', `${data.grandBalance >= 0 ? '+' : ''}${fmtAmt(data.grandBalance)}`],
        ['Total Transactions', String(data.totalTransactions)],
        ['Quarters Covered', String(data.quarterlyTrend.length)],
        ['Outstanding Debts', fmtAmt(data.totalDebt)],
        ['Current Stock Value', fmtAmt(data.totalStockValue)],
      ]
    )
  );
  children.push(emptyLine());
  children.push(
    textParagraph(
      data.grandBalance >= 0
        ? `The organization maintains a positive net balance of ${fmtAmt(data.grandBalance)}, reflecting sound financial management.`
        : `The organization shows a net deficit of ${fmtAmt(Math.abs(data.grandBalance))}. Attention is required.`,
      { italic: true, color: '6B7280' }
    )
  );
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // 2. QUARTERLY FINANCIAL TRENDS
  // ════════════════════════════════════════════
  children.push(heading('2. Quarterly Financial Breakdown'), goldRule());
  children.push(
    textParagraph('The table below shows receipts, payments, and net balance for each quarter since inception.')
  );
  children.push(
    buildTable(
      ['Period', 'Receipts', 'Payments', 'Net', 'Txns'],
      [
        ...data.quarterlyTrend.map((q) => [
          q.period,
          fmtAmt(q.receipts),
          fmtAmt(q.payments),
          `${q.net >= 0 ? '+' : ''}${fmtAmt(q.net)}`,
          String(q.txnCount),
        ]),
        ['TOTAL', fmtAmt(data.grandReceipts), fmtAmt(data.grandPayments), `${data.grandBalance >= 0 ? '+' : ''}${fmtAmt(data.grandBalance)}`, String(data.totalTransactions)],
      ]
    )
  );
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // 3. CUMULATIVE BALANCE
  // ════════════════════════════════════════════
  children.push(heading('3. Cumulative Balance Over Time'), goldRule());
  children.push(
    textParagraph('The running cumulative balance shows the overall financial trajectory quarter by quarter.')
  );
  children.push(
    buildTable(
      ['Period', 'Quarter Net', 'Cumulative Balance'],
      data.cumulativeData.map((q) => [
        q.period,
        `${data.quarterlyTrend.find((t) => t.period === q.period)?.net ?? 0 >= 0 ? '+' : ''}${fmtAmt(data.quarterlyTrend.find((t) => t.period === q.period)?.net ?? 0)}`,
        `${q.cumulative >= 0 ? '+' : ''}${fmtAmt(q.cumulative)}`,
      ])
    )
  );
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // 4. ANNUAL SUMMARY
  // ════════════════════════════════════════════
  children.push(heading('4. Annual Summary'), goldRule());
  children.push(
    buildTable(
      ['Year', 'Receipts', 'Payments', 'Net', 'Transactions'],
      data.yearlySummary.map((y) => [
        String(y.year),
        fmtAmt(y.receipts),
        fmtAmt(y.payments),
        `${y.net >= 0 ? '+' : ''}${fmtAmt(y.net)}`,
        String(y.txnCount),
      ])
    )
  );
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // 5. RECEIPT ANALYSIS
  // ════════════════════════════════════════════
  children.push(heading('5. Receipt Analysis by Category'), goldRule());
  children.push(
    textParagraph('Income breakdown by category shows where the organization receives its funds from.')
  );
  children.push(
    buildTable(
      ['Category', 'Amount', '% of Total'],
      [
        ...data.receiptCategories.map((c) => [
          c.name,
          fmtAmt(c.value),
          `${((c.value / data.grandReceipts) * 100).toFixed(1)}%`,
        ]),
        ['TOTAL', fmtAmt(data.grandReceipts), '100%'],
      ],
      GREEN
    )
  );
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // 6. PAYMENT ANALYSIS
  // ════════════════════════════════════════════
  children.push(heading('6. Payment Analysis by Category'), goldRule());
  children.push(
    textParagraph('Expenditure breakdown shows how the organization allocates resources.')
  );
  children.push(
    buildTable(
      ['Category', 'Amount', '% of Total'],
      [
        ...data.paymentCategories.map((c) => [
          c.name,
          fmtAmt(c.value),
          `${((c.value / data.grandPayments) * 100).toFixed(1)}%`,
        ]),
        ['TOTAL', fmtAmt(data.grandPayments), '100%'],
      ],
      RED
    )
  );
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // 7. CIRCUIT PERFORMANCE
  // ════════════════════════════════════════════
  children.push(heading('7. Circuit Performance'), goldRule());
  children.push(
    textParagraph("Each circuit's total financial contribution and expenditures across the entire reporting period.")
  );
  children.push(
    buildTable(
      ['Circuit', 'Receipts', 'Payments', 'Net', 'Txns'],
      data.circuitPerformance.map((c) => [
        c.name,
        fmtAmt(c.receipts),
        fmtAmt(c.payments),
        `${c.net >= 0 ? '+' : ''}${fmtAmt(c.net)}`,
        String(c.txnCount),
      ])
    )
  );
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // 8. OUTSTANDING DEBTS
  // ════════════════════════════════════════════
  children.push(heading('8. Outstanding Circuit Debts'), goldRule());
  children.push(
    textParagraph(
      `The following circuits have outstanding balances owed to the Europe Mission. Amounts include a ${CURRENCY_SYMBOL}40.00 handbook levy. Total outstanding: ${fmtAmt(data.totalDebt)}.`
    )
  );
  children.push(
    buildTable(
      ['Circuit', 'Amount Owed'],
      [
        ...data.outstandingDebts.map((d) => [d.circuit, fmtAmt(d.amount)]),
        ['TOTAL', fmtAmt(data.totalDebt)],
      ],
      RED
    )
  );
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // 9. TOP TRANSACTIONS
  // ════════════════════════════════════════════
  children.push(heading('9. Top 10 Receipts'), goldRule());
  children.push(
    buildTable(
      ['#', 'Date', 'Description', 'Amount'],
      data.topReceipts.map((t, i) => [
        String(i + 1),
        formatDate(t.date),
        t.description,
        fmtAmt(t.amount),
      ]),
      GREEN
    )
  );
  children.push(emptyLine());

  children.push(heading('Top 10 Payments', HeadingLevel.HEADING_2));
  children.push(
    buildTable(
      ['#', 'Date', 'Description', 'Amount'],
      data.topPayments.map((t, i) => [
        String(i + 1),
        formatDate(t.date),
        t.description,
        fmtAmt(t.amount),
      ]),
      RED
    )
  );
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // 10. INVENTORY & STOCK
  // ════════════════════════════════════════════
  children.push(heading('10. Inventory & Stock Balance'), goldRule());
  children.push(
    textParagraph(`Current stock levels from the latest count. Total stock value: ${fmtAmt(data.totalStockValue)}.`)
  );
  children.push(
    buildTable(
      ['Product', 'Stock', 'Cost Price', 'Sell Price', 'Stock Value'],
      [
        ...data.inventorySummary.map((p) => [
          `${p.lowStock ? '⚠ ' : ''}${p.name}`,
          String(p.stock),
          fmtAmt(p.costPrice),
          fmtAmt(p.sellingPrice),
          fmtAmt(p.stockValue),
        ]),
        ['TOTAL', '', '', '', fmtAmt(data.totalStockValue)],
      ]
    )
  );
  children.push(emptyLine());

  // ════════════════════════════════════════════
  // 11. HANDBOOK DISTRIBUTION
  // ════════════════════════════════════════════
  if (data.handbookDistribution.length > 0) {
    children.push(heading('11. Handbook 2026 Distribution'), goldRule());
    const totalCopies = data.handbookDistribution.reduce((s, h) => s + h.quantity, 0);
    children.push(
      textParagraph(`${totalCopies} Handbook 2026 copies were distributed to circuits in Q1 2026:`)
    );
    children.push(
      buildTable(
        ['Circuit', 'Copies'],
        [
          ...data.handbookDistribution.map((h) => [h.circuit, String(h.quantity)]),
          ['TOTAL', String(totalCopies)],
        ]
      )
    );
    children.push(emptyLine());
  }

  // ════════════════════════════════════════════
  // 12. KEY OBSERVATIONS
  // ════════════════════════════════════════════
  children.push(heading('12. Key Observations & Notes'), goldRule());

  const observations = [
    'Circuit contributions and merchandise sales consistently form the largest revenue sources.',
    `Outstanding circuit debts total ${fmtAmt(data.totalDebt)}. Collection should be prioritized for larger balances.`,
    `Current inventory is valued at ${fmtAmt(data.totalStockValue)} across ${data.inventorySummary.length} product lines.`,
    'Europe Mission cloth (3 full pieces and 8 yards) was given as a complimentary gift to the Connectional Women\'s Fellowship in Q1 2026.',
    'Hamburg Circuit has a forward order for 47 pieces of Europe Mission cloth (€1,880.00) with €1,575.00 paid and €305.00 balance remaining.',
    `${data.inventorySummary.filter((p) => p.lowStock).length} products are at or below reorder levels and may need restocking.`,
  ];

  observations.forEach((obs, i) => {
    children.push(
      textParagraph(`${i + 1}. ${obs}`)
    );
  });

  // ════════════════════════════════════════════
  // BUILD & SAVE
  // ════════════════════════════════════════════
  const doc = new Document({
    creator: ORGANIZATION_NAME,
    title: `${ORGANIZATION_NAME} — Comprehensive Financial Report Q4 2023 – Q1 2026`,
    description: 'Comprehensive financial report generated by Martha Virtual Assistant',
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${ORGANIZATION_NAME} — Confidential Financial Report  |  Page `, color: '6B7280', size: 14, font: 'Calibri' }),
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

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${ORGANIZATION_NAME.replace(/\s+/g, '-')}-Comprehensive-Report-Q4-2023-Q1-2026.docx`);
}
