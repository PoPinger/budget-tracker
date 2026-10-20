import { House, ReceiptText, Tag, Wallet } from "lucide-react";
import { TABS } from "../constants";

const ICONS = {
  [TABS.DASHBOARD]: House,
  [TABS.EXPENSES]: ReceiptText,
  [TABS.CATEGORIES]: Tag,
  [TABS.BUDGETS]: Wallet,
};

export default function NavIcon({ tab, size = 18 }) {
  const Icon = ICONS[tab];
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />;
}
