// Shared user preferences — persisted to localStorage and read across pages.
// Changing a value on /settings dispatches an event so any mounted component
// using useSettings() updates live, without a reload.
import { useEffect, useState } from "react";

export interface Settings {
  reminderLeadDays: number;
  autoRenewalAlerts: boolean;
  weeklyDigest: boolean;
  highRiskThreshold: number;
  currency: "INR" | "USD" | "EUR";
  dateFormat: "DD MMM YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
}

export const DEFAULTS: Settings = {
  reminderLeadDays: 90,
  autoRenewalAlerts: true,
  weeklyDigest: false,
  highRiskThreshold: 50,
  currency: "INR",
  dateFormat: "DD MMM YYYY",
};

export const STORE_KEY = "contractiq:settings";
const CHANGE_EVENT = "contractiq:settings-changed";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(next: Settings): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* storage unavailable — value still applies for this session via the event */
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(STORE_KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

// Reactive read. Updates on cross-tab `storage` events and same-tab saves.
export function useSettings(): Settings {
  const [s, setS] = useState<Settings>(DEFAULTS);
  useEffect(() => {
    const sync = () => setS(loadSettings());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);
  return s;
}

// ── Formatters that respect the chosen currency / date format ──
const CURRENCY: Record<Settings["currency"], { symbol: string; locale: string }> = {
  INR: { symbol: "₹", locale: "en-IN" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
};

// Note: this swaps the display symbol/grouping only — it does not convert FX,
// since contract amounts are stored in their original currency.
export function formatMoney(amount: number, currency: Settings["currency"]): string {
  const c = CURRENCY[currency] ?? CURRENCY.INR;
  return `${c.symbol}${Math.round(amount).toLocaleString(c.locale)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(dateStr: string, fmt: Settings["dateFormat"]): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  if (fmt === "MM/DD/YYYY") return `${pad(m + 1)}/${pad(day)}/${y}`;
  if (fmt === "YYYY-MM-DD") return `${y}-${pad(m + 1)}-${pad(day)}`;
  return `${day} ${MONTHS[m]} ${y}`;
}
