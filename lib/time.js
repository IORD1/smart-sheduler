// "HH:mm" or "H:mm" → minutes-since-midnight
export function tToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// minutes-since-midnight → "h:mm AM/PM"
export function minToT(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// minutes-since-midnight → "HH:mm"
export function minToShort(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// "HH:mm" (24h) → minutes-since-midnight. Returns null on bad input.
export function hhmmToMin(t) {
  if (!t || typeof t !== 'string') return null;
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function durMin(start, end) {
  return tToMin(end) - tToMin(start);
}

// Date | ISO string → "hh:mm AM/PM"
export function convertDateTime(dataTime) {
  const dateTime = new Date(dataTime);
  let hours = dateTime.getHours();
  const minutes = dateTime.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

export function formatDuration(min) {
  if (min == null) return null;
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// "9:30 AM" / "12:00 PM" → ISO anchored to baseDate.
// Handles 12 AM (→ 0) and 12 PM (→ 12) correctly.
export function parseAmPmToISO(timeString, baseDate = new Date()) {
  const [time, period] = timeString.trim().split(/\s+/);
  const [rawHours, rawMinutes] = time.split(':');
  let hours = parseInt(rawHours, 10) % 12;
  if (period && period.toUpperCase() === 'PM') hours += 12;
  const minutes = parseInt(rawMinutes, 10);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

// Date → "HH:mm" in local time
export function dateToHHMM(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// "9:30 AM" / "12:00 PM" → "HH:mm" (24h). Returns null on bad input.
export function ampmToHHMM(timeString) {
  if (!timeString || typeof timeString !== 'string') return null;
  const parts = timeString.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const [time, period] = parts;
  const [rawH, rawM] = time.split(':');
  const h = parseInt(rawH, 10);
  const m = parseInt(rawM, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const hours = (h % 12) + (period.toUpperCase() === 'PM' ? 12 : 0);
  return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
