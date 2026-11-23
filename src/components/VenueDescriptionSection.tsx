import { Check, FileEdit, MapPin, Phone, Clock, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { saveVenueProfile } from '../services/bookingService';
import { BLUEPRINT_LIMITS, VenueProfile } from '../types/booking';

export function VenueDescriptionSection() {
  const { venueProfile, isAdmin } = useFirebase();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<VenueProfile>(venueProfile);
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setForm(venueProfile);
    }
  }, [venueProfile, editing]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSaveFeedback(null);
    setSaving(true);
    try {
      await saveVenueProfile(form);
      setEditing(false);
      setSaveFeedback('Descrições do Espaço Boa Vista atualizadas com sucesso.');
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'Não foi possível salvar as descrições.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id="sobre-salao"
      className="bg-white border-t border-slate-200 mt-10"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              Sobre o {venueProfile.name}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Informações gerais, estrutura da piscina e orientações de reserva
            </p>
          </div>

          {isAdmin && !editing && (
            <button
              type="button"
              onClick={() => {
                setSaveFeedback(null);
                setErrorMsg(null);
                setForm(venueProfile);
                setEditing(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileEdit className="w-4 h-4" />
              <span>Editar Descrições do Espaço</span>
            </button>
          )}
        </div>

        {saveFeedback && (
          <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{saveFeedback}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
            {errorMsg}
          </div>
        )}

        {editing && isAdmin ? (
          <form onSubmit={(e) => void handleSave(e)} className="mt-6 space-y-5 max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do espaço *
                </label>
                <input
                  type="text"
                  required
                  maxLength={BLUEPRINT_LIMITS.VENUE_NAME_MAX}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Frase de destaque (subtítulo)
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.VENUE_TAGLINE_MAX}
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Capacidade
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.VENUE_CAPACITY_MAX}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Horário padrão
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.VENUE_HOURS_MAX}
                  value={form.defaultHours}
                  onChange={(e) => setForm({ ...form, defaultHours: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  WhatsApp / Contato
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.CLIENT_PHONE_MAX}
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="(00) 90000-0000"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Localização / Bairro
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.VENUE_LOCATION_MAX}
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Descrição principal do espaço
                </label>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {form.description.length}/{BLUEPRINT_LIMITS.VENUE_DESCRIPTION_MAX}
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={BLUEPRINT_LIMITS.VENUE_DESCRIPTION_MAX}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Piscina, área gourmet e comodidades
                  </label>
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {form.amenitiesDescription.length}/{BLUEPRINT_LIMITS.VENUE_AMENITIES_MAX}
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={BLUEPRINT_LIMITS.VENUE_AMENITIES_MAX}
                  value={form.amenitiesDescription}
                  onChange={(e) =>
                    setForm({ ...form, amenitiesDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Regras e condições de reserva
                  </label>
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {form.rulesDescription.length}/{BLUEPRINT_LIMITS.VENUE_RULES_MAX}
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={BLUEPRINT_LIMITS.VENUE_RULES_MAX}
                  value={form.rulesDescription}
                  onChange={(e) =>
                    setForm({ ...form, rulesDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-700"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
              >
                {saving ? 'Salvando...' : 'Salvar Descrições'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditing(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div id="comodidades" className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="space-y-3">
              <h3 className="font-display text-base font-bold text-slate-900">
                01. O Espaço
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {venueProfile.description}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-display text-base font-bold text-slate-900">
                02. Piscina e Comodidades
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {venueProfile.amenitiesDescription}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-display text-base font-bold text-slate-900">
                03. Regras e Atendimento
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {venueProfile.rulesDescription}
              </p>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>{venueProfile.capacity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-700 shrink-0" />
                  <span className="tabular-nums">{venueProfile.defaultHours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>{venueProfile.location}</span>
                </div>
                {venueProfile.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-sky-700 shrink-0" />
                    <span className="tabular-nums font-medium">{venueProfile.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
