/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { BulkBlockModal } from './components/BulkBlockModal';
import { CalendarWorkspace } from './components/CalendarWorkspace';
import { DayInspectorPanel, InspectorMode } from './components/DayInspectorPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { VenueDescriptionSection } from './components/VenueDescriptionSection';
import { VenueHeaderStrip } from './components/VenueHeaderStrip';
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import { ReservationType } from './types/booking';
import { getMonthPrefix, getTodayISO, pad2 } from './utils/dateUtils';

function BoaVistaApp() {
  const { availabilityMap } = useFirebase();

  const todayISO = getTodayISO();
  const initialDate = new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('view');
  const [formType, setFormType] = useState<ReservationType>('reservation');
  const [showBulkBlock, setShowBulkBlock] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const monthStats = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prefix = getMonthPrefix(currentYear, currentMonth);
    let reservedCount = 0;
    let blockedCount = 0;
    let nextFreeDateISO: string | null = null;

    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${prefix}-${pad2(d)}`;
      const entry = availabilityMap[iso];
      if (!entry) {
        if (!nextFreeDateISO && iso >= todayISO) {
          nextFreeDateISO = iso;
        }
      } else if (entry.status === 'reserved') {
        reservedCount++;
      } else if (entry.status === 'blocked') {
        blockedCount++;
      }
    }

    const freeCount = daysInMonth - reservedCount - blockedCount;
    return { freeCount, reservedCount, blockedCount, nextFreeDateISO };
  }, [currentYear, currentMonth, availabilityMap, todayISO]);

  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function handleGoToday() {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(getTodayISO());
    setInspectorMode('view');
  }

  function handleSelectDate(dateISO: string) {
    setSelectedDate(dateISO);
    setInspectorMode('view');

    // Automatically switch month view if user clicks an adjacent month's cell
    const [y, m] = dateISO.split('-').map(Number);
    if (y && m && (y !== currentYear || m - 1 !== currentMonth)) {
      setCurrentYear(y);
      setCurrentMonth(m - 1);
    }
  }

  function handleOpenNewReservation() {
    const targetDate = !availabilityMap[selectedDate]
      ? selectedDate
      : monthStats.nextFreeDateISO || selectedDate;
    setSelectedDate(targetDate);
    setFormType('reservation');
    setInspectorMode('form');
    const el = document.getElementById('calendario');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleNavigateSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        onNavigateSection={handleNavigateSection}
        onOpenNewReservation={handleOpenNewReservation}
      />

      <main className="flex-1">
        <VenueHeaderStrip
          currentYear={currentYear}
          currentMonth={currentMonth}
          freeCount={monthStats.freeCount}
          reservedCount={monthStats.reservedCount}
          blockedCount={monthStats.blockedCount}
          nextFreeDateISO={monthStats.nextFreeDateISO}
          onJumpToDate={handleSelectDate}
        />

        <section
          id="calendario"
          className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8"
        >
          {toastMessage && (
            <div className="mb-4 flex items-center justify-between gap-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900">
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                Fechar
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <CalendarWorkspace
                currentYear={currentYear}
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onGoToday={handleGoToday}
                onSelectDate={handleSelectDate}
                onOpenNewReservation={handleOpenNewReservation}
                onOpenBulkBlock={() => setShowBulkBlock(true)}
              />
            </div>

            <div className="lg:col-span-4">
              <DayInspectorPanel
                selectedDate={selectedDate}
                mode={inspectorMode}
                formType={formType}
                onChangeMode={(nextMode, nextType) => {
                  if (nextType) setFormType(nextType);
                  setInspectorMode(nextMode);
                }}
              />
            </div>
          </div>
        </section>

        <VenueDescriptionSection />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Espaço Boa Vista · Agenda Oficial de Disponibilidade</span>
          <span>Controle de reservas, bloqueios e descrições</span>
        </div>
      </footer>

      {showBulkBlock && (
        <BulkBlockModal
          initialYear={currentYear}
          initialMonth={currentMonth}
          onClose={() => setShowBulkBlock(false)}
          onSuccess={(count) =>
            setToastMessage(
              `${count} ${count === 1 ? 'data bloqueada' : 'datas bloqueadas'} manualmente no calendário.`,
            )
          }
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <BoaVistaApp />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
