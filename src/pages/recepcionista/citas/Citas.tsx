import React, { useState, useEffect } from 'react';
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
import { getAppointmentsApi, createAppointmentApi } from '../../../services/appointments.service';
import { getProfessionalsApi } from '../../../services/professionals.service';
import type { Appointment } from '../../../types/appointment.types';
import type { ProfessionalOption } from '../../../types/appointment.types';

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
  const [isLoading, setIsLoading] = useState(true);

  const [citasHoyList, setCitasHoyList] = useState<CitaHoy[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<CalendarEventBlock[]>([]);

  // Selection & Form State for Nueva / Reprogramar Cita
  const [isNuevaCitaOpen, setIsNuevaCitaOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<CitaHoy | null>(null);

  const [docType, setDocType] = useState('CC');
  const [pacienteQuery, setPacienteQuery] = useState('');
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [apps, profs] = await Promise.all([
          getAppointmentsApi(),
          getProfessionalsApi(),
        ]);

        setAppointments(apps);
        setProfessionals(profs);
        const todayStr = new Date().toISOString().split('T')[0];

        let finalApps = Array.isArray(apps) && apps.length > 0 ? apps : [];
        
        // Ensure mock appointments exist for today so the user can test Reprogramar/Cancelar
        const mockDefaultApps: any[] = [
          {
            id: 101,
            patientId: 'p-101',
            patientName: 'Carlos Eduardo Restrepo (CC 1020304050)',
            patientAge: 42,
            patientGender: 'M',
            patientDoc: '1020304050',
            patientPhone: '3001234567',
            patientEmail: 'carlos@example.com',
            patientAvatar: '',
            professionalId: '1',
            professionalName: 'Dr. Alejandro Silva',
            professionalSpecialty: 'Cardiología',
            serviceName: 'Consulta Cardiológica',
            date: todayStr,
            time: '09:00',
            status: 'Agendada',
            notes: 'Control hipertensión arterial',
          },
          {
            id: 102,
            patientId: 'p-102',
            patientName: 'María Fernanda Gómez (CC 1098765432)',
            patientAge: 35,
            patientGender: 'F',
            patientDoc: '1098765432',
            patientPhone: '3109876543',
            patientEmail: 'maria@example.com',
            patientAvatar: '',
            professionalId: '2',
            professionalName: 'Dra. Elena Rostova',
            professionalSpecialty: 'Medicina General',
            serviceName: 'Consulta Medicina General',
            date: todayStr,
            time: '11:00',
            status: 'Agendada',
            notes: 'Revisión de exámen general',
          },
          {
            id: 103,
            patientId: 'p-103',
            patientName: 'Juan Pablo Martínez (TI 1012345678)',
            patientAge: 16,
            patientGender: 'M',
            patientDoc: '1012345678',
            patientPhone: '3201234567',
            patientEmail: 'juan@example.com',
            patientAvatar: '',
            professionalId: '3',
            professionalName: 'Dr. Roberto Mendoza',
            professionalSpecialty: 'Odontología',
            serviceName: 'Limpieza Dental',
            date: todayStr,
            time: '14:00',
            status: 'Agendada',
            notes: 'Limpieza de rutina y profilaxis',
          },
        ];

        // Merge mock apps if list is empty or doesn't have today's appointments
        const todayAppsInApi = finalApps.filter(a => a.date === todayStr);
        if (todayAppsInApi.length === 0) {
          finalApps = [...mockDefaultApps, ...finalApps];
        }

        setAppointments(finalApps);

        const hoyMapped = finalApps
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
        const agendaMapped: CalendarEventBlock[] = finalApps.map((app) => {
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

        // Auto-select the first appointment so Reprogramar/Cancelar buttons are visible immediately!
        if (hoyMapped.length > 0) {
          const first = hoyMapped[0];
          setSelectedCita(first);
          setIsNuevaCitaOpen(true);
          setPacienteQuery(first.paciente);
          setServicioSelect(first.servicio);
          setHoraInput(first.hora);
          setNotasInput(`Gestionando cita #${first.id}`);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleClearForm = () => {
    setSelectedCita(null);
    setPacienteQuery('');
    setProfesionalSelect('');
    setServicioSelect('');
    setFechaInput(new Date().toISOString().split('T')[0]);
    setHoraInput('09:00');
    setNotasInput('');
    setIsNuevaCitaOpen(false);
  };

  const handleSelectCita = (c: CitaHoy) => {
    setSelectedCita(c);
    setIsNuevaCitaOpen(true);
    setPacienteQuery(c.paciente);
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
    if (!pacienteQuery.trim()) {
      showToast('Por favor ingrese la cédula o nombre del paciente.');
      return;
    }

    const selectedProf = professionals.find((p) => p.id.toString() === profesionalSelect);

    if (selectedCita) {
      // Reprogramming an existing appointment
      setCitasHoyList((prev) =>
        prev.map((c) =>
          c.id === selectedCita.id
            ? {
                ...c,
                hora: horaInput,
                profesional: selectedProf?.name || c.profesional,
                servicio: servicioSelect || c.servicio,
                estado: 'Agendada',
              }
            : c
        )
      );
      setAgendaEvents((prev) =>
        prev.map((ev) =>
          ev.id === selectedCita.id
            ? {
                ...ev,
                hour: `${horaInput.split(':')[0].padStart(2, '0')}:00`,
                horaLabel: horaInput,
                servicio: servicioSelect || ev.servicio,
              }
            : ev
        )
      );
      showToast(`Cita de ${pacienteQuery} reprogramada con éxito.`);
      handleClearForm();
      return;
    }

    // Creating a new appointment
    const newCitaPayload: Partial<Appointment> = {
      patientName: pacienteQuery,
      professionalId: profesionalSelect,
      professionalName: selectedProf?.name || 'Médico no asignado',
      professionalSpecialty: selectedProf?.specialty || 'Medicina General',
      serviceName: servicioSelect || 'Consulta Medicina General',
      date: fechaInput || new Date().toISOString().split('T')[0],
      time: horaInput || '09:00',
      status: 'Agendada',
      notes: notasInput,
    };

    try {
      await createAppointmentApi(newCitaPayload as Appointment);

      const newId = `c-${Date.now()}`;
      const newHoy: CitaHoy = {
        id: newId,
        hora: horaInput,
        paciente: pacienteQuery,
        profesional: selectedProf?.name || 'Médico no asignado',
        servicio: servicioSelect || 'Consulta Medicina General',
        estado: 'Agendada',
      };
      setCitasHoyList((prev) => [newHoy, ...prev]);

      const hourPart = horaInput.split(':')[0] || '09';
      setAgendaEvents((prev) => [
        {
          id: newId,
          dayIndex: (new Date().getDay() + 6) % 7,
          hour: `${hourPart.padStart(2, '0')}:00`,
          paciente: pacienteQuery,
          servicio: servicioSelect || 'Consulta Medicina General',
          horaLabel: horaInput,
          color: 'teal',
        },
        ...prev,
      ]);

      handleClearForm();
      showToast(`Cita agendada para ${pacienteQuery} con éxito.`);
    } catch (error) {
      console.error('[Citas.tsx] Error al agendar cita:', error);
      showToast('Error al registrar la cita en el servidor.');
    }
  };

  const handleCancelarCita = () => {
    if (!selectedCita) return;
    setCitasHoyList((prev) =>
      prev.map((c) => (c.id === selectedCita.id ? { ...c, estado: 'Cancelada' } : c))
    );
    setAgendaEvents((prev) =>
      prev.map((ev) => (ev.id === selectedCita.id ? { ...ev, color: 'red' } : ev))
    );
    showToast(`Cita de ${selectedCita.paciente} fue cancelada.`);
    handleClearForm();
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
                    <label className="field-label">Documento del Paciente</label>
                    <div className="search-field-wrapper doc-search-wrapper">
                      <select
                        className="doc-type-inline-select"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                      >
                        <option value="CC">CC</option>
                        <option value="TI">TI</option>
                        <option value="RC">RC</option>
                      </select>

                      <input
                        type="text"
                        className="field-input"
                        placeholder="Número de documento..."
                        inputMode="numeric"
                        value={pacienteQuery}
                        onChange={(e) => setPacienteQuery(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
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
                      <option value="Consulta Medicina General">Consulta Medicina General</option>
                      <option value="Consulta Cardiológica">Consulta Cardiológica</option>
                      <option value="Limpieza Dental">Limpieza Dental</option>
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
                      <input
                        type="time"
                        className="field-input"
                        value={horaInput}
                        onChange={(e) => setHoraInput(e.target.value)}
                      />
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
