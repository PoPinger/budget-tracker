// Months are always represented as the first day: "YYYY-MM-01".

function toMonthValue(year, monthIndex) {
  const date = new Date(year, monthIndex, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export function currentMonth() {
  const today = new Date();
  return toMonthValue(today.getFullYear(), today.getMonth());
}

export function shiftMonth(monthValue, delta) {
  const [year, month] = monthValue.split("-").map(Number);
  return toMonthValue(year, month - 1 + delta);
}

export function monthRange(centerMonth, before, after) {
  const months = [];
  for (let delta = after; delta >= -before; delta -= 1) {
    months.push(shiftMonth(centerMonth, delta));
  }
  return months;
}

// Default date for a new expense: today if it falls in the month, otherwise the 1st.
export function defaultExpenseDate(monthValue) {
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return todayValue.slice(0, 7) === monthValue.slice(0, 7) ? todayValue : monthValue;
}
