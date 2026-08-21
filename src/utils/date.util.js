const DEFAULT_TIMEZONE = 'Asia/Jakarta';

function resolveTimezone(timeZone) {
  return timeZone || process.env.APP_TIMEZONE || DEFAULT_TIMEZONE;
}

// en-CA memformat tanggal sebagai YYYY-MM-DD, sama dengan format kolom date.
function today(timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: resolveTimezone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Geser tanggal lewat UTC murni supaya pergeseran DST tidak pernah membuat
// satu hari terlewat atau terhitung 2 kali.
function shiftDays(dateStr, delta) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + delta);
  return shifted.toISOString().split('T')[0];
}

module.exports = { today, shiftDays };
