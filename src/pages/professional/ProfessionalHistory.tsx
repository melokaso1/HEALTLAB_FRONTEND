import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  Calendar,
  Filter,
  RotateCcw,
  FileText,
  X,
  User,
  Stethoscope,
} from 'lucide-react';
import { getAppointmentsApi } from '../../services/appointments.service';
import { useAuth } from '../../context/AuthContext';
import { resolveMedicoIdForUser } from '../../services/professionals.service';
import { mergeStoredAppointmentNotes } from '../../services/appointmentNotes.service';
import Pagination from '../../components/common/Pagination';
import './ProfessionalHistory.css';

export interface ConsultationRecord {
  id: number;
  date: string;
  patientName: string;
  patientDoc: string;
  service: string;
  diagnosis: string;
  observations: string;
  result: string;
  resultBadgeType?: 'normal' | 'blue' | 'red' | 'green';
  status: 'Atendido' | 'Completado' | 'En seguimiento';
  doctorNotes?: string;
  prescription?: string;
}

const ProfessionalHistory: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ConsultationRecord[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const [apps, medicoId] = await Promise.all([
        getAppointmentsApi(),
        resolveMedicoIdForUser(user),
      ]);
      if (Array.isArray(apps)) {
        const mapped: ConsultationRecord[] = mergeStoredAppointmentNotes(apps)
          .filter((a) =>
            (medicoId
              ? String(a.professionalId) === medicoId
              : a.professionalName.toLowerCase().includes((user?.name || '').toLowerCase())) &&
            (a.status === 'Atendida' || Boolean(a.notes)))
          .map((a: any) => ({
          id: a.id,
          date: a.date,
          patientName: a.patientName,
          patientDoc: a.patientDoc,
          service: a.serviceName,
          diagnosis: a.notes || 'Atención Médica Finalizada',
          observations: a.notes || 'Sin observaciones adicionales.',
          result: 'Atención Completada',
          resultBadgeType: 'normal',
          status: a.status === 'Atendida' ? 'Completado' : 'En seguimiento',
        }));
        setHistory(mapped);
      }
    };
    void loadHistory();
  }, [user]);

  const [searchPatient, setSearchPatient] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Selected item for modal detail
  const [selectedRecord, setSelectedRecord] = useState<ConsultationRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return history.filter((rec) => {
      const patientMatch =
        !searchPatient ||
        rec.patientName.toLowerCase().includes(searchPatient.toLowerCase().trim()) ||
        rec.patientDoc.toLowerCase().includes(searchPatient.toLowerCase().trim()) ||
        rec.diagnosis.toLowerCase().includes(searchPatient.toLowerCase().trim());

      const statusMatch = statusFilter === 'all' || rec.status === statusFilter;
      const startMatch = !startDate || rec.date >= startDate;
      const endMatch = !endDate || rec.date <= endDate;

      return patientMatch && statusMatch && startMatch && endMatch;
    });
  }, [history, searchPatient, statusFilter, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchPatient('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    showToast('Exportando historial de consultas a formato CSV...');
  };

  const renderResultBadge = (rec: ConsultationRecord) => {
    if (rec.resultBadgeType === 'blue') {
      return <span className="prof-hist-badge prof-hist-badge--blue">• {rec.result}</span>;
    }
    if (rec.resultBadgeType === 'red') {
      return <span className="prof-hist-badge prof-hist-badge--red">• {rec.result}</span>;
    }
    return <span className="prof-hist-result-text">{rec.result}</span>;
  };

  return (
    <div className="prof-history-page">
      {/* Top Header Row */}
      <div className="prof-history__header">
        <div className="prof-history__title-group">
          <h1 className="prof-history__title">Historial de Consultas Realizadas</h1>
          <p className="prof-history__subtitle">
            Registro inmutable de atenciones médicas y diagnósticos.
          </p>
        </div>

        <button
          type="button"
          className="prof-history__btn-export"
          onClick={handleExportCSV}
        >
          <Download size={15} />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Main Filter Bar Card */}
      <div className="prof-card prof-history-filter-card">
        <div className="prof-history-filters-grid">
          {/* Patient Search */}
          <div className="filter-group">
            <label className="filter-label">Paciente</label>
            <div className="filter-input-box">
              <Search size={15} className="filter-icon" />
              <input
                type="text"
                className="filter-input"
                placeholder="Nombre o ID..."
                value={searchPatient}
                onChange={(e) => {
                  setSearchPatient(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Fecha Inicio */}
          <div className="filter-group">
            <label className="filter-label">Fecha Inicio</label>
            <div className="filter-input-box">
              <Calendar size={15} className="filter-icon" />
              <input
                type="date"
                className="filter-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          {/* Fecha Fin */}
          <div className="filter-group">
            <label className="filter-label">Fecha Fin</label>
            <div className="filter-input-box">
              <Calendar size={15} className="filter-icon" />
              <input
                type="date"
                className="filter-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Estado Filter */}
          <div className="filter-group">
            <label className="filter-label">Estado</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="Completado">Completado</option>
              <option value="En seguimiento">En seguimiento</option>
              <option value="Atendido">Atendido</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="filter-actions">
            <button
              type="button"
              className="btn-apply-filters"
              onClick={() => setCurrentPage(1)}
            >
              <Filter size={14} />
              <span>Aplicar</span>
            </button>
            <button
              type="button"
              className="btn-reset-filters"
              title="Limpiar filtros"
              onClick={handleResetFilters}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="prof-card prof-history-table-card">
        <div className="prof-history-table-wrapper">
          <table className="prof-history-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>FECHA</th>
                <th>PACIENTE</th>
                <th>SERVICIO</th>
                <th>DIAGNÓSTICO</th>
                <th>OBSERVACIONES</th>
                <th>RESULTADO</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="prof-history-table__empty">
                    No se encontraron registros de consultas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="prof-history-row"
                    onClick={() => setSelectedRecord(rec)}
                  >
                    <td className="prof-hist-date">{rec.date}</td>
                    <td className="prof-hist-patient">{rec.patientName}</td>
                    <td className="prof-hist-service">{rec.service}</td>
                    <td className="prof-hist-diagnosis">{rec.diagnosis}</td>
                    <td className="prof-hist-obs">{rec.observations}</td>
                    <td className="prof-hist-result">{renderResultBadge(rec)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="prof-history-table-footer" style={{ padding: 0 }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRecords.length}
            itemsPerPage={pageSize}
            itemLabel="registros"
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      {/* Detail Modal popover */}
      {selectedRecord && (
        <div className="modal-backdrop">
          <div className="modal-content record-detail-modal">
            <div className="modal-header">
              <div className="modal-header__title-group">
                <Stethoscope size={18} className="modal-header__icon" />
                <h3 className="modal-title">Detalle de Consulta Médica</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedRecord(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="record-patient-banner">
                <div className="record-patient-banner__info">
                  <User size={18} />
                  <span className="record-patient-banner__name">{selectedRecord.patientName}</span>
                  <span className="record-patient-banner__doc">({selectedRecord.patientDoc})</span>
                </div>
                <span className="record-patient-banner__date">{selectedRecord.date}</span>
              </div>

              <div className="detail-section">
                <span className="detail-label">Servicio Médico</span>
                <span className="detail-value">{selectedRecord.service}</span>
              </div>

              <div className="detail-section">
                <span className="detail-label">Diagnóstico Principal</span>
                <span className="detail-value detail-value--highlight">
                  {selectedRecord.diagnosis}
                </span>
              </div>

              <div className="detail-section">
                <span className="detail-label">Observaciones Clínicas</span>
                <p className="detail-text">{selectedRecord.observations}</p>
              </div>

              <div className="detail-section">
                <span className="detail-label">Resultado / Plan Indicado</span>
                <div className="detail-result-box">{selectedRecord.result}</div>
              </div>

              {selectedRecord.prescription && (
                <div className="detail-section">
                  <span className="detail-label">Receta / Medicación Solicitada</span>
                  <div className="detail-prescription-box">
                    <FileText size={14} />
                    <span>{selectedRecord.prescription}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedRecord(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast message */}
      {toastMsg && <div className="toast-msg">{toastMsg}</div>}
    </div>
  );
};

export default ProfessionalHistory;
