// ============================================================
// PDF Report Generator — Professional quarterly financial report
// ============================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReportData } from './reportData';
import { fmtAmt, fmtPct } from './reportData';
import { formatDate } from './helpers';
import { QUARTER_LABELS } from './constants';

// ── Brand colours ──
const NAVY = [27, 42, 74] as const;
const GOLD = [212, 168, 67] as const;
const WHITE = [255, 255, 255] as const;
const LIGHT_GRAY = [245, 245, 245] as const;
const GREEN = [45, 139, 85] as const;
const RED = [232, 93, 74] as const;
const TEXT = [55, 65, 81] as const;
const TEXT_LIGHT = [107, 114, 128] as const;

type RGB = readonly [number, number, number];

function setColor(doc: jsPDF, color: RGB) {
  doc.setTextColor(color[0], color[1], color[2]);
}

function drawLine(doc: jsPDF, y: number, width: number, color: RGB = GOLD) {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.5);
  doc.line(20, y, width - 20, y);
}

function addPageFooter(doc: jsPDF, data: ReportData) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Footer line
    doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.setLineWidth(0.3);
    doc.line(20, h - 15, w - 20, h - 15);

    doc.setFontSize(7);
    setColor(doc, TEXT_LIGHT);
    doc.text(`${data.organization} — Confidential Financial Report`, 20, h - 10);
    doc.text(`Page ${i} of ${pageCount}`, w - 20, h - 10, { align: 'right' });
  }
}

