export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export const WEEKDAY_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export const WEEKDAY_FULL_PT = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const;

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function toDateISO(year: number, monthZeroIndexed: number, day: number): string {
  return `${year}-${pad2(monthZeroIndexed + 1)}-${pad2(day)}`;
}

export function getTodayISO(): string {
  const now = new Date();
  return toDateISO(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseDateISO(dateISO: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatFullDatePt(dateISO: string): string {
  const dt = parseDateISO(dateISO);
  const weekday = WEEKDAY_FULL_PT[dt.getDay()];
  const day = dt.getDate();
  const month = MONTH_NAMES_PT[dt.getMonth()];
  const year = dt.getFullYear();
  return `${weekday}, ${day} de ${month} de ${year}`;
}

export function formatShortDatePt(dateISO: string): string {
  const [, m, d] = dateISO.split('-');
  return `${d}/${m}`;
}

export function formatDisplayDatePt(dateISO: string): string {
  const [y, m, d] = dateISO.split('-');
  return `${d}/${m}/${y}`;
}

export interface CalendarCell {
  dateISO: string;
  dayNumber: number;
  inCurrentMonth: boolean;
}

export function buildMonthGrid(year: number, monthZeroIndexed: number): CalendarCell[] {
  const firstDayOfMonth = new Date(year, monthZeroIndexed, 1);
  const startWeekday = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthZeroIndexed, 0).getDate();

  const cells: CalendarCell[] = [];

  // Previous month leading cells
  const prevMonth = monthZeroIndexed === 0 ? 11 : monthZeroIndexed - 1;
  const prevYear = monthZeroIndexed === 0 ? year - 1 : year;
  for (let i = startWeekday - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    cells.push({
      dateISO: toDateISO(prevYear, prevMonth, dayNum),
      dayNumber: dayNum,
      inCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      dateISO: toDateISO(year, monthZeroIndexed, d),
      dayNumber: d,
      inCurrentMonth: true,
    });
  }

  // Trailing next month cells to complete 6 rows (42) or 5 rows (35)
  const totalNeeded = cells.length <= 35 ? 35 : 42;
  const nextMonth = monthZeroIndexed === 11 ? 0 : monthZeroIndexed + 1;
  const nextYear = monthZeroIndexed === 11 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length < totalNeeded) {
    cells.push({
      dateISO: toDateISO(nextYear, nextMonth, nextDay),
      dayNumber: nextDay,
      inCurrentMonth: false,
    });
    nextDay++;
  }

  return cells;
}

export function getMonthPrefix(year: number, monthZeroIndexed: number): string {
  return `${year}-${pad2(monthZeroIndexed + 1)}`;
}
