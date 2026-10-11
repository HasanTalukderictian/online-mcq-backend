const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-18" -> "18 Oct, 2026"
export function fmtDate(s) {
    if (!s) return "-";
    const p = String(s).slice(0, 10).split("-");
    if (p.length !== 3) return String(s);
    return p[2] + " " + MONTHS[Number(p[1]) - 1] + ", " + p[0];
}

// today as "YYYY-MM-DD" in the browser's local time
export function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// days from today to the end date (0 = today, negative = already over)
export function daysLeft(end) {
    if (!end) return null;
    const p = String(end).slice(0, 10).split("-").map(Number);
    if (p.length !== 3) return null;
    const e = new Date(p[0], p[1] - 1, p[2]);
    const n = new Date();
    const t = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return Math.round((e - t) / 86400000);
}