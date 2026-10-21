import { useState } from "react";
import { closeMonth, reopenMonth } from "../api";

// "Zamknij miesiąc" (after the confirmation dialog) and "Otwórz ponownie".
export function useMonthActions({ data, messages, selectedMonth, sheets }) {
  const [busy, setBusy] = useState(false);

  const run = async (action, success, failure) => {
    messages.clearMessages();
    setBusy(true);
    try {
      await action(selectedMonth);
      await data.loadOverview(selectedMonth);
      sheets.close();
      window.scrollTo({ top: 0 });
      messages.showMessage(success);
    } catch (error) {
      sheets.close();
      messages.showMessage(error.message || failure, "error");
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    confirmClose: () => sheets.open("closeMonth"),
    close: () => run(closeMonth, "Miesiąc został zamknięty.", "Nie udało się zamknąć miesiąca."),
    reopen: () => run(reopenMonth, "Miesiąc został otwarty ponownie.", "Nie udało się otworzyć miesiąca."),
  };
}
