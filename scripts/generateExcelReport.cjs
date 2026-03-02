// ============================================================
// EUROPE MISSION — Advanced Excel Financial Report Generator
// Covers: Q1 2024 through Q4 2025 (with 2024/25 outstanding debts)
// ============================================================

const ExcelJS = require('exceljs');
const path = require('path');

// ── Colour palette ──
const NAVY     = '1B2A4A';
const GOLD     = 'C5A572';
const CREAM    = 'FFF8F0';
const WHITE    = 'FFFFFF';
const LIGHT_BG = 'F5F0E8';
const GREEN    = '27AE60';
const RED      = 'E74C3C';
const BLUE     = '2980B9';
const GREY     = '95A5A6';
const DARK     = '2C3E50';
const LIGHT_GOLD = 'F5EBD7';
const LIGHT_GREEN = 'E8F5E9';
const LIGHT_RED   = 'FDEDEC';

// ── All transactions 2024-2025 ──
const transactions = [
  // ===================== Q1 2024 (Jan-Mar) =====================
  { date: '2024-01-01', type: 'receipt', category: 'opening_balance', description: 'Balance C/F from December 2023', amount: 7494.75, circuit: '', quarter: 'Q1', year: 2024, notes: '' },
  { date: '2024-01-06', type: 'receipt', category: 'merchandise_sale', description: 'Hamburg Sales – Headgear, Gold Badge, Officer Badge, Regalia, Tree of Life', amount: 203.00, circuit: 'Hamburg', quarter: 'Q1', year: 2024, notes: 'Headgear 10×4=40, Gold Badge 2×10=20, Officer Badge 5×5=25, Regalia 6×8=48, Tree of Life 1×70=70' },
  { date: '2024-02-15', type: 'receipt', category: 'debt_repayment', description: 'Stuttgart Circuit payment of Jackets', amount: 500.00, circuit: 'Stuttgart', quarter: 'Q1', year: 2024, notes: '' },
  { date: '2024-02-15', type: 'receipt', category: 'merchandise_sale', description: 'Holland Circuit Sales – Regalia 6pcs, Jacket 1pc', amount: 81.00, circuit: 'Holland', quarter: 'Q1', year: 2024, notes: 'Regalia 6×8=48, Jacket 1×35=33' },
  { date: '2024-02-28', type: 'payment', category: 'merchandise_purchase', description: 'Handbooks purchased from Ghana – 150 copies', amount: 229.00, circuit: '', quarter: 'Q1', year: 2024, notes: '150 Handbooks' },
  { date: '2024-02-28', type: 'payment', category: 'merchandise_purchase', description: 'Dues Cards purchased from Ghana – 50pcs', amount: 250.00, circuit: '', quarter: 'Q1', year: 2024, notes: '' },
  { date: '2024-02-28', type: 'payment', category: 'merchandise_purchase', description: 'T-shirts purchased from Ghana – 33pcs', amount: 240.00, circuit: '', quarter: 'Q1', year: 2024, notes: '33 Lacoste T-Shirts' },
  { date: '2024-03-01', type: 'payment', category: 'transportation', description: 'Transportation from Ghana – extra bag cloth & T-shirt', amount: 170.00, circuit: '', quarter: 'Q1', year: 2024, notes: '' },
  { date: '2024-03-01', type: 'payment', category: 'transportation', description: 'Transportation errand from Ghana', amount: 130.00, circuit: '', quarter: 'Q1', year: 2024, notes: '' },
  { date: '2024-03-03', type: 'payment', category: 'airtime', description: 'Air Time Credit for Zoom large meeting March 2024', amount: 56.73, circuit: '', quarter: 'Q1', year: 2024, notes: '' },
  { date: '2024-03-15', type: 'payment', category: 'airtime', description: 'Air Time Credit – Snr Sis Grace & Presiding Bishop\'s Wife', amount: 100.00, circuit: '', quarter: 'Q1', year: 2024, notes: '' },
  { date: '2024-03-23', type: 'payment', category: 'postage', description: 'Postage to countries (Handbooks)', amount: 108.84, circuit: '', quarter: 'Q1', year: 2024, notes: 'Italy 51.49, Belgium 18.95, Finland 19.50, Holland 18.90' },
  { date: '2024-03-25', type: 'receipt', category: 'merchandise_sale', description: 'Handbook sales – Italy Circuit 23pcs', amount: 92.00, circuit: 'Italy', quarter: 'Q1', year: 2024, notes: '23 × €4.00' },
  { date: '2024-03-25', type: 'receipt', category: 'merchandise_sale', description: 'Handbook sales – Belgium 20pcs', amount: 80.00, circuit: 'Belgium', quarter: 'Q1', year: 2024, notes: '20 × €4.00' },
  { date: '2024-03-25', type: 'receipt', category: 'merchandise_sale', description: 'Handbook sales – Stuttgart 30pcs', amount: 105.00, circuit: 'Stuttgart', quarter: 'Q1', year: 2024, notes: '30 × €3.50' },
  { date: '2024-03-25', type: 'receipt', category: 'merchandise_sale', description: 'Handbook sales – Dusseldorf 20pcs', amount: 80.00, circuit: 'Dusseldorf', quarter: 'Q1', year: 2024, notes: '20 × €4.00' },
  { date: '2024-03-25', type: 'receipt', category: 'merchandise_sale', description: 'Handbook sales – Finland 5pcs', amount: 20.00, circuit: 'Finland', quarter: 'Q1', year: 2024, notes: '5 × €4.00' },
  { date: '2024-03-25', type: 'receipt', category: 'merchandise_sale', description: 'Handbook sales – Hamburg 31pcs', amount: 124.00, circuit: 'Hamburg', quarter: 'Q1', year: 2024, notes: '31 × €4.00' },
  { date: '2024-03-25', type: 'receipt', category: 'merchandise_sale', description: 'Handbook sales – Holland 20pcs', amount: 80.00, circuit: 'Holland', quarter: 'Q1', year: 2024, notes: '20 × €4.00' },
  { date: '2024-03-30', type: 'receipt', category: 'merchandise_sale', description: 'Jacket sale to Holland – 1pc', amount: 35.00, circuit: 'Holland', quarter: 'Q1', year: 2024, notes: '' },
  { date: '2024-03-31', type: 'payment', category: 'stationery', description: 'Stationery – Cellotape 3×2.90', amount: 8.70, circuit: '', quarter: 'Q1', year: 2024, notes: '' },
  { date: '2024-03-31', type: 'receipt', category: 'debt_repayment', description: 'Stuttgart Circuit – Payment of old debt', amount: 300.00, circuit: 'Stuttgart', quarter: 'Q1', year: 2024, notes: '' },

  // ===================== Q2 2024 (Apr-Jun) =====================
  { date: '2024-04-03', type: 'receipt', category: 'opening_balance', description: 'Balance C/F from March 2024', amount: 8052.32, circuit: '', quarter: 'Q2', year: 2024, notes: '' },
  { date: '2024-05-08', type: 'receipt', category: 'circuit_contribution', description: 'Circuit contributions – Hamburg', amount: 50.00, circuit: 'Hamburg', quarter: 'Q2', year: 2024, notes: '' },
  { date: '2024-05-08', type: 'receipt', category: 'circuit_contribution', description: 'Circuit contributions – Stuttgart', amount: 50.00, circuit: 'Stuttgart', quarter: 'Q2', year: 2024, notes: '' },
  { date: '2024-05-08', type: 'receipt', category: 'circuit_contribution', description: 'Circuit contributions – Holland', amount: 50.00, circuit: 'Holland', quarter: 'Q2', year: 2024, notes: '' },
  { date: '2024-05-08', type: 'receipt', category: 'circuit_contribution', description: 'Circuit contributions – Italy', amount: 50.00, circuit: 'Italy', quarter: 'Q2', year: 2024, notes: '' },
  { date: '2024-05-08', type: 'receipt', category: 'circuit_contribution', description: 'Circuit contributions – Dusseldorf', amount: 50.00, circuit: 'Dusseldorf', quarter: 'Q2', year: 2024, notes: '' },
  { date: '2024-05-08', type: 'receipt', category: 'circuit_contribution', description: 'Circuit contributions – Belgium', amount: 50.00, circuit: 'Belgium', quarter: 'Q2', year: 2024, notes: '' },
  { date: '2024-05-08', type: 'receipt', category: 'merchandise_sale', description: 'Sales to Finland – Regalia, Officer Badge, T-shirt, Headgear, Handbook', amount: 129.00, circuit: 'Finland', quarter: 'Q2', year: 2024, notes: 'Regalia 6×8=48, Officer Badge 5×5=25, Lacoste T-shirt 4×8=32, Headgear 1×4=4, Handbook 5×4=20' },
  { date: '2024-05-08', type: 'payment', category: 'donation_given', description: 'Inauguration of Finland Circuit – Donation', amount: 300.00, circuit: 'Finland', quarter: 'Q2', year: 2024, notes: '' },
  { date: '2024-05-20', type: 'receipt', category: 'merchandise_sale', description: 'Sales to Italy Circuit – Tree of Life 3pcs, Regalia 6pcs', amount: 258.00, circuit: 'Italy', quarter: 'Q2', year: 2024, notes: 'Tree of Life 3×70=210, Regalia 6×8=48' },
  { date: '2024-05-20', type: 'receipt', category: 'debt_repayment', description: 'Payment by Italy (overpayment on merchandise)', amount: 22.00, circuit: 'Italy', quarter: 'Q2', year: 2024, notes: '' },
  { date: '2024-05-28', type: 'payment', category: 'event_expense', description: 'Retreat – Part Payment for Cruise', amount: 4000.00, circuit: '', quarter: 'Q2', year: 2024, notes: '' },
  { date: '2024-06-21', type: 'receipt', category: 'merchandise_sale', description: 'Sales to Stuttgart – Regalia 6pcs', amount: 48.00, circuit: 'Stuttgart', quarter: 'Q2', year: 2024, notes: '6 × €8.00' },
  { date: '2024-06-24', type: 'receipt', category: 'merchandise_sale', description: 'Sales to Hamburg – Lacoste T-shirt, Tree of Life, Jackets', amount: 600.00, circuit: 'Hamburg', quarter: 'Q2', year: 2024, notes: 'T-shirt 5×8=40, Tree of Life 2×70=140, Jackets 12×35=420' },
  { date: '2024-06-24', type: 'payment', category: 'merchandise_purchase', description: 'New Jacket Order – Part payment', amount: 4000.00, circuit: '', quarter: 'Q2', year: 2024, notes: 'Part payment for 250 new jackets' },

  // ===================== Q3 2024 (Jul-Sep) =====================
  { date: '2024-07-01', type: 'receipt', category: 'opening_balance', description: 'Balance C/F from 30th June 2024', amount: 1061.32, circuit: '', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-07-15', type: 'payment', category: 'merchandise_purchase', description: 'New Jackets purchased – 250pcs full invoice', amount: 8016.25, circuit: '', quarter: 'Q3', year: 2024, notes: '250 new jackets' },
  { date: '2024-07-15', type: 'payment', category: 'transportation', description: 'Jacket Transportation from Holland', amount: 250.00, circuit: 'Holland', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-24', type: 'receipt', category: 'event_income', description: 'Proceeds from Retreat (Sept 21–23, 2023)', amount: 19462.00, circuit: '', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-24', type: 'payment', category: 'event_expense', description: 'Retreat – Hostel fee', amount: 7704.00, circuit: '', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-24', type: 'payment', category: 'event_expense', description: 'Retreat – Cruise fee', amount: 3785.59, circuit: '', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-24', type: 'payment', category: 'stationery', description: 'Retreat – Stationery/Banner', amount: 50.00, circuit: '', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-24', type: 'payment', category: 'honorarium', description: 'Retreat – Honorarium', amount: 200.00, circuit: '', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-24', type: 'payment', category: 'event_expense', description: 'Retreat – Chairs and tables hired', amount: 250.00, circuit: '', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-24', type: 'payment', category: 'transportation', description: 'Retreat – Fuel', amount: 395.00, circuit: '', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-24', type: 'payment', category: 'event_expense', description: 'Retreat – Photos and videos', amount: 250.00, circuit: '', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-24', type: 'payment', category: 'event_expense', description: 'Retreat – Decorations', amount: 100.00, circuit: '', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-24', type: 'payment', category: 'event_expense', description: 'Retreat – Committee levy to support food', amount: 1050.00, circuit: '', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-27', type: 'receipt', category: 'event_income', description: 'Late retreat fee payment by Finland', amount: 100.00, circuit: 'Finland', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-30', type: 'receipt', category: 'debt_repayment', description: 'Italy Circuit Payment', amount: 401.00, circuit: 'Italy', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-08-30', type: 'payment', category: 'merchandise_purchase', description: 'Purchase from Ghana – Headgear, Tree of Life, Officer Badge, T-Shirt', amount: 410.00, circuit: '', quarter: 'Q3', year: 2024, notes: 'Headgear 15, TofL 10, Officer 50, T-shirt 11' },
  { date: '2024-08-30', type: 'receipt', category: 'merchandise_sale', description: 'Cash Sales – Retreat event', amount: 948.00, circuit: '', quarter: 'Q3', year: 2024, notes: 'TofL 5×70, T-shirt 30×8, Headgear 13×4, Jackets 6×35, Dues 14×2, Enrol 16×4' },
  { date: '2024-09-03', type: 'receipt', category: 'event_income', description: 'Late retreat fee by Hamburg', amount: 50.00, circuit: 'Hamburg', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-09-03', type: 'receipt', category: 'debt_repayment', description: 'Payment of Jacket by UK', amount: 401.28, circuit: 'UK', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-09-03', type: 'receipt', category: 'debt_repayment', description: 'Payment of Jacket by UK (2nd)', amount: 283.66, circuit: 'UK', quarter: 'Q3', year: 2024, notes: '' },
  { date: '2024-09-05', type: 'payment', category: 'gift', description: 'Send-Off Connexion Gift', amount: 150.00, circuit: '', quarter: 'Q3', year: 2024, notes: '' },

  // ===================== Q4 2024 (Oct-Dec) =====================
  { date: '2024-10-20', type: 'receipt', category: 'event_income', description: 'Late payment of retreat fee by Belgium', amount: 100.00, circuit: 'Belgium', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-10-20', type: 'receipt', category: 'debt_repayment', description: 'Payment of new Jacket by Belgium', amount: 73.00, circuit: 'Belgium', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-10-20', type: 'receipt', category: 'merchandise_sale', description: 'Belgium sales – Regalia 6pcs, Officer Badge 5pcs, Jacket 20pcs', amount: 813.00, circuit: 'Belgium', quarter: 'Q4', year: 2024, notes: 'Regalia 6×8=48, Officer Badge 5×5=25, Jacket 20×37=740' },
  { date: '2024-10-20', type: 'receipt', category: 'circuit_contribution', description: 'Retreat Centre Cape Coast levy – Finland', amount: 43.50, circuit: 'Finland', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-10-20', type: 'receipt', category: 'circuit_contribution', description: 'Retreat Centre Cape Coast levy – Hamburg', amount: 148.50, circuit: 'Hamburg', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-10-20', type: 'receipt', category: 'circuit_contribution', description: 'Retreat Centre Cape Coast levy – Italy', amount: 114.00, circuit: 'Italy', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-10-20', type: 'receipt', category: 'circuit_contribution', description: 'Retreat Centre Cape Coast levy – Modena (Italy)', amount: 37.50, circuit: 'Italy (Modena)', quarter: 'Q4', year: 2024, notes: 'Modena sub-branch' },
  { date: '2024-10-20', type: 'receipt', category: 'circuit_contribution', description: 'Retreat Centre Cape Coast levy – Belgium', amount: 109.50, circuit: 'Belgium', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-10-20', type: 'receipt', category: 'circuit_contribution', description: 'Retreat Centre Cape Coast levy – Stuttgart', amount: 82.50, circuit: 'Stuttgart', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-10-20', type: 'receipt', category: 'circuit_contribution', description: 'Retreat Centre Cape Coast levy – Dusseldorf', amount: 55.50, circuit: 'Dusseldorf', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-10-20', type: 'receipt', category: 'circuit_contribution', description: 'Retreat Centre Cape Coast levy – Holland', amount: 180.00, circuit: 'Holland', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-11-09', type: 'payment', category: 'donation_given', description: 'Payment to Ghana for the Retreat Centre', amount: 771.00, circuit: '', quarter: 'Q4', year: 2024, notes: 'Cape Coast retreat centre' },
  { date: '2024-11-15', type: 'payment', category: 'other', description: 'Miscellaneous – Connexion program', amount: 350.00, circuit: '', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-11-20', type: 'payment', category: 'airtime', description: 'Air time', amount: 75.00, circuit: '', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-12-01', type: 'receipt', category: 'circuit_contribution', description: 'Support Belgium inauguration – Holland', amount: 50.00, circuit: 'Holland', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-12-01', type: 'receipt', category: 'circuit_contribution', description: 'Support Belgium inauguration – Hamburg', amount: 50.00, circuit: 'Hamburg', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-12-01', type: 'receipt', category: 'circuit_contribution', description: 'Support Belgium inauguration – Finland', amount: 50.00, circuit: 'Finland', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-12-01', type: 'receipt', category: 'circuit_contribution', description: 'Support Belgium inauguration – Dusseldorf', amount: 50.00, circuit: 'Dusseldorf', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-12-01', type: 'receipt', category: 'circuit_contribution', description: 'Support Belgium inauguration – Italy', amount: 50.00, circuit: 'Italy', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-12-01', type: 'receipt', category: 'circuit_contribution', description: 'Support Belgium inauguration – Modena', amount: 50.00, circuit: 'Italy (Modena)', quarter: 'Q4', year: 2024, notes: 'Modena sub-branch' },
  { date: '2024-12-01', type: 'receipt', category: 'circuit_contribution', description: 'Support Belgium inauguration – Stuttgart', amount: 50.00, circuit: 'Stuttgart', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-12-10', type: 'payment', category: 'donation_given', description: 'Donation to Belgium (inauguration support)', amount: 300.00, circuit: 'Belgium', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-12-14', type: 'payment', category: 'honorarium', description: 'Honorarium – Bro. Mensou and others', amount: 200.00, circuit: '', quarter: 'Q4', year: 2024, notes: '' },
  { date: '2024-12-14', type: 'payment', category: 'merchandise_purchase', description: 'Handbooks purchased from Ghana – 200pcs', amount: 300.00, circuit: '', quarter: 'Q4', year: 2024, notes: '200 copies' },
  { date: '2024-12-22', type: 'receipt', category: 'merchandise_sale', description: 'Hamburg (Hannover) – Tree of Life 2pcs', amount: 140.00, circuit: 'Hamburg', quarter: 'Q4', year: 2024, notes: '2 × €70.00' },

  // ===================== Q1 2025 (Jan-Mar) =====================
  { date: '2025-01-08', type: 'receipt', category: 'debt_repayment', description: 'Italy Circuit – Payment of items bought', amount: 530.00, circuit: 'Italy', quarter: 'Q1', year: 2025, notes: '' },
  { date: '2025-01-18', type: 'payment', category: 'other', description: 'Cash deposit to bank', amount: 200.00, circuit: '', quarter: 'Q1', year: 2025, notes: '' },
  { date: '2025-02-03', type: 'payment', category: 'other', description: 'Cash deposit to bank', amount: 200.00, circuit: '', quarter: 'Q1', year: 2025, notes: '' },
  { date: '2025-03-03', type: 'payment', category: 'other', description: 'Cash Deposit to Bank', amount: 3500.00, circuit: '', quarter: 'Q1', year: 2025, notes: '' },
  { date: '2025-03-03', type: 'payment', category: 'postage', description: 'T&T to Italy – Package postage', amount: 20.41, circuit: 'Italy', quarter: 'Q1', year: 2025, notes: '' },
  { date: '2025-03-11', type: 'receipt', category: 'circuit_contribution', description: 'Payment by Belgium Circuit', amount: 134.00, circuit: 'Belgium', quarter: 'Q1', year: 2025, notes: '' },

  // ===================== Q2 2025 (Apr-Jun) =====================
  { date: '2025-04-11', type: 'receipt', category: 'circuit_contribution', description: 'Payment by Finland Circuit', amount: 20.00, circuit: 'Finland', quarter: 'Q2', year: 2025, notes: '' },
  { date: '2025-04-17', type: 'receipt', category: 'circuit_contribution', description: 'Payment by Belgium', amount: 700.00, circuit: 'Belgium', quarter: 'Q2', year: 2025, notes: '' },
  { date: '2025-04-17', type: 'payment', category: 'other', description: 'Cash Deposit to Bank', amount: 5000.00, circuit: '', quarter: 'Q2', year: 2025, notes: '' },
  { date: '2025-04-23', type: 'payment', category: 'merchandise_purchase', description: 'Payment of Europe Cloth', amount: 5000.00, circuit: '', quarter: 'Q2', year: 2025, notes: 'Europe Mission Cloth – major purchase' },
  { date: '2025-05-24', type: 'receipt', category: 'circuit_contribution', description: 'Payment by Italy Circuit', amount: 500.00, circuit: 'Italy', quarter: 'Q2', year: 2025, notes: '' },
  { date: '2025-05-24', type: 'receipt', category: 'circuit_contribution', description: 'Dusseldorf Circuit Payment', amount: 600.00, circuit: 'Dusseldorf', quarter: 'Q2', year: 2025, notes: '' },
  { date: '2025-06-15', type: 'payment', category: 'gift', description: 'Gift for Presiding', amount: 60.00, circuit: '', quarter: 'Q2', year: 2025, notes: '' },
  { date: '2025-06-24', type: 'receipt', category: 'circuit_contribution', description: 'Holland Circuit Payment', amount: 320.00, circuit: 'Holland', quarter: 'Q2', year: 2025, notes: '' },

  // ===================== Q3 2025 (Jul-Sep) =====================
  { date: '2025-07-25', type: 'receipt', category: 'circuit_contribution', description: 'Italy Circuit Payment', amount: 300.00, circuit: 'Italy', quarter: 'Q3', year: 2025, notes: '' },
  { date: '2025-07-31', type: 'receipt', category: 'circuit_contribution', description: 'Belgium Circuit Payment', amount: 162.00, circuit: 'Belgium', quarter: 'Q3', year: 2025, notes: '' },
  { date: '2025-08-01', type: 'receipt', category: 'merchandise_sale', description: 'Henry Retail Centre – Cash Sales', amount: 220.00, circuit: '', quarter: 'Q3', year: 2025, notes: '' },
  { date: '2025-08-13', type: 'payment', category: 'event_expense', description: 'Conference extra contribution', amount: 138.00, circuit: '', quarter: 'Q3', year: 2025, notes: '' },
  { date: '2025-08-15', type: 'receipt', category: 'circuit_contribution', description: 'Holland Circuit Payment', amount: 200.00, circuit: 'Holland', quarter: 'Q3', year: 2025, notes: '' },
  { date: '2025-08-16', type: 'receipt', category: 'circuit_contribution', description: 'Holland Circuit Payment (2nd)', amount: 650.00, circuit: 'Holland', quarter: 'Q3', year: 2025, notes: '' },
  { date: '2025-09-20', type: 'payment', category: 'merchandise_purchase', description: 'Europe Mission Cloth', amount: 1000.00, circuit: '', quarter: 'Q3', year: 2025, notes: '' },
  { date: '2025-09-20', type: 'payment', category: 'donation_given', description: 'Retreale Cape Coast', amount: 200.00, circuit: '', quarter: 'Q3', year: 2025, notes: '' },
  { date: '2025-09-21', type: 'receipt', category: 'debt_repayment', description: 'Final Payment from UK – Jacket', amount: 241.64, circuit: 'UK', quarter: 'Q3', year: 2025, notes: '' },
  { date: '2025-09-25', type: 'payment', category: 'merchandise_purchase', description: 'Berlin seebranch – Jackets 11pcs & others', amount: 383.00, circuit: '', quarter: 'Q3', year: 2025, notes: '' },
  { date: '2025-09-30', type: 'payment', category: 'gift', description: 'Gift for Belgium Rev. Gymah', amount: 30.00, circuit: 'Belgium', quarter: 'Q3', year: 2025, notes: '' },

  // ===================== Q4 2025 (Oct-Dec) =====================
  { date: '2025-10-04', type: 'payment', category: 'postage', description: 'Holland T&T Package postage', amount: 31.49, circuit: 'Holland', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-10-13', type: 'payment', category: 'other', description: 'Payment to Bank', amount: 1400.00, circuit: '', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-10-14', type: 'receipt', category: 'circuit_contribution', description: 'Payment by Belgium Circuit', amount: 390.00, circuit: 'Belgium', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-10-15', type: 'receipt', category: 'circuit_contribution', description: 'Payment by Holland Circuit', amount: 1000.00, circuit: 'Holland', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-10-15', type: 'receipt', category: 'circuit_contribution', description: 'Payment by Holland Circuit (2nd)', amount: 157.00, circuit: 'Holland', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-10-16', type: 'receipt', category: 'circuit_contribution', description: 'Belgium Circuit Payment', amount: 1116.00, circuit: 'Belgium', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-10-16', type: 'payment', category: 'merchandise_purchase', description: 'Tree of Life 16pcs + T-shirt 40pcs', amount: 192.00, circuit: '', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-10-23', type: 'receipt', category: 'circuit_contribution', description: 'Finland Circuit Payment', amount: 280.00, circuit: 'Finland', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-10-24', type: 'receipt', category: 'circuit_contribution', description: 'Finland Circuit Payment (2nd)', amount: 67.00, circuit: 'Finland', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-10-25', type: 'receipt', category: 'circuit_contribution', description: 'Stuttgart Circuit Payment', amount: 1000.00, circuit: 'Stuttgart', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-10-27', type: 'receipt', category: 'circuit_contribution', description: 'Belgium Circuit Payment (3rd)', amount: 200.00, circuit: 'Belgium', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-11-23', type: 'receipt', category: 'circuit_contribution', description: 'Belgium Circuit Payout', amount: 500.00, circuit: 'Belgium', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-11-25', type: 'payment', category: 'merchandise_purchase', description: 'Handbooks purchase from Ghana', amount: 812.00, circuit: '', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-12-06', type: 'payment', category: 'merchandise_purchase', description: 'Officers Badges purchase', amount: 980.00, circuit: '', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-12-08', type: 'payment', category: 'transportation', description: 'Extra Bag from Ghana – transportation', amount: 140.00, circuit: '', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-12-12', type: 'payment', category: 'merchandise_purchase', description: 'Lacoste T-Shirt 9pcs, Enrolment Badge 100pcs, Headgear 15pcs, Enrolment Service BK', amount: 13.60, circuit: '', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-12-21', type: 'payment', category: 'merchandise_purchase', description: 'Scarf 50pcs, Cap Headgear, Enrollment Badges', amount: 180.00, circuit: '', quarter: 'Q4', year: 2025, notes: '' },
  { date: '2025-12-30', type: 'receipt', category: 'circuit_contribution', description: 'Finland Circuit Payment', amount: 135.00, circuit: 'Finland', quarter: 'Q4', year: 2025, notes: '' },
];

// ── Stock movements 2024-2025 ──
const stockMovements = [
  // Q1 2024
  { date: '2024-01-06', product: 'Headgear', type: 'sale', qty: 10, unitPrice: 4.00, circuit: 'Hamburg', quarter: 'Q1', year: 2024 },
  { date: '2024-01-06', product: 'Gold Badge', type: 'sale', qty: 2, unitPrice: 10.00, circuit: 'Hamburg', quarter: 'Q1', year: 2024 },
  { date: '2024-01-06', product: "Officer's Badge", type: 'sale', qty: 5, unitPrice: 5.00, circuit: 'Hamburg', quarter: 'Q1', year: 2024 },
  { date: '2024-01-06', product: 'Regalia', type: 'sale', qty: 6, unitPrice: 8.00, circuit: 'Hamburg', quarter: 'Q1', year: 2024 },
  { date: '2024-01-06', product: 'Tree of Life', type: 'sale', qty: 1, unitPrice: 70.00, circuit: 'Hamburg', quarter: 'Q1', year: 2024 },
  { date: '2024-02-15', product: 'Regalia', type: 'sale', qty: 6, unitPrice: 8.00, circuit: 'Holland', quarter: 'Q1', year: 2024 },
  { date: '2024-02-15', product: 'Jacket', type: 'sale', qty: 1, unitPrice: 35.00, circuit: 'Holland', quarter: 'Q1', year: 2024 },
  { date: '2024-02-28', product: 'Handbook', type: 'purchase', qty: 150, unitPrice: 1.53, circuit: '', quarter: 'Q1', year: 2024 },
  { date: '2024-02-28', product: 'Dues Card', type: 'purchase', qty: 50, unitPrice: 0.30, circuit: '', quarter: 'Q1', year: 2024 },
  { date: '2024-02-28', product: 'Lacoste T-Shirt', type: 'purchase', qty: 33, unitPrice: 5.00, circuit: '', quarter: 'Q1', year: 2024 },
  { date: '2024-02-28', product: 'Tree of Life', type: 'purchase', qty: 10, unitPrice: 38.00, circuit: '', quarter: 'Q1', year: 2024 },
  { date: '2024-03-25', product: 'Handbook', type: 'sale', qty: 23, unitPrice: 4.00, circuit: 'Italy', quarter: 'Q1', year: 2024 },
  { date: '2024-03-25', product: 'Handbook', type: 'sale', qty: 20, unitPrice: 4.00, circuit: 'Belgium', quarter: 'Q1', year: 2024 },
  { date: '2024-03-25', product: 'Handbook', type: 'sale', qty: 30, unitPrice: 3.50, circuit: 'Stuttgart', quarter: 'Q1', year: 2024 },
  { date: '2024-03-25', product: 'Handbook', type: 'sale', qty: 20, unitPrice: 4.00, circuit: 'Dusseldorf', quarter: 'Q1', year: 2024 },
  { date: '2024-03-25', product: 'Handbook', type: 'sale', qty: 5, unitPrice: 4.00, circuit: 'Finland', quarter: 'Q1', year: 2024 },
  { date: '2024-03-25', product: 'Handbook', type: 'sale', qty: 31, unitPrice: 4.00, circuit: 'Hamburg', quarter: 'Q1', year: 2024 },
  { date: '2024-03-25', product: 'Handbook', type: 'sale', qty: 20, unitPrice: 4.00, circuit: 'Holland', quarter: 'Q1', year: 2024 },
  { date: '2024-03-30', product: 'Jacket', type: 'sale', qty: 1, unitPrice: 35.00, circuit: 'Holland', quarter: 'Q1', year: 2024 },
  // Q2 2024
  { date: '2024-05-08', product: 'Regalia', type: 'sale', qty: 6, unitPrice: 8.00, circuit: 'Finland', quarter: 'Q2', year: 2024 },
  { date: '2024-05-08', product: "Officer's Badge", type: 'sale', qty: 5, unitPrice: 5.00, circuit: 'Finland', quarter: 'Q2', year: 2024 },
  { date: '2024-05-08', product: 'Lacoste T-Shirt', type: 'sale', qty: 4, unitPrice: 8.00, circuit: 'Finland', quarter: 'Q2', year: 2024 },
  { date: '2024-05-08', product: 'Headgear', type: 'sale', qty: 1, unitPrice: 4.00, circuit: 'Finland', quarter: 'Q2', year: 2024 },
  { date: '2024-05-08', product: 'Handbook', type: 'sale', qty: 5, unitPrice: 4.00, circuit: 'Finland', quarter: 'Q2', year: 2024 },
  { date: '2024-05-20', product: 'Tree of Life', type: 'sale', qty: 3, unitPrice: 70.00, circuit: 'Italy', quarter: 'Q2', year: 2024 },
  { date: '2024-05-20', product: 'Regalia', type: 'sale', qty: 6, unitPrice: 8.00, circuit: 'Italy', quarter: 'Q2', year: 2024 },
  { date: '2024-06-21', product: 'Regalia', type: 'sale', qty: 6, unitPrice: 8.00, circuit: 'Stuttgart', quarter: 'Q2', year: 2024 },
  { date: '2024-06-24', product: 'Lacoste T-Shirt', type: 'sale', qty: 5, unitPrice: 8.00, circuit: 'Hamburg', quarter: 'Q2', year: 2024 },
  { date: '2024-06-24', product: 'Tree of Life', type: 'sale', qty: 2, unitPrice: 70.00, circuit: 'Hamburg', quarter: 'Q2', year: 2024 },
  { date: '2024-06-24', product: 'Jacket', type: 'sale', qty: 12, unitPrice: 35.00, circuit: 'Hamburg', quarter: 'Q2', year: 2024 },
  // Q3 2024
  { date: '2024-07-15', product: 'Jacket', type: 'purchase', qty: 250, unitPrice: 32.07, circuit: '', quarter: 'Q3', year: 2024 },
  { date: '2024-08-30', product: 'Headgear', type: 'purchase', qty: 15, unitPrice: 2.00, circuit: '', quarter: 'Q3', year: 2024 },
  { date: '2024-08-30', product: 'Tree of Life', type: 'purchase', qty: 10, unitPrice: 38.00, circuit: '', quarter: 'Q3', year: 2024 },
  { date: '2024-08-30', product: "Officer's Badge", type: 'purchase', qty: 50, unitPrice: 3.00, circuit: '', quarter: 'Q3', year: 2024 },
  { date: '2024-08-30', product: 'Lacoste T-Shirt', type: 'purchase', qty: 11, unitPrice: 5.00, circuit: '', quarter: 'Q3', year: 2024 },
  { date: '2024-08-30', product: 'Tree of Life', type: 'sale', qty: 5, unitPrice: 70.00, circuit: '', quarter: 'Q3', year: 2024 },
  { date: '2024-08-30', product: 'Lacoste T-Shirt', type: 'sale', qty: 30, unitPrice: 8.00, circuit: '', quarter: 'Q3', year: 2024 },
  { date: '2024-08-30', product: 'Headgear', type: 'sale', qty: 13, unitPrice: 4.00, circuit: '', quarter: 'Q3', year: 2024 },
  { date: '2024-08-30', product: 'Jacket', type: 'sale', qty: 6, unitPrice: 35.00, circuit: '', quarter: 'Q3', year: 2024 },
  { date: '2024-08-30', product: 'Dues Card', type: 'sale', qty: 14, unitPrice: 2.00, circuit: '', quarter: 'Q3', year: 2024 },
  { date: '2024-08-30', product: 'Enrolment Badge', type: 'sale', qty: 16, unitPrice: 4.00, circuit: '', quarter: 'Q3', year: 2024 },
  // Q4 2024
  { date: '2024-10-20', product: 'Regalia', type: 'sale', qty: 6, unitPrice: 8.00, circuit: 'Belgium', quarter: 'Q4', year: 2024 },
  { date: '2024-10-20', product: "Officer's Badge", type: 'sale', qty: 5, unitPrice: 5.00, circuit: 'Belgium', quarter: 'Q4', year: 2024 },
  { date: '2024-10-20', product: 'Jacket', type: 'sale', qty: 20, unitPrice: 37.00, circuit: 'Belgium', quarter: 'Q4', year: 2024 },
  { date: '2024-12-22', product: 'Tree of Life', type: 'sale', qty: 2, unitPrice: 70.00, circuit: 'Hamburg', quarter: 'Q4', year: 2024 },
  { date: '2024-12-14', product: 'Handbook', type: 'purchase', qty: 200, unitPrice: 1.50, circuit: '', quarter: 'Q4', year: 2024 },
  // Q2 2025
  { date: '2025-04-23', product: 'Europe Cloth', type: 'purchase', qty: 280, unitPrice: 21.43, circuit: '', quarter: 'Q2', year: 2025 },
  // Q3 2025
  { date: '2025-09-25', product: 'Jacket', type: 'sale', qty: 11, unitPrice: 34.82, circuit: '', quarter: 'Q3', year: 2025 },
  // Q4 2025
  { date: '2025-10-16', product: 'Tree of Life', type: 'purchase', qty: 16, unitPrice: 12.00, circuit: '', quarter: 'Q4', year: 2025 },
  { date: '2025-10-16', product: 'Lacoste T-Shirt', type: 'purchase', qty: 40, unitPrice: 5.00, circuit: '', quarter: 'Q4', year: 2025 },
  { date: '2025-11-25', product: 'Handbook', type: 'purchase', qty: 250, unitPrice: 3.25, circuit: '', quarter: 'Q4', year: 2025 },
  { date: '2025-12-06', product: "Officer's Badge", type: 'purchase', qty: 324, unitPrice: 3.02, circuit: '', quarter: 'Q4', year: 2025 },
  { date: '2025-12-12', product: 'Gold Badge', type: 'purchase', qty: 3, unitPrice: 6.00, circuit: '', quarter: 'Q4', year: 2025 },
  { date: '2025-12-12', product: 'Lacoste T-Shirt', type: 'purchase', qty: 9, unitPrice: 1.51, circuit: '', quarter: 'Q4', year: 2025 },
  { date: '2025-12-12', product: 'Enrolment Badge', type: 'purchase', qty: 150, unitPrice: 2.00, circuit: '', quarter: 'Q4', year: 2025 },
  { date: '2025-12-12', product: 'Headgear', type: 'purchase', qty: 35, unitPrice: 2.00, circuit: '', quarter: 'Q4', year: 2025 },
  { date: '2025-12-12', product: 'Enrolment Service Book', type: 'purchase', qty: 10, unitPrice: 1.36, circuit: '', quarter: 'Q4', year: 2025 },
  { date: '2025-12-21', product: 'Scarf', type: 'purchase', qty: 70, unitPrice: 2.57, circuit: '', quarter: 'Q4', year: 2025 },
];

// ── Circuit outstanding debts 2024/25 ──
const circuitDebts = [
  { circuit: 'Hamburg',    amount: 532.00 },
  { circuit: 'Italy',     amount: 1624.00 },
  { circuit: 'Holland',   amount: 1000.00 },
  { circuit: 'Stuttgart', amount: 800.00 },
  { circuit: 'Finland',   amount: 0 },
  { circuit: 'Modena',    amount: 0 },
  { circuit: 'Dusseldorf',amount: 645.00 },
];

// ── Helper: format category names ──
function formatCategory(cat) {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Style helpers ──
function applyHeaderStyle(row, bgColor = NAVY, fontColor = WHITE) {
  row.height = 28;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: fontColor }, size: 11, name: 'Calibri' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: GOLD } },
      bottom: { style: 'thin', color: { argb: GOLD } },
      left: { style: 'thin', color: { argb: GOLD } },
      right: { style: 'thin', color: { argb: GOLD } },
    };
  });
}

