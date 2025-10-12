export const parseOffsetFromLabel = (label: string) => {
  const match = label.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) return '+00:00';
  const sign = match[1];
  const hours = match[2].padStart(2, '0');
  const minutes = (match[3] || '00').padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
};

export const toNewYorkISOString = (input?: Date | number | string) => {
  const date = input instanceof Date ? new Date(input.getTime())
    : typeof input === 'number' ? new Date(input)
    : typeof input === 'string' ? new Date(input)
    : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Invalid date input');
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'longOffset'
  });
  const parts = formatter.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }
  const offset = parseOffsetFromLabel(values.timeZoneName || 'GMT-00:00');
  const { year, month, day, hour, minute, second } = values;
  if (!year || !month || !day || !hour || !minute || !second) {
    throw new TypeError('Unable to format date');
  }
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
};
