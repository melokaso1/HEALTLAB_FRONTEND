import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import './Citas.css';
import {
  cancelAppointmentApi,
  getAppointmentsApi,
  rescheduleAppointmentApi,
} from '../../../services/appointments.service';
import { getProfessionalsApi } from '../../../services/professionals.service';
import { getHorariosByMedicoApi, getTiposCitaApi, type CatalogOption } from '../../../services/catalogs.service';
import {
  findPatientByCedula,
  createAppointmentFromInput,
} from '../../../services/createAppointment.logic';
import type { Appointment } from '../../../types/appointment.types';
import type { ProfessionalOption } from '../../../types/appointment.types';
import type { Patient } from '../../../types/patient.types';
import { useAuth } from '../../../context/AuthContext';

interface CalendarEventBlock {
  id: string;
  dayIndex: number;
  hour: string;
  paciente: string;
  servicio: string;
  horaLabel: string;
  color: 'teal' | 'blue' | 'red';
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
  // Navigation Pills
  const [viewPill, setViewPill] = useState<'Semana' | 'Dia'>('Semana');
  const [monday, _setMonday] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  // API States
  const [_appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [tiposCita, setTiposCita] = useState<CatalogOption[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [citasHoyList, setCitasHoyList] = useState<CitaHoy[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<CalendarEventBlock[]>([]);

  // Selection & Form State for Nueva / Reprogramar Cita
  const [isNuevaCitaOpen, setIsNuevaCitaOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<CitaHoy | null>(null);

  const [docType, setDocType] = useState('CC');
  const [cedulaQuery, setCedulaQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [profesionalSelect, setProfesionalSelect] = useState('');
  const [servicioSelect, setServicioSelect] = useState('');
  const [fechaInput, setFechaInput] = useState(new Date().toISOString().split('T')[0]);
  const [horaInput, setHoraInput] = useState('09:00');
  const [notasInput, setNotasInput] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

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
      const todayStr = new Date().toISOString().split('T')[0];

      const hoyMapped = apps
          .filter((a) => a.date === todayStr)
          .map((app) => {
            let estado: 'Agendada' | 'Atendida' | 'Cancelada' = 'Agendada';
            if (app.status === 'Atendida') estado = 'Atendida';
            else if (app.status === 'Cancelada') estado = 'Cancelada';

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
          const d = new Date(app.date);
          const dayIndex = (d.getDay() + 6) % 7;

          let color: 'teal' | 'blue' | 'red' = 'teal';
          if (app.status === 'Cancelada') color = 'red';
          else if (app.status === 'Atendida') color = 'blue';

          const hourPart = app.time.split(':')[0] || '08';

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
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!profesionalSelect) {
      setAvailableHours([]);
      return;
    }
    void getHorariosByMedicoApi(profesionalSelect)
      .then((horarios) => setAvailableHours(
        horarios
          .map((horario) => (horario as CatalogOption & { horaInicio?: string }).horaInicio ?? horario.nombre)
          .map((hora) => hora.slice(0, 5))
          .filter(Boolean),
      ))
      .catch((error) => showToast(error instanceof Error ? error.message : 'No se pudieron cargar los horarios.'));
  }, [profesionalSelect]);

  const handleClearForm = () => {
    setSelectedCita(null);
    setCedulaQuery('');
    setSelectedPatient(null);
    setProfesionalSelect('');
    setServicioSelect('');
    setFechaInput(new Date().toISOString().split('T')[0]);
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
      const patient = await findPatientByCedula(doc);
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

    const selectedProf = professionals.find((p) => p.id.toString() === profesionalSelect);

    if (selectedCita) {
      try {
        await rescheduleAppointmentApi(selectedCita.id, fechaInput, horaInput, notasInput);
        await loadData();
        showToast(`Cita de ${selectedCita.paciente} reprogramada con éxito.`);
        handleClearForm();
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'No se pudo reprogramar la cita.');
      }
      return;
    }

    if (!selectedPatient) {
      showToast('Busque y seleccione un paciente por cédula antes de agendar.');
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
      date: fechaInput || new Date().toISOString().split('T')[0],
      time: horaInput || '09:00',
      notes: notasInput,
      usuarioCreacionId: user?.id ?? '',
    });

    if (!result.ok) {
      showToast(result.error);
      return;
    }

    await loadData();
    handleClearForm();
    showToast(`Cita agendada para ${selectedPatient.name} con éxito.`);
  };

  const handleCancelarCita = async () => {
    if (!selectedCita) return;
    try {
      await cancelAppointmentApi(selectedCita.id, 'Cancelada por recepción', user?.id);
      await loadData();
      showToast(`Cita de ${selectedCita.paciente} fue cancelada.`);
      handleClearForm();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo cancelar la cita.');
    }
  };

  const daysHeader = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const names = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    const isTodayStr = d.toDateString() === new Date().toDateString();
    return { name: names[i], num: d.getDate(), isToday: isTodayStr };
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
              <div className="view-pills">
                <button
                  type="button"
                  className={`pill-btn ${viewPill === 'Semana' ? 'active' : ''}`}
                  onClick={() => setViewPill('Semana')}
                >
                  Semana
                </button>
                <button
                  type="button"
                  className={`pill-btn ${viewPill === 'Dia' ? 'active' : ''}`}
                  onClick={() => setViewPill('Dia')}
                >
                  Dia
                </button>
              </div>

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
                    if (isNuevaCitaOpen && selectedCita) {
                      handleClearForm();
                    } else {
                      setSelectedCita(null);
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
                        const matchingEvent = agendaEvents.find(
                          (ev) => ev.dayIndex === colIndex && ev.hour === hour
                        );

                        return (
                          <div key={d.num} className="slot-cell">
                            {matchingEvent && (
                              <div
                                className={`agenda-block ${matchingEvent.color}`}
                                onClick={() => {
                                  const matchingHoy = citasHoyList.find((c) => c.id === matchingEvent.id) || {
                                    id: matchingEvent.id,
                                    hora: matchingEvent.horaLabel,
                                    paciente: matchingEvent.paciente,
                                    profesional: 'Dr. Asignado',
                                    servicio: matchingEvent.servicio,
                                    estado: 'Agendada',
                                  };
                                  handleSelectCita(matchingHoy);
                                }}
                              >
                                <span className="block-patient">{matchingEvent.paciente}</span>
                                <span className="block-desc">{matchingEvent.servicio}</span>
                                <span className="block-time">{matchingEvent.horaLabel}</span>
                              </div>
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

        {/* Right Column Container: Collapsible Nueva Cita + Citas de Hoy */}
        <div className={`citas-right-column ${isNuevaCitaOpen ? 'is-open' : 'is-closed'}`}>
          {/* Smooth Collapsible Container for Nueva Cita Card */}
          <div className={`nueva-cita-collapsible-wrapper ${isNuevaCitaOpen ? 'is-open' : 'is-closed'}`}>
            <div className="nueva-cita-collapsible-content">
              <div className="nueva-cita-card">
                <div className="nueva-cita-header">
                  <div>
                    <h2 className="nueva-cita-title">
                      {selectedCita ? 'Reprogramar / Cancelar Cita' : 'Nueva Cita'}
                    </h2>
                    {selectedCita && (
                      <span className="selected-cita-badge">
                        ● Editando cita de {selectedCita.paciente}
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
                      <label className="field-label">Hora</label>
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
                        >
                          <Trash2 size={14} />
                          <span>Cancelar Cita</span>
                        </button>

                        <button type="submit" className="btn-agendar-main">
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
                        <button type="submit" className="btn-agendar-main">
                          Agendar Cita
                        </button>
                      </>
                    )}
                  </div>
                </form>
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
                              {c.estado === 'Cancelada' ? <Eye size={15} /> : <Edit size={15} />}
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
