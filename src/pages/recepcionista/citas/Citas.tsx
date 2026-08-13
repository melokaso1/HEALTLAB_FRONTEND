import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
  Edit,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import './Citas.css';
import { getAppointmentsApi, createAppointmentApi } from '../../../services/appointments.service';
import { getProfessionalsApi } from '../../../services/professionals.service';
import type { Appointment } from '../../../types/appointment.types';
import type { ProfessionalOption } from '../../../types/appointment.types';


interface CalendarEventBlock {
  id: string;
  dayIndex: number; // 0=Lun, 1=Mar, 2=Mie, etc.
  hour: string; // '08:00', '09:00', '10:00'
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
  
  // API States
  const [_appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [citasHoyList, setCitasHoyList] = useState<CitaHoy[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<CalendarEventBlock[]>([]);

  // Form State for Nueva Cita
  const [pacienteQuery, setPacienteQuery] = useState('');
  const [profesionalSelect, setProfesionalSelect] = useState('');
  const [servicioSelect, setServicioSelect] = useState('');
  
  const nowStr = new Date().toISOString().split('T')[0];
  const [fechaInput, setFechaInput] = useState(nowStr);
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
          getProfessionalsApi()
        ]);
        
        setAppointments(apps);
        setProfessionals(profs);
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        const hoyMapped = apps
          .filter(a => a.date === todayStr)
          .map(app => {
            let estado: 'Agendada' | 'Atendida' | 'Cancelada' = 'Agendada';
            if (app.status === 'Atendida') estado = 'Atendida';
            else if (app.status === 'Cancelada') estado = 'Cancelada';
            
            return {
              id: app.id.toString(),
              hora: app.time,
              paciente: app.patientName,
              profesional: app.professionalName,
              servicio: app.serviceName,
              estado
            };
          });
          
        setAppointments(apps);
        setCitasHoyList(hoyMapped);
        
        // Map to agenda
        const agendaMapped: CalendarEventBlock[] = apps.map((app) => {
          const d = new Date(app.date);
          const dayIndex = (d.getDay() + 6) % 7; // Monday = 0
          
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
            color
          };
        });
        
        setAgendaEvents(agendaMapped);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleClearForm = () => {
    setPacienteQuery('');
    setProfesionalSelect('');
    setServicioSelect('');
    setFechaInput(new Date().toISOString().split('T')[0]);
    setHoraInput('');
    setNotasInput('');
  };

  const handleAgendarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteQuery.trim()) {
      showToast('Por favor ingrese o busque el nombre del paciente.');
      return;
    }

    const selectedProf = professionals.find((p) => p.id.toString() === profesionalSelect);

    const newCitaPayload: Partial<Appointment> = {
      patientName: pacienteQuery,
      professionalId: profesionalSelect,
      professionalName: selectedProf?.name || 'Médico no asignado',
      professionalSpecialty: selectedProf?.specialty || 'Medicina General',
      serviceName: servicioSelect || 'Consulta Medicina General',
      date: fechaInput || new Date().toISOString().split('T')[0],
      time: horaInput || '12:00 PM',
      status: 'Agendada',
      notes: notasInput,
    };

    try {
      await createAppointmentApi(newCitaPayload as Appointment);

      const freshApps = await getAppointmentsApi();
      if (Array.isArray(freshApps) && freshApps.length > 0) {
        const mappedHoy: CitaHoy[] = freshApps.map((app) => ({
          id: String(app.id),
          hora: app.time,
          paciente: app.patientName,
          profesional: app.professionalName,
          servicio: app.serviceName || 'Consulta Médica',
          estado: app.status === 'Cancelada' ? 'Cancelada' : app.status === 'No asistió' ? 'No asistió' : 'Agendada',
        }));
        setCitasHoyList(mappedHoy);
      }

      handleClearForm();
      showToast(`Cita agendada para ${pacienteQuery} con éxito.`);
    } catch (error) {
      console.error('[Citas.tsx] Error al agendar cita:', error);
      showToast('Error al registrar la cita en el servidor.');
    }
  };

  // Generate current week dates
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(today.setDate(diff));
  
  const daysHeader = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const names = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    const isTodayStr = new Date().toDateString() === d.toDateString();
    return { name: names[i], num: d.getDate(), isToday: isTodayStr };
  });

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const startMonth = monthNames[monday.getMonth()];
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const endMonth = monthNames[sunday.getMonth()];
  const dateRangeStr = `${startMonth} ${monday.getDate()} - ${sunday.getDate()} ${endMonth === startMonth ? '' : endMonth}, ${sunday.getFullYear()}`;

  const currentDay = new Date().getDate();
  const currentMonthStr = monthNames[new Date().getMonth()].substring(0, 3);
  
  const hoursList = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

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

      {/* Main 2-Column Grid Layout */}
      <div className="recep-citas-layout">
        {/* Left Column Container (~65%) */}
        <div className="citas-left-column">
          {/* Calendar Card Container */}
          <div className="calendar-card">
            {/* Top Toolbar */}
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

              <button className="btn-filtros" type="button">
                <Filter size={14} />
                <span>Filtros</span>
              </button>
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
                  <div style={{ padding: '2rem', textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>Cargando...</div>
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
                                onClick={() =>
                                  showToast(`Evento: ${matchingEvent.paciente} (${matchingEvent.servicio})`)
                                }
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

          {/* Bottom Card: Citas de Hoy */}
          <div className="citas-hoy-card">
            <div className="citas-hoy-header">
              <h2 className="citas-hoy-title">Citas de Hoy ({currentDay} {currentMonthStr})</h2>
              {!isLoading && <span className="count-badge">{citasHoyList.length} Totales</span>}
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
                      <tr key={c.id}>
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
                              title="Ver / Editar cita"
                              onClick={() => showToast(`Cita de ${c.paciente} seleccionada`)}
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

        {/* Right Column Container: Panel Nueva Cita (~35%) */}
        <div className="nueva-cita-card">
          <div className="nueva-cita-header">
            <h2 className="nueva-cita-title">Nueva Cita</h2>
            <button className="btn-close-form" type="button" onClick={handleClearForm}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleAgendarCita} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Field: Paciente */}
            <div className="form-field-group">
              <label className="field-label">Paciente</label>
              <div className="search-field-wrapper">
                <Search size={16} className="search-field-icon" />
                <input
                  type="text"
                  className="field-input"
                  placeholder="Buscar paciente..."
                  value={pacienteQuery}
                  onChange={(e) => setPacienteQuery(e.target.value)}
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
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {p.specialty}</option>
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecepCitas;
