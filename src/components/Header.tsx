import { CalendarPlus } from 'lucide-react';
import { LOGO_PATH } from '../types/booking';

interface HeaderProps {
  onNavigateSection: (id: string) => void;
  onOpenNewReservation: () => void;
}

export function Header({ onNavigateSection, onOpenNewReservation }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#calendario"
          onClick={(e) => {
            e.preventDefault();
            onNavigateSection('calendario');
          }}
          className="flex items-center gap-3 whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 rounded-lg"
        >
          <img
            src={LOGO_PATH}
            alt="Logo Espaço Boa Vista"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover border border-amber-300/80 bg-sky-50 shrink-0"
          />
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 group-hover:text-sky-800 transition-colors">
            Espaço Boa Vista
          </span>
        </a>

        {/* Zone 2: Clean Single-Line Text Navigation */}
        <nav
          aria-label="Navegação principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#calendario"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('calendario');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Calendário
          </a>
          <a
            href="#sobre-salao"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('sobre-salao');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Sobre o Espaço
          </a>
          <a
            href="#comodidades"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('comodidades');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Estrutura e Regras
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenNewReservation}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
          >
            <CalendarPlus className="w-4 h-4 shrink-0" />
            <span>Nova Reserva</span>
          </button>
        </div>
      </div>
    </header>
  );
}
