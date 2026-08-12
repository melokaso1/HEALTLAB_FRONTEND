import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Settings,
  Award,
  Building,
  CheckCircle2,
  Search,
  X,
  User,
  Check,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import medicoAvatar from '../../assets/images/medico1.jpeg';
import './ProfessionalDashboard.css';

export interface DoctorAppointmentEvent {
  id: number;
  weekOffset?: number; // 0 for current week, 1 for next week, -1 for prev week, etc.
  dayAbrev: 'DOM' | 'LUN' | 'MAR' | 'MIÉ' | 'JUE' | 'VIE' | 'SÁB';
  dayNum: number;
  timeSlot: string; // e.g. '08:00', '09:00', '10:00'
  timeDisplay: string; // e.g. '08:00 - 09:00'
  service: string;
  patientName: string;
  patientDoc: string;
  patientAge: number;
  patientGender: string;
  reason: string;
  status: 'Atendido' | 'Confirmada' | 'En sala de espera' | 'Cancelada';
  diagnosis?: string;
  clinicalNotes?: string;
  treatmentPlan?: string;
  requiresLabs?: boolean;
  labDetails?: string;
}

const mockWeekEvents: DoctorAppointmentEvent[] = [
  {
    id: 1,
    weekOffset: 0,
    dayAbrev: 'LUN',
    dayNum: 10,
    timeSlot: '08:00',
    timeDisplay: '08:00 - 09:00',
    service: 'Consulta Cardiológica',
    patientName: 'María López',
    patientDoc: 'CC-98765432',
    patientAge: 45,
    patientGender: 'Femenino',
    reason: 'Dolor torácico ocasional',
    status: 'Atendido',
    diagnosis: 'Molestia muscular intercostal sin compromiso coronario',
    clinicalNotes: 'Paciente refiere molestias al inspirar profundo. EKG normal.',
    treatmentPlan: 'Analgésicos simples por 5 días.',
  },
  {
    id: 2,
    weekOffset: 0,
    dayAbrev: 'LUN',
    dayNum: 10,
    timeSlot: '10:00',
    timeDisplay: '10:00 - 11:00',
    service: 'Ecocardiograma',
    patientName: 'Carlos Mendoza',
    patientDoc: 'CC-12345678',
    patientAge: 52,
    patientGender: 'Masculino',
    reason: 'Evaluación funcional ventricular',
    status: 'Atendido',
    diagnosis: 'Fracción de eyección conservada',
    clinicalNotes: 'Estructura valvular normal.',
    treatmentPlan: 'Control anual.',
  },
  {
    id: 3,
    weekOffset: 0,
    dayAbrev: 'MAR',
    dayNum: 11,
    timeSlot: '09:00',
    timeDisplay: '09:00 - 10:00',
    service: 'Evaluación Preoperatoria',
    patientName: 'Ana Gómez',
    patientDoc: 'CC-55443322',
    patientAge: 38,
    patientGender: 'Femenino',
    reason: 'Riesgo quirúrgico para colecistectomía',
    status: 'Confirmada',
  },
  {
    id: 4,
    weekOffset: 0,
    dayAbrev: 'MIÉ',
    dayNum: 12,
    timeSlot: '08:00',
    timeDisplay: '08:00 - 08:30',
    service: 'Prueba de Esfuerzo',
    patientName: 'Pedro Ramírez',
    patientDoc: 'CE-66778899',
    patientAge: 50,
    patientGender: 'Masculino',
    reason: 'Protocolo ergométrico de control',
    status: 'Confirmada',
  },
  {
    id: 5,
    weekOffset: 0,
    dayAbrev: 'VIE',
    dayNum: 14,
    timeSlot: '09:00',
    timeDisplay: '09:00 - 10:30',
    service: 'Ecocardiograma Doppler',
    patientName: 'Carmen Vargas',
    patientDoc: 'CC-33221144',
    patientAge: 61,
    patientGender: 'Femenino',
    reason: 'Insuficiencia mitral moderada en estudio',
    status: 'En sala de espera',
  },
  {
    id: 6,
    weekOffset: 0,
    dayAbrev: 'MIÉ',
    dayNum: 12,
    timeSlot: '11:00',
    timeDisplay: '11:00 - 11:30',
    service: 'Consulta de Seguimiento',
    patientName: 'Jorge Silva',
    patientDoc: 'CC-77889900',
    patientAge: 43,
    patientGender: 'Masculino',
    reason: 'Control de hipertensión',
    status: 'En sala de espera',
  },
  {
    id: 7,
    weekOffset: 0,
    dayAbrev: 'JUE',
    dayNum: 13,
    timeSlot: '10:00',
    timeDisplay: '10:00 - 11:00',
    service: 'Holter 24h Lectura',
    patientName: 'Lucia Morales',
    patientDoc: 'CC-11224455',
    patientAge: 29,
    patientGender: 'Femenino',
    reason: 'Palpitaciones nocturnas',
    status: 'Confirmada',
  },
];

