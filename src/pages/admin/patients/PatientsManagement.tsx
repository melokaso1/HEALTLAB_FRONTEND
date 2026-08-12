import React, { useState } from 'react';
import {
  Search,
  Plus,
  X,
  CalendarPlus,
  Edit,
  Phone,
  HeartPulse,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreVertical,
} from 'lucide-react';
import type { Patient, GenderType } from '../../../types/patient.types';
import { mockPatients } from '../../../services/patients.service';
import './PatientsManagement.css';

const PatientsManagement: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [activePatientId, setActivePatientId] = useState<number | null>(1); // Maria Rodriguez open by default
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [activeTab, setActiveTab] = useState<'Resumen' | 'Historial' | 'Notas'>('Resumen');
  const [newNoteText, setNewNoteText] = useState('');

  // Modal State for New Patient
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAddNote = (patientId: number) => {
    if (!newNoteText.trim()) return;

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const newNote = {
            id: Date.now(),
            date: 'Hoy',
            author: 'Director Médico',
            text: newNoteText.trim(),
          };
          return {
            ...p,
            notes: [newNote, ...p.notes],
          };
        }
        return p;
      })
    );

    setNewNoteText('');
    showToast('Nota médica agregada correctamente');
  };

  // Form State for New Patient
  const [newName, setNewName] = useState('');
  const [newDocType, setNewDocType] = useState<'CC' | 'CE' | 'TI' | 'PAS'>('CC');
  const [newDocNum, setNewDocNum] = useState('');
  const [newGender, setNewGender] = useState<GenderType>('Femenino');
  const [newAge, setNewAge] = useState<number | ''>(30);
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBloodType, setNewBloodType] = useState('O+');
  const [newAllergies, setNewAllergies] = useState('Ninguna');

  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleTogglePanel = (patientId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePatientId === patientId) {
      setActivePatientId(null);
    } else {
      setActivePatientId(patientId);
    }
  };

  const handleClosePanel = () => {
    setActivePatientId(null);
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDocNum.trim()) {
      showToast('Por favor completa el nombre y número de documento');
      return;
    }

    const initials = newName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newPatient: Patient = {
      id: Date.now(),
      name: newName,
      gender: newGender,
      age: Number(newAge) || 30,
      documentType: newDocType,
      documentNumber: newDocNum,
      contact: {
        phone: newPhone || '+57 300 000 0000',
        email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '')}@email.com`,
        address: newAddress || 'Dirección no registrada',
      },
      lastVisitDate: 'Hoy',
      lastVisitSpecialty: 'Medicina General',
      specialtyBadgeColor: 'green',
      status: 'active',
      initials: initials,
      avatarBg: '#0A9396',
      medicalData: {
        bloodType: newBloodType,
        allergies: newAllergies ? newAllergies.split(',').map((a) => a.trim()) : ['Ninguna'],
      },
      recentActivity: [
        {
          id: Date.now() + 1,
          title: 'Apertura de Expediente',
          date: 'Hoy',
          note: 'Paciente registrado en el sistema.',
          category: 'consulta',
        },
      ],
      history: [],
      notes: [],
    };

    setPatients([newPatient, ...patients]);
    setActivePatientId(newPatient.id);
    setIsCreateModalOpen(false);
    setNewName('');
    setNewDocNum('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    showToast(`Paciente ${newPatient.name} creado exitosamente`);
  };

  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      p.documentNumber.includes(term) ||
      p.contact.email.toLowerCase().includes(term) ||
      p.contact.phone.includes(term);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.status === 'active') ||
      (statusFilter === 'inactive' && p.status === 'inactive');

    return matchesSearch && matchesStatus;
  });

  const renderSpecialtyBadge = (specialty: string) => {
    const isDermatology = specialty.toLowerCase().includes('derm');
    const badgeClass = isDermatology
      ? 'specialty-badge specialty-badge--purple'
      : 'specialty-badge specialty-badge--green';
    return <span className={badgeClass}>{specialty}</span>;
  };

  return (
    <div className="patients-mgmt">
      {/* Header & Controls Row (Identical Layout to UsersManagement) */}
      <div className="patients-mgmt__header-row">
        <div className="patients-mgmt__title-group">
          <h1 className="patients-mgmt__title">Gestión de Pacientes</h1>
          <p className="patients-mgmt__subtitle">
            Administre los expedientes e historial clínico de los pacientes de la clínica.
          </p>
        </div>

        <div className="patients-mgmt__filters">
          {/* Search Input */}
          <div className="patients-mgmt__search-box">
            <Search size={16} className="patients-mgmt__search-icon" />
            <input
              type="text"
              className="patients-mgmt__search-input"
              placeholder="Buscar paciente por nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter Dropdown */}
          <select
            className="patients-mgmt__select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="active">Estado: Activos</option>
            <option value="inactive">Estado: Inactivos</option>
            <option value="all">Estado: Todos</option>
          </select>

          {/* Add Patient Button */}
          <button
            type="button"
            className="patients-mgmt__btn-add"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} />
            <span>Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* Grid Layout (Table Left / Patient Details Panel Right) */}
      <div className={`patients-mgmt__grid${activePatientId !== null ? ' patients-mgmt__grid--with-panel' : ''}`}>
        {/* Left Column: Table */}
        <div className="patients-card">
          <div className="patients-table__wrapper">
            <table className="patients-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>PACIENTE</th>
                  <th>ID / DOCUMENTO</th>
                  <th>CONTACTO</th>
                  <th>ÚLTIMA VISITA</th>
                  <th style={{ textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="patients-table__empty">
                      No se encontraron pacientes con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient, idx) => {
                    const isPanelOpen = patient.id === activePatientId;
                    return (
                      <tr
                        key={patient.id}
                        className={isPanelOpen ? 'patients-table__row--selected' : ''}
                      >
                        <td className="patients-table__index">{idx + 1}</td>
                        <td>
                          <div className="patient-identity">
                            <div
                              className="patient-avatar"
                              style={{ backgroundColor: patient.avatarBg || '#0A9396' }}
                            >
                              {patient.initials}
                            </div>
                            <div className="patient-identity__info">
                              <span className="patient-identity__name">{patient.name}</span>
                              <span className="patient-identity__sub">
                                {patient.gender}, {patient.age} años
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="patient-doc-cell">
                            {patient.documentType}-{patient.documentNumber}
                          </span>
                        </td>
                        <td>
                          <div className="patient-contact-cell">
                            <span className="patient-contact-phone">{patient.contact.phone}</span>
                            <span className="patient-contact-email">{patient.contact.email}</span>
                          </div>
                        </td>
                        <td>
                          <div className="patient-visit-cell">
                            <span className="patient-visit-date">{patient.lastVisitDate}</span>
                            {renderSpecialtyBadge(patient.lastVisitSpecialty)}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="patients-table__actions" style={{ justifyContent: 'center' }}>
                            <button
                              type="button"
                              className={`action-btn${isPanelOpen ? ' action-btn--active' : ''}`}
                              title="Ver detalle del paciente"
                              onClick={(e) => handleTogglePanel(patient.id, e)}
                            >
                              <MoreVertical size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="patients-table__footer">
            <span>
              Mostrando 1 - {filteredPatients.length} de {patients.length} pacientes
            </span>
            <div className="pagination-controls">
              <button type="button" className="pagination-btn" disabled>
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="pagination-btn pagination-btn--active">
                1
              </button>
              <button type="button" className="pagination-btn">
                2
              </button>
              <button type="button" className="pagination-btn">
                3
              </button>
              <span style={{ fontSize: '12px', color: '#94A3B8', padding: '0 4px' }}>...</span>
              <button type="button" className="pagination-btn">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Panel: Patient Detail Panel */}
        {activePatientId !== null && activePatient && (
          <div className="patients-card patient-detail-panel">
            {/* Header / Close Button */}
            <div className="patient-detail__top">
              <button
                type="button"
                className="patient-detail__close-btn"
                onClick={handleClosePanel}
                title="Cerrar detalle"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Avatar & Name */}
            <div className="patient-detail__header-info">
              <div
                className="patient-detail__avatar"
                style={{ backgroundColor: activePatient.avatarBg || '#0A9396' }}
              >
                {activePatient.initials}
              </div>
              <h2 className="patient-detail__name">{activePatient.name}</h2>
              <span className="patient-detail__doc">
                ID: {activePatient.documentType}-{activePatient.documentNumber}
              </span>

              {/* Action Buttons Row */}
              <div className="patient-detail__actions">
                <button type="button" className="btn-agendar">
                  <CalendarPlus size={14} />
                  <span>Agendar</span>
                </button>
                <button type="button" className="btn-editar">
                  <Edit size={14} />
                  <span>Editar</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="patient-detail__tabs">
              <button
                type="button"
                className={`patient-detail__tab-btn${activeTab === 'Resumen' ? ' patient-detail__tab-btn--active' : ''}`}
                onClick={() => setActiveTab('Resumen')}
              >
                Resumen
              </button>
              <button
                type="button"
                className={`patient-detail__tab-btn${activeTab === 'Historial' ? ' patient-detail__tab-btn--active' : ''}`}
                onClick={() => setActiveTab('Historial')}
              >
                Historial
              </button>
              <button
                type="button"
                className={`patient-detail__tab-btn${activeTab === 'Notas' ? ' patient-detail__tab-btn--active' : ''}`}
                onClick={() => setActiveTab('Notas')}
              >
                Notas
              </button>
            </div>

            {/* Tab Body */}
            <div className="patient-detail__body">
              {activeTab === 'Resumen' && (
                <>
                  {/* INFORMACIÓN DE CONTACTO */}
                  <div className="detail-section">
                    <div className="detail-section__header">
                      <Phone size={14} className="detail-section__icon" />
                      <span>INFORMACIÓN DE CONTACTO</span>
                    </div>
                    <div className="detail-info-list">
                      <div className="detail-info-item">
                        <span className="detail-info-label">Teléfono:</span>
                        <span className="detail-info-value">{activePatient.contact.phone}</span>
                      </div>
                      <div className="detail-info-item">
                        <span className="detail-info-label">Email:</span>
                        <span className="detail-info-value detail-info-value--email">
                          {activePatient.contact.email}
                        </span>
                      </div>
                      <div className="detail-info-item">
                        <span className="detail-info-label">Dirección:</span>
                        <span className="detail-info-value">{activePatient.contact.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* DATOS MÉDICOS */}
                  <div className="detail-section">
                    <div className="detail-section__header">
                      <HeartPulse size={14} className="detail-section__icon" />
                      <span>DATOS MÉDICOS</span>
                    </div>
                    <div className="medical-data-grid">
                      <div className="medical-data-card">
                        <span className="medical-data-label">Tipo de Sangre</span>
                        <span className="medical-data-val medical-data-val--blood">
                          {activePatient.medicalData.bloodType}
                        </span>
                      </div>
                      <div className="medical-data-card">
                        <span className="medical-data-label">Alergias</span>
                        <span className="medical-data-val medical-data-val--allergies">
                          {activePatient.medicalData.allergies.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVIDAD RECIENTE */}
                  <div className="detail-section">
                    <div className="detail-section__header">
                      <Clock size={14} className="detail-section__icon" />
                      <span>ACTIVIDAD RECIENTE</span>
                    </div>
                    <div className="activity-timeline">
                      {activePatient.recentActivity.length === 0 ? (
                        <p style={{ fontSize: '12px', color: '#64748B' }}>
                          No hay actividad reciente registrada.
                        </p>
                      ) : (
                        activePatient.recentActivity.map((act) => (
                          <div key={act.id} className="timeline-item">
                            <div className="timeline-dot" />
                            <div className="timeline-content">
                              <span className="timeline-title">{act.title}</span>
                              <span className="timeline-sub">
                                {act.date} {act.doctor ? `- ${act.doctor}` : ''}
                              </span>
                              {act.note && (
                                <div className="timeline-note-box">{act.note}</div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'Historial' && (
                <div className="detail-section">
                  <div className="detail-section__header">
                    <Clock size={14} className="detail-section__icon" />
                    <span>HISTORIAL DE CONSULTAS ({activePatient.history.length})</span>
                  </div>
                  {activePatient.history.length === 0 ? (
                    <div className="empty-tab-state">
                      <p style={{ margin: 0 }}>Sin historial de consultas previas.</p>
                    </div>
                  ) : (
                    <div className="history-list">
                      {activePatient.history.map((h) => (
                        <div key={h.id} className="history-card">
                          <div className="history-card__top">
                            <span className="history-card__date">{h.date}</span>
                            {renderSpecialtyBadge(h.specialty)}
                          </div>
                          <div className="history-card__doctor">
                            <span>Atendido por: <strong>{h.doctor}</strong></span>
                          </div>
                          <div className="history-card__diag-box">
                            <span className="history-card__diag-label">Diagnóstico / Motivo</span>
                            <p className="history-card__diag-text">{h.diagnosis}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Notas' && (
                <div className="detail-section">
                  <div className="detail-section__header">
                    <FileText size={14} className="detail-section__icon" />
                    <span>NOTAS MÉDICAS ({activePatient.notes.length})</span>
                  </div>

                  {/* Formulario Agregar Nota */}
                  <div className="add-note-box">
                    <textarea
                      className="add-note-input"
                      placeholder="Escribir una nota médica sobre el paciente..."
                      rows={2}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-add-note"
                      onClick={() => handleAddNote(activePatient.id)}
                    >
                      <span>Agregar Nota</span>
                    </button>
                  </div>

                  {activePatient.notes.length === 0 ? (
                    <div className="empty-tab-state">
                      <p style={{ margin: 0 }}>Sin notas médicas registradas.</p>
                    </div>
                  ) : (
                    <div className="notes-list">
                      {activePatient.notes.map((n) => (
                        <div key={n.id} className="note-card">
                          <div className="note-card__header">
                            <span className="note-card__author">{n.author}</span>
                            <span className="note-card__date">{n.date}</span>
                          </div>
                          <p className="note-card__text">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create New Patient */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nuevo Paciente</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePatient}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Maria Rodriguez"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Tipo Doc.</label>
                    <select
                      className="patients-mgmt__select"
                      style={{ width: '100%' }}
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value as 'CC' | 'CE' | 'TI' | 'PAS')}
                    >
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="TI">TI</option>
                      <option value="PAS">PAS</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Número de Documento</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="1029384756"
                      value={newDocNum}
                      onChange={(e) => setNewDocNum(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Sexo</label>
                    <select
                      className="patients-mgmt__select"
                      style={{ width: '100%' }}
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value as GenderType)}
                    >
                      <option value="Femenino">Femenino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Edad</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="34"
                      value={newAge}
                      onChange={(e) => setNewAge(e.target.value ? Number(e.target.value) : '')}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+57 300 123 4567"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="mrodriguez@email.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Calle 123 #45-67"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Tipo de Sangre</label>
                    <select
                      className="patients-mgmt__select"
                      style={{ width: '100%' }}
                      value={newBloodType}
                      onChange={(e) => setNewBloodType(e.target.value)}
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alergias</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej. Penicilina, Sulfa"
                      value={newAllergies}
                      onChange={(e) => setNewAllergies(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && <div className="toast-msg">{toastMessage}</div>}
    </div>
  );
};

export default PatientsManagement;
