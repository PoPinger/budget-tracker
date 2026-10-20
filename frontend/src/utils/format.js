export function formatMoney(value) {
  const number = Number(value || 0);
  return `${number.toFixed(2)} zł`;
}
