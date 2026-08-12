import React, { useState } from 'react';
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
  estado: 'Atendida' | 'Cancelada' | 'Agendada';
}

const mockAgendaEvents: CalendarEventBlock[] = [
  {
    id: 'ev1',
    dayIndex: 1, // Mar 17
    hour: '08:00',
    paciente: 'Carlos Mendoza',
    servicio: 'Consulta General',
    horaLabel: '08:15 - 09:00',
    color: 'teal',
  },
  {
    id: 'ev2',
    dayIndex: 0, // Lun 16
    hour: '09:00',
    paciente: 'Ana Silva',
    servicio: 'Revisión',
    horaLabel: '09:00 - 09:45',
    color: 'blue',
  },
  {
    id: 'ev3',
    dayIndex: 1, // Mar 17
    hour: '10:00',
    paciente: 'Miguel Torres',
    servicio: 'Cancelada',
    horaLabel: '10:15 - 11:00',
    color: 'red',
  },
];

const mockCitasHoy: CitaHoy[] = [
  {
    id: 'ch1',
    hora: '08:15',
    paciente: 'Carlos Mendoza',
    profesional: 'Dr. J. Moore',
    servicio: 'Consulta General',
    estado: 'Atendida',
  },
  {
    id: 'ch2',
    hora: '10:15',
    paciente: 'Miguel Torres',
    profesional: 'Dra. S. Vega',
    servicio: 'Limpieza Dental',
    estado: 'Cancelada',
  },
  {
    id: 'ch3',
    hora: '11:30',
    paciente: 'Lucia Ramos',
    profesional: 'Dr. J. Moore',
    servicio: 'Cardiología',
    estado: 'Agendada',
  },
];

const RecepCitas: React.FC = () => {
  // Navigation Pills
  const [viewPill, setViewPill] = useState<'Semana' | 'Dia'>('Semana');
  const [citasHoyList, setCitasHoyList] = useState<CitaHoy[]>(mockCitasHoy);

  // Form State for Nueva Cita
  const [pacienteQuery, setPacienteQuery] = useState('');
  const [profesionalSelect, setProfesionalSelect] = useState('');
  const [servicioSelect, setServicioSelect] = useState('');
  const [fechaInput, setFechaInput] = useState('2023-10-17');
  const [horaInput, setHoraInput] = useState('09:00');
  const [notasInput, setNotasInput] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleClearForm = () => {
    setPacienteQuery('');
    setProfesionalSelect('');
    setServicioSelect('');
    setFechaInput('2023-10-17');
    setHoraInput('');
    setNotasInput('');
  };

  const handleAgendarCita = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteQuery.trim()) {
      showToast('Por favor ingrese o busque el nombre del paciente.');
      return;
    }

    const newCita: CitaHoy = {
      id: `ch-${Date.now()}`,
      hora: horaInput || '12:00',
      paciente: pacienteQuery,
      profesional: profesionalSelect || 'Dr. Julian Moore',
      servicio: servicioSelect || 'Consulta Medicina General',
      estado: 'Agendada',
    };

    setCitasHoyList((prev) => [newCita, ...prev]);
    handleClearForm();
    showToast(`Cita agendada para ${newCita.paciente} con éxito.`);
  };

  const daysHeader = [
    { name: 'Lun', num: 16, isToday: false },
    { name: 'Mar', num: 17, isToday: true },
    { name: 'Mie', num: 18, isToday: false },
    { name: 'Jue', num: 19, isToday: false },
    { name: 'Vie', num: 20, isToday: false },
    { name: 'Sab', num: 21, isToday: false },
    { name: 'Dom', num: 22, isToday: false },
  ];

  const hoursList = ['08:00', '09:00', '10:00', '11:00', '12:00'];

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
                <span className="current-date-range">Octubre 16 - 22, 2023</span>
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
                {hoursList.map((hour) => (
                  <div key={hour} className="time-row">
                    <div className="time-label-cell">{hour}</div>
                    {daysHeader.map((d, colIndex) => {
                      const matchingEvent = mockAgendaEvents.find(
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
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Card: Citas de Hoy (17 Oct) */}
          <div className="citas-hoy-card">
            <div className="citas-hoy-header">
              <h2 className="citas-hoy-title">Citas de Hoy (17 Oct)</h2>
              <span className="count-badge">{citasHoyList.length} Totales</span>
            </div>

            <div className="citas-hoy-table-wrapper">
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
                <option value="Dr. Julian Moore">Dr. Julian Moore (Cardiología)</option>
                <option value="Dra. Silvia Vega">Dra. Silvia Vega (Pediatría)</option>
                <option value="Dr. Mario Rios">Dr. Mario Rios (Medicina General)</option>
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
