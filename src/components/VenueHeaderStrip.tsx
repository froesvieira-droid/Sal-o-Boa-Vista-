import { ArrowRight, CalendarCheck } from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { LOGO_PATH } from '../types/booking';
import { formatShortDatePt, MONTH_NAMES_PT } from '../utils/dateUtils';

interface VenueHeaderStripProps {
  currentYear: number;
  currentMonth: number;
  freeCount: number;
  reservedCount: number;
  blockedCount: number;
  nextFreeDateISO: string | null;
  onJumpToDate: (dateISO: string) => void;
}

export function VenueHeaderStrip({
  currentYear,
  currentMonth,
  freeCount,
  reservedCount,
  blockedCount,
  nextFreeDateISO,
  onJumpToDate,
}: VenueHeaderStripProps) {
  const { venueProfile } = useFirebase();
  const monthLabel = `${MONTH_NAMES_PT[currentMonth]} ${currentYear}`;

  return (
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Venue Brand & Logo Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-amber-400/70 bg-sky-50 shrink-0 shadow-xs">
              <img
                src={LOGO_PATH}
                alt="Espaço Boa Vista — Logo Oficial"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                {venueProfile.name}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
                {venueProfile.tagline}
              </p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-slate-500 mt-2">
                <span>{venueProfile.capacity}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{venueProfile.defaultHours}</span>
                <span aria-hidden="true">·</span>
                <span>{venueProfile.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 shrink-0">
            <CalendarCheck className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>Agenda aberta para edição e reservas diretas</span>
          </div>
        </div>

        {/* Full-Width 4-Column Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-5">
          <div>
            <p className="text-xs text-slate-500">Dias livres em {monthLabel}</p>
            <p className="font-display text-2xl font-bold text-emerald-700 tabular-nums mt-0.5">
              {freeCount} {freeCount === 1 ? 'dia' : 'dias'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Dias reservados</p>
            <p className="font-display text-2xl font-bold text-amber-700 tabular-nums mt-0.5">
              {reservedCount} {reservedCount === 1 ? 'dia' : 'dias'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Datas bloqueadas</p>
            <p className="font-display text-2xl font-bold text-slate-700 tabular-nums mt-0.5">
              {blockedCount} {blockedCount === 1 ? 'dia' : 'dias'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Próxima data livre</p>
            {nextFreeDateISO ? (
              <button
                type="button"
                onClick={() => onJumpToDate(nextFreeDateISO)}
                className="mt-0.5 inline-flex items-center gap-1.5 font-display text-2xl font-bold text-sky-700 hover:text-sky-900 tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 rounded"
              >
                <span>{formatShortDatePt(nextFreeDateISO)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <p className="font-display text-lg font-semibold text-slate-500 mt-1">
                Sem datas livres no mês
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
