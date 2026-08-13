import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart2,
  Clock,
  Filter,
  X,
  Search,
  Eye,
  Info,
  Calendar as CalendarIcon,
  User,
  Stethoscope,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import type { Appointment } from '../../../types/appointment.types';
import Pagination from '../../../components/common/Pagination';
import { getAppointmentsApi } from '../../../services/appointments.service';
import { getReporteConteoPorEstadoApi } from '../../../services/reports.service';
import './AdminReportes.css';

// TypeScript Interfaces
export interface ActionLog {
  id: number;
  fechaHora: string;
  usuario: {
    nombre: string;
    rol: string;
    avatar?: string;
  };
  profesional: string;
  tipoAccion: 'Cita creada' | 'Cita atendida' | 'Nota registrada' | 'Cita cancelada' | 'Cita reprogramada';
  detalles: string;
  citaId: number;
}

export interface PastAppointment {
  id: number;
  codigo: string;
  fecha: string;
  hora: string;
  paciente: string;
  documento: string;
  profesional: string;
  especialidad: string;
  servicio: string;
  estado: 'agendada' | 'atendida' | 'cancelada' | 'no_asistio';
  notaProfesional?: string;
  resultadoAtencion?: string;
}

const initialActionLogs: ActionLog[] = [];
const mockPastAppointments: PastAppointment[] = [];
const profesionalesLista = ['Todos'];
const usuariosLista = ['Todos'];