export function generatePDF(data: ReportData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const w = doc.internal.pageSize.getWidth();
  let y = 0;

  // ════════════════════════════════════════════
  // COVER / HEADER
  // ════════════════════════════════════════════
  // Navy header band
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(0, 0, w, 55, 'F');

  // Gold accent line
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(0, 55, w, 3, 'F');

  // Organization name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  setColor(doc, WHITE);
  doc.text(data.organization, 20, 25);

  // Report title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  setColor(doc, GOLD);
  doc.text('Quarterly Financial Report', 20, 34);

  // Period
  doc.setFontSize(11);
  setColor(doc, WHITE);
  doc.text(`${data.quarterLabel} ${data.year}`, 20, 44);

  // Generated Date (right side)
  doc.setFontSize(8);
  setColor(doc, [...GOLD] as unknown as RGB);
  doc.text(`Generated: ${formatDate(data.generatedAt)}`, w - 20, 44, { align: 'right' });

  y = 68;

  // ════════════════════════════════════════════
  // EXECUTIVE SUMMARY
  // ════════════════════════════════════════════
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(doc, NAVY);
  doc.text('Executive Summary', 20, y);
  y += 3;
  drawLine(doc, y, w);
  y += 8;

  // Summary box
  doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
  doc.roundedRect(20, y, w - 40, 32, 3, 3, 'F');

  const summaryCol1 = 35;
  const summaryCol2 = w / 2 + 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setColor(doc, TEXT_LIGHT);
  doc.text('Total Receipts', summaryCol1, y + 8);
  doc.text('Total Payments', summaryCol2, y + 8);
  doc.text('Net Balance', summaryCol1, y + 22);
  doc.text('Total Transactions', summaryCol2, y + 22);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  setColor(doc, GREEN);
  doc.text(fmtAmt(data.totalReceipts), summaryCol1, y + 14);
  setColor(doc, RED);
  doc.text(fmtAmt(data.totalPayments), summaryCol2, y + 14);

  const balColor = data.netBalance >= 0 ? GREEN : RED;
  setColor(doc, balColor);
  doc.text((data.netBalance >= 0 ? '+' : '') + fmtAmt(data.netBalance), summaryCol1, y + 28);
  setColor(doc, NAVY);
  doc.setFontSize(13);
  doc.text(String(data.totalTransactions), summaryCol2, y + 28);

  y += 40;

  // ── Quarterly comparison ──
  if (data.advanced.receiptGrowthVsPrevQ !== null) {
    const prevQ = data.quarter === 1 ? 4 : data.quarter - 1;
    const prevY = data.quarter === 1 ? data.year - 1 : data.year;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    setColor(doc, NAVY);
    doc.text(`Compared to ${QUARTER_LABELS[prevQ]} ${prevY}`, 20, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    setColor(doc, TEXT);

    const rcptGrowth = fmtPct(data.advanced.receiptGrowthVsPrevQ);
    const pmtGrowth = fmtPct(data.advanced.paymentGrowthVsPrevQ);
    doc.text(`Receipts: ${fmtAmt(data.advanced.prevQReceipts)} → ${fmtAmt(data.totalReceipts)}  (${rcptGrowth})`, 25, y);
    y += 5;
    doc.text(`Payments: ${fmtAmt(data.advanced.prevQPayments)} → ${fmtAmt(data.totalPayments)}  (${pmtGrowth})`, 25, y);
    y += 8;
  }

  // ── Key metrics ──
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor(doc, NAVY);
  doc.text('Key Metrics', 20, y);
  y += 6;

  const metrics = [
    ['Average Transaction', fmtAmt(data.advanced.avgTransactionSize)],
    ['Average Receipt', fmtAmt(data.advanced.avgReceiptSize)],
    ['Average Payment', fmtAmt(data.advanced.avgPaymentSize)],
    ['Median Transaction', fmtAmt(data.advanced.medianTransaction)],
    ['Operating Ratio', `${(data.advanced.operatingRatio * 100).toFixed(1)}%`],
    ['Busiest Month', data.advanced.busyMonth],
    ['Quietest Month', data.advanced.quietMonth],
    ['Financial Status', data.advanced.surplusDeficit === 'surplus' ? 'SURPLUS' : data.advanced.surplusDeficit === 'deficit' ? 'DEFICIT' : 'BALANCED'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: metrics,
    theme: 'striped',
    margin: { left: 20, right: 20 },
    headStyles: { fillColor: [NAVY[0], NAVY[1], NAVY[2]], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: [TEXT[0], TEXT[1], TEXT[2]] },
    alternateRowStyles: { fillColor: [LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ════════════════════════════════════════════
  // MONTHLY BREAKDOWN
  // ════════════════════════════════════════════
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(doc, NAVY);
  doc.text('Monthly Breakdown', 20, y);
  y += 3;
  drawLine(doc, y, w);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Month', 'Receipts', 'Payments', 'Net', 'Transactions']],
    body: data.monthlyBreakdown.map((m) => [
      m.month,
      fmtAmt(m.receipts),
      fmtAmt(m.payments),
      (m.net >= 0 ? '+' : '') + fmtAmt(m.net),
      String(m.txnCount),
    ]),
    theme: 'striped',
    margin: { left: 20, right: 20 },
    headStyles: { fillColor: [NAVY[0], NAVY[1], NAVY[2]], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: [TEXT[0], TEXT[1], TEXT[2]] },
    alternateRowStyles: { fillColor: [LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]] },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ════════════════════════════════════════════
  // RECEIPTS BY CATEGORY
  // ════════════════════════════════════════════
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(doc, NAVY);
  doc.text('Receipts Analysis', 20, y);
  y += 3;
  drawLine(doc, y, w);
  y += 6;

  if (data.receiptsByCategory.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Amount', 'Transactions', '% of Total']],
      body: data.receiptsByCategory.map((c) => [
        c.label,
        fmtAmt(c.amount),
        String(c.count),
        `${c.percentage.toFixed(1)}%`,
      ]),
      foot: [['TOTAL', fmtAmt(data.totalReceipts), String(data.receiptCount), '100%']],
      theme: 'striped',
      margin: { left: 20, right: 20 },
      headStyles: { fillColor: [GREEN[0], GREEN[1], GREEN[2]], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      footStyles: { fillColor: [NAVY[0], NAVY[1], NAVY[2]], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: [TEXT[0], TEXT[1], TEXT[2]] },
      alternateRowStyles: { fillColor: [LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // Notable receipt
  if (data.advanced.largestReceipt) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    setColor(doc, TEXT_LIGHT);
    doc.text(
      `Largest receipt: ${fmtAmt(data.advanced.largestReceipt.amount)} — ${data.advanced.largestReceipt.description} (${formatDate(data.advanced.largestReceipt.date)})`,
      25, y + 2
    );
    y += 10;
  }

  // ════════════════════════════════════════════
  // PAYMENTS BY CATEGORY
  // ════════════════════════════════════════════
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(doc, NAVY);
  doc.text('Payments Analysis', 20, y);
  y += 3;
  drawLine(doc, y, w);
  y += 6;

  if (data.paymentsByCategory.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Amount', 'Transactions', '% of Total']],
      body: data.paymentsByCategory.map((c) => [
        c.label,
        fmtAmt(c.amount),
        String(c.count),
        `${c.percentage.toFixed(1)}%`,
      ]),
      foot: [['TOTAL', fmtAmt(data.totalPayments), String(data.paymentCount), '100%']],
      theme: 'striped',
      margin: { left: 20, right: 20 },
      headStyles: { fillColor: [RED[0], RED[1], RED[2]], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      footStyles: { fillColor: [NAVY[0], NAVY[1], NAVY[2]], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: [TEXT[0], TEXT[1], TEXT[2]] },
      alternateRowStyles: { fillColor: [LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  if (data.advanced.largestPayment) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    setColor(doc, TEXT_LIGHT);
    doc.text(
      `Largest payment: ${fmtAmt(data.advanced.largestPayment.amount)} — ${data.advanced.largestPayment.description} (${formatDate(data.advanced.largestPayment.date)})`,
      25, y + 2
    );
    y += 10;
  }

  // ════════════════════════════════════════════
  // CIRCUIT ANALYSIS
  // ════════════════════════════════════════════
  if (data.circuitBreakdown.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setColor(doc, NAVY);
    doc.text('Circuit Performance', 20, y);
    y += 3;
    drawLine(doc, y, w);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Circuit', 'Receipts', 'Payments', 'Net', 'Transactions']],
      body: data.circuitBreakdown.map((c) => [
        c.name,
        fmtAmt(c.receipts),
        fmtAmt(c.payments),
        (c.net >= 0 ? '+' : '') + fmtAmt(c.net),
        String(c.txnCount),
      ]),
      theme: 'striped',
      margin: { left: 20, right: 20 },
      headStyles: { fillColor: [NAVY[0], NAVY[1], NAVY[2]], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: [TEXT[0], TEXT[1], TEXT[2]] },
      alternateRowStyles: { fillColor: [LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ════════════════════════════════════════════
  // DETAILED TRANSACTION LEDGER
  // ════════════════════════════════════════════
  doc.addPage();
  y = 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(doc, NAVY);
  doc.text('Transaction Ledger — Receipts', 20, y);
  y += 3;
  drawLine(doc, y, w);
  y += 6;

  if (data.allReceipts.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Description', 'Category', 'Circuit', 'Amount']],
      body: data.allReceipts.map((t) => [
        formatDate(t.date),
        t.description,
        data.receiptsByCategory.find((c) => c.category === t.category)?.label || t.category,
        '',  // circuit column placeholder
        fmtAmt(t.amount),
      ]),
      theme: 'striped',
      margin: { left: 20, right: 20 },
      headStyles: { fillColor: [GREEN[0], GREEN[1], GREEN[2]], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [TEXT[0], TEXT[1], TEXT[2]] },
      alternateRowStyles: { fillColor: [LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]] },
      columnStyles: { 1: { cellWidth: 50 }, 4: { halign: 'right', fontStyle: 'bold' } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor(doc, NAVY);
  doc.text('Transaction Ledger — Payments', 20, y);
  y += 3;
  drawLine(doc, y, w);
  y += 6;

  if (data.allPayments.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: data.allPayments.map((t) => [
        formatDate(t.date),
        t.description,
        data.paymentsByCategory.find((c) => c.category === t.category)?.label || t.category,
        fmtAmt(t.amount),
      ]),
      theme: 'striped',
      margin: { left: 20, right: 20 },
      headStyles: { fillColor: [RED[0], RED[1], RED[2]], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [TEXT[0], TEXT[1], TEXT[2]] },
      alternateRowStyles: { fillColor: [LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]] },
      columnStyles: { 1: { cellWidth: 55 }, 3: { halign: 'right', fontStyle: 'bold' } },
    });
  }

  // ── Page footers ──
  addPageFooter(doc, data);

  // ── Save ──
  const filename = `${data.organization.replace(/\s/g, '-')}-${data.quarterLabel.replace(/\s/g, '-')}-${data.year}-Report.pdf`;
  doc.save(filename);
}