function applyDataStyle(row, idx) {
  const bg = idx % 2 === 0 ? WHITE : LIGHT_BG;
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font = { size: 10, name: 'Calibri', color: { argb: DARK } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'hair', color: { argb: GREY } },
      bottom: { style: 'hair', color: { argb: GREY } },
      left: { style: 'hair', color: { argb: GREY } },
      right: { style: 'hair', color: { argb: GREY } },
    };
  });
}

function applyTotalRow(row, bgColor = GOLD, fontColor = NAVY) {
  row.height = 26;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: fontColor }, size: 11, name: 'Calibri' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'medium', color: { argb: NAVY } },
      bottom: { style: 'medium', color: { argb: NAVY } },
      left: { style: 'thin', color: { argb: NAVY } },
      right: { style: 'thin', color: { argb: NAVY } },
    };
  });
}

function addSheetTitle(ws, title, colCount) {
  const titleRow = ws.addRow([title]);
  ws.mergeCells(ws.rowCount, 1, ws.rowCount, colCount);
  titleRow.height = 36;
  titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: NAVY }, name: 'Calibri' };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GOLD } };
  titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  titleRow.getCell(1).border = {
    bottom: { style: 'medium', color: { argb: GOLD } },
  };

  const subtitleRow = ws.addRow(['The Methodist Church Ghana — Europe Mission']);
  ws.mergeCells(ws.rowCount, 1, ws.rowCount, colCount);
  subtitleRow.height = 22;
  subtitleRow.getCell(1).font = { bold: false, italic: true, size: 10, color: { argb: GREY }, name: 'Calibri' };
  subtitleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  ws.addRow([]);
}