const MONTH_SHORT = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
const DAY_ABREVS_LIST: ('DOM' | 'LUN' | 'MAR' | 'MIÉ' | 'JUE' | 'VIE' | 'SÁB')[] = [
  'DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'
];

const hoursAxisList = [
  '7:00 a. m.',
  '8:00 a. m.',
  '9:00 a. m.',
  '10:00 a. m.',
  '11:00 a. m.',
  '12:00 p. m.',
  '1:00 p. m.',
  '2:00 p. m.',
  '3:00 p. m.',
  '4:00 p. m.',
  '5:00 p. m.',
  '6:00 p. m.',
];

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const doctorName = user?.name || 'Dr. Julian Moore';

  const [events, setEvents] = useState<DoctorAppointmentEvent[]>(mockWeekEvents);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Calculate dynamic week info
  const { currentDaysHeaderList, currentWeekRangeLabel } = useMemo(() => {
    const baseDate = new Date(2026, 7, 12);
    const dayOfWeek = baseDate.getDay();
    const sunday = new Date(baseDate);
    sunday.setDate(baseDate.getDate() - dayOfWeek + weekOffset * 7);

    const days: { abrev: 'DOM' | 'LUN' | 'MAR' | 'MIÉ' | 'JUE' | 'VIE' | 'SÁB'; dayNum: number; isToday?: boolean }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      days.push({
        abrev: DAY_ABREVS_LIST[i],
        dayNum: d.getDate(),
        isToday: weekOffset === 0 && d.getDate() === 12 && d.getMonth() === 7,
      });
    }

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    const startLabel = `${sunday.getDate()} ${MONTH_SHORT[sunday.getMonth()]}`;
    const endLabel = `${saturday.getDate()} ${MONTH_SHORT[saturday.getMonth()]} ${saturday.getFullYear()}`;

    return {
      currentDaysHeaderList: days,
      currentWeekRangeLabel: `${startLabel} - ${endLabel}`,
    };
  }, [weekOffset]);

  const handlePrevWeek = () => setWeekOffset((prev) => prev - 1);
  const handleNextWeek = () => setWeekOffset((prev) => prev + 1);
  const handleCurrentWeek = () => setWeekOffset(0);

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<DoctorAppointmentEvent | null>(null);
  const [isAttencionModalOpen, setIsAttencionModalOpen] = useState<boolean>(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState<boolean>(false);
  const [isConfigHorarioOpen, setIsConfigHorarioOpen] = useState<boolean>(false);

  // Form states for Registrar Atención
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [treatmentPlan, setTreatmentPlan] = useState<string>('');
  const [requiresLabs, setRequiresLabs] = useState<boolean>(false);
  const [labDetails, setLabDetails] = useState<string>('');

  // Form states for Agendar Cita
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientDoc, setNewPatientDoc] = useState<string>('');
  const [newService, setNewService] = useState<string>('Consulta General');
  const [newDayAbrev, setNewDayAbrev] = useState<'DOM' | 'LUN' | 'MAR' | 'MIÉ' | 'JUE' | 'VIE' | 'SÁB'>('MIÉ');
  const [newTimeSlot, setNewTimeSlot] = useState<string>('09:00');
  const [newReason, setNewReason] = useState<string>('');

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesWeek = (ev.weekOffset ?? 0) === weekOffset;
      const matchesStatus = statusFilter === 'all' || ev.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        ev.patientName.toLowerCase().includes(term) ||
        ev.service.toLowerCase().includes(term) ||
        ev.patientDoc.toLowerCase().includes(term);

      return matchesWeek && matchesStatus && matchesSearch;
    });
  }, [events, weekOffset, statusFilter, searchTerm]);

  // Open "Registrar Atención"
  const handleOpenAttencionModal = (ev: DoctorAppointmentEvent) => {
    setSelectedEvent(ev);
    setDiagnosis(ev.diagnosis || '');
    setClinicalNotes(ev.clinicalNotes || '');
    setTreatmentPlan(ev.treatmentPlan || '');
    setRequiresLabs(ev.requiresLabs || false);
    setLabDetails(ev.labDetails || '');
    setIsAttencionModalOpen(true);
  };

  // Open "Agendar Cita" at specific slot
  const handleOpenNewAppointmentAtSlot = (
    dayAbrev: 'DOM' | 'LUN' | 'MAR' | 'MIÉ' | 'JUE' | 'VIE' | 'SÁB',
    hourStr: string
  ) => {
    const slotHour = hourStr.split(':')[0].padStart(2, '0') + ':00';
    setNewDayAbrev(dayAbrev);
    setNewTimeSlot(slotHour);
    setNewPatientName('');
    setNewPatientDoc('');
    setNewReason('');
    setIsNewAppointmentOpen(true);
  };

  // Save Atención
  const handleSaveAttencion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!diagnosis.trim()) {
      showToast('Por favor ingrese el diagnóstico principal del paciente');
      return;
    }

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id === selectedEvent.id) {
          return {
            ...ev,
            status: 'Atendido',
            diagnosis: diagnosis.trim(),
            clinicalNotes: clinicalNotes.trim(),
            treatmentPlan: treatmentPlan.trim(),
            requiresLabs: requiresLabs,
            labDetails: labDetails.trim(),
          };
        }
        return ev;
      })
    );

    setIsAttencionModalOpen(false);
    showToast(`Atención médica registrada para ${selectedEvent.patientName}`);
  };

  // Create New Appointment
  const handleCreateNewAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) {
      showToast('Ingrese el nombre del paciente');
      return;
    }

    const dayObj = currentDaysHeaderList.find((d) => d.abrev === newDayAbrev) || { dayNum: 12 };

    const newEv: DoctorAppointmentEvent = {
      id: Date.now(),
      weekOffset: weekOffset,
      dayAbrev: newDayAbrev,
      dayNum: dayObj.dayNum,
      timeSlot: newTimeSlot,
      timeDisplay: `${newTimeSlot} - ${parseInt(newTimeSlot.split(':')[0], 10) + 1}:00`,
      service: newService,
      patientName: newPatientName.trim(),
      patientDoc: newPatientDoc.trim() || 'CC-12345678',
      patientAge: 35,
      patientGender: 'Paciente',
      reason: newReason.trim() || 'Consulta médica agendada',
      status: 'Confirmada',
    };

    setEvents((prev) => [...prev, newEv]);
    setIsNewAppointmentOpen(false);
    showToast(`Cita programada para ${newPatientName} el ${newDayAbrev} a las ${newTimeSlot}`);
  };

  return (
    <div className="prof-agenda-view">
      {/* Top Header Title Row */}
      <div className="prof-agenda__header">
        <div className="prof-agenda__title-group">
          <h1 className="prof-agenda__title">Mi Agenda Médica</h1>
          <p className="prof-agenda__subtitle">
            Directorio médico, agenda semanal de citas y configuración de disponibilidad.
          </p>
        </div>
      </div>

      {/* 1. DOCTOR HERO PROFILE CARD (Matching AdminProfesionales) */}
      <div className="prof-card prof-hero-card">
        <div className="prof-hero-content">
          <div className="prof-hero-identity">
            <img src={medicoAvatar} alt={doctorName} className="prof-hero-avatar" />

            <div className="prof-hero-text-group">
              <h2 className="prof-hero-name">{doctorName}</h2>
              <p className="prof-hero-specialty">Cardiología Intervencionista</p>

              <div className="prof-hero-tags-row">
                <span className="tag-badge">
                  <Award size={14} color="#0A9396" />
                  <span>Lic: CMP-45882</span>
                </span>

                <span className="tag-badge">
                  <Building size={14} color="#3B82F6" />
                  <span>Consultorio 302</span>
                </span>

                <span className="tag-badge active-status">● Activo</span>
              </div>
            </div>
          </div>

          {/* Action buttons top right */}
          <div className="prof-hero-actions">
            <button
              type="button"
              className="btn-primary btn-add-cita"
              onClick={() => setIsNewAppointmentOpen(true)}
            >
              <Plus size={15} />
              <span>Agendar Cita</span>
            </button>

            <button
              type="button"
              className="btn-outline btn-config-horario"
              onClick={() => setIsConfigHorarioOpen(true)}
            >
              <Settings size={15} />
              <span>Configurar Horario</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FULL-WIDTH WEEKLY CALENDAR CARD (Matching AdminProfesionales) */}
      <div className="prof-card calendar-card">
        {/* Calendar Toolbar */}
        <div className="calendar-toolbar">
          <div className="calendar-toolbar__left">
            <div className="week-selector-group">
              <button
                type="button"
                className="btn-week-nav"
                title="Semana anterior"
                onClick={handlePrevWeek}
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                className="week-date-trigger"
                onClick={handleCurrentWeek}
              >
                <CalendarIcon size={15} color="#0A9396" />
                <span>{currentWeekRangeLabel}</span>
              </button>

              <button
                type="button"
                className="btn-week-nav"
                title="Semana siguiente"
                onClick={handleNextWeek}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <button
              type="button"
              className="btn-today-shortcut"
              onClick={handleCurrentWeek}
            >
              Semana actual
            </button>
          </div>

          <div className="calendar-toolbar__right">
            {/* Search Box */}
            <div className="prof-agenda-search-box">
              <Search size={14} className="prof-agenda-search-icon" />
              <input
                type="text"
                className="prof-agenda-search-input"
                placeholder="Buscar paciente o cita..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="prof-agenda-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todas las citas</option>
              <option value="Atendido">Atendidas</option>
              <option value="Confirmada">Confirmadas</option>
              <option value="En sala de espera">En sala de espera</option>
              <option value="Cancelada">Canceladas</option>
            </select>

            <button
              type="button"
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '12.5px' }}
              onClick={() => setIsNewAppointmentOpen(true)}
            >
              <Plus size={14} />
              <span>Agendar Cita</span>
            </button>
          </div>
        </div>

        {/* CSS GRID TIMETABLE */}
        <div className="calendar-grid-container">
          {/* Header Row: HORA + 7 Days */}
          <div className="calendar-grid-header">
            <div className="time-header-cell">HORA</div>
            {currentDaysHeaderList.map((dayObj) => (
              <div
                key={dayObj.abrev}
                className={`day-header-col${dayObj.isToday ? ' is-selected-day' : ''}`}
              >
                <div className="day-header-badge">
                  <span>{dayObj.abrev}</span>
                  <span style={{ fontSize: '14px' }}>{dayObj.dayNum}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Body Scrollable Timetable Area */}
          <div className="calendar-grid-body">
            {hoursAxisList.map((hourLabel) => {
              const hourNumberStr = hourLabel.split(':')[0].padStart(2, '0');

              return (
                <div key={hourLabel} className="calendar-hour-row">
                  {/* Y-Axis Hour Cell */}
                  <div className="time-axis-cell">{hourLabel}</div>

                  {/* 7 Days Columns */}
                  {currentDaysHeaderList.map((dayObj) => {
                    const matchingEvents = filteredEvents.filter(
                      (ev) =>
                        ev.dayAbrev === dayObj.abrev &&
                        ev.timeSlot.startsWith(hourNumberStr)
                    );

                    return (
                      <div
                        key={`${dayObj.abrev}-${hourLabel}`}
                        className="grid-day-cell"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('.appointment-card-block')) return;
                          handleOpenNewAppointmentAtSlot(dayObj.abrev, hourNumberStr);
                        }}
                      >
                        {matchingEvents.map((ev) => {
                          const statusKey = ev.status.toLowerCase().replace(/ /g, '-');
                          return (
                            <div
                              key={ev.id}
                              className={`appointment-card-block status-${statusKey}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAttencionModal(ev);
                              }}
                            >
                              <h4 className="appointment-card-header">
                                <Stethoscope size={11} style={{ flexShrink: 0 }} />
                                <span>{ev.service}</span>
                              </h4>

                              <p className="appointment-patient-name">{ev.patientName}</p>

                              <div className="appointment-time-badge">
                                <span>{ev.timeDisplay}</span>
                                <span className={`status-chip-mini ${statusKey}`}>
                                  {ev.status === 'Atendido' ? 'Atendida' : ev.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal 1: Registrar Atención */}
      {isAttencionModalOpen && selectedEvent && (
        <div className="modal-backdrop">
          <div className="modal-content registrar-atencion-modal">
            <div className="modal-header">
              <h3 className="modal-title">Registrar Atención Médica</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAttencionModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAttencion}>
              <div className="modal-body">
                <div className="patient-modal-card">
                  <div className="patient-modal-card__avatar">
                    <User size={20} />
                  </div>
                  <div className="patient-modal-card__details">
                    <span className="patient-modal-card__name">{selectedEvent.patientName}</span>
                    <span className="patient-modal-card__sub">
                      {selectedEvent.patientDoc} • {selectedEvent.patientAge} años •{' '}
                      {selectedEvent.patientGender}
                    </span>
                    <span className="patient-modal-card__reason">
                      <strong>Motivo:</strong> {selectedEvent.reason}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Diagnóstico Principal</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Hipertensión arterial estadio 1"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Observaciones Clínicas</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Detalles de la evolución del paciente y hallazgos..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Resultado / Plan a Seguir</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Medicación, indicaciones y fecha de próximo control..."
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                  />
                </div>

                <div className="form-group form-group--checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={requiresLabs}
                      onChange={(e) => setRequiresLabs(e.target.checked)}
                    />
                    <span>Requiere exámenes adicionales o laboratorio</span>
                  </label>
                </div>

                {requiresLabs && (
                  <div className="form-group">
                    <label className="form-label">Exámenes Solicitados</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Hemograma, EKG, Perfil lipídico..."
                      value={labDetails}
                      onChange={(e) => setLabDetails(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAttencionModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary btn-save">
                  <CheckCircle2 size={16} />
                  <span>Guardar atención</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Agendar Nueva Cita */}
      {isNewAppointmentOpen && (
        <div className="modal-backdrop">
          <div className="modal-content new-appointment-modal">
            <div className="modal-header">
              <h3 className="modal-title">Agendar Nueva Cita Médica</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsNewAppointmentOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewAppointment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Paciente</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Carlos Mendoza"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Documento / Cédula</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. CC-12345678"
                    value={newPatientDoc}
                    onChange={(e) => setNewPatientDoc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Servicio Médico</label>
                  <select
                    className="form-input"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                  >
                    <option value="Consulta General">Consulta General</option>
                    <option value="Consulta Cardiológica">Consulta Cardiológica</option>
                    <option value="Ecocardiograma">Ecocardiograma</option>
                    <option value="Prueba de Esfuerzo">Prueba de Esfuerzo</option>
                    <option value="Evaluación Preoperatoria">Evaluación Preoperatoria</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Día de la semana</label>
                    <select
                      className="form-input"
                      value={newDayAbrev}
                      onChange={(e) =>
                        setNewDayAbrev(
                          e.target.value as 'DOM' | 'LUN' | 'MAR' | 'MIÉ' | 'JUE' | 'VIE' | 'SÁB'
                        )
                      }
                    >
                      <option value="LUN">LUN 10</option>
                      <option value="MAR">MAR 11</option>
                      <option value="MIÉ">MIÉ 12</option>
                      <option value="JUE">JUE 13</option>
                      <option value="VIE">VIE 14</option>
                      <option value="SÁB">SÁB 15</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hora del turno</label>
                    <select
                      className="form-input"
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                    >
                      <option value="08:00">08:00 AM</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Motivo de la Cita</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Descripción del motivo de consulta..."
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsNewAppointmentOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary btn-save">
                  <Check size={16} />
                  <span>Confirmar Cita</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Configurar Horario */}
      {isConfigHorarioOpen && (
        <div className="modal-backdrop">
          <div className="modal-content config-horario-modal">
            <div className="modal-header">
              <h3 className="modal-title">Configurar Horario y Disponibilidad</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsConfigHorarioOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Días de Atención Asignados</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day) => (
                    <span key={day} className="tag-badge active-status">
                      ✓ {day}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Hora de Inicio</label>
                  <input type="time" className="form-input" defaultValue="08:00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora de Fin</label>
                  <input type="time" className="form-input" defaultValue="17:00" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Consultorio Asignado</label>
                <input type="text" className="form-input" defaultValue="Consultorio 302 - Torre B" />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsConfigHorarioOpen(false)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setIsConfigHorarioOpen(false);
                  showToast('Configuración de horario actualizada correctamente');
                }}
              >
                Guardar Horario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && <div className="toast-msg">{toastMsg}</div>}
    </div>
  );
};

export default ProfessionalDashboard;
