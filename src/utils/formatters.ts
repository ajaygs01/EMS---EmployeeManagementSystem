/**
 * Indian Localization and Currency Formatters (INR, Lakhs, Crores, Indian Date Format)
 */

export const CURRENCY_SYMBOL = "₹";
export const CURRENCY_CODE = "INR";

/**
 * Format a number into Indian Rupee format (e.g. ₹1,50,000 or ₹45,200)
 */
export function formatINR(amount: number | string | undefined | null, showSymbol = true): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return showSymbol ? "₹0" : "0";
  }
  const numeric = Number(amount);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(numeric);

  return showSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format annual CTC into Lakhs Per Annum (LPA) (e.g. ₹14.5 LPA)
 */
export function formatLPA(annualSalary: number | string | undefined | null): string {
  if (!annualSalary || isNaN(Number(annualSalary))) return "₹0 LPA";
  const num = Number(annualSalary);
  if (num >= 100000) {
    const lakhs = (num / 100000).toFixed(1).replace(/\.0$/, "");
    return `₹${lakhs} LPA`;
  }
  return formatINR(num);
}

/**
 * Format Indian Phone Numbers (e.g. +91 98765 43210)
 */
export function formatIndianPhone(phone: string | undefined | null): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+91") && cleaned.length === 13) {
    return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Format standard Indian date string (e.g. 15 Aug 2026 or 15/08/2026)
 */
export function formatIndianDate(dateStr: string | Date | undefined | null, style: "short" | "medium" | "long" = "medium"): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    if (style === "short") {
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
    if (style === "long") {
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    }
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return String(dateStr);
  }
}
