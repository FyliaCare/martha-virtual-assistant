// ============================================================
// Historical Data Seed — Real Europe Mission financial data
// extracted from the Word documents:
//   - Q4 2023 (Oct–Dec)
//   - Q1 2024 (Jan–Mar)
//   - Q2 2024 (Apr–Jun)
//   - Q3 2024 (Jul–Sep)
//   - Q4 2024 (Oct–Dec)
// ============================================================

import { db } from './database';
import { generateId, now } from '../utils/helpers';
import type {
  Transaction,
  TransactionType,
  TransactionCategory,
  Quarter,
  StockMovement,
  MissionEvent,
} from '../types';

// ---- Helper to build a transaction record ----
function txn(
  date: string,
  type: TransactionType,
  category: TransactionCategory,
  description: string,
  amount: number,
  quarter: Quarter,
  year: number,
  circuitRef?: string,
  notes?: string,
): Omit<Transaction, 'id'> {
  return {
    uid: generateId(),
    date,
    type,
    category,
    description,
    amount,
    quarter,
    year,
    circuitId: circuitRef, // will be resolved to uid later
    notes,
    createdAt: now(),
    updatedAt: now(),
  };
}

// ---- Helper to build a stock movement ----
function sm(
  date: string,
  productRef: string,
  type: 'purchase' | 'sale' | 'adjustment',
  quantity: number,
  unitPrice: number,
  quarter: Quarter,
  year: number,
  circuitRef?: string,
  notes?: string,
): Omit<StockMovement, 'id'> {
  return {
    uid: generateId(),
    productId: productRef, // resolved later
    type,
    quantity,
    unitPrice,
    date,
    quarter,
    year,
    circuitId: circuitRef,
    notes,
    createdAt: now(),
  };
}