const AdminReportes: React.FC = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isDoctor = role === 'professional' || role === 'profesional' || role === 'medico' || role === 'doctor';
  
  // Real appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    getAppointmentsApi().then((data) => setAppointments(data));
    getReporteConteoPorEstadoApi().catch((err) => console.warn('Error reportes:', err));
  }, []);

  // Reportes Filter State
  const [repFechaDesde, setRepFechaDesde] = useState('2025-05-01');
  const [repFechaHasta, setRepFechaHasta] = useState('2025-05-31');
  const [repProfesional, setRepProfesional] = useState('Todos');
  const [repEstado, setRepEstado] = useState('Todos');

  // Historial Sub-tab State
  const [histTab, setHistTab] = useState<'acciones' | 'citas'>('acciones');

  // Historial Acciones Filter State
  const [actSearch, setActSearch] = useState('');
  const [actFechaDesde, setActFechaDesde] = useState('2025-05-01');
  const [actFechaHasta, setActFechaHasta] = useState('2025-05-31');
  const [actUsuario, setActUsuario] = useState('Todos');
  const [actProfesional, setActProfesional] = useState('Todos');
  const [actTipoAccion, setActTipoAccion] = useState('Todos');

  // Citas Pasadas Filter State
  const [citasSearch, setCitasSearch] = useState('');
  const [citasFechaDesde, setCitasFechaDesde] = useState('2025-05-01');
  const [citasFechaHasta, setCitasFechaHasta] = useState('2025-05-31');
  const [citasEstado, setCitasEstado] = useState('Todas');

  // Modal State
  const [selectedAppointment, setSelectedAppointment] = useState<PastAppointment | null>(null);

  // Calendar Selected Day Detail Popover State
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ day: number; count: number } | null>(null);

  // Dynamic counts based on real appointments
  const summaryCounts = useMemo(() => {
    let filtered = appointments;
    if (repProfesional !== 'Todos') {
      filtered = filtered.filter((a) => a.professionalName.includes(repProfesional));
    }
    const agendada = filtered.filter((a) => a.status === 'Agendada').length;
    const atendida = filtered.filter((a) => a.status === 'Atendida').length;
    const cancelada = filtered.filter((a) => a.status === 'Cancelada').length;
    const noAsistio = filtered.filter((a) => a.status === 'No asistió').length;

    if (repEstado === 'Agendada') return { agendada, atendida: 0, cancelada: 0, noAsistio: 0, total: agendada };
    if (repEstado === 'Atendida') return { agendada: 0, atendida, cancelada: 0, noAsistio: 0, total: atendida };
    if (repEstado === 'Cancelada') return { agendada: 0, atendida: 0, cancelada, noAsistio: 0, total: cancelada };
    if (repEstado === 'No asistió') return { agendada: 0, atendida: 0, cancelada: 0, noAsistio, total: noAsistio };

    return { agendada, atendida, cancelada, noAsistio, total: filtered.length };
  }, [appointments, repProfesional, repEstado]);

  // Filtered Action Logs for Right Column
  const filteredActionLogs = useMemo(() => {
    return initialActionLogs.filter((log) => {
      if (actSearch.trim()) {
        const q = actSearch.toLowerCase();
        const matchDet = log.detalles.toLowerCase().includes(q);
        const matchUser = log.usuario.nombre.toLowerCase().includes(q);
        const matchDoc = log.profesional.toLowerCase().includes(q);
        if (!matchDet && !matchUser && !matchDoc) return false;
      }
      if (actUsuario !== 'Todos' && log.usuario.nombre !== actUsuario) return false;
      if (actProfesional !== 'Todos' && log.profesional !== actProfesional) return false;
      if (actTipoAccion !== 'Todos' && log.tipoAccion !== actTipoAccion) return false;
      return true;
    });
  }, [actSearch, actUsuario, actProfesional, actTipoAccion]);

  // Filtered Past Appointments for Right Column (Citas pasadas tab)
  const filteredPastAppointments = useMemo(() => {
    return mockPastAppointments.filter((app) => {
      if (citasSearch.trim()) {
        const q = citasSearch.toLowerCase();
        const matchPac = app.paciente.toLowerCase().includes(q);
        const matchDoc = app.profesional.toLowerCase().includes(q);
        const matchDni = app.documento.includes(q);
        const matchCod = app.codigo.toLowerCase().includes(q);
        if (!matchPac && !matchDoc && !matchDni && !matchCod) return false;
      }
      if (citasEstado !== 'Todas' && app.estado !== citasEstado.toLowerCase().replace(' ', '_')) {
        if (citasEstado === 'No asistió' && app.estado !== 'no_asistio') return false;
        if (citasEstado === 'Atendida' && app.estado !== 'atendida') return false;
        if (citasEstado === 'Cancelada' && app.estado !== 'cancelada') return false;
      }
      return true;
    });
  }, [citasSearch, citasEstado]);

  // Pagination States for 3 tables
  const [repCurrentPage, setRepCurrentPage] = useState(1);
  const [actCurrentPage, setActCurrentPage] = useState(1);
  const [pastCurrentPage, setPastCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => { setActCurrentPage(1); }, [actSearch, actUsuario, actProfesional, actTipoAccion]);
  useEffect(() => { setPastCurrentPage(1); }, [citasSearch, citasEstado]);

  const repTotalPages = Math.ceil(appointments.length / itemsPerPage) || 1;
  const paginatedAppointments = useMemo(() => {
    return appointments.slice((repCurrentPage - 1) * itemsPerPage, repCurrentPage * itemsPerPage);
  }, [appointments, repCurrentPage]);

  const actTotalPages = Math.ceil(filteredActionLogs.length / itemsPerPage) || 1;
  const paginatedActionLogs = useMemo(() => {
    return filteredActionLogs.slice((actCurrentPage - 1) * itemsPerPage, actCurrentPage * itemsPerPage);
  }, [filteredActionLogs, actCurrentPage]);

  const pastTotalPages = Math.ceil(filteredPastAppointments.length / itemsPerPage) || 1;
  const paginatedPastAppointments = useMemo(() => {
    return filteredPastAppointments.slice((pastCurrentPage - 1) * itemsPerPage, pastCurrentPage * itemsPerPage);
  }, [filteredPastAppointments, pastCurrentPage]);

  // Helper for Action Badges
  const getActionBadge = (tipo: ActionLog['tipoAccion']) => {
    switch (tipo) {
      case 'Cita creada':
        return <span className="action-badge action-badge--creada">Cita creada</span>;
      case 'Cita atendida':
        return <span className="action-badge action-badge--atendida">Cita atendida</span>;
      case 'Nota registrada':
        return <span className="action-badge action-badge--nota">Nota registrada</span>;
      case 'Cita cancelada':
        return <span className="action-badge action-badge--cancelada">Cita cancelada</span>;
      case 'Cita reprogramada':
        return <span className="action-badge action-badge--reprogramada">Cita reprogramada</span>;
      default:
        return <span className="action-badge">{tipo}</span>;
    }
  };

  // Helper for Appointment Status Badges
  const getStatusBadge = (estado: PastAppointment['estado']) => {
    switch (estado) {
      case 'atendida':
        return <span className="status-badge status-badge--atendida">Atendida</span>;
      case 'agendada':
        return <span className="status-badge status-badge--agendada">Agendada</span>;
      case 'cancelada':
        return <span className="status-badge status-badge--cancelada">Cancelada</span>;
      case 'no_asistio':
        return <span className="status-badge status-badge--no-asistio">No asistió</span>;
      default:
        return <span className="status-badge">{estado}</span>;
    }
  };

  // Reset Filters Handlers
  const handleClearActionsFilter = () => {
    setActSearch('');
    setActFechaDesde('2025-05-01');
    setActFechaHasta('2025-05-31');
    setActUsuario('Todos');
    setActProfesional('Todos');
    setActTipoAccion('Todos');
  };

  const handleClearCitasFilter = () => {
    setCitasSearch('');
    setCitasFechaDesde('2025-05-01');
    setCitasFechaHasta('2025-05-31');
    setCitasEstado('Todas');
  };

  return (
    <div className="reportes-historial-page">
      <div className="reportes-historial-grid">
        {/* ========================================================= */}
        {/* 1. SECCIÓN IZQUIERDA — REPORTES (45%)                       */}
        {/* ========================================================= */}
        <section className="col-reportes">
          {/* Header */}
          <div className="col-header">
            <div className="col-header__icon col-header__icon--teal">
              <BarChart2 size={22} />
            </div>
            <div>
              <h1 className="col-header__title">Reportes</h1>
              <p className="col-header__subtitle">Consulta y analiza la gestión de citas.</p>
            </div>
          </div>

          {/* Filtros de Reportes (Compact Horizontal) */}
          <div className="card reportes-filters-card">
            <div className="rep-filter-row">
              <div className="rep-filter-item">
                <label htmlFor="rep-fecha-desde">Fecha desde</label>
                <input
                  id="rep-fecha-desde"
                  type="date"
                  value={repFechaDesde}
                  onChange={(e) => setRepFechaDesde(e.target.value)}
                />
              </div>

              <div className="rep-filter-item">
                <label htmlFor="rep-fecha-hasta">Fecha hasta</label>
                <input
                  id="rep-fecha-hasta"
                  type="date"
                  value={repFechaHasta}
                  onChange={(e) => setRepFechaHasta(e.target.value)}
                />
              </div>

              <div className="rep-filter-item">
                <label htmlFor="rep-profesional">Profesional</label>
                <select
                  id="rep-profesional"
                  value={repProfesional}
                  onChange={(e) => setRepProfesional(e.target.value)}
                >
                  {profesionalesLista.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rep-filter-item">
                <label htmlFor="rep-estado">Estado</label>
                <select
                  id="rep-estado"
                  value={repEstado}
                  onChange={(e) => setRepEstado(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  <option value="Agendada">Agendada</option>
                  <option value="Atendida">Atendida</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="No asistió">No asistió</option>
                </select>
              </div>

              <div className="rep-filter-actions">
                <button type="button" className="btn btn--primary">
                  <Filter size={14} />
                  <span>Filtrar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Resumen por Estado */}
          <div className="card reportes-summary-card">
            <h2 className="section-card-title">Resumen de citas por estado</h2>
            <div className="table-wrapper">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="status-label">
                        <span className="dot-indicator dot-indicator--blue" />
                        <span>Agendada</span>
                      </div>
                    </td>
                    <td className="summary-count">{summaryCounts.agendada}</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="status-label">
                        <span className="dot-indicator dot-indicator--green" />
                        <span>Atendida</span>
                      </div>
                    </td>
                    <td className="summary-count">{summaryCounts.atendida}</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="status-label">
                        <span className="dot-indicator dot-indicator--red" />
                        <span>Cancelada</span>
                      </div>
                    </td>
                    <td className="summary-count">{summaryCounts.cancelada}</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="status-label">
                        <span className="dot-indicator dot-indicator--amber" />
                        <span>No asistió</span>
                      </div>
                    </td>
                    <td className="summary-count">{summaryCounts.noAsistio}</td>
                  </tr>
                  <tr className="summary-total-row">
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td className="summary-count">
                      <strong>{summaryCounts.total}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla de Citas Atendidas */}
          <div className="card calendar-card">
            <div className="calendar-card__header">
              <div className="calendar-title-group">
                <div className="calendar-icon-bg">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h3 className="calendar-title">Citas atendidas</h3>
                  <p className="calendar-subtitle">
                    Registro de citas médicas finalizadas recientemente.
                  </p>
                </div>
              </div>

              <div className="calendar-legend">
                <span className="dot-indicator dot-indicator--green" />
                <span>{summaryCounts.total} Citas registradas</span>
              </div>
            </div>

            <div className="table-wrapper" style={{ marginTop: '8px' }}>
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>FECHA</th>
                    <th>PACIENTE</th>
                    <th>MÉDICO</th>
                    <th>ESPECIALIDAD</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '13px' }}>
                        No hay citas atendidas registradas.
                      </td>
                    </tr>
                  ) : (
                    paginatedAppointments.map((cita) => (
                      <tr key={cita.id}>
                        <td style={{ fontSize: '12.5px', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {cita.date}
                        </td>
                        <td style={{ fontWeight: 600 }}>{cita.patientName}</td>
                        <td>{cita.professionalName}</td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: 'rgba(0, 168, 150, 0.12)',
                              color: '#00A896',
                            }}
                          >
                            {cita.professionalSpecialty || cita.serviceName || 'Medicina General'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer de Paginación */}
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--hl-border, #E2E8F0)' }}>
              <Pagination
                currentPage={repCurrentPage}
                totalPages={repTotalPages}
                totalItems={appointments.length}
                itemsPerPage={itemsPerPage}
                itemLabel="registros"
                onPageChange={(p) => setRepCurrentPage(p)}
              />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. SECCIÓN DERECHA — HISTORIAL (55%)                        */}
        {/* ========================================================= */}
        <section className="col-historial">
          {/* Top Bar Header with Sub-tabs inline */}
          <div className="historial-top-bar">
            <div className="col-header">
              <div className="col-header__icon col-header__icon--teal">
                <Clock size={22} />
              </div>
              <div>
                <h1 className="col-header__title">
                  {isDoctor ? 'Historial de Consultas' : 'Historial'}
                </h1>
                <p className="col-header__subtitle">
                  {isDoctor
                    ? 'Consulta el historial de atenciones clínicas y expedientes de pacientes.'
                    : 'Consulta el historial de acciones y citas pasadas.'}
                </p>
              </div>
            </div>

            {/* Sub-tabs segment */}
            <div className="hist-subtabs">
              <button
                type="button"
                className={`hist-subtab-btn${histTab === 'acciones' ? ' hist-subtab-btn--active' : ''}`}
                onClick={() => setHistTab('acciones')}
              >
                Historial de acciones
              </button>
              <button
                type="button"
                className={`hist-subtab-btn${histTab === 'citas' ? ' hist-subtab-btn--active' : ''}`}
                onClick={() => setHistTab('citas')}
              >
                Citas pasadas
              </button>
            </div>
          </div>

          {/* TAB 1: HISTORIAL DE ACCIONES */}
          {histTab === 'acciones' && (
            <div className="card historial-main-card">
              {/* Filtros compactos */}
              <div className="hist-filter-grid">
                <div className="hist-search-box">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar acción, usuario..."
                    value={actSearch}
                    onChange={(e) => setActSearch(e.target.value)}
                  />
                </div>

                <div className="hist-filter-item">
                  <label htmlFor="act-fecha-desde">Fecha desde</label>
                  <input
                    id="act-fecha-desde"
                    type="date"
                    value={actFechaDesde}
                    onChange={(e) => setActFechaDesde(e.target.value)}
                  />
                </div>

                <div className="hist-filter-item">
                  <label htmlFor="act-fecha-hasta">Fecha hasta</label>
                  <input
                    id="act-fecha-hasta"
                    type="date"
                    value={actFechaHasta}
                    onChange={(e) => setActFechaHasta(e.target.value)}
                  />
                </div>

                <div className="hist-filter-item">
                  <label htmlFor="act-usuario">Usuario</label>
                  <select
                    id="act-usuario"
                    value={actUsuario}
                    onChange={(e) => setActUsuario(e.target.value)}
                  >
                    {usuariosLista.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="hist-filter-item">
                  <label htmlFor="act-profesional">Profesional</label>
                  <select
                    id="act-profesional"
                    value={actProfesional}
                    onChange={(e) => setActProfesional(e.target.value)}
                  >
                    {profesionalesLista.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="hist-filter-item">
                  <label htmlFor="act-tipo-accion">Tipo de acción</label>
                  <select
                    id="act-tipo-accion"
                    value={actTipoAccion}
                    onChange={(e) => setActTipoAccion(e.target.value)}
                  >
                    <option value="Todos">Todos</option>
                    <option value="Cita creada">Cita creada</option>
                    <option value="Cita atendida">Cita atendida</option>
                    <option value="Nota registrada">Nota registrada</option>
                    <option value="Cita cancelada">Cita cancelada</option>
                    <option value="Cita reprogramada">Cita reprogramada</option>
                  </select>
                </div>

                <div className="hist-filter-buttons">
                  <button type="button" className="btn btn--primary">
                    <Filter size={14} />
                    <span>Filtrar</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={handleClearActionsFilter}
                  >
                    <X size={14} />
                    <span>Limpiar</span>
                  </button>
                </div>
              </div>

              {/* Tabla de Acciones (Sin columna Entidad Relacionada) */}
              <div className="table-wrapper">
                <table className="historial-table">
                  <thead>
                    <tr>
                      <th>Fecha y hora</th>
                      <th>Usuario</th>
                      <th>Profesional</th>
                      <th>Tipo de acción</th>
                      <th>Detalles</th>
                      <th style={{ textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedActionLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                          No se encontraron registros de acciones con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      paginatedActionLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="td-datetime">{log.fechaHora}</td>
                          <td>
                            <div className="user-info">
                              {log.usuario.avatar ? (
                                <img
                                  src={log.usuario.avatar}
                                  alt={log.usuario.nombre}
                                  className="user-avatar"
                                />
                              ) : (
                                <div className="user-avatar-fallback">
                                  <User size={14} />
                                </div>
                              )}
                              <div className="user-info">
                                <span className="user-name">{log.usuario.nombre}</span>
                                <span className="user-role">{log.usuario.rol}</span>
                              </div>
                            </div>
                          </td>
                          <td className="td-profesional">{log.profesional}</td>
                          <td>{getActionBadge(log.tipoAccion)}</td>
                          <td className="td-detalles">{log.detalles}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-ver-cita"
                              onClick={() => {
                                const found = mockPastAppointments.find((a) => a.id === log.citaId);
                                setSelectedAppointment(
                                  found || {
                                    id: log.citaId,
                                    codigo: `CIT-2025-00${log.citaId}`,
                                    fecha: '2025-05-31',
                                    hora: '10:45 AM',
                                    paciente: 'María López',
                                    documento: '1098472635',
                                    profesional: log.profesional,
                                    especialidad: 'Medicina General',
                                    servicio: 'Consulta médica general',
                                    estado: 'atendida',
                                    notaProfesional: 'Registro de auditoría consultado.',
                                    resultadoAtencion: 'Atención realizada satisfactoriamente.',
                                  }
                                );
                              }}
                            >
                              Ver cita
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div style={{ marginTop: '12px' }}>
                <Pagination
                  currentPage={actCurrentPage}
                  totalPages={actTotalPages}
                  totalItems={filteredActionLogs.length}
                  itemsPerPage={itemsPerPage}
                  itemLabel="registros"
                  onPageChange={(p) => setActCurrentPage(p)}
                />
              </div>

              {/* Banner Informativo Inferior */}
              <div className="historial-info-banner">
                <div className="banner-left">
                  <div className="banner-icon-bg">
                    <Info size={18} />
                  </div>
                  <span>
                    Para consultar las citas pasadas y sus detalles (incluyendo notas y resultados de atención), dirígete a la pestaña "Citas pasadas".
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn--primary btn--banner"
                  onClick={() => setHistTab('citas')}
                >
                  <CalendarIcon size={14} />
                  <span>Ir a Citas pasadas</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CITAS PASADAS */}
          {histTab === 'citas' && (
            <div className="card historial-main-card">
              {/* Filtros para Citas Pasadas */}
              <div className="citas-filter-grid">
                <div className="hist-search-box">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por paciente, documento o profesional..."
                    value={citasSearch}
                    onChange={(e) => setCitasSearch(e.target.value)}
                  />
                </div>

                <div className="hist-filter-item">
                  <label htmlFor="citas-fecha-desde">Fecha desde</label>
                  <input
                    id="citas-fecha-desde"
                    type="date"
                    value={citasFechaDesde}
                    onChange={(e) => setCitasFechaDesde(e.target.value)}
                  />
                </div>

                <div className="hist-filter-item">
                  <label htmlFor="citas-fecha-hasta">Fecha hasta</label>
                  <input
                    id="citas-fecha-hasta"
                    type="date"
                    value={citasFechaHasta}
                    onChange={(e) => setCitasFechaHasta(e.target.value)}
                  />
                </div>

                <div className="hist-filter-item">
                  <label htmlFor="citas-estado">Estado</label>
                  <select
                    id="citas-estado"
                    value={citasEstado}
                    onChange={(e) => setCitasEstado(e.target.value)}
                  >
                    <option value="Todas">Todas</option>
                    <option value="Atendida">Atendida</option>
                    <option value="Cancelada">Cancelada</option>
                    <option value="No asistió">No asistió</option>
                  </select>
                </div>

                <div className="hist-filter-buttons">
                  <button type="button" className="btn btn--primary">
                    <Filter size={14} />
                    <span>Filtrar</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={handleClearCitasFilter}
                  >
                    <X size={14} />
                    <span>Limpiar</span>
                  </button>
                </div>
              </div>

              {/* Tabla de Citas Pasadas */}
              <div className="table-wrapper">
                <table className="historial-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Paciente</th>
                      <th>Profesional</th>
                      <th>Servicio</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPastAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                          No se encontraron citas pasadas con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      paginatedPastAppointments.map((cita) => (
                        <tr key={cita.id}>
                          <td className="td-datetime">{cita.fecha}</td>
                          <td className="td-datetime">{cita.hora}</td>
                          <td>
                            <div className="user-info">
                              <span className="user-name">{cita.paciente}</span>
                              <span className="user-role">DNI: {cita.documento}</span>
                            </div>
                          </td>
                          <td className="td-profesional">{cita.profesional}</td>
                          <td className="td-detalles">{cita.servicio}</td>
                          <td>{getStatusBadge(cita.estado)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-ver-cita"
                              onClick={() => setSelectedAppointment(cita)}
                            >
                              <Eye size={14} />
                              <span>Ver detalle</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div style={{ marginTop: '12px' }}>
                <Pagination
                  currentPage={pastCurrentPage}
                  totalPages={pastTotalPages}
                  totalItems={filteredPastAppointments.length}
                  itemsPerPage={itemsPerPage}
                  itemLabel="registros"
                  onPageChange={(p) => setPastCurrentPage(p)}
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ========================================================= */}
      {/* 3. MODAL DE DETALLE DE LA ATENCIÓN                        */}
      {/* ========================================================= */}
      {selectedAppointment && (
        <div className="modal-backdrop" onClick={() => setSelectedAppointment(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-bg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Detalle de la Atención</h3>
                  <span className="modal-code">{selectedAppointment.codigo}</span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedAppointment(null)}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Información General Grid */}
              <div className="modal-info-grid">
                <div className="info-block">
                  <span className="info-label">
                    <User size={13} /> Paciente
                  </span>
                  <span className="info-val">{selectedAppointment.paciente}</span>
                  <span className="info-sub">DNI: {selectedAppointment.documento}</span>
                </div>

                <div className="info-block">
                  <span className="info-label">
                    <Stethoscope size={13} /> Profesional
                  </span>
                  <span className="info-val">{selectedAppointment.profesional}</span>
                  <span className="info-sub">{selectedAppointment.especialidad}</span>
                </div>

                <div className="info-block">
                  <span className="info-label">
                    <CalendarIcon size={13} /> Fecha y Hora
                  </span>
                  <span className="info-val">
                    {selectedAppointment.fecha} - {selectedAppointment.hora}
                  </span>
                </div>

                <div className="info-block">
                  <span className="info-label">Estado de la Cita</span>
                  <div style={{ marginTop: '4px' }}>
                    {getStatusBadge(selectedAppointment.estado)}
                  </div>
                </div>
              </div>

              <div className="modal-divider" />

              {/* Servicio / Especialidad */}
              <div className="modal-section">
                <h4 className="modal-section-title">Servicio prestado</h4>
                <p className="modal-section-box">{selectedAppointment.servicio}</p>
              </div>

              {/* Nota del profesional */}
              <div className="modal-section">
                <h4 className="modal-section-title">Nota del profesional</h4>
                <p className="modal-section-box">
                  {selectedAppointment.notaProfesional || 'Sin notas registradas por el profesional.'}
                </p>
              </div>

              {/* Resultado de la atención */}
              <div className="modal-section">
                <h4 className="modal-section-title">Resultado de la atención</h4>
                <p className="modal-section-box modal-section-box--highlight">
                  {selectedAppointment.resultadoAtencion || 'Atención no completada o resultado no registrado.'}
                </p>
              </div>

              <div className="modal-notice">
                <Info size={14} />
                <span>
                  Modo consulta para administración. El registro y modificación de notas médicas son competencia exclusiva del profesional de salud.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setSelectedAppointment(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popover / Mini Modal de Citas Atendidas del Día */}
      {selectedDayDetail && (
        <div className="modal-backdrop" onClick={() => setSelectedDayDetail(null)}>
          <div className="modal-container modal-container--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-bg">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h3 className="modal-title">Citas Atendidas - {selectedDayDetail.day} Mayo 2025</h3>
                  <span className="modal-code">{selectedDayDetail.count} citas finalizadas</span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedDayDetail(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="day-citas-list">
                {Array.from({ length: selectedDayDetail.count }).map((_, idx) => (
                  <div key={idx} className="day-cita-item">
                    <div className="day-cita-time">
                      <Clock size={14} />
                      <span>{String(9 + idx * 2).padStart(2, '0')}:00 AM</span>
                    </div>
                    <div className="day-cita-details">
                      <strong>Paciente {idx + 1}</strong>
                      <span>Dra. Laura Martínez — Consulta Médica</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setSelectedDayDetail(null)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportes;
