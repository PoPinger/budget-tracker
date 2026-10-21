const NBSP = " ";
const MINUS = "−";

const MONTHS = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];
const MONTHS_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function groupThousands(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

// 1301 -> "1 301,00 zł", -20 -> "−20,00 zł" (non-breaking spaces, true minus sign).
export function formatMoney(value) {
  const number = Number(value || 0);
  const [integer, fraction] = Math.abs(number).toFixed(2).split(".");
  const sign = number < 0 && Math.abs(number) >= 0.005 ? MINUS : "";
  return `${sign}${groupThousands(integer)},${fraction}${NBSP}zł`;
}

// Expense amounts are shown as outgoing money: 150 -> "−150,00 zł".
export function formatExpenseAmount(value) {
  return `${MINUS}${formatMoney(Math.abs(Number(value || 0)))}`;
}

// 67.4725 -> "67,5 %", 100 -> "100 %".
export function formatPercent(value) {
  const rounded = Math.round(Number(value || 0) * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
  return `${text.replace("-", MINUS)}${NBSP}%`;
}

function parts(isoDate) {
  const [year, month, day] = String(isoDate).slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

// "2026-10-17" -> "17 paź 2026"
export function formatDate(isoDate) {
  const { year, month, day } = parts(isoDate);
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

// "2026-10-01" -> "Październik 2026"
export function formatMonthTitle(monthValue) {
  const { year, month } = parts(monthValue);
  return `${MONTHS[month - 1]} ${year}`;
}

// "2026-10-01" -> "Październik"
export function formatMonthName(monthValue) {
  return MONTHS[parts(monthValue).month - 1];
}

// "2026-10-01" -> "paź 2026"
export function formatMonthShort(monthValue) {
  const { year, month } = parts(monthValue);
  return `${MONTHS_SHORT[month - 1]} ${year}`;
}

// Polish plural: plural(5, "kategoria", "kategorie", "kategorii") -> "kategorii"
export function plural(count, one, few, many) {
  const n = Math.abs(count);
  if (n === 1) return one;
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

// Amount from the API (number) -> input text with a comma: 1200.5 -> "1200,50", 1200 -> "1200".
export function toAmountInput(value) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(".", ",");
}