export async function seedHistoricalData() {
  // Check if we already have transactions — if so, skip
  const txnCount = await db.transactions.count();
  if (txnCount > 0) {
    console.log('[Martha] Historical data already seeded, skipping.');
    return;
  }

  console.log('[Martha] Seeding historical financial data from documents...');

  // ---- Get circuit UIDs by name ----
  const allCircuits = await db.circuits.toArray();
  const cid = (name: string) => allCircuits.find((c) => c.name.toLowerCase() === name.toLowerCase())?.uid || '';

  // ---- Get product UIDs by name ----
  const allProducts = await db.products.toArray();
  const pid = (fragment: string) =>
    allProducts.find((p) => p.name.toLowerCase().includes(fragment.toLowerCase()))?.uid || '';

  // ==================================================================
  // QUARTER 4 — OCTOBER TO DECEMBER 2023
  // ==================================================================
  const q4_2023: Omit<Transaction, 'id'>[] = [
    // Opening Balance
    txn('2023-10-01', 'receipt', 'opening_balance', 'Opening Balance B/F', 6105.00, 4, 2023),

    // ---- PAYMENTS: Donations ----
    txn('2023-10-15', 'payment', 'donation_given', 'Donation to V. Rev. S. Amoah', 200.00, 4, 2023, undefined, 'Maiden Conference'),
    txn('2023-10-15', 'payment', 'donation_given', 'Donation to Rev. Nyantayi', 100.00, 4, 2023),
    txn('2023-10-15', 'payment', 'donation_given', 'Donation to Rev. Bossomann', 100.00, 4, 2023),
    txn('2023-10-15', 'payment', 'donation_given', 'Donation to Holland Circuit', 250.00, 4, 2023, cid('Holland')),
    txn('2023-10-15', 'payment', 'donation_given', 'Donation to V. Rev. C. Gyasi (Dusseldorf)', 150.00, 4, 2023, cid('Dusseldorf')),
    txn('2023-10-15', 'payment', 'donation_given', 'Donation to V. Rev. B. Bosumpim (Belgium)', 150.00, 4, 2023, cid('Belgium')),
    txn('2023-10-20', 'payment', 'donation_given', 'Donation to Cape Coast Building Project', 500.00, 4, 2023, undefined, 'Ghana Project'),

    // ---- RECEIPTS ----
    txn('2023-10-20', 'receipt', 'debt_repayment', 'Old Debt Sept and Oct 2023', 380.00, 4, 2023),
    txn('2023-10-20', 'receipt', 'other', 'Cash at hand Sept 2023', 1008.00, 4, 2023),
    txn('2023-10-25', 'receipt', 'donation_received', 'Contribution from Finland for Maiden Conference 2023', 150.00, 4, 2023, cid('Finland')),

    // Jacket Sales — Hamburg (Hannover & Wesley)
    txn('2023-11-01', 'receipt', 'merchandise_sale', 'Jacket sales – Hamburg Hannover', 490.00, 4, 2023, cid('Hamburg'), '14 jackets @35'),
    txn('2023-11-01', 'receipt', 'merchandise_sale', 'Jacket sales – Hamburg Wesley', 75.00, 4, 2023, cid('Hamburg'), '~2 jackets'),

    // Dusseldorf Sales
    txn('2023-11-10', 'receipt', 'merchandise_sale', 'Sales to Dusseldorf – Tree of Life, Enrolment Badge, Headgear', 220.00, 4, 2023, cid('Dusseldorf'), 'Tree of Life 2×70, Enrolment Badge 10×4, Headgear 10×4. Paid 150'),

    // ---- PAYMENTS continued ----
    txn('2023-11-15', 'payment', 'gift', 'Send-Off V. Rev. Eldad Bonney – Gift', 35.00, 4, 2023),
    txn('2023-11-15', 'payment', 'gift', 'Send-Off V. Rev. Dr. C. Gyasi – Gift', 40.00, 4, 2023),
    txn('2023-11-20', 'payment', 'airtime', 'Air Time Credit for large meeting Nov 2023 (Zoom)', 56.75, 4, 2023),
    txn('2023-11-25', 'payment', 'donation_given', 'Europe Youth Maiden Conference 2023 – Donation', 100.00, 4, 2023),

    // Purchase from Ghana
    txn('2023-12-05', 'payment', 'merchandise_purchase', 'Purchase from Ghana – Regalia 90pcs, Gold Badge 3pcs', 312.00, 4, 2023, undefined, 'Regalia 90×3=270, Gold Badge 3×6=18 + shipping'),

    // Italy Jacket payment received
    txn('2023-12-10', 'receipt', 'debt_repayment', 'Payment Italy Jacket debt', 1280.30, 4, 2023, cid('Italy')),
  ];

  // ==================================================================
  // QUARTER 1 — JANUARY TO MARCH 2024
  // ==================================================================
  const q1_2024: Omit<Transaction, 'id'>[] = [
    // Opening balance (carried forward from Q4 2023: 7,494.75 or 7,593.75 — using doc2 figure)
    txn('2024-01-01', 'receipt', 'opening_balance', 'Balance C/F from December 2023', 7494.75, 1, 2024),

    // Hamburg Sales Jan
    txn('2024-01-06', 'receipt', 'merchandise_sale', 'Hamburg Sales – Headgear, Gold Badge, Officer Badge, Regalia, Tree of Life', 203.00, 1, 2024, cid('Hamburg'),
      'Headgear 10×4=40, Gold Badge 2×10=20, Officer Badge 5×5=25, Regalia 6×8=48, Tree of Life 1×70=70'),

    // Stuttgart payment for jackets
    txn('2024-02-15', 'receipt', 'debt_repayment', 'Stuttgart Circuit payment of Jackets', 500.00, 1, 2024, cid('Stuttgart')),

    // Holland Sales
    txn('2024-02-15', 'receipt', 'merchandise_sale', 'Holland Circuit Sales – Regalia 6pcs, Jacket 1pc', 81.00, 1, 2024, cid('Holland'), 'Regalia 6×8=48, Jacket 1×35=33 (discounted)'),

    // Purchase from Ghana
    txn('2024-02-28', 'payment', 'merchandise_purchase', 'Handbooks purchased from Ghana – 150 copies', 229.00, 1, 2024, undefined, '150 Handbooks @~1.50 + shipping'),
    txn('2024-02-28', 'payment', 'merchandise_purchase', 'Dues Cards purchased from Ghana – 50pcs', 250.00, 1, 2024, undefined, '50 Dues Cards'),
    txn('2024-02-28', 'payment', 'merchandise_purchase', 'T-shirts purchased from Ghana – 33pcs', 240.00, 1, 2024, undefined, '33 Lacoste T-Shirts'),

    // Transportation
    txn('2024-03-01', 'payment', 'transportation', 'Transportation from Ghana – extra bag cloth & T-shirt', 170.00, 1, 2024),
    txn('2024-03-01', 'payment', 'transportation', 'Transportation errand from Ghana', 130.00, 1, 2024, undefined, 'Extra bag + errand combined'),

    // Airtime
    txn('2024-03-03', 'payment', 'airtime', 'Air Time Credit for Zoom large meeting March 2024', 56.73, 1, 2024),
    txn('2024-03-15', 'payment', 'airtime', 'Air Time Credit for Snr Sis Grace & Presiding Bishop\'s Wife', 100.00, 1, 2024),

    // Postage
    txn('2024-03-23', 'payment', 'postage', 'Postage to countries (Handbooks)', 108.84, 1, 2024, undefined,
      'Italy 51.49, Belgium 18.95, Finland 19.50, Holland 18.90'),

    // Handbook Sales to Circuits
    txn('2024-03-25', 'receipt', 'merchandise_sale', 'Handbook sales – Italy Circuit 23pcs', 92.00, 1, 2024, cid('Italy'), '23 × €4.00'),
    txn('2024-03-25', 'receipt', 'merchandise_sale', 'Handbook sales – Belgium 20pcs', 80.00, 1, 2024, cid('Belgium'), '20 × €4.00'),
    txn('2024-03-25', 'receipt', 'merchandise_sale', 'Handbook sales – Stuttgart 30pcs', 105.00, 1, 2024, cid('Stuttgart'), '30 × €3.50'),
    txn('2024-03-25', 'receipt', 'merchandise_sale', 'Handbook sales – Dusseldorf 20pcs', 80.00, 1, 2024, cid('Dusseldorf'), '20 × €4.00'),
    txn('2024-03-25', 'receipt', 'merchandise_sale', 'Handbook sales – Finland 5pcs', 20.00, 1, 2024, cid('Finland'), '5 × €4.00'),
    txn('2024-03-25', 'receipt', 'merchandise_sale', 'Handbook sales – Hamburg 31pcs', 124.00, 1, 2024, cid('Hamburg'), '31 × €4.00'),
    txn('2024-03-25', 'receipt', 'merchandise_sale', 'Handbook sales – Holland 20pcs', 80.00, 1, 2024, cid('Holland'), '20 × €4.00'),

    // Holland jacket sale + stationery
    txn('2024-03-30', 'receipt', 'merchandise_sale', 'Jacket sale to Holland – 1pc', 35.00, 1, 2024, cid('Holland')),
    txn('2024-03-31', 'payment', 'stationery', 'Stationery – Cellotape 3×2.90', 8.70, 1, 2024),

    // Stuttgart old debt
    txn('2024-03-31', 'receipt', 'debt_repayment', 'Stuttgart Circuit – Payment of old debt', 300.00, 1, 2024, cid('Stuttgart')),
  ];

  // ==================================================================
  // QUARTER 2 — APRIL TO JUNE 2024
  // ==================================================================
  const q2_2024: Omit<Transaction, 'id'>[] = [
    // Opening balance
    txn('2024-04-03', 'receipt', 'opening_balance', 'Balance C/F from March 2024', 8052.32, 2, 2024),

    // Circuit contributions
    txn('2024-05-08', 'receipt', 'circuit_contribution', 'Circuit contributions – Hamburg', 50.00, 2, 2024, cid('Hamburg')),
    txn('2024-05-08', 'receipt', 'circuit_contribution', 'Circuit contributions – Stuttgart', 50.00, 2, 2024, cid('Stuttgart')),
    txn('2024-05-08', 'receipt', 'circuit_contribution', 'Circuit contributions – Holland', 50.00, 2, 2024, cid('Holland')),
    txn('2024-05-08', 'receipt', 'circuit_contribution', 'Circuit contributions – Italy', 50.00, 2, 2024, cid('Italy')),
    txn('2024-05-08', 'receipt', 'circuit_contribution', 'Circuit contributions – Dusseldorf', 50.00, 2, 2024, cid('Dusseldorf')),
    txn('2024-05-08', 'receipt', 'circuit_contribution', 'Circuit contributions – Belgium', 50.00, 2, 2024, cid('Belgium')),

    // Sales to Finland
    txn('2024-05-08', 'receipt', 'merchandise_sale', 'Sales to Finland – Regalia, Officer Badge, T-shirt, Headgear, Handbook', 129.00, 2, 2024, cid('Finland'),
      'Regalia 6×8=48, Officer Badge 5×5=25, Lacoste T-shirt 4×8=32, Headgear 1×4=4, Handbook 5×4=20'),

    // Finland inauguration donation payment
    txn('2024-05-08', 'payment', 'donation_given', 'Inauguration of Finland Circuit – Donation', 300.00, 2, 2024, cid('Finland')),

    // Italy Sales
    txn('2024-05-20', 'receipt', 'merchandise_sale', 'Sales to Italy Circuit – Tree of Life 3pcs, Regalia 6pcs', 258.00, 2, 2024, cid('Italy'),
      'Tree of Life 3×70=210, Regalia 6×8=48. Total 258. Italy paid 280'),
    txn('2024-05-20', 'receipt', 'debt_repayment', 'Payment by Italy (overpayment on merchandise)', 22.00, 2, 2024, cid('Italy')),

    // Retreat part payment
    txn('2024-05-28', 'payment', 'event_expense', 'Retreat – Part Payment for Cruise', 4000.00, 2, 2024, undefined, 'Sept 2023-planned retreat cruise'),

    // Stuttgart Sales – Regalia
    txn('2024-06-21', 'receipt', 'merchandise_sale', 'Sales to Stuttgart – Regalia 6pcs', 48.00, 2, 2024, cid('Stuttgart'), '6 × €8.00'),

    // Hamburg Circuit Sales
    txn('2024-06-24', 'receipt', 'merchandise_sale', 'Sales to Hamburg – Lacoste T-shirt, Tree of Life, Jackets', 600.00, 2, 2024, cid('Hamburg'),
      'T-shirt 5×8=40, Tree of Life 2×70=140, Jackets 12×35=420'),

    // New jacket order
    txn('2024-06-24', 'payment', 'merchandise_purchase', 'New Jacket Order – Part payment', 4000.00, 2, 2024, undefined, 'Part payment for 250 new jackets'),
  ];

  // ==================================================================
  // QUARTER 3 — JULY TO SEPTEMBER 2024
  // ==================================================================
  const q3_2024: Omit<Transaction, 'id'>[] = [
    // Opening balance
    txn('2024-07-01', 'receipt', 'opening_balance', 'Balance C/F from 30th June 2024', 1061.32, 3, 2024),

    // Jacket purchase – full bill
    txn('2024-07-15', 'payment', 'merchandise_purchase', 'New Jackets purchased – 250pcs full invoice', 8016.25, 3, 2024, undefined, '250 new jackets'),
    txn('2024-07-15', 'payment', 'transportation', 'Jacket Transportation from Holland', 250.00, 3, 2024, cid('Holland')),

    // Retreat proceeds
    txn('2024-08-24', 'receipt', 'event_income', 'Proceeds from Retreat (Sept 21–23, 2023)', 19462.00, 3, 2024, undefined, 'Retreat registration, contributions, etc.'),

    // Retreat expenses
    txn('2024-08-24', 'payment', 'event_expense', 'Retreat – Hostel fee', 7704.00, 3, 2024),
    txn('2024-08-24', 'payment', 'event_expense', 'Retreat – Cruise fee', 3785.59, 3, 2024),
    txn('2024-08-24', 'payment', 'stationery', 'Retreat – Stationery/Banner', 50.00, 3, 2024),
    txn('2024-08-24', 'payment', 'honorarium', 'Retreat – Honorarium', 200.00, 3, 2024),
    txn('2024-08-24', 'payment', 'event_expense', 'Retreat – Chairs and tables hired', 250.00, 3, 2024),
    txn('2024-08-24', 'payment', 'transportation', 'Retreat – Fuel', 395.00, 3, 2024),
    txn('2024-08-24', 'payment', 'event_expense', 'Retreat – Photos and videos', 250.00, 3, 2024),
    txn('2024-08-24', 'payment', 'event_expense', 'Retreat – Decorations', 100.00, 3, 2024),
    txn('2024-08-24', 'payment', 'event_expense', 'Retreat – Committee and circuit levy to support food', 1050.00, 3, 2024),

    // Italy payment
    txn('2024-08-30', 'receipt', 'debt_repayment', 'Italy Circuit Payment', 401.00, 3, 2024, cid('Italy')),

    // Purchase from Ghana
    txn('2024-08-30', 'payment', 'merchandise_purchase', 'Purchase from Ghana – Headgear 15pcs, Tree of Life 10pcs, Officer Badge 50pcs, T-Shirt 11pcs', 410.00, 3, 2024,
      undefined, 'Headgear 15×2, Tree of Life 10×38, Officer Badge 50×3, T-shirt 11×5'),

    // Cash Sales at event
    txn('2024-08-30', 'receipt', 'merchandise_sale', 'Cash Sales – Tree of Life 5pcs @70, Lacoste T-shirt 30pcs @8, Headgear 13pcs @4, Jackets 6pcs @35, Dues Card 14pcs @2, Enrolment Badge 16pcs @4', 948.00, 3, 2024,
      undefined, 'TofL 350 + T-shirt 240 + Headgear 52 + Jackets 210 + Dues 32 + Enrolment 64'),

    // Finland late retreat fee
    txn('2024-08-27', 'receipt', 'event_income', 'Late retreat fee payment by Finland', 100.00, 3, 2024, cid('Finland')),

    // Hamburg late retreat fee
    txn('2024-09-03', 'receipt', 'event_income', 'Late retreat fee payment by Hamburg', 50.00, 3, 2024, cid('Hamburg')),

    // UK jacket payments
    txn('2024-09-03', 'receipt', 'debt_repayment', 'Payment of Jacket by UK', 401.28, 3, 2024, cid('UK')),
    txn('2024-09-03', 'receipt', 'debt_repayment', 'Payment of Jacket by UK (2nd)', 283.66, 3, 2024, cid('UK')),

    // Send-off gift
    txn('2024-09-05', 'payment', 'gift', 'Send-Off Connexion Gift', 150.00, 3, 2024),
  ];

  // ==================================================================
  // QUARTER 4 — OCTOBER TO DECEMBER 2024
  // ==================================================================
  const q4_2024: Omit<Transaction, 'id'>[] = [
    // Belgium – Late retreat fee + jacket payment + merchandise
    txn('2024-10-20', 'receipt', 'event_income', 'Late payment of retreat fee by Belgium', 100.00, 4, 2024, cid('Belgium')),
    txn('2024-10-20', 'receipt', 'debt_repayment', 'Payment of new Jacket by Belgium', 73.00, 4, 2024, cid('Belgium')),
    txn('2024-10-20', 'receipt', 'merchandise_sale', 'Belgium sales – Regalia 6pcs, Officer Badge 5pcs, Jacket 20pcs', 813.00, 4, 2024, cid('Belgium'),
      'Regalia 6×8=48, Officer Badge 5×5=25, Jacket 20×37=740'),

    // Retreat Centre Levy from circuits
    txn('2024-10-20', 'receipt', 'circuit_contribution', 'Retreat Centre Cape Coast levy – Finland', 43.50, 4, 2024, cid('Finland')),
    txn('2024-10-20', 'receipt', 'circuit_contribution', 'Retreat Centre Cape Coast levy – Hamburg', 148.50, 4, 2024, cid('Hamburg')),
    txn('2024-10-20', 'receipt', 'circuit_contribution', 'Retreat Centre Cape Coast levy – Italy', 114.00, 4, 2024, cid('Italy')),
    txn('2024-10-20', 'receipt', 'circuit_contribution', 'Retreat Centre Cape Coast levy – Modena (Italy)', 37.50, 4, 2024, cid('Italy'), 'Modena sub-branch'),
    txn('2024-10-20', 'receipt', 'circuit_contribution', 'Retreat Centre Cape Coast levy – Belgium', 109.50, 4, 2024, cid('Belgium')),
    txn('2024-10-20', 'receipt', 'circuit_contribution', 'Retreat Centre Cape Coast levy – Stuttgart', 82.50, 4, 2024, cid('Stuttgart')),
    txn('2024-10-20', 'receipt', 'circuit_contribution', 'Retreat Centre Cape Coast levy – Dusseldorf', 55.50, 4, 2024, cid('Dusseldorf')),
    txn('2024-10-20', 'receipt', 'circuit_contribution', 'Retreat Centre Cape Coast levy – Holland', 180.00, 4, 2024, cid('Holland')),

    // Payment to Ghana for retreat centre
    txn('2024-11-09', 'payment', 'donation_given', 'Payment to Ghana for the Retreat Centre', 771.00, 4, 2024, undefined, 'Cape Coast retreat centre'),

    // Jacket sales to circuits (these are large orders — recorded as income when paid)
    // Italy Jackets: 12+10+8 = 30  pcs @37 = 1110
    // Dusseldorf: 25 pcs @37 = 925
    // UK: 20 pcs @37 = 740
    // Stuttgart: 18 pcs @37 = 666
    // (These may be partially paid / debts — recording as merchandise sales)

    // Miscellaneous
    txn('2024-11-15', 'payment', 'other', 'Miscellaneous – Connexion program', 350.00, 4, 2024),
    txn('2024-11-20', 'payment', 'airtime', 'Air time', 75.00, 4, 2024),

    // Hamburg Hannover – Tree of Life
    txn('2024-12-22', 'receipt', 'merchandise_sale', 'Hamburg (Hannover) – Tree of Life 2pcs', 140.00, 4, 2024, cid('Hamburg'), '2 × €70.00'),

    // Circuit contributions to support Belgium inauguration
    txn('2024-12-01', 'receipt', 'circuit_contribution', 'Support Belgium inauguration – Holland', 50.00, 4, 2024, cid('Holland')),
    txn('2024-12-01', 'receipt', 'circuit_contribution', 'Support Belgium inauguration – Hamburg', 50.00, 4, 2024, cid('Hamburg')),
    txn('2024-12-01', 'receipt', 'circuit_contribution', 'Support Belgium inauguration – Finland', 50.00, 4, 2024, cid('Finland')),
    txn('2024-12-01', 'receipt', 'circuit_contribution', 'Support Belgium inauguration – Dusseldorf', 50.00, 4, 2024, cid('Dusseldorf')),
    txn('2024-12-01', 'receipt', 'circuit_contribution', 'Support Belgium inauguration – Italy', 50.00, 4, 2024, cid('Italy')),
    txn('2024-12-01', 'receipt', 'circuit_contribution', 'Support Belgium inauguration – Modena', 50.00, 4, 2024, cid('Italy'), 'Modena sub-branch'),
    txn('2024-12-01', 'receipt', 'circuit_contribution', 'Support Belgium inauguration – Stuttgart', 50.00, 4, 2024, cid('Stuttgart')),

    // Donation to Belgium
    txn('2024-12-10', 'payment', 'donation_given', 'Donation to Belgium (inauguration support)', 300.00, 4, 2024, cid('Belgium')),

    // Honorarium
    txn('2024-12-14', 'payment', 'honorarium', 'Honorarium – Bro. Mensou and others', 200.00, 4, 2024),

    // Handbook purchase from Ghana
    txn('2024-12-14', 'payment', 'merchandise_purchase', 'Handbooks purchased from Ghana – 200pcs', 300.00, 4, 2024, undefined, '200 copies'),
  ];

  // ==================================================================
  // QUARTER 1 — JANUARY TO MARCH 2025
  // ==================================================================
  const q1_2025: Omit<Transaction, 'id'>[] = [
    // ---- RECEIPTS ----
    txn('2025-01-08', 'receipt', 'debt_repayment', 'Italy Circuit – Payment of items bought', 530.00, 1, 2025, cid('Italy')),
    txn('2025-03-11', 'receipt', 'circuit_contribution', 'Payment by Belgium Circuit', 134.00, 1, 2025, cid('Belgium')),

    // ---- PAYMENTS ----
    txn('2025-01-18', 'payment', 'other', 'Cash deposit to bank', 200.00, 1, 2025, undefined, 'Cash transferred to bank account'),
    txn('2025-02-03', 'payment', 'other', 'Cash deposit to bank', 200.00, 1, 2025, undefined, 'Cash transferred to bank account'),
    txn('2025-03-03', 'payment', 'other', 'Cash Deposit to Bank', 3500.00, 1, 2025, undefined, 'Cash transferred to bank account'),
    txn('2025-03-03', 'payment', 'postage', 'T&T to Italy – Package postage', 20.41, 1, 2025, cid('Italy'), 'Transport & postage for Italy package'),
  ];

  // ==================================================================
  // QUARTER 2 — APRIL TO JUNE 2025
  // ==================================================================
  const q2_2025: Omit<Transaction, 'id'>[] = [
    // ---- RECEIPTS ----
    txn('2025-04-11', 'receipt', 'circuit_contribution', 'Payment by Finland Circuit', 20.00, 2, 2025, cid('Finland')),
    txn('2025-04-17', 'receipt', 'circuit_contribution', 'Payment by Belgium', 700.00, 2, 2025, cid('Belgium')),
    txn('2025-05-24', 'receipt', 'circuit_contribution', 'Payment by Italy Circuit', 500.00, 2, 2025, cid('Italy')),
    txn('2025-05-24', 'receipt', 'circuit_contribution', 'Dusseldorf Circuit Payment', 600.00, 2, 2025, cid('Dusseldorf')),
    txn('2025-06-24', 'receipt', 'circuit_contribution', 'Holland Circuit Payment', 320.00, 2, 2025, cid('Holland')),

    // ---- PAYMENTS ----
    txn('2025-04-17', 'payment', 'other', 'Cash Deposit to Bank', 5000.00, 2, 2025, undefined, 'Cash transferred to bank account'),
    txn('2025-04-23', 'payment', 'merchandise_purchase', 'Payment of Europe Cloth', 5000.00, 2, 2025, undefined, 'Europe Mission Cloth – major purchase payment'),
    txn('2025-06-15', 'payment', 'gift', 'Gift for Presiding', 60.00, 2, 2025),
  ];

  // ==================================================================
  // QUARTER 3 — JULY TO SEPTEMBER 2025
  // ==================================================================
  const q3_2025: Omit<Transaction, 'id'>[] = [
    // ---- RECEIPTS ----
    txn('2025-07-25', 'receipt', 'circuit_contribution', 'Italy Circuit Payment', 300.00, 3, 2025, cid('Italy')),
    txn('2025-07-31', 'receipt', 'circuit_contribution', 'Belgium Circuit Payment', 162.00, 3, 2025, cid('Belgium')),
    txn('2025-08-01', 'receipt', 'merchandise_sale', 'Henry Retail Centre – Cash Sales', 220.00, 3, 2025, undefined, 'Sales at Henry Retail Centre'),
    txn('2025-08-15', 'receipt', 'circuit_contribution', 'Holland Circuit Payment', 200.00, 3, 2025, cid('Holland')),
    txn('2025-08-16', 'receipt', 'circuit_contribution', 'Holland Circuit Payment (2nd)', 650.00, 3, 2025, cid('Holland')),
    txn('2025-09-21', 'receipt', 'debt_repayment', 'Final Payment from UK – Jacket', 241.64, 3, 2025, cid('UK')),

    // ---- PAYMENTS ----
    txn('2025-08-13', 'payment', 'event_expense', 'Conference extra contribution', 138.00, 3, 2025, undefined, 'Additional conference expenses'),
    txn('2025-09-20', 'payment', 'merchandise_purchase', 'Europe Mission Cloth', 1000.00, 3, 2025, undefined, 'Additional cloth purchase for Europe Mission'),
    txn('2025-09-20', 'payment', 'donation_given', 'Retreale Cape Coast', 200.00, 3, 2025, undefined, 'Cape Coast retreat contribution'),
    txn('2025-09-25', 'payment', 'merchandise_purchase', 'Berlin seebranch – Jackets bought 11pcs & others', 383.00, 3, 2025, undefined, '11 jackets and other items for Berlin sub-branch'),
    txn('2025-09-30', 'payment', 'gift', 'Gift for Belgium Rev. Gymah', 30.00, 3, 2025, cid('Belgium')),
  ];

  // ==================================================================
  // QUARTER 4 — OCTOBER TO DECEMBER 2025
  // ==================================================================
  const q4_2025: Omit<Transaction, 'id'>[] = [
    // ---- RECEIPTS ----
    txn('2025-10-14', 'receipt', 'circuit_contribution', 'Payment by Belgium Circuit', 390.00, 4, 2025, cid('Belgium')),
    txn('2025-10-15', 'receipt', 'circuit_contribution', 'Payment by Holland Circuit', 1000.00, 4, 2025, cid('Holland')),
    txn('2025-10-15', 'receipt', 'circuit_contribution', 'Payment by Holland Circuit (2nd)', 157.00, 4, 2025, cid('Holland')),
    txn('2025-10-16', 'receipt', 'circuit_contribution', 'Belgium Circuit Payment', 1116.00, 4, 2025, cid('Belgium')),
    txn('2025-10-23', 'receipt', 'circuit_contribution', 'Finland Circuit Payment', 280.00, 4, 2025, cid('Finland')),
    txn('2025-10-24', 'receipt', 'circuit_contribution', 'Finland Circuit Payment (2nd)', 67.00, 4, 2025, cid('Finland')),
    txn('2025-10-25', 'receipt', 'circuit_contribution', 'Stuttgart Circuit Payment', 1000.00, 4, 2025, cid('Stuttgart')),
    txn('2025-10-27', 'receipt', 'circuit_contribution', 'Belgium Circuit Payment (3rd)', 200.00, 4, 2025, cid('Belgium')),
    txn('2025-11-23', 'receipt', 'circuit_contribution', 'Belgium Circuit Payout', 500.00, 4, 2025, cid('Belgium')),
    txn('2025-12-30', 'receipt', 'circuit_contribution', 'Finland Circuit Payment', 135.00, 4, 2025, cid('Finland')),

    // ---- PAYMENTS ----
    txn('2025-10-04', 'payment', 'postage', 'Holland T&T Package postage', 31.49, 4, 2025, cid('Holland'), 'Transport & postage for Holland package'),
    txn('2025-10-13', 'payment', 'other', 'Payment to Bank', 1400.00, 4, 2025, undefined, 'Cash transferred to bank account'),
    txn('2025-10-16', 'payment', 'merchandise_purchase', 'Tree of Life 16pcs + T-shirt 40pcs purchase', 192.00, 4, 2025, undefined, 'Tree of Life 16pcs @12/pc. T-shirt 40pcs included in batch.'),
    txn('2025-11-25', 'payment', 'merchandise_purchase', 'Handbooks purchase from Ghana', 812.00, 4, 2025, undefined, 'Large handbook order'),
    txn('2025-12-06', 'payment', 'merchandise_purchase', 'Officers Badges purchase', 980.00, 4, 2025, undefined, 'Bulk officer badge order from Ghana'),
    txn('2025-12-08', 'payment', 'transportation', 'Extra Bag from Ghana – transportation', 140.00, 4, 2025, undefined, 'Shipping cost for extra bag from Ghana'),
    txn('2025-12-12', 'payment', 'merchandise_purchase', 'Lacoste T-Shirt 9pcs, Enrolment Badge 100pcs, Headgear 15pcs, Enrolment Service BK', 13.60, 4, 2025, undefined,
      'Combined purchase batch: Lacoste T-Shirt 9pcs, Enrolment Badge 100pcs, Headgear 15pcs, Enrolment Service Book'),
    txn('2025-12-21', 'payment', 'merchandise_purchase', 'Scarf 50pcs, Cap Headgear, Enrollment Badges', 180.00, 4, 2025, undefined, 'Scarf 50pcs @3.60/pc. Cap Headgear and Enrollment Badges included in batch.'),
  ];

  // ==================================================================
  // STOCK MOVEMENTS — derived from the documents
  // ==================================================================
  const stockMovements: Omit<StockMovement, 'id'>[] = [
    // ---- Q4 2023 initial purchases from Ghana ----
    sm('2023-12-05', pid('Regalia'), 'purchase', 90, 3.00, 4, 2023, undefined, 'Purchase from Ghana'),
    sm('2023-12-05', pid('Gold Badge'), 'purchase', 3, 6.00, 4, 2023, undefined, 'Purchase from Ghana'),

    // Q4 2023 sales
    sm('2023-11-01', pid('Jacket'), 'sale', 16, 35.00, 4, 2023, cid('Hamburg'), 'Hannover 14 + Wesley 2'),
    sm('2023-11-10', pid('Tree of Life'), 'sale', 2, 70.00, 4, 2023, cid('Dusseldorf')),
    sm('2023-11-10', pid('Enrolment'), 'sale', 10, 4.00, 4, 2023, cid('Dusseldorf')),
    sm('2023-11-10', pid('Headgear'), 'sale', 10, 4.00, 4, 2023, cid('Dusseldorf')),

    // ---- Q1 2024 ----
    // Hamburg Sales Jan
    sm('2024-01-06', pid('Headgear'), 'sale', 10, 4.00, 1, 2024, cid('Hamburg')),
    sm('2024-01-06', pid('Gold Badge'), 'sale', 2, 10.00, 1, 2024, cid('Hamburg')),
    sm('2024-01-06', pid('Officer'), 'sale', 5, 5.00, 1, 2024, cid('Hamburg')),
    sm('2024-01-06', pid('Regalia'), 'sale', 6, 8.00, 1, 2024, cid('Hamburg')),
    sm('2024-01-06', pid('Tree of Life'), 'sale', 1, 70.00, 1, 2024, cid('Hamburg')),

    // Holland Sales Feb
    sm('2024-02-15', pid('Regalia'), 'sale', 6, 8.00, 1, 2024, cid('Holland')),
    sm('2024-02-15', pid('Jacket'), 'sale', 1, 35.00, 1, 2024, cid('Holland')),

    // Purchases from Ghana Feb
    sm('2024-02-28', pid('Handbook'), 'purchase', 150, 1.53, 1, 2024, undefined, '150 copies from Ghana @229 total'),
    sm('2024-02-28', pid('Dues Card'), 'purchase', 50, 0.30, 1, 2024, undefined, '50 Dues Cards'),
    sm('2024-02-28', pid('Lacoste'), 'purchase', 33, 5.00, 1, 2024, undefined, '33 T-shirts from Ghana'),
    sm('2024-02-28', pid('Tree of Life'), 'purchase', 10, 38.00, 1, 2024, undefined, '10 pcs Tree of Life'),

    // Handbook sales Mar
    sm('2024-03-25', pid('Handbook'), 'sale', 23, 4.00, 1, 2024, cid('Italy')),
    sm('2024-03-25', pid('Handbook'), 'sale', 20, 4.00, 1, 2024, cid('Belgium')),
    sm('2024-03-25', pid('Handbook'), 'sale', 30, 3.50, 1, 2024, cid('Stuttgart')),
    sm('2024-03-25', pid('Handbook'), 'sale', 20, 4.00, 1, 2024, cid('Dusseldorf')),
    sm('2024-03-25', pid('Handbook'), 'sale', 5, 4.00, 1, 2024, cid('Finland')),
    sm('2024-03-25', pid('Handbook'), 'sale', 31, 4.00, 1, 2024, cid('Hamburg')),
    sm('2024-03-25', pid('Handbook'), 'sale', 20, 4.00, 1, 2024, cid('Holland')),

    // Holland jacket sale Mar
    sm('2024-03-30', pid('Jacket'), 'sale', 1, 35.00, 1, 2024, cid('Holland')),

    // ---- Q2 2024 ----
    // Finland sales May
    sm('2024-05-08', pid('Regalia'), 'sale', 6, 8.00, 2, 2024, cid('Finland')),
    sm('2024-05-08', pid('Officer'), 'sale', 5, 5.00, 2, 2024, cid('Finland')),
    sm('2024-05-08', pid('Lacoste'), 'sale', 4, 8.00, 2, 2024, cid('Finland')),
    sm('2024-05-08', pid('Headgear'), 'sale', 1, 4.00, 2, 2024, cid('Finland')),
    sm('2024-05-08', pid('Handbook'), 'sale', 5, 4.00, 2, 2024, cid('Finland')),

    // Italy sales May
    sm('2024-05-20', pid('Tree of Life'), 'sale', 3, 70.00, 2, 2024, cid('Italy')),
    sm('2024-05-20', pid('Regalia'), 'sale', 6, 8.00, 2, 2024, cid('Italy')),

    // Stuttgart sales Jun
    sm('2024-06-21', pid('Regalia'), 'sale', 6, 8.00, 2, 2024, cid('Stuttgart')),

    // Hamburg sales Jun
    sm('2024-06-24', pid('Lacoste'), 'sale', 5, 8.00, 2, 2024, cid('Hamburg')),
    sm('2024-06-24', pid('Tree of Life'), 'sale', 2, 70.00, 2, 2024, cid('Hamburg')),
    sm('2024-06-24', pid('Jacket'), 'sale', 12, 35.00, 2, 2024, cid('Hamburg')),

    // ---- Q3 2024 ----
    // Jacket purchase Jul
    sm('2024-07-15', pid('Jacket'), 'purchase', 250, 32.07, 3, 2024, undefined, '250 new jackets @8016.25 total'),

    // Purchase from Ghana Aug
    sm('2024-08-30', pid('Headgear'), 'purchase', 15, 2.00, 3, 2024, undefined, 'From Ghana'),
    sm('2024-08-30', pid('Tree of Life'), 'purchase', 10, 38.00, 3, 2024, undefined, 'From Ghana'),
    sm('2024-08-30', pid('Officer'), 'purchase', 50, 3.00, 3, 2024, undefined, 'From Ghana'),
    sm('2024-08-30', pid('Lacoste'), 'purchase', 11, 5.00, 3, 2024, undefined, '11 T-shirts from Ghana'),

    // Cash Sales Aug (retreat event)
    sm('2024-08-30', pid('Tree of Life'), 'sale', 5, 70.00, 3, 2024, undefined, 'Cash sales at event'),
    sm('2024-08-30', pid('Lacoste'), 'sale', 30, 8.00, 3, 2024, undefined, 'Cash sales at event'),
    sm('2024-08-30', pid('Headgear'), 'sale', 13, 4.00, 3, 2024, undefined, 'Cash sales at event'),
    sm('2024-08-30', pid('Jacket'), 'sale', 6, 35.00, 3, 2024, undefined, 'Cash sales at event'),
    sm('2024-08-30', pid('Dues Card'), 'sale', 14, 2.00, 3, 2024, undefined, 'Cash sales at event'),
    sm('2024-08-30', pid('Enrolment'), 'sale', 16, 4.00, 3, 2024, undefined, 'Cash sales at event'),

    // ---- Q4 2024 ----
    // Belgium sales Oct
    sm('2024-10-20', pid('Regalia'), 'sale', 6, 8.00, 4, 2024, cid('Belgium')),
    sm('2024-10-20', pid('Officer'), 'sale', 5, 5.00, 4, 2024, cid('Belgium')),
    sm('2024-10-20', pid('Jacket'), 'sale', 20, 37.00, 4, 2024, cid('Belgium')),

    // Hamburg Hannover – Tree of Life Dec
    sm('2024-12-22', pid('Tree of Life'), 'sale', 2, 70.00, 4, 2024, cid('Hamburg')),

    // Handbook purchase from Ghana Dec
    sm('2024-12-14', pid('Handbook'), 'purchase', 200, 1.50, 4, 2024, undefined, '200 from Ghana'),

    // ---- 2025 ----
    // Q4 2025 – Tree of Life purchase Oct
    sm('2025-10-16', pid('Tree of Life'), 'purchase', 16, 12.00, 4, 2025, undefined, '16 pcs from Ghana @12/pc'),

    // Q4 2025 – Lacoste T-Shirt 40pcs Oct (part of batch with Tree of Life)
    sm('2025-10-16', pid('Lacoste'), 'purchase', 40, 5.00, 4, 2025, undefined, '40 pcs T-shirts, part of batch purchase'),

    // Q4 2025 – Scarf 50pcs Dec
    sm('2025-12-21', pid('Scarf'), 'purchase', 50, 3.60, 4, 2025, undefined, '50 scarves @3.60/pc from Ghana'),

    // Q4 2025 – Lacoste T-Shirt 9pcs Dec
    sm('2025-12-12', pid('Lacoste'), 'purchase', 9, 1.51, 4, 2025, undefined, '9 pcs Lacoste T-shirt, part of combined purchase batch'),

    // Q4 2025 – Enrolment Badge 100pcs Dec
    sm('2025-12-12', pid('Enrolment'), 'purchase', 100, 2.00, 4, 2025, undefined, '100 enrolment badges, part of combined purchase batch'),

    // Q4 2025 – Headgear 15pcs Dec
    sm('2025-12-12', pid('Headgear'), 'purchase', 15, 2.00, 4, 2025, undefined, '15 headgear caps, part of combined purchase batch'),

    // Q3 2025 – Jacket sale/distribution to Berlin seebranch
    sm('2025-09-25', pid('Jacket'), 'sale', 11, 34.82, 3, 2025, undefined, 'Berlin seebranch – 11 jackets plus others, total €383'),
  ];

  // ==================================================================
  // EVENTS
  // ==================================================================
  const events: Omit<MissionEvent, 'id'>[] = [
    {
      uid: generateId(),
      name: 'Europe Mission Retreat 2023',
      type: 'retreat' as const,
      startDate: '2023-09-21',
      endDate: '2023-09-23',
      notes: 'Main annual retreat. Income and expenses spread across Q3-Q4 2023 and Q3 2024.',
      createdAt: now(),
    },
    {
      uid: generateId(),
      name: 'Europe Youth Maiden Conference 2023',
      type: 'conference' as const,
      startDate: '2023-11-25',
      endDate: '2023-11-25',
      notes: 'First youth conference. Donation of €100 given.',
      createdAt: now(),
    },
    {
      uid: generateId(),
      name: 'Finland Circuit Inauguration',
      type: 'inauguration' as const,
      startDate: '2024-05-08',
      endDate: '2024-05-08',
      notes: 'Inauguration of Finland circuit. Donation of €300.',
      createdAt: now(),
    },
    {
      uid: generateId(),
      name: 'Belgium Circuit Inauguration',
      type: 'inauguration' as const,
      startDate: '2024-12-01',
      endDate: '2024-12-01',
      notes: 'Inauguration of Belgium circuit. €300 donated, €350 contributed by 7 circuits.',
      createdAt: now(),
    },
    {
      uid: generateId(),
      name: 'Youth Conference 2024',
      type: 'conference' as const,
      startDate: '2024-06-15',
      endDate: '2024-06-15',
      notes: '€150 spent per annual summary.',
      createdAt: now(),
    },
  ];

  // ==================================================================
  // WRITE TO DATABASE
  // ==================================================================
  const allTransactions = [
    ...q4_2023,
    ...q1_2024,
    ...q2_2024,
    ...q3_2024,
    ...q4_2024,
    ...q1_2025,
    ...q2_2025,
    ...q3_2025,
    ...q4_2025,
  ];

  await db.transactions.bulkAdd(allTransactions as Transaction[]);
  console.log(`[Martha] Seeded ${allTransactions.length} transactions.`);

  await db.stockMovements.bulkAdd(stockMovements as StockMovement[]);
  console.log(`[Martha] Seeded ${stockMovements.length} stock movements.`);

  await db.events.bulkAdd(events);
  console.log(`[Martha] Seeded ${events.length} events.`);

  // ==================================================================
  // UPDATE PRODUCT STOCK from movements
  // ==================================================================
  // Recalculate current stock from all movements
  for (const product of allProducts) {
    const movements = await db.stockMovements
      .where('productId')
      .equals(product.uid)
      .toArray();

    let stock = 0;
    for (const m of movements) {
      if (m.type === 'sale') {
        stock -= m.quantity;
      } else {
        stock += m.quantity;
      }
    }

    // Don't go below 0
    stock = Math.max(0, stock);

    if (product.id) {
      await db.products.update(product.id, { currentStock: stock, updatedAt: now() });
    }
  }
  console.log('[Martha] Product stock levels updated from movements.');

  console.log('[Martha] Historical data seeding complete!');
}
