import { AlertTriangle, ChevronLeft, ChevronRight, Lock, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { blockMultipleDates } from '../services/bookingService';
import { BLUEPRINT_LIMITS } from '../types/booking';
import {
  buildMonthGrid,
  formatShortDatePt,
  MONTH_NAMES_PT,
  WEEKDAY_SHORT_PT,
} from '../utils/dateUtils';

interface BulkBlockModalProps {
  initialYear: number;
  initialMonth: number;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export function BulkBlockModal({
  initialYear,
  initialMonth,
  onClose,
  onSuccess,
}: BulkBlockModalProps) {
  const { availabilityMap, reservationsMap } = useFirebase();

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [title, setTitle] = useState('Bloqueio manual');
  const [description, setDescription] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const conflictingReservedDates = useMemo(
    () => selectedDates.filter((d) => availabilityMap[d]?.status === 'reserved'),
    [selectedDates, availabilityMap],
  );

  function toggleDate(dateISO: string) {
    setSelectedDates((prev) =>
      prev.includes(dateISO)
        ? prev.filter((item) => item !== dateISO)
        : [...prev, dateISO].sort(),
    );
  }

  function handlePrevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedDates.length === 0) {
      setErrorMsg('Selecione pelo menos uma data no calendário acima.');
      return;
    }

    setSubmitting(true);
    try {
      await blockMultipleDates({
        dates: selectedDates,
        title,
        description,
        publicNote,
        existingMap: reservationsMap,
      });
      onSuccess(selectedDates.length);
      onClose();
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'Erro ao bloquear as datas.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-block-title"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-slate-700" />
            <h2 id="bulk-block-title" className="font-display text-lg font-bold text-slate-900">
              Bloqueio Manual de Datas Específicas
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-5">
          {errorMsg && (
            <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-800">
              {errorMsg}
            </div>
          )}

          {/* Mini Date Picker */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-700">
                Clique nos dias que deseja bloquear ({selectedDates.length} selecionados)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-800 min-w-[125px] text-center">
                  {MONTH_NAMES_PT[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAY_SHORT_PT.map((w) => (
                <div key={w} className="text-center text-[11px] font-medium text-slate-500 py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell) => {
                const isSelected = selectedDates.includes(cell.dateISO);
                const avail = availabilityMap[cell.dateISO];
                const isReserved = avail?.status === 'reserved';
                const isBlocked = avail?.status === 'blocked';

                return (
                  <button
                    key={cell.dateISO}
                    type="button"
                    onClick={() => toggleDate(cell.dateISO)}
                    className={`py-2 rounded-md text-xs font-mono tabular-nums border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-700 text-white border-sky-700 font-semibold'
                        : isReserved
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : isBlocked
                            ? 'bg-slate-200 text-slate-700 border-slate-300'
                            : cell.inCurrentMonth
                              ? 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                              : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}
                  >
                    {cell.dayNumber}
                  </button>
                );
              })}
            </div>

            {selectedDates.length > 0 && (
              <p className="mt-2.5 text-xs text-slate-600">
                Datas selecionadas:{' '}
                <span className="font-mono font-medium text-slate-900">
                  {selectedDates.map(formatShortDatePt).join(', ')}
                </span>
              </p>
            )}
          </div>

          {conflictingReservedDates.length > 0 && (
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <span>
                Atenção: as datas{' '}
                <strong className="font-mono">
                  {conflictingReservedDates.map(formatShortDatePt).join(', ')}
                </strong>{' '}
                já possuem reserva confirmada. Confirmar irá substituí-las por bloqueio manual.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Motivo do bloqueio *
              </label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Manutenção da piscina"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nota pública no calendário (opcional)
              </label>
              <input
                type="text"
                maxLength={BLUEPRINT_LIMITS.PUBLIC_NOTE_MAX}
                value={publicNote}
                onChange={(e) => setPublicNote(e.target.value)}
                placeholder="Ex: Fechado para manutenção"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Descrição detalhada (somente proprietário)
            </label>
            <textarea
              rows={3}
              maxLength={BLUEPRINT_LIMITS.DESCRIPTION_MAX}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anotações internas sobre o motivo do bloqueio..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || selectedDates.length === 0}
              className="px-5 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting
                ? 'Bloqueando...'
                : `Bloquear ${selectedDates.length || ''} ${
                    selectedDates.length === 1 ? 'Data' : 'Datas'
                  }`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
