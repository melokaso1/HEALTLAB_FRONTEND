import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Calendar,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
  Stethoscope,
  User,
} from 'lucide-react';
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

const mockConsultationHistory: ConsultationRecord[] = [
  {
    id: 101,
    date: '15 Oct 2026',
    patientName: 'Carlos Mendoza',
    patientDoc: 'CC-98765432',
    service: 'Consulta General',
    diagnosis: 'Hipertensión arterial estadio 1',
    observations: 'Paciente estable, presión 130/85. Sin síntomas agudos.',
    result: 'Continuar dieta hiposódica',
    resultBadgeType: 'normal',
    status: 'Completado',
    doctorNotes: 'Responde bien a esquema actual. Control en 3 meses.',
    prescription: 'Enalapril 10mg cada 12 horas por 90 días.',
  },
  {
    id: 102,
    date: '14 Oct 2026',
    patientName: 'Ana Rojas',
    patientDoc: 'CC-44556677',
    service: 'Control Anual',
    diagnosis: 'Paciente Sano',
    observations: 'Sin novedades reportadas en examen físico ni laboratorios.',
    result: 'Próximo control 1 año',
    resultBadgeType: 'normal',
    status: 'Completado',
    doctorNotes: 'Exámenes preventivos dentro de rangos normales.',
  },
  {
    id: 103,
    date: '12 Oct 2026',
    patientName: 'Luis Gómez',
    patientDoc: 'CE-11223344',
    service: 'Cardiología',
    diagnosis: 'Arritmia leve',
    observations: 'Monitoreo holter 24h completado. Extrasístoles supraventriculares aisladas.',
    result: 'Ajuste medicación',
    resultBadgeType: 'blue',
    status: 'En seguimiento',
    doctorNotes: 'Se ajusta dosis de beta-bloqueador.',
    prescription: 'Bisoprolol 2.5mg cada 24 horas.',
  },
  {
    id: 104,
    date: '10 Oct 2026',
    patientName: 'María Soto',
    patientDoc: 'CC-88776655',
    service: 'Dermatología',
    diagnosis: 'Dermatitis de contacto',
    observations: 'Mejora visible en extremidades superiores tras 5 días de tratamiento.',
    result: 'Crema tópica x7 días',
    resultBadgeType: 'normal',
    status: 'Completado',
    doctorNotes: 'Evitar contacto con detergentes concentrados.',
    prescription: 'Hidrocortisona crema 1% aplicar 2 veces al día.',
  },
  {
    id: 105,
    date: '08 Oct 2026',
    patientName: 'Jorge Pinto',
    patientDoc: 'CC-33445566',
    service: 'Consulta General',
    diagnosis: 'Infección respiratoria alta',
    observations: 'Fiebre controlada. Odinofagia persistente leve.',
    result: 'Antibiótico 5 días',
    resultBadgeType: 'normal',
    status: 'Completado',
    prescription: 'Amoxicilina 500mg cada 8 horas.',
  },
  {
    id: 106,
    date: '05 Oct 2026',
    patientName: 'Elena Vásquez',
    patientDoc: 'CC-55667788',
    service: 'Traumatología',
    diagnosis: 'Esguince tobillo grado 2',
    observations: 'Dolor persistente al apoyo, inflamación articular moderada.',
    result: 'Derivar Kinesio',
    resultBadgeType: 'red',
    status: 'En seguimiento',
    doctorNotes: 'Se indica bota inmovilizadora e inicio de fisioterapia.',
  },
  {
    id: 107,
    date: '02 Oct 2026',
    patientName: 'Roberto Chen',
    patientDoc: 'CC-33221144',
    service: 'Cardiología',
    diagnosis: 'Control de hipertensión',
    observations: 'Monitoreo de presión arterial dentro de parámetros esperados.',
    result: 'Mantener tratamiento',
    resultBadgeType: 'normal',
    status: 'Completado',
  },
  {
    id: 108,
    date: '28 Sep 2026',
    patientName: 'Camila Morales',
    patientDoc: 'CC-99001122',
    service: 'Medicina General',
    diagnosis: 'Gastritis aguda',
    observations: 'Dolor epigástrico postprandial.',
    result: 'Dieta + Inhibidor de bomba',
    resultBadgeType: 'blue',
    status: 'Completado',
    prescription: 'Omeprazol 20mg en ayunas por 30 días.',
  },
];

const ProfessionalHistory: React.FC = () => {
  const [history] = useState<ConsultationRecord[]>(mockConsultationHistory);
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

      return patientMatch && statusMatch;
    });
  }, [history, searchPatient, statusFilter]);

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
        <div className="prof-history-table-footer">
          <span className="footer-pagination-info">
            Mostrando {paginatedRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} a{' '}
            {Math.min(currentPage * pageSize, filteredRecords.length)} de {filteredRecords.length}{' '}
            registros
          </span>

          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`pagination-btn${pageNum === currentPage ? ' pagination-btn--active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
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
