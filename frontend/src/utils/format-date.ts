// en-GB gives the day before the month: "23 Oct 2026, 12:15", in the user's local time zone
const formatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(iso: string): string {
  return formatter.format(new Date(iso))
}
