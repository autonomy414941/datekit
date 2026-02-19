const $ = (id) => document.getElementById(id);

const diffStart = $("diff-start");
const diffEnd = $("diff-end");
const diffResult = $("diff-result");
const mathBase = $("math-base");
const mathDays = $("math-days");
const mathResult = $("math-result");
const unixDate = $("unix-date");
const unixInput = $("unix-input");
const unixResult = $("unix-result");
const copyStatus = $("copy-status");

function pad(n) {
  return String(n).padStart(2, "0");
}

function toLocalDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toLocalDateTimeInput(date) {
  return `${toLocalDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function setResult(el, text, error = false) {
  el.textContent = text;
  el.classList.toggle("error", error);
}

function formatDuration(ms) {
  const sign = ms < 0 ? -1 : 1;
  let rest = Math.abs(ms);
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const minMs = 60 * 1000;

  const days = Math.floor(rest / dayMs);
  rest -= days * dayMs;
  const hours = Math.floor(rest / hourMs);
  rest -= hours * hourMs;
  const mins = Math.floor(rest / minMs);
  rest -= mins * minMs;
  const secs = Math.floor(rest / 1000);

  const parts = [`${days}d`, `${hours}h`, `${mins}m`, `${secs}s`];
  return `${sign < 0 ? "-" : ""}${parts.join(" ")}`;
}

function runDiff() {
  const start = new Date(diffStart.value);
  const end = new Date(diffEnd.value);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    setResult(diffResult, "Enter both start and end date/time.", true);
    return;
  }

  const ms = end.getTime() - start.getTime();
  const days = ms / (24 * 60 * 60 * 1000);
  const hours = ms / (60 * 60 * 1000);
  const mins = ms / (60 * 1000);

  setResult(
    diffResult,
    [
      `Signed duration: ${formatDuration(ms)}`,
      `Days: ${days.toFixed(4)}`,
      `Hours: ${hours.toFixed(2)}`,
      `Minutes: ${mins.toFixed(1)}`,
    ].join("\n")
  );
}

function formatWeekday(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
}

function runDateMath() {
  if (!mathBase.value) {
    setResult(mathResult, "Select a base date.", true);
    return;
  }

  const days = Number(mathDays.value);
  if (!Number.isFinite(days) || !Number.isInteger(days)) {
    setResult(mathResult, "Days must be an integer.", true);
    return;
  }

  const base = new Date(`${mathBase.value}T00:00:00`);
  if (Number.isNaN(base.getTime())) {
    setResult(mathResult, "Invalid base date.", true);
    return;
  }

  const result = new Date(base);
  result.setDate(result.getDate() + days);

  setResult(
    mathResult,
    [
      `Result: ${toLocalDateInput(result)} (${formatWeekday(result)})`,
      `From: ${toLocalDateInput(base)} (${formatWeekday(base)})`,
      `Offset: ${days >= 0 ? "+" : ""}${days} day(s)`,
    ].join("\n")
  );
}

function runUnixFromDate() {
  const date = new Date(unixDate.value);
  if (Number.isNaN(date.getTime())) {
    setResult(unixResult, "Select a date and time first.", true);
    return;
  }

  const ms = date.getTime();
  const sec = Math.floor(ms / 1000);

  setResult(
    unixResult,
    [
      `Unix seconds: ${sec}`,
      `Unix milliseconds: ${ms}`,
      `UTC: ${date.toUTCString()}`,
      `ISO: ${date.toISOString()}`,
    ].join("\n")
  );
}

function runUnixToDate() {
  const raw = unixInput.value.trim();
  if (!raw) {
    setResult(unixResult, "Enter a Unix value.", true);
    return;
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    setResult(unixResult, "Unix value must be numeric.", true);
    return;
  }

  const ms = Math.abs(value) < 1e12 ? value * 1000 : value;
  const date = new Date(ms);

  if (Number.isNaN(date.getTime())) {
    setResult(unixResult, "Unix value is out of range.", true);
    return;
  }

  setResult(
    unixResult,
    [
      `Local: ${date.toLocaleString()}`,
      `UTC: ${date.toUTCString()}`,
      `ISO: ${date.toISOString()}`,
      `Detected unit: ${Math.abs(value) < 1e12 ? "seconds" : "milliseconds"}`,
    ].join("\n")
  );
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copyStatus.textContent = "Copied";
  } catch (_error) {
    copyStatus.textContent = "Copy failed";
  }
  setTimeout(() => {
    copyStatus.textContent = "";
  }, 1200);
}

function seedDefaults() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  diffStart.value = toLocalDateTimeInput(weekAgo);
  diffEnd.value = toLocalDateTimeInput(now);
  mathBase.value = toLocalDateInput(now);
  mathDays.value = "30";
  unixDate.value = toLocalDateTimeInput(now);

  setResult(diffResult, "Pick dates and press Calculate.");
  setResult(mathResult, "Pick a date and offset, then Compute.");
  setResult(unixResult, "Convert in either direction.");
}

$("diff-run").addEventListener("click", runDiff);
$("math-run").addEventListener("click", runDateMath);
$("unix-from-date").addEventListener("click", runUnixFromDate);
$("unix-to-date").addEventListener("click", runUnixToDate);
$("copy-link").addEventListener("click", () => {
  void copyUrl();
});

seedDefaults();