function euroFmt() { return '€#,##0.00'; }

// ============================================================
// MAIN
// ============================================================
async function generateExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Martha Virtual Assistant';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ===========================
  // SHEET 1: ALL TRANSACTIONS
  // ===========================
  const ws1 = workbook.addWorksheet('All Transactions', {
    properties: { tabColor: { argb: NAVY } },
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  addSheetTitle(ws1, 'FINANCIAL TRANSACTIONS LEDGER — 2024 to 2025', 9);

  ws1.columns = [
    { header: '#',           key: 'num',         width: 6  },
    { header: 'Date',        key: 'date',        width: 13 },
    { header: 'Quarter',     key: 'quarter',     width: 10 },
    { header: 'Type',        key: 'type',        width: 11 },
    { header: 'Category',    key: 'category',    width: 22 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Receipts (€)',key: 'receipts',    width: 15 },
    { header: 'Payments (€)',key: 'payments',    width: 15 },
    { header: 'Circuit',     key: 'circuit',     width: 16 },
  ];

  const hdrRow1 = ws1.getRow(4);
  hdrRow1.values = ['#', 'Date', 'Quarter', 'Type', 'Category', 'Description', 'Receipts (€)', 'Payments (€)', 'Circuit'];
  applyHeaderStyle(hdrRow1);

  let rowIdx = 0;
  transactions.forEach((t, i) => {
    const row = ws1.addRow({
      num: i + 1,
      date: t.date,
      quarter: `${t.quarter} ${t.year}`,
      type: t.type === 'receipt' ? 'RECEIPT' : 'PAYMENT',
      category: formatCategory(t.category),
      description: t.description,
      receipts: t.type === 'receipt' ? t.amount : '',
      payments: t.type === 'payment' ? t.amount : '',
      circuit: t.circuit || '—',
    });
    applyDataStyle(row, rowIdx++);
    // Colour-code type
    const typeCell = row.getCell('type');
    typeCell.font = {
      bold: true, size: 10, name: 'Calibri',
      color: { argb: t.type === 'receipt' ? GREEN : RED },
    };
    // Euro format
    if (t.type === 'receipt') row.getCell('receipts').numFmt = euroFmt();
    else row.getCell('payments').numFmt = euroFmt();
  });

  // Totals row
  const dataStart = 5;
  const dataEnd = 4 + transactions.length;
  const totRow1 = ws1.addRow({
    num: '', date: '', quarter: '', type: '', category: '',
    description: 'GRAND TOTALS',
    receipts: { formula: `SUM(G${dataStart}:G${dataEnd})` },
    payments: { formula: `SUM(H${dataStart}:H${dataEnd})` },
    circuit: '',
  });
  applyTotalRow(totRow1);
  totRow1.getCell('receipts').numFmt = euroFmt();
  totRow1.getCell('payments').numFmt = euroFmt();

  // Net balance row
  const netRow = ws1.addRow({
    num: '', date: '', quarter: '', type: '', category: '',
    description: 'NET BALANCE (Receipts − Payments)',
    receipts: { formula: `G${dataEnd + 1}-H${dataEnd + 1}` },
    payments: '',
    circuit: '',
  });
  applyTotalRow(netRow, NAVY, GOLD);
  netRow.getCell('receipts').numFmt = euroFmt();

  // ===========================
  // SHEET 2: QUARTERLY SUMMARY
  // ===========================
  const ws2 = workbook.addWorksheet('Quarterly Summary', {
    properties: { tabColor: { argb: GOLD } },
  });

  addSheetTitle(ws2, 'QUARTERLY FINANCIAL SUMMARY — 2024 to 2025', 7);

  const quarters = ['Q1 2024','Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025'];
  const qHdr = ws2.addRow(['Quarter', 'Total Receipts (€)', 'Total Payments (€)', 'Net Balance (€)', 'Receipt Count', 'Payment Count', 'Total Transactions']);
  applyHeaderStyle(qHdr);

  ws2.getColumn(1).width = 14;
  ws2.getColumn(2).width = 20;
  ws2.getColumn(3).width = 20;
  ws2.getColumn(4).width = 18;
  ws2.getColumn(5).width = 15;
  ws2.getColumn(6).width = 15;
  ws2.getColumn(7).width = 18;

  quarters.forEach((q, idx) => {
    const [qtr, yr] = q.split(' ');
    const qTxns = transactions.filter(t => t.quarter === qtr && t.year === parseInt(yr));
    const receipts = qTxns.filter(t => t.type === 'receipt').reduce((s, t) => s + t.amount, 0);
    const payments = qTxns.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
    const recCount = qTxns.filter(t => t.type === 'receipt').length;
    const payCount = qTxns.filter(t => t.type === 'payment').length;

    const row = ws2.addRow([q, receipts, payments, receipts - payments, recCount, payCount, qTxns.length]);
    applyDataStyle(row, idx);
    row.getCell(2).numFmt = euroFmt();
    row.getCell(3).numFmt = euroFmt();
    row.getCell(4).numFmt = euroFmt();
    // Colour net
    row.getCell(4).font = {
      bold: true, size: 10, name: 'Calibri',
      color: { argb: (receipts - payments) >= 0 ? GREEN : RED },
    };
  });

  // Grand total
  const qDataStart = 5;
  const qDataEnd = qDataStart + quarters.length - 1;
  const qTotRow = ws2.addRow([
    'TOTAL',
    { formula: `SUM(B${qDataStart}:B${qDataEnd})` },
    { formula: `SUM(C${qDataStart}:C${qDataEnd})` },
    { formula: `SUM(D${qDataStart}:D${qDataEnd})` },
    { formula: `SUM(E${qDataStart}:E${qDataEnd})` },
    { formula: `SUM(F${qDataStart}:F${qDataEnd})` },
    { formula: `SUM(G${qDataStart}:G${qDataEnd})` },
  ]);
  applyTotalRow(qTotRow);
  qTotRow.getCell(2).numFmt = euroFmt();
  qTotRow.getCell(3).numFmt = euroFmt();
  qTotRow.getCell(4).numFmt = euroFmt();

  // ===========================
  // SHEET 3: CIRCUIT BREAKDOWN
  // ===========================
  const ws3 = workbook.addWorksheet('Circuit Breakdown', {
    properties: { tabColor: { argb: BLUE } },
  });

  addSheetTitle(ws3, 'CIRCUIT FINANCIAL BREAKDOWN — 2024 to 2025', 7);

  const circuitNames = ['Hamburg', 'Stuttgart', 'Dusseldorf', 'Holland', 'Italy', 'Italy (Modena)', 'Belgium', 'Finland', 'UK'];

  const cHdr = ws3.addRow(['Circuit', 'Total Receipts (€)', 'Total Payments (€)', 'Net Contribution (€)', 'Merchandise Sales (€)', 'Debt Repaid (€)', 'Transaction Count']);
  applyHeaderStyle(cHdr, BLUE);

  ws3.getColumn(1).width = 18;
  ws3.getColumn(2).width = 20;
  ws3.getColumn(3).width = 20;
  ws3.getColumn(4).width = 20;
  ws3.getColumn(5).width = 20;
  ws3.getColumn(6).width = 18;
  ws3.getColumn(7).width = 18;

  circuitNames.forEach((name, idx) => {
    const cTxns = transactions.filter(t => t.circuit === name);
    const rec = cTxns.filter(t => t.type === 'receipt').reduce((s, t) => s + t.amount, 0);
    const pay = cTxns.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
    const merch = cTxns.filter(t => t.category === 'merchandise_sale').reduce((s, t) => s + t.amount, 0);
    const debt = cTxns.filter(t => t.category === 'debt_repayment').reduce((s, t) => s + t.amount, 0);

    const row = ws3.addRow([name, rec, pay, rec - pay, merch, debt, cTxns.length]);
    applyDataStyle(row, idx);
    [2, 3, 4, 5, 6].forEach(col => { row.getCell(col).numFmt = euroFmt(); });
    row.getCell(4).font = {
      bold: true, size: 10, name: 'Calibri',
      color: { argb: (rec - pay) >= 0 ? GREEN : RED },
    };
  });

  const cDataStart = 5;
  const cDataEnd = cDataStart + circuitNames.length - 1;
  const cTotRow = ws3.addRow([
    'TOTAL',
    { formula: `SUM(B${cDataStart}:B${cDataEnd})` },
    { formula: `SUM(C${cDataStart}:C${cDataEnd})` },
    { formula: `SUM(D${cDataStart}:D${cDataEnd})` },
    { formula: `SUM(E${cDataStart}:E${cDataEnd})` },
    { formula: `SUM(F${cDataStart}:F${cDataEnd})` },
    { formula: `SUM(G${cDataStart}:G${cDataEnd})` },
  ]);
  applyTotalRow(cTotRow, BLUE, WHITE);
  [2, 3, 4, 5, 6].forEach(col => { cTotRow.getCell(col).numFmt = euroFmt(); });

  // ===========================
  // SHEET 4: CATEGORY ANALYSIS
  // ===========================
  const ws4 = workbook.addWorksheet('Category Analysis', {
    properties: { tabColor: { argb: GREEN } },
  });

  addSheetTitle(ws4, 'INCOME & EXPENDITURE BY CATEGORY — 2024 to 2025', 5);

  // Receipts section
  const recTitle = ws4.addRow(['RECEIPTS BY CATEGORY']);
  ws4.mergeCells(ws4.rowCount, 1, ws4.rowCount, 5);
  recTitle.getCell(1).font = { bold: true, size: 13, color: { argb: GREEN }, name: 'Calibri' };
  recTitle.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GREEN } };
  recTitle.height = 28;

  const recHdr = ws4.addRow(['Category', 'Total Amount (€)', 'Count', '% of Total Receipts', 'Avg per Transaction (€)']);
  applyHeaderStyle(recHdr, GREEN);
  ws4.getColumn(1).width = 28;
  ws4.getColumn(2).width = 20;
  ws4.getColumn(3).width = 10;
  ws4.getColumn(4).width = 20;
  ws4.getColumn(5).width = 22;

  const receiptTxns = transactions.filter(t => t.type === 'receipt');
  const totalReceipts = receiptTxns.reduce((s, t) => s + t.amount, 0);
  const recCategories = [...new Set(receiptTxns.map(t => t.category))];

  recCategories.sort((a, b) => {
    const aSum = receiptTxns.filter(t => t.category === a).reduce((s, t) => s + t.amount, 0);
    const bSum = receiptTxns.filter(t => t.category === b).reduce((s, t) => s + t.amount, 0);
    return bSum - aSum;
  });

  recCategories.forEach((cat, idx) => {
    const catTxns = receiptTxns.filter(t => t.category === cat);
    const total = catTxns.reduce((s, t) => s + t.amount, 0);
    const pct = totalReceipts > 0 ? (total / totalReceipts * 100) : 0;
    const avg = catTxns.length > 0 ? total / catTxns.length : 0;

    const row = ws4.addRow([formatCategory(cat), total, catTxns.length, pct, avg]);
    applyDataStyle(row, idx);
    row.getCell(2).numFmt = euroFmt();
    row.getCell(4).numFmt = '0.0"%"';
    row.getCell(5).numFmt = euroFmt();
  });

  ws4.addRow([]);

  // Payments section
  const payTitle = ws4.addRow(['PAYMENTS BY CATEGORY']);
  ws4.mergeCells(ws4.rowCount, 1, ws4.rowCount, 5);
  payTitle.getCell(1).font = { bold: true, size: 13, color: { argb: RED }, name: 'Calibri' };
  payTitle.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_RED } };
  payTitle.height = 28;

  const payHdr = ws4.addRow(['Category', 'Total Amount (€)', 'Count', '% of Total Payments', 'Avg per Transaction (€)']);
  applyHeaderStyle(payHdr, RED);

  const paymentTxns = transactions.filter(t => t.type === 'payment');
  const totalPayments = paymentTxns.reduce((s, t) => s + t.amount, 0);
  const payCategories = [...new Set(paymentTxns.map(t => t.category))];

  payCategories.sort((a, b) => {
    const aSum = paymentTxns.filter(t => t.category === a).reduce((s, t) => s + t.amount, 0);
    const bSum = paymentTxns.filter(t => t.category === b).reduce((s, t) => s + t.amount, 0);
    return bSum - aSum;
  });

  payCategories.forEach((cat, idx) => {
    const catTxns = paymentTxns.filter(t => t.category === cat);
    const total = catTxns.reduce((s, t) => s + t.amount, 0);
    const pct = totalPayments > 0 ? (total / totalPayments * 100) : 0;
    const avg = catTxns.length > 0 ? total / catTxns.length : 0;

    const row = ws4.addRow([formatCategory(cat), total, catTxns.length, pct, avg]);
    applyDataStyle(row, idx);
    row.getCell(2).numFmt = euroFmt();
    row.getCell(4).numFmt = '0.0"%"';
    row.getCell(5).numFmt = euroFmt();
  });

  // ===========================
  // SHEET 5: STOCK / INVENTORY
  // ===========================
  const ws5 = workbook.addWorksheet('Inventory Movements', {
    properties: { tabColor: { argb: '8E44AD' } },
  });

  addSheetTitle(ws5, 'STOCK MOVEMENTS REGISTER — 2024 to 2025', 8);

  const smHdr = ws5.addRow(['#', 'Date', 'Product', 'Type', 'Qty', 'Unit Price (€)', 'Total Value (€)', 'Circuit']);
  applyHeaderStyle(smHdr, '8E44AD');

  ws5.getColumn(1).width = 6;
  ws5.getColumn(2).width = 13;
  ws5.getColumn(3).width = 22;
  ws5.getColumn(4).width = 12;
  ws5.getColumn(5).width = 8;
  ws5.getColumn(6).width = 15;
  ws5.getColumn(7).width = 16;
  ws5.getColumn(8).width = 16;

  stockMovements.forEach((sm, idx) => {
    const row = ws5.addRow([
      idx + 1,
      sm.date,
      sm.product,
      sm.type.toUpperCase(),
      sm.qty,
      sm.unitPrice,
      sm.qty * sm.unitPrice,
      sm.circuit || '—',
    ]);
    applyDataStyle(row, idx);
    row.getCell(6).numFmt = euroFmt();
    row.getCell(7).numFmt = euroFmt();
    const typeCell = row.getCell(4);
    typeCell.font = {
      bold: true, size: 10, name: 'Calibri',
      color: { argb: sm.type === 'purchase' ? BLUE : sm.type === 'sale' ? GREEN : GREY },
    };
  });

  // Stock summary
  ws5.addRow([]);
  const stSumTitle = ws5.addRow(['PRODUCT STOCK SUMMARY']);
  ws5.mergeCells(ws5.rowCount, 1, ws5.rowCount, 8);
  stSumTitle.getCell(1).font = { bold: true, size: 13, color: { argb: '8E44AD' }, name: 'Calibri' };
  stSumTitle.height = 28;

  const stSumHdr = ws5.addRow(['', '', 'Product', 'Total Purchased', 'Total Sold', 'Net Stock Change', 'Purchase Value (€)', 'Sales Value (€)']);
  applyHeaderStyle(stSumHdr, '8E44AD');

  const products = [...new Set(stockMovements.map(s => s.product))];
  products.forEach((prod, idx) => {
    const pMoves = stockMovements.filter(s => s.product === prod);
    const purchased = pMoves.filter(s => s.type === 'purchase').reduce((s, m) => s + m.qty, 0);
    const sold = pMoves.filter(s => s.type === 'sale').reduce((s, m) => s + m.qty, 0);
    const purchaseVal = pMoves.filter(s => s.type === 'purchase').reduce((s, m) => s + m.qty * m.unitPrice, 0);
    const salesVal = pMoves.filter(s => s.type === 'sale').reduce((s, m) => s + m.qty * m.unitPrice, 0);

    const row = ws5.addRow(['', '', prod, purchased, sold, purchased - sold, purchaseVal, salesVal]);
    applyDataStyle(row, idx);
    row.getCell(7).numFmt = euroFmt();
    row.getCell(8).numFmt = euroFmt();
  });

  // ===========================
  // SHEET 6: OUTSTANDING DEBTS
  // ===========================
  const ws6 = workbook.addWorksheet('Outstanding Debts', {
    properties: { tabColor: { argb: RED } },
  });

  addSheetTitle(ws6, 'CIRCUITS OWING EUROPE MISSION — 2024/25', 4);

  const dHdr = ws6.addRow(['Circuit', 'Amount Owing (€)', 'Status', 'Notes']);
  applyHeaderStyle(dHdr, RED);

  ws6.getColumn(1).width = 20;
  ws6.getColumn(2).width = 20;
  ws6.getColumn(3).width = 14;
  ws6.getColumn(4).width = 40;

  circuitDebts.forEach((d, idx) => {
    const status = d.amount > 0 ? 'OWING' : 'CLEAR';
    const notes = d.amount > 0 ? `${d.circuit} Circuit owes €${d.amount.toLocaleString('en', { minimumFractionDigits: 2 })} to Europe Mission` : 'No outstanding debt';
    const row = ws6.addRow([d.circuit, d.amount, status, notes]);
    applyDataStyle(row, idx);
    row.getCell(2).numFmt = euroFmt();
    row.getCell(3).font = {
      bold: true, size: 10, name: 'Calibri',
      color: { argb: d.amount > 0 ? RED : GREEN },
    };
  });

  // Total
  const dDataStart = 5;
  const dDataEnd = dDataStart + circuitDebts.length - 1;
  const dTotRow = ws6.addRow([
    'TOTAL OUTSTANDING',
    { formula: `SUM(B${dDataStart}:B${dDataEnd})` },
    '',
    '',
  ]);
  applyTotalRow(dTotRow, RED, WHITE);
  dTotRow.getCell(2).numFmt = euroFmt();

  // Percentage breakdown
  ws6.addRow([]);
  const pctTitle = ws6.addRow(['DEBT DISTRIBUTION']);
  ws6.mergeCells(ws6.rowCount, 1, ws6.rowCount, 4);
  pctTitle.getCell(1).font = { bold: true, size: 12, color: { argb: RED }, name: 'Calibri' };

  const pctHdr = ws6.addRow(['Circuit', '% of Total Debt', '', '']);
  applyHeaderStyle(pctHdr, DARK);

  const totalDebt = circuitDebts.reduce((s, d) => s + d.amount, 0);
  circuitDebts.filter(d => d.amount > 0).forEach((d, idx) => {
    const pct = totalDebt > 0 ? (d.amount / totalDebt * 100) : 0;
    const row = ws6.addRow([d.circuit, pct, '', '']);
    applyDataStyle(row, idx);
    row.getCell(2).numFmt = '0.0"%"';
  });

  // ===========================
  // SHEET 7: ANNUAL COMPARISON
  // ===========================
  const ws7 = workbook.addWorksheet('Annual Comparison', {
    properties: { tabColor: { argb: DARK } },
  });

  addSheetTitle(ws7, 'YEAR-ON-YEAR FINANCIAL COMPARISON', 5);

  const annHdr = ws7.addRow(['Year', 'Total Receipts (€)', 'Total Payments (€)', 'Net Balance (€)', 'Transaction Count']);
  applyHeaderStyle(annHdr, DARK);
  ws7.getColumn(1).width = 12;
  ws7.getColumn(2).width = 20;
  ws7.getColumn(3).width = 20;
  ws7.getColumn(4).width = 18;
  ws7.getColumn(5).width = 18;

  [2024, 2025].forEach((yr, idx) => {
    const yrTxns = transactions.filter(t => t.year === yr);
    const rec = yrTxns.filter(t => t.type === 'receipt').reduce((s, t) => s + t.amount, 0);
    const pay = yrTxns.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
    const row = ws7.addRow([yr, rec, pay, rec - pay, yrTxns.length]);
    applyDataStyle(row, idx);
    [2, 3, 4].forEach(col => { row.getCell(col).numFmt = euroFmt(); });
    row.getCell(4).font = {
      bold: true, size: 10, name: 'Calibri',
      color: { argb: (rec - pay) >= 0 ? GREEN : RED },
    };
  });

  // Year-on-year change
  ws7.addRow([]);
  const yoyTitle = ws7.addRow(['YEAR-ON-YEAR CHANGE']);
  ws7.mergeCells(ws7.rowCount, 1, ws7.rowCount, 5);
  yoyTitle.getCell(1).font = { bold: true, size: 12, color: { argb: DARK }, name: 'Calibri' };

  const yr2024 = transactions.filter(t => t.year === 2024);
  const yr2025 = transactions.filter(t => t.year === 2025);
  const rec2024 = yr2024.filter(t => t.type === 'receipt').reduce((s, t) => s + t.amount, 0);
  const rec2025 = yr2025.filter(t => t.type === 'receipt').reduce((s, t) => s + t.amount, 0);
  const pay2024 = yr2024.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
  const pay2025 = yr2025.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);

  const chgHdr = ws7.addRow(['Metric', '2024 (€)', '2025 (€)', 'Change (€)', 'Change (%)']);
  applyHeaderStyle(chgHdr, DARK);

  const metrics = [
    ['Receipts', rec2024, rec2025],
    ['Payments', pay2024, pay2025],
    ['Net Balance', rec2024 - pay2024, rec2025 - pay2025],
  ];

  metrics.forEach(([label, v2024, v2025], idx) => {
    const change = v2025 - v2024;
    const pctChg = v2024 !== 0 ? (change / Math.abs(v2024) * 100) : 0;
    const row = ws7.addRow([label, v2024, v2025, change, pctChg]);
    applyDataStyle(row, idx);
    [2, 3, 4].forEach(col => { row.getCell(col).numFmt = euroFmt(); });
    row.getCell(5).numFmt = '0.0"%"';
    row.getCell(4).font = {
      bold: true, size: 10, name: 'Calibri',
      color: { argb: change >= 0 ? GREEN : RED },
    };
  });

  // ===========================
  // SHEET 8: RECEIPTS DETAIL (LEDGER)
  // ===========================
  const ws8 = workbook.addWorksheet('Receipts Ledger', {
    properties: { tabColor: { argb: GREEN } },
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  addSheetTitle(ws8, 'RECEIPTS LEDGER — 2024 to 2025', 7);

  const rHdr = ws8.addRow(['#', 'Date', 'Particulars', 'Category', 'Circuit', 'Amount (€)', 'Running Total (€)']);
  applyHeaderStyle(rHdr, GREEN);
  ws8.getColumn(1).width = 6;
  ws8.getColumn(2).width = 13;
  ws8.getColumn(3).width = 50;
  ws8.getColumn(4).width = 22;
  ws8.getColumn(5).width = 16;
  ws8.getColumn(6).width = 15;
  ws8.getColumn(7).width = 18;

  let runningRec = 0;
  const receiptData = transactions.filter(t => t.type === 'receipt');
  receiptData.forEach((t, idx) => {
    runningRec += t.amount;
    const row = ws8.addRow([idx + 1, t.date, t.description, formatCategory(t.category), t.circuit || '—', t.amount, runningRec]);
    applyDataStyle(row, idx);
    row.getCell(6).numFmt = euroFmt();
    row.getCell(7).numFmt = euroFmt();
  });

  const recTotRow = ws8.addRow(['', '', 'TOTAL RECEIPTS', '', '', receiptData.reduce((s, t) => s + t.amount, 0), '']);
  applyTotalRow(recTotRow, GREEN, WHITE);
  recTotRow.getCell(6).numFmt = euroFmt();

  // ===========================
  // SHEET 9: PAYMENTS DETAIL (LEDGER)
  // ===========================
  const ws9 = workbook.addWorksheet('Payments Ledger', {
    properties: { tabColor: { argb: RED } },
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  addSheetTitle(ws9, 'PAYMENTS LEDGER — 2024 to 2025', 7);

  const pHdr = ws9.addRow(['#', 'Date', 'Particulars', 'Category', 'Circuit', 'Amount (€)', 'Running Total (€)']);
  applyHeaderStyle(pHdr, RED);
  ws9.getColumn(1).width = 6;
  ws9.getColumn(2).width = 13;
  ws9.getColumn(3).width = 50;
  ws9.getColumn(4).width = 22;
  ws9.getColumn(5).width = 16;
  ws9.getColumn(6).width = 15;
  ws9.getColumn(7).width = 18;

  let runningPay = 0;
  const paymentData = transactions.filter(t => t.type === 'payment');
  paymentData.forEach((t, idx) => {
    runningPay += t.amount;
    const row = ws9.addRow([idx + 1, t.date, t.description, formatCategory(t.category), t.circuit || '—', t.amount, runningPay]);
    applyDataStyle(row, idx);
    row.getCell(6).numFmt = euroFmt();
    row.getCell(7).numFmt = euroFmt();
  });

  const payTotRow = ws9.addRow(['', '', 'TOTAL PAYMENTS', '', '', paymentData.reduce((s, t) => s + t.amount, 0), '']);
  applyTotalRow(payTotRow, RED, WHITE);
  payTotRow.getCell(6).numFmt = euroFmt();

  // ===========================
  // SAVE
  // ===========================
  const outputPath = path.join(__dirname, '..', 'Europe_Mission_Financial_Report_2024_2025.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`\n✅ Excel workbook generated successfully!`);
  console.log(`📁 Location: ${outputPath}`);
  console.log(`\n📊 Sheets created:`);
  console.log(`   1. All Transactions      — Full ledger (${transactions.length} entries)`);
  console.log(`   2. Quarterly Summary      — Quarter-by-quarter totals`);
  console.log(`   3. Circuit Breakdown      — Per-circuit analysis`);
  console.log(`   4. Category Analysis      — Income & expenditure categories`);
  console.log(`   5. Inventory Movements    — Stock register + product summary`);
  console.log(`   6. Outstanding Debts      — Circuits owing Europe Mission 2024/25`);
  console.log(`   7. Annual Comparison      — 2024 vs 2025 year-on-year`);
  console.log(`   8. Receipts Ledger        — All receipts with running total`);
  console.log(`   9. Payments Ledger        — All payments with running total`);
}

generateExcel().catch(console.error);
