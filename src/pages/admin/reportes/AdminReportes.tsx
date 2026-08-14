import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart2,
  Clock,
  Filter,
  X,
  Search,
  Eye,
  Calendar as CalendarIcon,
  User,
  Stethoscope,
  FileText,
  CheckCircle,
} from 'lucide-react';
import type { Appointment } from '../../../types/appointment.types';
import Pagination from '../../../components/common/Pagination';
import { getAppointmentsApi } from '../../../services/appointments.service';
import { getProfessionalsApi } from '../../../services/professionals.service';
import { getReporteConteoPorEstadoApi } from '../../../services/reports.service';
import './AdminReportes.css';

const AdminReportes: React.FC = () => {
  // Real appointments & professionals state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profesionalesLista, setProfesionalesLista] = useState<string[]>(['Todos']);

  useEffect(() => {
    getAppointmentsApi().then((data) => {
      if (data) setAppointments(data);
    });
    getProfessionalsApi().then((profs) => {
      if (profs && profs.length > 0) {
        const names = Array.from(new Set(profs.map((p) => p.name)));
        setProfesionalesLista(['Todos', ...names]);
      }
    });
    getReporteConteoPorEstadoApi().catch((err) => console.warn('Error reportes:', err));
  }, []);

  // Reportes Filter State
  const [repFechaDesde, setRepFechaDesde] = useState('2026-01-01');
  const [repFechaHasta, setRepFechaHasta] = useState('2026-12-31');
  const [repProfesional, setRepProfesional] = useState('Todos');
  const [repEstado, setRepEstado] = useState('Todos');

  // Paginación de la columna de reportes
  const [repCurrentPage, setRepCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // Applied Filters State for "Filtrar" action
  const [appliedFilters, setAppliedFilters] = useState({
    fechaDesde: '2026-01-01',
    fechaHasta: '2026-12-31',
    profesional: 'Todos',
    estado: 'Todos',
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      fechaDesde: repFechaDesde,
      fechaHasta: repFechaHasta,
      profesional: repProfesional,
      estado: repEstado,
    });
  };

  // Filtered appointments list based on applied filters
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      if (appliedFilters.fechaDesde && app.date < appliedFilters.fechaDesde) return false;
      if (appliedFilters.fechaHasta && app.date > appliedFilters.fechaHasta) return false;
      if (appliedFilters.profesional !== 'Todos' && !app.professionalName.includes(appliedFilters.profesional)) return false;
      if (appliedFilters.estado !== 'Todos' && app.status !== appliedFilters.estado) return false;
      return true;
    });
  }, [appointments, appliedFilters]);

  const attendedAppointments = useMemo(() => {
    return filteredAppointments.filter((app) => app.status === 'Atendida');
  }, [filteredAppointments]);

  const repTotalPages = useMemo(
    () => Math.ceil(attendedAppointments.length / itemsPerPage) || 1,
    [attendedAppointments.length, itemsPerPage]
  );

  const paginatedAttendedAppointments = useMemo(() => {
    const start = (repCurrentPage - 1) * itemsPerPage;
    return attendedAppointments.slice(start, start + itemsPerPage);
  }, [attendedAppointments, repCurrentPage, itemsPerPage]);

  // Dynamic counts based on real appointments and applied filters
  const summaryCounts = useMemo(() => {
    const baseList = appointments.filter((app) => {
      if (appliedFilters.fechaDesde && app.date < appliedFilters.fechaDesde) return false;
      if (appliedFilters.fechaHasta && app.date > appliedFilters.fechaHasta) return false;
      if (appliedFilters.profesional !== 'Todos' && !app.professionalName.includes(appliedFilters.profesional)) return false;
      return true;
    });

    const agendada = baseList.filter((a) => a.status === 'Agendada').length;
    const atendida = baseList.filter((a) => a.status === 'Atendida').length;
    const cancelada = baseList.filter((a) => a.status === 'Cancelada').length;
    const noAsistio = baseList.filter((a) => a.status === 'No asistió').length;

    if (appliedFilters.estado === 'Agendada') return { agendada, atendida: 0, cancelada: 0, noAsistio: 0, total: agendada };
    if (appliedFilters.estado === 'Atendida') return { agendada: 0, atendida, cancelada: 0, noAsistio: 0, total: atendida };
    if (appliedFilters.estado === 'Cancelada') return { agendada: 0, atendida: 0, cancelada, noAsistio: 0, total: cancelada };
    if (appliedFilters.estado === 'No asistió') return { agendada: 0, atendida: 0, cancelada: 0, noAsistio, total: noAsistio };

    return { agendada, atendida, cancelada, noAsistio, total: baseList.length };
  }, [appointments, appliedFilters]);

  // Simplified Historial Filter State
  const [histSearch, setHistSearch] = useState('');
  const [histFechaDesde, setHistFechaDesde] = useState('2026-01-01');
  const [histFechaHasta, setHistFechaHasta] = useState('2026-12-31');
  const [histEstado, setHistEstado] = useState('Todos');
  const [histProfesional, setHistProfesional] = useState('Todos');

  const [appliedHistFilters, setAppliedHistFilters] = useState({
    search: '',
    fechaDesde: '2026-01-01',
    fechaHasta: '2026-12-31',
    estado: 'Todos',
    profesional: 'Todos',
  });

  const handleApplyHistFilters = () => {
    setAppliedHistFilters({
      search: histSearch,
      fechaDesde: histFechaDesde,
      fechaHasta: histFechaHasta,
      estado: histEstado,
      profesional: histProfesional,
    });
  };

  const handleClearHistFilters = () => {
    setHistSearch('');
    setHistFechaDesde('2026-01-01');
    setHistFechaHasta('2026-12-31');
    setHistEstado('Todos');
    setHistProfesional('Todos');
    setAppliedHistFilters({
      search: '',
      fechaDesde: '2026-01-01',
      fechaHasta: '2026-12-31',
      estado: 'Todos',
      profesional: 'Todos',
    });
  };

  // Modal State
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Filtered Appointments for Historial Column
  const filteredHistorialAppointments = useMemo(() => {
    return appointments.filter((app) => {
      if (appliedHistFilters.fechaDesde && app.date < appliedHistFilters.fechaDesde) return false;
      if (appliedHistFilters.fechaHasta && app.date > appliedHistFilters.fechaHasta) return false;
      if (appliedHistFilters.estado !== 'Todos' && app.status !== appliedHistFilters.estado) return false;
      if (appliedHistFilters.profesional !== 'Todos' && !app.professionalName.includes(appliedHistFilters.profesional)) return false;
      if (appliedHistFilters.search.trim()) {
        const q = appliedHistFilters.search.toLowerCase();
        const matchPac = app.patientName.toLowerCase().includes(q);
        const matchDoc = app.professionalName.toLowerCase().includes(q);
        const matchSrv = app.serviceName.toLowerCase().includes(q);
        const matchNotes = (app.notes || '').toLowerCase().includes(q);
        if (!matchPac && !matchDoc && !matchSrv && !matchNotes) return false;
      }
      return true;
    });
  }, [appointments, appliedHistFilters]);

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
                <button type="button" className="btn btn--primary" onClick={handleApplyFilters}>
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
                <span>{attendedAppointments.length} Citas registradas</span>
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
                  {paginatedAttendedAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '13px' }}>
                        No se encontraron citas atendidas con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    paginatedAttendedAppointments.map((cita) => (
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
                totalItems={attendedAppointments.length}
                itemsPerPage={itemsPerPage}
                itemLabel="registros"
                onPageChange={(p) => setRepCurrentPage(p)}
              />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. SECCIÓN DERECHA — HISTORIAL DE CITAS (55%)             */}
        {/* ========================================================= */}
        <section className="col-historial">
          <div className="historial-top-bar">
            <div className="col-header">
              <div className="col-header__icon col-header__icon--teal">
                <Clock size={22} />
              </div>
              <div>
                <h1 className="col-header__title">Historial de Citas</h1>
                <p className="col-header__subtitle">
                  Consulta el historial completo de atención y estado de las citas en el sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="card historial-main-card">
            {/* Filtros simplificados */}
            <div className="hist-filter-grid">
              <div className="hist-search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por paciente, médico o nota..."
                  value={histSearch}
                  onChange={(e) => setHistSearch(e.target.value)}
                />
              </div>

              <div className="hist-filter-item">
                <label htmlFor="hist-fecha-desde">Fecha desde</label>
                <input
                  id="hist-fecha-desde"
                  type="date"
                  value={histFechaDesde}
                  onChange={(e) => setHistFechaDesde(e.target.value)}
                />
              </div>

              <div className="hist-filter-item">
                <label htmlFor="hist-fecha-hasta">Fecha hasta</label>
                <input
                  id="hist-fecha-hasta"
                  type="date"
                  value={histFechaHasta}
                  onChange={(e) => setHistFechaHasta(e.target.value)}
                />
              </div>

              <div className="hist-filter-item">
                <label htmlFor="hist-estado">Estado</label>
                <select
                  id="hist-estado"
                  value={histEstado}
                  onChange={(e) => setHistEstado(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  <option value="Agendada">Agendada</option>
                  <option value="Atendida">Atendida</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="No asistió">No asistió</option>
                </select>
              </div>

              <div className="hist-filter-item">
                <label htmlFor="hist-profesional">Profesional</label>
                <select
                  id="hist-profesional"
                  value={histProfesional}
                  onChange={(e) => setHistProfesional(e.target.value)}
                >
                  {profesionalesLista.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hist-filter-buttons">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleApplyHistFilters}
                >
                  <Filter size={14} />
                  <span>Filtrar</span>
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleClearHistFilters}
                >
                  <X size={14} />
                  <span>Limpiar</span>
                </button>
              </div>
            </div>

            {/* Tabla del Historial Real */}
            <div className="table-wrapper">
              <table className="historial-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Paciente</th>
                    <th>Profesional</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistorialAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                        No se encontraron registros de citas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredHistorialAppointments.map((cita) => (
                      <tr key={cita.id}>
                        <td className="td-datetime">
                          {cita.date} <br />
                          <small style={{ color: '#64748B' }}>{cita.time}</small>
                        </td>
                        <td>
                          <div className="user-info">
                            <span className="user-name">{cita.patientName}</span>
                            <span className="user-role">Doc: {cita.patientDoc}</span>
                          </div>
                        </td>
                        <td className="td-profesional">
                          {cita.professionalName}
                          <br />
                          <small style={{ color: '#64748B' }}>{cita.professionalSpecialty}</small>
                        </td>
                        <td className="td-detalles">{cita.serviceName}</td>
                        <td>
                          <span
                            className={`badge badge--${
                              cita.status === 'Agendada'
                                ? 'agendada'
                                : cita.status === 'Atendida'
                                ? 'atendida'
                                : cita.status === 'Cancelada'
                                ? 'cancelada'
                                : 'no-asistio'
                            }`}
                          >
                            {cita.status}
                          </span>
                        </td>
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
            <div className="table-pagination">
              <span className="pagination-info">
                Mostrando 1 a {filteredHistorialAppointments.length} de {filteredHistorialAppointments.length} registros
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* 3. MODAL DE DETALLE DE LA CITAS                           */}
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
                  <h3 className="modal-title">Detalle de la Cita</h3>
                  <span className="modal-code">ID: {selectedAppointment.id}</span>
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
              <div className="modal-info-grid">
                <div className="info-block">
                  <span className="info-label">
                    <User size={13} /> Paciente
                  </span>
                  <span className="info-val">{selectedAppointment.patientName}</span>
                  <span className="info-sub">Doc: {selectedAppointment.patientDoc}</span>
                </div>

                <div className="info-block">
                  <span className="info-label">
                    <Stethoscope size={13} /> Profesional
                  </span>
                  <span className="info-val">{selectedAppointment.professionalName}</span>
                  <span className="info-sub">{selectedAppointment.professionalSpecialty}</span>
                </div>

                <div className="info-block">
                  <span className="info-label">
                    <CalendarIcon size={13} /> Fecha y Hora
                  </span>
                  <span className="info-val">
                    {selectedAppointment.date} — {selectedAppointment.time}
                  </span>
                </div>

                <div className="info-block">
                  <span className="info-label">Estado de la Cita</span>
                  <div style={{ marginTop: '4px' }}>
                    <span
                      className={`badge badge--${
                        selectedAppointment.status === 'Agendada'
                          ? 'agendada'
                          : selectedAppointment.status === 'Atendida'
                          ? 'atendida'
                          : selectedAppointment.status === 'Cancelada'
                          ? 'cancelada'
                          : 'no-asistio'
                      }`}
                    >
                      {selectedAppointment.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-divider" />

              <div className="modal-section">
                <h4 className="modal-section-title">Servicio</h4>
                <p className="modal-section-box">{selectedAppointment.serviceName}</p>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">Observaciones / Motivo</h4>
                <p className="modal-section-box">
                  {selectedAppointment.notes || 'Sin observaciones registradas.'}
                </p>
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
    </div>
  );
};

export default AdminReportes;
