import {
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  FileEdit,
  Lock,
  Pencil,
  Phone,
  ShieldAlert,
  Trash2,
  Unlock,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import {
  freeDate,
  saveReservationOrBlock,
  updateDayDescriptions,
} from '../services/bookingService';
import {
  BLUEPRINT_LIMITS,
  DayStatus,
  PaymentStatus,
  ReservationFormInput,
  ReservationType,
} from '../types/booking';
import { formatFullDatePt } from '../utils/dateUtils';

export type InspectorMode = 'view' | 'form' | 'edit-description';

interface DayInspectorPanelProps {
  selectedDate: string;
  mode: InspectorMode;
  formType: ReservationType;
  onChangeMode: (mode: InspectorMode, formType?: ReservationType) => void;
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  none: 'Não informado',
  pending: 'Pagamento pendente',
  deposit: 'Sinal pago',
  paid: 'Total quitado',
};

export function DayInspectorPanel({
  selectedDate,
  mode,
  formType,
  onChangeMode,
}: DayInspectorPanelProps) {
  const { availabilityMap, reservationsMap, isAdmin, reservationsLoaded } =
    useFirebase();

  const avail = availabilityMap[selectedDate];
  const record = isAdmin ? reservationsMap[selectedDate] : undefined;
  const dayStatus: DayStatus = !avail
    ? 'free'
    : avail.status === 'blocked'
      ? 'blocked'
      : 'reserved';

  // Form states
  const [editType, setEditType] = useState<ReservationType>(formType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [guestCount, setGuestCount] = useState<number>(50);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('22:00');
  const [totalValue, setTotalValue] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('deposit');

  const [submitting, setSubmitting] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync form fields when selected date, mode, or record changes
  useEffect(() => {
    setFormError(null);
    setConfirmRelease(false);

    if (mode === 'form') {
      if (record && formType === record.type) {
        setEditType(record.type);
        setTitle(record.title);
        setDescription(record.description);
        setPublicNote(avail?.publicNote || '');
        setClientName(record.clientName);
        setClientPhone(record.clientPhone);
        setGuestCount(record.guestCount);
        setStartTime(record.startTime || '09:00');
        setEndTime(record.endTime || '22:00');
        setTotalValue(record.totalValue);
        setPaymentStatus(record.paymentStatus);
      } else if (record && formType !== record.type) {
        setEditType(formType);
        setTitle(formType === 'blocked' ? 'Data bloqueada manualmente' : '');
        setDescription(record.description || '');
        setPublicNote(avail?.publicNote || '');
        setClientName(record.clientName || '');
        setClientPhone(record.clientPhone || '');
        setGuestCount(record.guestCount || 50);
        setStartTime(record.startTime || '09:00');
        setEndTime(record.endTime || '22:00');
        setTotalValue(record.totalValue || '');
        setPaymentStatus(formType === 'blocked' ? 'none' : 'deposit');
      } else {
        setEditType(formType);
        setTitle(formType === 'blocked' ? 'Bloqueio manual' : '');
        setDescription('');
        setPublicNote('');
        setClientName('');
        setClientPhone('');
        setGuestCount(50);
        setStartTime('09:00');
        setEndTime('22:00');
        setTotalValue('');
        setPaymentStatus(formType === 'blocked' ? 'none' : 'deposit');
      }
    } else if (mode === 'edit-description' && record) {
      setTitle(record.title);
      setDescription(record.description);
      setPublicNote(avail?.publicNote || '');
    }
  }, [selectedDate, mode, formType, record, avail]);

  useEffect(() => {
    setFeedbackMsg(null);
  }, [selectedDate]);

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload: ReservationFormInput = {
        date: selectedDate,
        type: editType,
        title,
        description,
        publicNote,
        clientName,
        clientPhone,
        guestCount: Number(guestCount) || 0,
        startTime,
        endTime,
        totalValue,
        paymentStatus: editType === 'reservation' ? paymentStatus : 'none',
      };
      await saveReservationOrBlock(payload, record);
      setFeedbackMsg(
        editType === 'reservation'
          ? 'Reserva salva com sucesso.'
          : 'Data bloqueada com sucesso.',
      );
      onChangeMode('view');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Erro ao salvar alterações.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDescriptions(e: React.FormEvent) {
    e.preventDefault();
    if (!record) return;
    setFormError(null);
    setSubmitting(true);

    try {
      await updateDayDescriptions({
        date: selectedDate,
        title,
        description,
        publicNote,
        existingRecord: record,
      });
      setFeedbackMsg('Descrições atualizadas com sucesso.');
      onChangeMode('view');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Erro ao atualizar descrições.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReleaseDate() {
    setFormError(null);
    setSubmitting(true);
    try {
      await freeDate(selectedDate);
      setConfirmRelease(false);
      setFeedbackMsg('Data liberada no calendário.');
      onChangeMode('view');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Erro ao liberar a data.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="bg-white border border-slate-200 rounded-xl overflow-hidden lg:sticky lg:top-20">
      {/* Header Date & Status */}
      <div className="p-5 border-b border-slate-200">
        <p className="text-xs font-medium text-slate-500">Data selecionada</p>
        <h3 className="font-display text-lg font-bold text-slate-900 mt-0.5 capitalize">
          {formatFullDatePt(selectedDate)}
        </h3>

        <div className="mt-3 flex items-center gap-2">
          {dayStatus === 'free' && (
            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Dia Livre — Disponível</span>
            </div>
          )}
          {dayStatus === 'reserved' && (
            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900">
              <CalendarCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Dia Reservado</span>
            </div>
          )}
          {dayStatus === 'blocked' && (
            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <Lock className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Data Bloqueada Manualmente</span>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className="mx-5 mt-4 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-900">
          {feedbackMsg}
        </div>
      )}

      {formError && (
        <div className="mx-5 mt-4 px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-800">
          {formError}
        </div>
      )}

      {/* Body */}
      <div className="p-5">
        {/* MODE: VIEW */}
        {mode === 'view' && (
          <>
            {dayStatus === 'free' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Esta data está livre no calendário do Espaço Boa Vista e disponível para agendamento.
                </p>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => onChangeMode('form', 'reservation')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>Adicionar Reserva</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeMode('form', 'blocked')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-slate-600" />
                    <span>Bloquear esta Data</span>
                  </button>
                </div>
              </div>
            )}

            {dayStatus !== 'free' && isAdmin && !reservationsLoaded && (
              <div className="space-y-3">
                <div className="h-5 w-2/3 bg-slate-100 rounded animate-pulse" />
                <div className="h-16 w-full bg-slate-100 rounded animate-pulse" />
              </div>
            )}

            {dayStatus !== 'free' && isAdmin && reservationsLoaded && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">
                    {dayStatus === 'reserved' ? 'Evento' : 'Motivo do bloqueio'}
                  </p>
                  <p className="font-display text-base font-bold text-slate-900 mt-0.5">
                    {record?.title || (dayStatus === 'reserved' ? 'Reserva registrada' : 'Bloqueio manual')}
                  </p>
                </div>

                {record?.type === 'reservation' && (
                  <div className="grid grid-cols-1 gap-2.5 py-3 border-y border-slate-100 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        Cliente
                      </span>
                      <span className="font-medium text-slate-900 text-right">
                        {record.clientName || 'Não informado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3.5 h-3.5" />
                        Contato
                      </span>
                      <span className="font-mono text-xs sm:text-sm text-slate-900 tabular-nums">
                        {record.clientPhone || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        Horário
                      </span>
                      <span className="font-mono text-xs sm:text-sm text-slate-900 tabular-nums">
                        {record.startTime} às {record.endTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <Users className="w-3.5 h-3.5" />
                        Convidados
                      </span>
                      <span className="font-mono text-xs sm:text-sm text-slate-900 tabular-nums">
                        {record.guestCount} pessoas
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        <Wallet className="w-3.5 h-3.5" />
                        Valor / Pagamento
                      </span>
                      <span className="text-slate-900 text-right tabular-nums">
                        {record.totalValue ? `${record.totalValue} · ` : ''}
                        <span className="font-medium">
                          {PAYMENT_LABELS[record.paymentStatus]}
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Internal Description */}
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    Descrição e observações internas
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {record?.description || 'Nenhuma descrição adicionada.'}
                  </p>
                </div>

                {/* Public Note */}
                {avail?.publicNote && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs font-medium text-slate-500 mb-0.5">
                      Nota visível no calendário público
                    </p>
                    <p className="text-xs text-slate-700">{avail.publicNote}</p>
                  </div>
                )}

                {/* Owner Action Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  {record && (
                    <button
                      type="button"
                      onClick={() => onChangeMode('edit-description')}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <FileEdit className="w-4 h-4" />
                      <span>Editar Descrição</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      onChangeMode('form', record?.type || (dayStatus === 'blocked' ? 'blocked' : 'reservation'))
                    }
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>
                      {dayStatus === 'reserved' ? 'Editar Reserva Completa' : 'Editar Bloqueio'}
                    </span>
                  </button>

                  {!confirmRelease ? (
                    <button
                      type="button"
                      onClick={() => setConfirmRelease(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {dayStatus === 'blocked' ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          <span>Desbloquear Data</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Cancelar Reserva e Liberar</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2.5">
                      <div className="flex items-start gap-2 text-xs text-rose-900">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-700 mt-0.5" />
                        <span>
                          Tem certeza que deseja liberar esta data? Ela voltará a aparecer como{' '}
                          <strong>Livre</strong> no calendário.
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void handleReleaseDate()}
                          className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-md transition-colors disabled:opacity-60 cursor-pointer"
                        >
                          {submitting ? 'Liberando...' : 'Confirmar'}
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => setConfirmRelease(false)}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                        >
                          Voltar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* MODE: QUICK DESCRIPTION EDIT */}
        {mode === 'edit-description' && isAdmin && record && (
          <form onSubmit={(e) => void handleSaveDescriptions(e)} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-bold text-slate-900">
                Editar descrições desta data
              </h4>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Título / Resumo *
              </label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Descrição detalhada (somente proprietário)
                </label>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {description.length}/{BLUEPRINT_LIMITS.DESCRIPTION_MAX}
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={BLUEPRINT_LIMITS.DESCRIPTION_MAX}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes do evento, combinados, itens inclusos ou motivo do bloqueio..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Nota pública no calendário (opcional)
                </label>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {publicNote.length}/{BLUEPRINT_LIMITS.PUBLIC_NOTE_MAX}
                </span>
              </div>
              <input
                type="text"
                maxLength={BLUEPRINT_LIMITS.PUBLIC_NOTE_MAX}
                value={publicNote}
                onChange={(e) => setPublicNote(e.target.value)}
                placeholder="Ex: Manutenção programada (não inclua dados pessoais)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Salvando...' : 'Salvar Descrição'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => onChangeMode('view')}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* MODE: CREATE OR FULL EDIT FORM */}
        {mode === 'form' && isAdmin && (
          <form onSubmit={(e) => void handleSaveForm(e)} className="space-y-3.5">
            {/* Segmented Type Selector */}
            <div>
              <span className="block text-xs font-medium text-slate-700 mb-1.5">
                Tipo de registro
              </span>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setEditType('reservation');
                    if (title === 'Bloqueio manual' || title === 'Data bloqueada manualmente') {
                      setTitle('');
                    }
                  }}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    editType === 'reservation'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Reserva de Evento
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditType('blocked');
                    if (!title) setTitle('Bloqueio manual');
                  }}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    editType === 'blocked'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bloqueio Manual
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {editType === 'reservation' ? 'Título do evento *' : 'Motivo do bloqueio *'}
              </label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  editType === 'reservation'
                    ? 'Ex: Aniversário da Júlia'
                    : 'Ex: Limpeza e manutenção da piscina'
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
              />
            </div>

            {editType === 'reservation' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nome do cliente
                    </label>
                    <input
                      type="text"
                      maxLength={BLUEPRINT_LIMITS.CLIENT_NAME_MAX}
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nome completo"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      WhatsApp / Telefone
                    </label>
                    <input
                      type="text"
                      maxLength={BLUEPRINT_LIMITS.CLIENT_PHONE_MAX}
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(00) 90000-0000"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Início
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Término
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Convidados
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full px-2.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Valor combinado
                    </label>
                    <input
                      type="text"
                      maxLength={BLUEPRINT_LIMITS.TOTAL_VALUE_MAX}
                      value={totalValue}
                      onChange={(e) => setTotalValue(e.target.value)}
                      placeholder="Ex: R$ 1.200,00"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Pagamento
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-700"
                    >
                      <option value="pending">Pendente</option>
                      <option value="deposit">Sinal pago</option>
                      <option value="paid">Quitado</option>
                      <option value="none">Não informado</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Descrição e observações (privado)
                </label>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {description.length}/{BLUEPRINT_LIMITS.DESCRIPTION_MAX}
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={BLUEPRINT_LIMITS.DESCRIPTION_MAX}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes da reserva, equipamentos solicitados ou motivo do bloqueio..."
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
                placeholder="Visível a visitantes (não insira telefone/nome)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
              >
                {submitting
                  ? 'Salvando...'
                  : editType === 'reservation'
                    ? 'Salvar Reserva'
                    : 'Confirmar Bloqueio'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => onChangeMode('view')}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </aside>
  );
}
