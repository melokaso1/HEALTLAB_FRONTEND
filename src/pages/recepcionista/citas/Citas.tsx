import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Edit,
  Eye,
  CheckCircle2,
  Plus,
  Trash2,
  RefreshCw,
  Calendar as CalendarIcon,
} from 'lucide-react';
import './Citas.css';

const localDateISO = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};
import {
  cancelAppointmentApi,
  getAppointmentsApi,
  rescheduleAppointmentApi,
  toApiTime,
} from '../../../services/appointments.service';
import { getProfessionalsApi } from '../../../services/professionals.service';
import {
  getHorariosByMedicoApi,
  getTiposCitaApi,
  type CatalogOption,
  type HorarioApi,
} from '../../../services/catalogs.service';
import {
  findPatientByCedula,
  createAppointmentFromInput,
} from '../../../services/createAppointment.logic';
import type { Appointment } from '../../../types/appointment.types';
import type { ProfessionalOption } from '../../../types/appointment.types';
import type { Patient } from '../../../types/patient.types';
import { useAuth } from '../../../context/AuthContext';

const appointmentStartsFromHorario = (horario: HorarioApi): string[] => {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  };
  const toTime = (value: number) =>
    `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  const ranges = [
    [toMinutes(horario.horaEntrada), toMinutes(horario.salidaAlmuerzo)],
    [toMinutes(horario.retornoActividades), toMinutes(horario.horaSalida)],
  ];

  return ranges.flatMap(([start, end]) => {
    const slots: string[] = [];
    for (let current = start; current + 30 <= end; current += 30) {
      slots.push(toTime(current));
    }
    return slots;
  });
};

export interface CalendarEventBlock {
  id: string;
  dayIndex: number;
  hour: string;
  paciente: string;
  servicio: string;
  horaLabel: string;
  color: 'teal' | 'blue' | 'red';
}

export interface SlotSelection {
  dayLabel: string;
  dateISO: string;
  hour: string;
  events: CalendarEventBlock[];
}

interface CitaHoy {
  id: string;
  hora: string;
  paciente: string;
  profesional: string;
  servicio: string;
  estado: 'Atendida' | 'Cancelada' | 'Agendada' | 'No asistió';
}

const RecepCitas: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [monday] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  // API States
  const [, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [tiposCita, setTiposCita] = useState<CatalogOption[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  /** null = checking / no professional; true/false after horarios load */
  const [selectedProfHasSchedule, setSelectedProfHasSchedule] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const NO_SCHEDULE_MSG =
    'El profesional seleccionado no tiene jornada configurada. Configure su horario en Profesionales antes de agendar.';

  const [citasHoyList, setCitasHoyList] = useState<CitaHoy[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<CalendarEventBlock[]>([]);

  // Selection & Form State for Nueva / Reprogramar Cita
  const [isNuevaCitaOpen, setIsNuevaCitaOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<CitaHoy | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection | null>(null);

  const [docType, setDocType] = useState('CC');
  const [cedulaQuery, setCedulaQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profesionalSelect, setProfesionalSelect] = useState('');
  const [servicioSelect, setServicioSelect] = useState('');
  const [fechaInput, setFechaInput] = useState(localDateISO());
  const [horaInput, setHoraInput] = useState('09:00');
  const [notasInput, setNotasInput] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  useEffect(() => {
    const state = location.state as { patient?: Patient; searchCedula?: string } | undefined;
    if (state?.patient || state?.searchCedula) {
      if (state.patient) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- navigation state initializes the appointment form.
        setSelectedPatient(state.patient);
        setCedulaQuery(state.patient.documentNumber);
      } else if (state.searchCedula) {
        setCedulaQuery(state.searchCedula);
      }
      setIsNuevaCitaOpen(true);
    }
  }, [location.state]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [apps, profs, tipos] = await Promise.all([
        getAppointmentsApi(),
        getProfessionalsApi(),
        getTiposCitaApi(),
      ]);
      setAppointments(apps);
      setProfessionals(profs);
      setTiposCita(tipos);
      const todayStr = localDateISO();

      const hoyMapped = apps
          .filter((a) => a.date === todayStr)
          .map((app) => {
            let estado: CitaHoy['estado'] = 'Agendada';
            if (app.status === 'Atendida') estado = 'Atendida';
            else if (app.status === 'Cancelada') estado = 'Cancelada';
            else if (app.status === 'No asistió') estado = 'No asistió';

            return {
              id: app.id.toString(),
              hora: app.time,
              paciente: app.patientName,
              profesional: app.professionalName,
              servicio: app.serviceName,
              estado,
            };
          });

      setCitasHoyList(hoyMapped);

        // Map to agenda timetable blocks
      const agendaMapped: CalendarEventBlock[] = apps.map((app) => {
          const d = parseLocalDate(app.date);
          const dayIndex = (d.getDay() + 6) % 7;

          let color: 'teal' | 'blue' | 'red' = 'teal';
          if (app.status === 'Cancelada') color = 'red';
          else if (app.status === 'Atendida') color = 'blue';

          const hourPart = toApiTime(app.time).split(':')[0] || '08';

          return {
            id: app.id.toString(),
            dayIndex,
            hour: `${hourPart.padStart(2, '0')}:00`,
            paciente: app.patientName,
            servicio: app.serviceName,
            horaLabel: app.time,
            color,
          };
        });

      setAgendaEvents(agendaMapped);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudieron cargar las citas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- asynchronous loader owns the data state.
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isNuevaCitaOpen || !profesionalSelect) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear dependent hours when no professional is selected.
      setAvailableHours([]);
      setSelectedProfHasSchedule(null);
      return;
    }
    let cancelled = false;
    setSelectedProfHasSchedule(null);
    void getHorariosByMedicoApi(profesionalSelect)
      .then((horarios) => {
        if (cancelled) return;
        const hours = horarios.flatMap(appointmentStartsFromHorario);
        setAvailableHours(hours);
        setSelectedProfHasSchedule(horarios.length > 0);
      })
      .catch((error) => {
        if (cancelled) return;
        setAvailableHours([]);
        setSelectedProfHasSchedule(false);
        showToast(error instanceof Error ? error.message : 'No se pudieron cargar los horarios.');
      });
    return () => {
      cancelled = true;
    };
  }, [profesionalSelect, isNuevaCitaOpen]);

  const handleClearForm = () => {
    setSelectedCita(null);
    setSelectedSlot(null);
    setCedulaQuery('');
    setSelectedPatient(null);
    setProfesionalSelect('');
    setServicioSelect('');
    setFechaInput(localDateISO());
    setHoraInput('09:00');
    setNotasInput('');
    setIsNuevaCitaOpen(false);
  };

  const handleBuscarPaciente = async () => {
    const doc = cedulaQuery.trim();
    if (!doc) {
      showToast('Ingrese el número de cédula del paciente.');
      return;
    }
    setIsSearchingPatient(true);
    setSelectedPatient(null);
    try {
      const patient = await findPatientByCedula(doc, docType as Patient['documentType']);
      if (!patient) {
        showToast('Paciente no encontrado con esa cédula.');
        return;
      }
      setSelectedPatient(patient);
      showToast(`Paciente encontrado: ${patient.name}`);
    } catch (error) {
      console.error('[Citas.tsx] Error al buscar paciente:', error);
      showToast(error instanceof Error ? error.message : 'Error al buscar el paciente. Intente de nuevo.');
    } finally {
      setIsSearchingPatient(false);
    }
  };

  const handleSelectCita = (c: CitaHoy) => {
    setSelectedCita(c);
    setIsNuevaCitaOpen(true);
    setCedulaQuery('');
    setSelectedPatient(null);
    setServicioSelect(c.servicio);
    setHoraInput(c.hora);

    const prof = professionals.find((p) => p.name === c.profesional);
    if (prof) {
      setProfesionalSelect(prof.id.toString());
    }
    setNotasInput(`Gestionando cita #${c.id} - ${c.paciente}`);
    showToast(`Cita de ${c.paciente} cargada para reprogramar o cancelar.`);
  };

  const handleAgendarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const selectedProf = professionals.find((p) => p.id.toString() === profesionalSelect);

    setIsSubmitting(true);
    try {
      if (selectedCita) {
        await rescheduleAppointmentApi(selectedCita.id, fechaInput, horaInput, notasInput);
        await loadData();
        showToast(`Cita de ${selectedCita.paciente} reprogramada con éxito.`);
        handleClearForm();
        return;
      }

      if (!selectedPatient) {
        showToast('Busque y seleccione un paciente por cédula antes de agendar.');
        return;
      }

      if (!profesionalSelect) {
        showToast('Seleccione un profesional médico.');
        return;
      }

      if (selectedProfHasSchedule === false) {
        showToast(NO_SCHEDULE_MSG);
        return;
      }

      const result = await createAppointmentFromInput({
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        professionalId: profesionalSelect,
        professionalName: selectedProf?.name || 'Médico no asignado',
        professionalSpecialty: selectedProf?.specialty || 'Medicina General',
        serviceId: servicioSelect,
        serviceName: tiposCita.find((tipo) => tipo.id === servicioSelect)?.nombre,
        date: fechaInput || localDateISO(),
        time: horaInput || '09:00',
        notes: notasInput,
        usuarioCreacionId: user?.id,
      });

      if (!result.ok) {
        showToast('error' in result && result.error ? result.error : 'Error al agendar la cita');
        return;
      }

      await loadData();
      handleClearForm();
      showToast(`Cita agendada para ${selectedPatient.name} con éxito.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo guardar la cita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelarCita = async () => {
    if (!selectedCita || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await cancelAppointmentApi(selectedCita.id, 'Cancelada por recepción', user?.id);
      await loadData();
      showToast(`Cita de ${selectedCita.paciente} fue cancelada.`);
      handleClearForm();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo cancelar la cita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysHeader = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const names = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    const isTodayStr = d.toDateString() === new Date().toDateString();
    const dateISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { name: names[i], num: d.getDate(), isToday: isTodayStr, dateISO };
  });

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const startMonth = monthNames[monday.getMonth()];
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const endMonth = monthNames[sunday.getMonth()];
  const dateRangeStr = `${startMonth} ${monday.getDate()} - ${sunday.getDate()} ${endMonth === startMonth ? '' : endMonth}, ${sunday.getFullYear()}`;

  const currentDay = new Date().getDate();
  const currentMonthStr = monthNames[new Date().getMonth()].substring(0, 3);

  const hoursList = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00',
  ];

  return (
    <div className="recep-citas-page">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="toast-banner success">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb */}
      <div className="recep-breadcrumb">
        <span>Citas</span>
        <span>&gt;</span>
        <span className="active">Gestión Diaria</span>
      </div>

      <div className="recep-citas-layout">
        {/* Left Column Container (~65%, shrinks smoothly when form is open) */}
        <div className={`citas-left-column ${isNuevaCitaOpen ? 'is-shrunk' : 'is-expanded'}`}>
          {/* Calendar Card Container */}
          <div className={`calendar-card ${isNuevaCitaOpen ? 'is-shrunk' : 'is-expanded'}`}>
            {/* Top Toolbar with "+ Agendar Cita" Button ON TOP OF THE AGENDA */}
            <div className="calendar-toolbar">
              <div className="date-navigator">
                <button className="nav-arrow-btn" type="button" title="Semana anterior">
                  <ChevronLeft size={18} />
                </button>
                <span className="current-date-range">{dateRangeStr}</span>
                <button className="nav-arrow-btn" type="button" title="Semana siguiente">
                  <ChevronRight size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button className="btn-filtros" type="button">
                  <Filter size={14} />
                  <span>Filtros</span>
                </button>

                {/* Agendar Cita Toggle Button directly inside Agenda Toolbar */}
                <button
                  type="button"
                  className={`btn-toggle-nueva-cita ${isNuevaCitaOpen ? 'active' : ''}`}
                  onClick={() => {
                    if (isNuevaCitaOpen && (selectedCita || selectedSlot)) {
                      handleClearForm();
                    } else {
                      setSelectedCita(null);
                      setSelectedSlot(null);
                      setIsNuevaCitaOpen((prev) => !prev);
                    }
                  }}
                >
                  <Plus
                    size={15}
                    style={{
                      transform: isNuevaCitaOpen ? 'rotate(45deg)' : 'none',
                      transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                  <span>{isNuevaCitaOpen ? 'Cerrar Formulario' : 'Agendar Cita'}</span>
                </button>
              </div>
            </div>

            {/* Timetable Grid View */}
            <div className="calendar-timetable">
              {/* Header Row Days */}
              <div className="calendar-header-row">
                <div className="header-empty-cell" />
                {daysHeader.map((d) => (
                  <div
                    key={d.num}
                    className={`header-day-cell ${d.isToday ? 'is-today' : ''}`}
                  >
                    <span className="day-name">{d.name}</span>
                    <span className="day-num-badge">{d.num}</span>
                  </div>
                ))}
              </div>

              {/* Body Hours Grid */}
              <div className="calendar-body-grid">
                {isLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
                    Cargando...
                  </div>
                ) : (
                  hoursList.map((hour) => (
                    <div key={hour} className="time-row">
                      <div className="time-label-cell">{hour}</div>
                      {daysHeader.map((d, colIndex) => {
                        const slotEvents = agendaEvents.filter(
                          (ev) => ev.dayIndex === colIndex && ev.hour === hour
                        );

                        return (
                          <div key={d.num} className="slot-cell">
                            {slotEvents.length > 0 && (
                              <button
                                type="button"
                                className="slot-count-btn"
                                onClick={() => {
                                  setSelectedSlot({
                                    dayLabel: `${d.name} ${d.num}`,
                                    dateISO: d.dateISO,
                                    hour,
                                    events: slotEvents,
                                  });
                                  setSelectedCita(null);
                                  setIsNuevaCitaOpen(true);
                                }}
                              >
                                <CalendarIcon size={12} />
                                <span>
                                  {slotEvents.length} {slotEvents.length === 1 ? 'Cita' : 'Citas'}
                                </span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Container: Collapsible Nueva Cita / Slot Table + Citas de Hoy */}
        <div className={`citas-right-column ${isNuevaCitaOpen ? 'is-open' : 'is-closed'}`}>
          {/* Smooth Collapsible Container for Nueva Cita Card */}
          <div className={`nueva-cita-collapsible-wrapper ${isNuevaCitaOpen ? 'is-open' : 'is-closed'}`}>
            <div className="nueva-cita-collapsible-content">
              <div className="nueva-cita-card">
                {/* SUBVIEW A: Slot Appointments Table */}
                <div className={`collapsible-subview ${selectedSlot && !selectedCita ? 'is-active' : 'is-inactive'}`}>
                  <div className="collapsible-subview-content">
                    {selectedSlot && (
                      <div className="slot-citas-container">
                        <div className="nueva-cita-header">
                          <div>
                            <h2 className="nueva-cita-title">
                              Citas a las {selectedSlot.hour}
                            </h2>
                            <span className="selected-cita-badge">
                              ● {selectedSlot.dayLabel} — {selectedSlot.events.length} {selectedSlot.events.length === 1 ? 'Cita Agendada' : 'Citas Agendadas'}
                            </span>
                          </div>
                          <button
                            className="btn-close-form"
                            type="button"
                            onClick={() => {
                              setSelectedSlot(null);
                              setIsNuevaCitaOpen(false);
                            }}
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <div className="slot-events-list">
                          {selectedSlot.events.map((ev) => (
                            <div key={ev.id} className="slot-event-item">
                              <div className="slot-event-item__info">
                                <span className="slot-event-item__patient">{ev.paciente}</span>
                                <span className="slot-event-item__service">{ev.servicio} ({ev.horaLabel})</span>
                              </div>
                              <button
                                type="button"
                                className="btn-manage-cita"
                                onClick={() => {
                                  const matchingHoy = citasHoyList.find((c) => c.id === ev.id) || {
                                    id: ev.id,
                                    hora: ev.horaLabel,
                                    paciente: ev.paciente,
                                    profesional: 'Dr. Asignado',
                                    servicio: ev.servicio,
                                    estado: 'Agendada',
                                  };
                                  handleSelectCita(matchingHoy);
                                }}
                              >
                                Gestionar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SUBVIEW B: Nueva / Reprogramar Form */}
                <div className={`collapsible-subview ${!selectedSlot || selectedCita ? 'is-active' : 'is-inactive'}`}>
                  <div className="collapsible-subview-content">
                    <div className="nueva-cita-header">
                      <div>
                        {selectedSlot && selectedCita && (
                          <button
                            type="button"
                            className="btn-back-to-slot"
                            onClick={() => setSelectedCita(null)}
                          >
                            <ChevronLeft size={14} />
                            <span>Volver a citas de las {selectedSlot.hour}</span>
                          </button>
                        )}
                        <h2 className="nueva-cita-title">
                          {selectedCita ? 'Reprogramar / Cancelar Cita' : 'Nueva Cita'}
                        </h2>
                        {selectedCita && (
                          <span className="selected-cita-badge--active">
                            <span className="badge-pulse-dot" /> Editando cita de {selectedCita.paciente}
                          </span>
                        )}
                      </div>
                      <button className="btn-close-form" type="button" onClick={handleClearForm}>
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleAgendarCita} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Field: Documento del Paciente (CC / TI / RC) */}
                      <div className="form-field-group">
                        <label className="field-label">Cédula del Paciente</label>
                        <div className="search-field-wrapper doc-search-wrapper">
                          <select
                            className="doc-type-inline-select"
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                            disabled={Boolean(selectedCita)}
                          >
                            <option value="CC">CC</option>
                            <option value="TI">TI</option>
                            <option value="RC">RC</option>
                          </select>

                          <input
                            type="text"
                            className="field-input"
                            placeholder="Número de cédula..."
                            inputMode="numeric"
                            value={cedulaQuery}
                            disabled={Boolean(selectedCita)}
                            onChange={(e) => {
                              setCedulaQuery(e.target.value.replace(/\D/g, ''));
                              setSelectedPatient(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void handleBuscarPaciente();
                              }
                            }}
                          />
                          {!selectedCita && (
                            <button
                              type="button"
                              className="btn-limpiar"
                              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                              onClick={() => void handleBuscarPaciente()}
                              disabled={isSearchingPatient}
                            >
                              {isSearchingPatient ? 'Buscando...' : 'Buscar'}
                            </button>
                          )}
                        </div>
                        {selectedCita ? (
                          <span className="selected-cita-badge" style={{ marginTop: 6, display: 'inline-block' }}>
                            Paciente: {selectedCita.paciente}
                          </span>
                        ) : selectedPatient ? (
                          <span className="selected-cita-badge" style={{ marginTop: 6, display: 'inline-block' }}>
                            ● {selectedPatient.name}
                            {selectedPatient.documentNumber
                              ? ` — ${selectedPatient.documentType} ${selectedPatient.documentNumber}`
                              : ''}
                          </span>
                        ) : null}
                      </div>

                      {/* Field: Profesional */}
                      <div className="form-field-group">
                        <label className="field-label">Profesional</label>
                        <select
                          className="field-select"
                          value={profesionalSelect}
                          onChange={(e) => setProfesionalSelect(e.target.value)}
                        >
                          <option value="">Seleccione médico</option>
                          {professionals.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} - {p.specialty}
                            </option>
                          ))}
                        </select>
                        {professionals.length === 0 && (
                          <small style={{ color: '#B42318' }}>
                            No hay médicos activos para agendar.
                          </small>
                        )}
                        {profesionalSelect && selectedProfHasSchedule === false && (
                          <small style={{ color: '#B42318', display: 'block', marginTop: 6 }}>
                            Este profesional no tiene jornada configurada. Configure su horario en
                            Profesionales antes de agendar.
                          </small>
                        )}
                      </div>

                      {/* Field: Servicio */}
                      <div className="form-field-group">
                        <label className="field-label">Servicio</label>
                        <select
                          className="field-select"
                          value={servicioSelect}
                          onChange={(e) => setServicioSelect(e.target.value)}
                        >
                          <option value="">
                            {profesionalSelect ? 'Seleccione servicio' : 'Seleccione primero el profesional'}
                          </option>
                          {tiposCita.map((tipo) => (
                            <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                          ))}
                        </select>
                      </div>

                      {/* Field: Fecha & Hora */}
                      <div className="date-time-row">
                        <div className="form-field-group">
                          <label className="field-label">Fecha</label>
                          <input
                            type="date"
                            className="field-input"
                            value={fechaInput}
                            onChange={(e) => setFechaInput(e.target.value)}
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Hora (30 min)</label>
                          {availableHours.length > 0 ? (
                            <select
                              className="field-select"
                              value={horaInput}
                              onChange={(e) => setHoraInput(e.target.value)}
                            >
                              {availableHours.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
                            </select>
                          ) : (
                            <input
                              type="time"
                              className="field-input"
                              value={horaInput}
                              onChange={(e) => setHoraInput(e.target.value)}
                            />
                          )}
                        </div>
                      </div>

                      {/* Field: Motivo / Notas */}
                      <div className="form-field-group">
                        <label className="field-label">Motivo / Notas</label>
                        <textarea
                          className="field-textarea"
                          placeholder="Opcional..."
                          value={notasInput}
                          onChange={(e) => setNotasInput(e.target.value)}
                        />
                      </div>

                      {/* Footer Form Buttons */}
                      <div className="nueva-cita-footer">
                        {selectedCita ? (
                          <>
                            <button
                              type="button"
                              className="btn-cancelar-cita"
                              onClick={handleCancelarCita}
                              disabled={isSubmitting}
                            >
                              <Trash2 size={14} />
                              <span>Cancelar</span>
                            </button>

                            <button type="submit" className="btn-agendar-main" disabled={isSubmitting}>
                              <RefreshCw size={14} />
                              <span>Reprogramar Cita</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn-limpiar"
                              onClick={handleClearForm}
                            >
                              Limpiar
                            </button>
                            <button
                              type="submit"
                              className="btn-agendar-main"
                              disabled={isSubmitting || selectedProfHasSchedule === false}
                            >
                              {isSubmitting ? 'Guardando...' : 'Agendar Cita'}
                            </button>
                          </>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Citas de Hoy (Positioned under Nueva Cita, expands dynamically) */}
          <div className={`citas-hoy-card ${isNuevaCitaOpen ? 'is-shrunk' : 'is-expanded'}`}>
            <div className="citas-hoy-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 className="citas-hoy-title">Citas de Hoy ({currentDay} {currentMonthStr})</h2>
                {!isLoading && <span className="count-badge">{citasHoyList.length} Totales</span>}
              </div>
            </div>

            <div className="citas-hoy-table-wrapper">
              {isLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>
              ) : citasHoyList.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>No hay citas para hoy</div>
              ) : (
                <table className="citas-hoy-table">
                  <thead>
                    <tr>
                      <th>HORA</th>
                      <th>PACIENTE</th>
                      <th>PROFESIONAL</th>
                      <th>SERVICIO</th>
                      <th>ESTADO</th>
                      <th style={{ textAlign: 'right' }}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasHoyList.map((c) => (
                      <tr
                        key={c.id}
                        className={selectedCita?.id === c.id ? 'row-selected' : ''}
                        onClick={() => handleSelectCita(c)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontWeight: 700 }}>{c.hora}</td>
                        <td style={{ fontWeight: 600 }}>{c.paciente}</td>
                        <td>{c.profesional}</td>
                        <td>{c.servicio}</td>
                        <td>
                          <span
                            className={`status-bullet-badge ${
                              c.estado === 'Atendida'
                                ? 'atendida'
                                : c.estado === 'Cancelada'
                                ? 'cancelada'
                                : c.estado === 'No asistió'
                                  ? 'no-asistio'
                                : 'agendada'
                            }`}
                          >
                            • {c.estado}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              className="btn-icon"
                              title="Ver / Reprogramar cita"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCita(c);
                              }}
                            >
                              {c.estado === 'Cancelada' || c.estado === 'No asistió' ? <Eye size={15} /> : <Edit size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecepCitas;
