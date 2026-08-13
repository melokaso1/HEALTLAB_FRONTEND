import React, { useState, useMemo, useEffect } from 'react';
import { Download, Eye, X, FileText, CheckCircle2 } from 'lucide-react';
import { getAppointmentsApi } from '../../../services/appointments.service';
import { getProfessionalsApi } from '../../../services/professionals.service';
import type { Appointment } from '../../../types/appointment.types';
import type { ProfessionalOption } from '../../../types/appointment.types';
import './Historial.css';

interface HistorialRecord {
  id: string;
  fecha: string;
  hora: string;
  pacienteNombre: string;
  pacienteDni: string;
  profesionalNombre: string;
  especialidad: string;
  estado: 'Atendido' | 'Cancelado' | 'No asistió';
  motivo: string;
  observaciones?: string;
}

const RecepHistorial: React.FC = () => {
  // Data States
  const [records, setRecords] = useState<HistorialRecord[]>([]);
  const [professionalsList, setProfessionalsList] = useState<ProfessionalOption[]>([]);
  const [_loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [profesionalFilter, setProfesionalFilter] = useState('Todos');
  const [fechaInicial, setFechaInicial] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todos');

  // Applied Filters
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    profesional: 'Todos',
    fechaInicial: '',
    fechaFinal: '',
    estado: 'Todos',
  });

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState<HistorialRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appsData, profsData] = await Promise.all([
          getAppointmentsApi(),
          getProfessionalsApi(),
        ]);

        if (Array.isArray(profsData)) {
          setProfessionalsList(profsData);
        }

        if (Array.isArray(appsData)) {
          const mapped: HistorialRecord[] = appsData.map((app: Appointment) => {
            let estadoMapped: 'Atendido' | 'Cancelado' | 'No asistió' = 'Atendido';
            if (app.status === 'Cancelada') estadoMapped = 'Cancelado';
            else if (app.status === 'No asistió') estadoMapped = 'No asistió';

            return {
              id: String(app.id),
              fecha: app.date,
              hora: app.time,
              pacienteNombre: app.patientName,
              pacienteDni: app.patientDoc || 'N/A',
              profesionalNombre: app.professionalName,
              especialidad: app.professionalSpecialty,
              estado: estadoMapped,
              motivo: app.notes || 'Consulta médica',
              observaciones: app.notes,
            };
          });

          setRecords(mapped);
        }
      } catch (error) {
        console.warn('[Historial.tsx] Error al cargar historial desde la API:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFiltrar = () => {
    setAppliedFilters({
      search: searchTerm,
      profesional: profesionalFilter,
      fechaInicial,
      fechaFinal,
      estado: estadoFilter,
    });
    setCurrentPage(1);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Search term filter (Nombre or DNI)
      if (appliedFilters.search.trim()) {
        const query = appliedFilters.search.toLowerCase();
        const matchesName = rec.pacienteNombre.toLowerCase().includes(query);
        const matchesDni = rec.pacienteDni.includes(query);
        if (!matchesName && !matchesDni) return false;
      }

      // Profesional filter
      if (
        appliedFilters.profesional !== 'Todos' &&
        rec.profesionalNombre !== appliedFilters.profesional
      ) {
        return false;
      }

      // Fecha Inicial filter
      if (appliedFilters.fechaInicial && rec.fecha < appliedFilters.fechaInicial) {
        return false;
      }

      // Fecha Final filter
      if (appliedFilters.fechaFinal && rec.fecha > appliedFilters.fechaFinal) {
        return false;
      }

      // Estado filter
      if (
        appliedFilters.estado !== 'Todos' &&
        rec.estado !== appliedFilters.estado
      ) {
        return false;
      }

      return true;
    });
  }, [records, appliedFilters]);

  const handleExport = () => {
    showToast('Exportando reporte histórico en formato CSV...');
  };

  return (
    <div className="recep-historial-page">
      {/* Toast banner */}
      {toastMessage && (
        <div className="toast-banner success">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Title Section */}
      <div className="recep-historial-header">
        <div className="recep-historial-header__text">
          <h1 className="recep-historial-header__title">Historial de Citas</h1>
          <p className="recep-historial-header__subtitle">
            Consulta el registro histórico de atenciones médicas. (Solo lectura)
          </p>
        </div>

        <button className="btn-export" onClick={handleExport}>
          <Download size={16} />
          <span>Exportar</span>
        </button>
      </div>

      {/* Filter Panel Card */}
      <div className="recep-filter-card">
        <div className="recep-filter-grid">
          {/* Filter 1: Paciente */}
          <div className="filter-group">
            <label className="filter-label">Paciente</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Nombre o DNI"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter 2: Profesional */}
          <div className="filter-group">
            <label className="filter-label">Profesional</label>
            <select
              className="filter-select"
              value={profesionalFilter}
              onChange={(e) => setProfesionalFilter(e.target.value)}
            >
              <option value="Todos">Todos los profesionales</option>
              {professionalsList.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.specialty})
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Fecha Inicial */}
          <div className="filter-group">
            <label className="filter-label">Fecha Inicial</label>
            <input
              type="date"
              className="filter-input"
              value={fechaInicial}
              onChange={(e) => setFechaInicial(e.target.value)}
            />
          </div>

          {/* Filter 4: Fecha Final */}
          <div className="filter-group">
            <label className="filter-label">Fecha Final</label>
            <input
              type="date"
              className="filter-input"
              value={fechaFinal}
              onChange={(e) => setFechaFinal(e.target.value)}
            />
          </div>

          {/* Filter 5: Estado */}
          <div className="filter-group">
            <label className="filter-label">Estado</label>
            <select
              className="filter-select"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Atendido">Atendido</option>
              <option value="Cancelado">Cancelado</option>
              <option value="No asistió">No asistió</option>
            </select>
          </div>
        </div>

        <div>
          <button className="btn-filtrar" onClick={handleFiltrar}>
            Filtrar
          </button>
        </div>
      </div>

      {/* History Data Table Card */}
      <div className="recep-table-card">
        <div className="recep-table-wrapper">
          <table className="historial-table">
            <thead>
              <tr>
                <th>FECHA / HORA</th>
                <th>PACIENTE</th>
                <th>PROFESIONAL</th>
                <th>ESPECIALIDAD</th>
                <th>ESTADO</th>
                <th>MOTIVO</th>
                <th style={{ textAlign: 'center' }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    No se encontraron registros de citas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <div className="fecha-cell">
                        <span className="fecha-date">{rec.fecha}</span>
                        <span className="fecha-time">{rec.hora}</span>
                      </div>
                    </td>

                    <td>
                      <div className="paciente-cell">
                        <span className="paciente-nombre">{rec.pacienteNombre}</span>
                        <span className="paciente-dni">DNI: {rec.pacienteDni}</span>
                      </div>
                    </td>

                    <td style={{ fontWeight: 600 }}>{rec.profesionalNombre}</td>
                    <td>{rec.especialidad}</td>

                    <td>
                      <span
                        className={`historial-status-badge ${
                          rec.estado === 'Atendido'
                            ? 'atendido'
                            : rec.estado === 'Cancelado'
                            ? 'cancelado'
                            : 'no-asistio'
                        }`}
                      >
                        {rec.estado}
                      </span>
                    </td>

                    <td>
                      <div className="motivo-text" title={rec.motivo}>
                        {rec.motivo}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-action-icon"
                        title="Ver detalle de la cita"
                        onClick={() => setSelectedRecord(rec)}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="recep-table-footer">
          <span className="recep-records-count">
            Mostrando {filteredRecords.length} de 145 registros
          </span>

          <div className="pagination-controls">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <button
              className={`page-btn ${currentPage === 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(1)}
            >
              1
            </button>
            <button
              className={`page-btn ${currentPage === 2 ? 'active' : ''}`}
              onClick={() => setCurrentPage(2)}
            >
              2
            </button>
            <button
              className={`page-btn ${currentPage === 3 ? 'active' : ''}`}
              onClick={() => setCurrentPage(3)}
            >
              3
            </button>
            <button
              className="page-btn"
              onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal Detalle de Cita Histórica */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <FileText size={18} color="#00A896" />
                Detalle de Cita Histórica #{selectedRecord.id}
              </h3>
              <button
                className="btn-icon"
                type="button"
                onClick={() => setSelectedRecord(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Paciente</label>
                  <div className="form-input" style={{ backgroundColor: 'var(--hl-bg-page)', fontWeight: 700 }}>
                    {selectedRecord.pacienteNombre} (DNI: {selectedRecord.pacienteDni})
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha y Hora</label>
                  <div className="form-input" style={{ backgroundColor: 'var(--hl-bg-page)' }}>
                    {selectedRecord.fecha} - {selectedRecord.hora}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Profesional Atendente</label>
                  <div className="form-input" style={{ backgroundColor: 'var(--hl-bg-page)' }}>
                    {selectedRecord.profesionalNombre} ({selectedRecord.especialidad})
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Estado de la Cita</label>
                  <div>
                    <span
                      className={`historial-status-badge ${
                        selectedRecord.estado === 'Atendido'
                          ? 'atendido'
                          : selectedRecord.estado === 'Cancelado'
                          ? 'cancelado'
                          : 'no-asistio'
                      }`}
                    >
                      {selectedRecord.estado}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Motivo de Consulta</label>
                <div className="form-input" style={{ backgroundColor: 'var(--hl-bg-page)', minHeight: '40px' }}>
                  {selectedRecord.motivo}
                </div>
              </div>

              {selectedRecord.observaciones && (
                <div className="form-group">
                  <label className="form-label">Observaciones de Recepción / Admisión</label>
                  <div className="form-input" style={{ backgroundColor: 'var(--hl-bg-page)', minHeight: '50px' }}>
                    {selectedRecord.observaciones}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-recep-primary"
                onClick={() => setSelectedRecord(null)}
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

export default RecepHistorial;
