import {
  Calendar as CalendarIcon,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  List,
  Lock,
  ShieldBan,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { DayStatus } from '../types/booking';
import {
  buildMonthGrid,
  formatDisplayDatePt,
  getMonthPrefix,
  getTodayISO,
  MONTH_NAMES_PT,
  WEEKDAY_SHORT_PT,
} from '../utils/dateUtils';

export type CalendarFilter = 'all' | 'free' | 'reserved' | 'blocked';

interface CalendarWorkspaceProps {
  currentYear: number;
  currentMonth: number;
  selectedDate: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToday: () => void;
  onSelectDate: (dateISO: string) => void;
  onOpenNewReservation: () => void;
  onOpenBulkBlock: () => void;
}

export function CalendarWorkspace({
  currentYear,
  currentMonth,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  onSelectDate,
  onOpenNewReservation,
  onOpenBulkBlock,
}: CalendarWorkspaceProps) {
  const { availabilityMap, reservationsMap, isAdmin, availabilityLoaded } = useFirebase();
  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const todayISO = getTodayISO();
  const cells = useMemo(
    () => buildMonthGrid(currentYear, currentMonth),
    [currentYear, currentMonth],
  );
  const monthPrefix = getMonthPrefix(currentYear, currentMonth);

  function getDayStatus(dateISO: string): DayStatus {
    const entry = availabilityMap[dateISO];
    if (!entry) return 'free';
    return entry.status === 'blocked' ? 'blocked' : 'reserved';
  }

  const monthListRows = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const rows: {
      dateISO: string;
      status: DayStatus;
      title: string;
      publicNote: string;
      clientName: string;
      hours: string;
    }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateISO = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      const status = getDayStatus(dateISO);
      if (filter !== 'all' && status !== filter) continue;
      if (filter === 'all' && status === 'free') continue;

      const avail = availabilityMap[dateISO];
      const res = reservationsMap[dateISO];

      rows.push({
        dateISO,
        status,
        title:
          isAdmin && res
            ? res.title
            : status === 'reserved'
              ? 'Reservado'
              : status === 'blocked'
                ? 'Bloqueado'
                : 'Disponível para reserva',
        publicNote: avail?.publicNote || '',
        clientName: isAdmin && res?.clientName ? res.clientName : '',
        hours:
          isAdmin && res && res.type === 'reservation'
            ? `${res.startTime}–${res.endTime}`
            : '',
      });
    }
    return rows;
  }, [currentYear, currentMonth, monthPrefix, filter, availabilityMap, reservationsMap, isAdmin]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Workspace Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Month Switcher */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Mês anterior"
              className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 min-w-[165px] text-center whitespace-nowrap">
              {MONTH_NAMES_PT[currentMonth]} {currentYear}
            </h2>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Próximo mês"
              className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onGoToday}
              className="ml-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Hoje
            </button>
          </div>

          {/* Owner Actions */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenBulkBlock}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
              >
                <ShieldBan className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Bloquear Datas</span>
              </button>
              <button
                type="button"
                onClick={onOpenNewReservation}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-1"
              >
                <CalendarPlus className="w-4 h-4 shrink-0" />
                <span>Nova Reserva</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter & View Segmented Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filtrar datas por disponibilidade"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full"
          >
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'free', label: 'Livres' },
                { id: 'reserved', label: 'Reservados' },
                { id: 'blocked', label: 'Bloqueados' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === item.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Alternar visualização"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0"
          >
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista do Mês</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar or List Body */}
      {!availabilityLoaded ? (
        <div className="p-5 grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, idx) => (
            <div key={idx} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="p-3 sm:p-5">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
            {WEEKDAY_SHORT_PT.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-slate-500 py-1.5"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {cells.map((cell) => {
              const status = getDayStatus(cell.dateISO);
              const isSelected = cell.dateISO === selectedDate;
              const isToday = cell.dateISO === todayISO;
              const isPast = cell.dateISO < todayISO;
              const matchesFilter = filter === 'all' || filter === status;
              const adminRecord = isAdmin ? reservationsMap[cell.dateISO] : undefined;
              const publicAvail = availabilityMap[cell.dateISO];

              let containerStyles = '';
              if (status === 'free') {
                containerStyles = cell.inCurrentMonth
                  ? 'bg-emerald-50/65 hover:bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/70 text-slate-500';
              } else if (status === 'reserved') {
                containerStyles = cell.inCurrentMonth
                  ? 'bg-amber-50 hover:bg-amber-100/80 border-amber-300 text-amber-950'
                  : 'bg-amber-50/40 hover:bg-amber-50/70 border-amber-200/70 text-amber-900/70';
              } else {
                containerStyles = cell.inCurrentMonth
                  ? 'bg-slate-100 hover:bg-slate-200/70 border-slate-300 text-slate-800 blocked-pattern'
                  : 'bg-slate-100/50 hover:bg-slate-100 border-slate-200/70 text-slate-500 blocked-pattern';
              }

              return (
                <button
                  key={cell.dateISO}
                  type="button"
                  onClick={() => onSelectDate(cell.dateISO)}
                  aria-label={`${formatDisplayDatePt(cell.dateISO)} — ${
                    status === 'free'
                      ? 'Livre'
                      : status === 'reserved'
                        ? 'Reservado'
                        : 'Bloqueado'
                  }`}
                  aria-pressed={isSelected}
                  className={`relative min-h-[76px] sm:min-h-[96px] p-1.5 sm:p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 ${containerStyles} ${
                    isSelected ? 'ring-2 ring-sky-700 ring-offset-1 z-10' : ''
                  } ${!matchesFilter ? 'opacity-30' : isPast && cell.inCurrentMonth ? 'opacity-80' : ''}`}
                >
                  {/* Top row: Day Number + Hoje */}
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span
                      className={`font-mono text-xs sm:text-sm font-semibold tabular-nums ${
                        isToday
                          ? 'inline-flex items-center justify-center w-6 h-6 rounded-md bg-sky-700 text-white'
                          : ''
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {isToday && (
                      <span className="hidden sm:inline text-[11px] font-semibold text-sky-700">
                        Hoje
                      </span>
                    )}
                  </div>

                  {/* Bottom status & summary */}
                  <div className="mt-1.5 space-y-0.5 w-full overflow-hidden">
                    {status === 'free' && (
                      <div className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">Livre</span>
                      </div>
                    )}

                    {status === 'reserved' && (
                      <>
                        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-amber-900">
                          <CalendarIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="truncate">Reservado</span>
                        </div>
                        {isAdmin && adminRecord ? (
                          <p className="hidden sm:block text-[11px] text-amber-900/90 truncate font-medium">
                            {adminRecord.title}
                          </p>
                        ) : publicAvail?.publicNote ? (
                          <p className="hidden sm:block text-[11px] text-amber-900/80 truncate">
                            {publicAvail.publicNote}
                          </p>
                        ) : null}
                      </>
                    )}

                    {status === 'blocked' && (
                      <>
                        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-700">
                          <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span className="truncate">Bloqueado</span>
                        </div>
                        {isAdmin && adminRecord ? (
                          <p className="hidden sm:block text-[11px] text-slate-600 truncate">
                            {adminRecord.title}
                          </p>
                        ) : publicAvail?.publicNote ? (
                          <p className="hidden sm:block text-[11px] text-slate-600 truncate">
                            {publicAvail.publicNote}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300 inline-block" />
              <span>Livre (disponível para reserva)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300 inline-block" />
              <span>Reservado (evento confirmado)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300 blocked-pattern inline-block" />
              <span>Bloqueado manualmente</span>
            </div>
          </div>
        </div>
      ) : (
        /* High-Density Monthly Table View */
        <div className="overflow-x-auto">
          {monthListRows.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-800">
                {filter === 'all'
                  ? `Nenhuma reserva ou bloqueio registrado em ${MONTH_NAMES_PT[currentMonth]}.`
                  : 'Nenhuma data encontrada para o filtro selecionado.'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Todos os dias sem marcação estão livres no calendário.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">{isAdmin ? 'Evento / Motivo' : 'Observação'}</th>
                  {isAdmin && <th className="py-3 px-4">Cliente</th>}
                  {isAdmin && <th className="py-3 px-4 text-right">Horário</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {monthListRows.map((row) => (
                  <tr
                    key={row.dateISO}
                    onClick={() => onSelectDate(row.dateISO)}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      row.dateISO === selectedDate ? 'bg-sky-50/60' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-xs sm:text-sm font-medium text-slate-900 tabular-nums whitespace-nowrap">
                      {formatDisplayDatePt(row.dateISO)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {row.status === 'free' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          Livre
                        </span>
                      )}
                      {row.status === 'reserved' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                          <CalendarIcon className="w-3.5 h-3.5 text-amber-700" />
                          Reservado
                        </span>
                      )}
                      {row.status === 'blocked' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Lock className="w-3.5 h-3.5 text-slate-600" />
                          Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-800 max-w-[260px] truncate">
                      {row.title}
                      {row.publicNote && !isAdmin ? ` · ${row.publicNote}` : ''}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-slate-600 max-w-[180px] truncate">
                        {row.clientName || '—'}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {row.hours || '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
