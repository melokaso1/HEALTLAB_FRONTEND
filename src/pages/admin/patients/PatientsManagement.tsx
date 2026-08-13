import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  X,
  CalendarPlus,
  Edit2,
  Phone,
  HeartPulse,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreVertical,
  RotateCcw,
} from 'lucide-react';
import type { Patient, GenderType } from '../../../types/patient.types';
import {
  mockPatients,
  getPatientsApi,
  createPatientApi,
  updatePatientApi,
  togglePatientStatusApi,
  addPatientNoteApi,
} from '../../../services/patients.service';
import { useAuth } from '../../../context/AuthContext';
import './PatientsManagement.css';

/* SVG Trash / Delete Icon */
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    height="18px"
    viewBox="0 -960 960 960"
    width="18px"
    fill="currentColor"
  >
    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
  </svg>
);

const PatientsManagement: React.FC = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'professional' || (user?.role as string) === 'medico' || (user?.role as string) === 'profesional';

  const [patients, setPatients] = useState<Patient[]>(mockPatients);

  useEffect(() => {
    getPatientsApi().then((data) => {
      if (data && data.length > 0) {
        setPatients(data);
      }
    });
  }, []);
  const [activePatientId, setActivePatientId] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [activeTab, setActiveTab] = useState<'Resumen' | 'Historial' | 'Notas'>('Resumen');
  const [newNoteText, setNewNoteText] = useState('');

  // Modal State for New Patient
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Patient State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editTargetPatient, setEditTargetPatient] = useState<Patient | null>(null);
  const [editName, setEditName] = useState('');
  const [editDocType, setEditDocType] = useState<'CC' | 'CE' | 'TI' | 'PAS'>('CC');
  const [editDocNum, setEditDocNum] = useState('');
  const [editGender, setEditGender] = useState<GenderType>('Femenino');
  const [editAge, setEditAge] = useState<number | ''>(30);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBloodType, setEditBloodType] = useState('O+');
  const [editAllergies, setEditAllergies] = useState('Ninguna');

  const handleAddNote = (patientId: string | number) => {
    if (!newNoteText.trim()) return;

    const notePayload = {
      author: user?.name || (isDoctor ? 'Dr. Julian Moore' : 'Director Médico'),
      text: newNoteText.trim(),
    };

    addPatientNoteApi(patientId, notePayload);

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const newNote = {
            id: Date.now(),
            date: 'Hoy',
            author: notePayload.author,
            text: notePayload.text,
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
    showToast('Nota clínica agregada correctamente');
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

  const activePatient = activePatientId !== null ? (patients.find((p) => p.id === activePatientId) || null) : null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleDeletePatient = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await togglePatientStatusApi(id, 'active');
      const fresh = await getPatientsApi();
      if (fresh && fresh.length > 0) {
        setPatients(fresh);
      } else {
        setPatients((prev) =>
          prev.map((patient) =>
            patient.id === id ? { ...patient, status: 'inactive' } : patient
          )
        );
      }
      showToast('Paciente deshabilitado y movido al archivo');
    } catch (error) {
      console.error('[PatientsManagement] Error al cambiar estado del paciente:', error);
      showToast('Error al actualizar el paciente en el servidor');
    }
  };

  const handleReactivatePatient = async (id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await togglePatientStatusApi(id, 'inactive');
      const fresh = await getPatientsApi();
      if (fresh && fresh.length > 0) {
        setPatients(fresh);
      } else {
        setPatients((prev) =>
          prev.map((patient) =>
            patient.id === id ? { ...patient, status: 'active' } : patient
          )
        );
      }
      setActivePatientId(id);
      setIsCreateModalOpen(false);
      showToast('Paciente reactivado exitosamente');
    } catch (error) {
      console.error('[PatientsManagement] Error al reactivar paciente:', error);
      showToast('Error al reactivar el paciente en el servidor');
    }
  };

  const handleOpenEditPatient = (patient: Patient, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditTargetPatient(patient);
    setEditName(patient.name);
    setEditDocType(patient.documentType);
    setEditDocNum(patient.documentNumber);
    setEditGender(patient.gender);
    setEditAge(patient.age);
    setEditPhone(patient.contact.phone);
    setEditEmail(patient.contact.email);
    setEditAddress(patient.contact.address);
    setEditBloodType(patient.medicalData.bloodType);
    setEditAllergies(patient.medicalData.allergies.join(', '));
    setIsEditModalOpen(true);
  };

  const handleSaveEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTargetPatient) return;

    try {
      await updatePatientApi(editTargetPatient.id, {
        name: editName,
        documentType: editDocType,
        documentNumber: editDocNum,
        gender: editGender,
        age: Number(editAge) || 30,
      });

      const fresh = await getPatientsApi();
      if (fresh && fresh.length > 0) {
        setPatients(fresh);
      }

      setIsEditModalOpen(false);
      showToast(`Información de ${editName} actualizada exitosamente`);
    } catch (error) {
      console.error('[PatientsManagement] Error al guardar edicion de paciente:', error);
      showToast('Error al actualizar la información del paciente');
    }
  };

  const handleTogglePanel = (patientId: string | number, e: React.MouseEvent) => {
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

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDocNum.trim()) {
      showToast('Por favor completa el nombre y número de documento');
      return;
    }

    try {
      const created = await createPatientApi({
        name: newName,
        gender: newGender,
        age: Number(newAge) || 30,
        documentType: newDocType,
        documentNumber: newDocNum,
        contact: {
          phone: newPhone || '+57 300 000 0000',
          email: newEmail,
          address: newAddress,
        },
        medicalData: {
          bloodType: newBloodType,
          allergies: newAllergies ? newAllergies.split(',').map((a) => a.trim()) : ['Ninguna'],
        },
      });

      const fresh = await getPatientsApi();
      if (fresh && fresh.length > 0) {
        setPatients(fresh);
      } else {
        setPatients((prev) => [created, ...prev]);
      }

      setActivePatientId(created.id);
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDocNum('');
      setNewPhone('');
      setNewEmail('');
      setNewAddress('');
      showToast(`Paciente ${created.name || newName} creado exitosamente`);
    } catch (error) {
      console.error('[PatientsManagement] Error al crear paciente:', error);
      showToast('Error al registrar el paciente en el servidor. Intente nuevamente.');
    }
  };

  // Check if any deactivated patients match current create modal input
  const deactivatedMatches = patients.filter((p) => {
    if (p.status !== 'inactive') return false;

    const nameInput = newName.toLowerCase().trim();
    const docInput = newDocNum.toLowerCase().trim();
    const emailInput = newEmail.toLowerCase().trim();

    if (!nameInput && !docInput && !emailInput) return false;

    const patientNameLower = p.name.toLowerCase().trim();
    const patientDocLower = p.documentNumber.toLowerCase().trim();
    const patientEmailLower = p.contact.email.toLowerCase().trim();

    const isExactName = nameInput !== '' && nameInput === patientNameLower;
    const isExactDoc = docInput !== '' && docInput === patientDocLower;
    const isExactEmail = emailInput !== '' && emailInput === patientEmailLower;

    return isExactName || isExactDoc || isExactEmail;
  });

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
          <h1 className="patients-mgmt__title">
            {isDoctor ? 'Mis Pacientes' : 'Gestión de Pacientes'}
          </h1>
          <p className="patients-mgmt__subtitle">
            {isDoctor
              ? 'Directorio de pacientes atendidos en sus consultas médicas e historial de atención.'
              : 'Administre los expedientes e historial clínico de los pacientes de la clínica.'}
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
            <option value="inactive">Estado: Inactivos / Eliminados</option>
            <option value="all">Estado: Todos</option>
          </select>

          {/* Add Patient Button - HIdden for Doctor role */}
          {!isDoctor && (
            <button
              type="button"
              className="patients-mgmt__btn-add"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              <span>Nuevo Paciente</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout (Table Left / Patient Details Panel Right) */}
      <div className={`patients-mgmt__grid${activePatientId !== null && activePatient !== null ? ' patients-mgmt__grid--with-panel' : ''}`}>
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
                            {!isDoctor && (
                              patient.status === 'active' ? (
                                <button
                                  type="button"
                                  className="trash-btn"
                                  title="Desactivar / Eliminar paciente"
                                  onClick={(e) => handleDeletePatient(patient.id, e)}
                                >
                                  <TrashIcon className="trash-btn__icon" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="reactivate-icon-btn"
                                  title="Reactivar paciente"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReactivatePatient(patient.id);
                                  }}
                                >
                                  <RotateCcw size={15} />
                                  <span>Reactivar</span>
                                </button>
                              )
                            )}
                            {!isDoctor && (
                              <button
                                type="button"
                                className="action-btn"
                                title="Editar paciente"
                                onClick={(e) => handleOpenEditPatient(patient, e)}
                              >
                                <Edit2 size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              className={`action-btn${isPanelOpen ? ' action-btn--active' : ''}`}
                              title="Ver detalle del paciente (solo lectura)"
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
              Mostrando {filteredPatients.length > 0 ? 1 : 0} - {filteredPatients.length} de{' '}
              {patients.filter((p) => statusFilter === 'all' || p.status === statusFilter).length} pacientes
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
                <button
                  type="button"
                  className="btn-editar"
                  onClick={(e) => handleOpenEditPatient(activePatient, e)}
                >
                  <Edit2 size={14} />
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
                {/* Deactivated Patients Prompt */}
                {deactivatedMatches.length > 0 && (
                  <div className="deactivated-restore-section">
                    <span className="deactivated-restore-section-title">
                      ¡Pacientes desactivados previamente encontrados ({deactivatedMatches.length})!
                    </span>
                    <div className="deactivated-restore-list">
                      {deactivatedMatches.map((match) => (
                        <div key={match.id} className="deactivated-restore-card">
                          <div className="deactivated-restore-info">
                            <span className="deactivated-restore-title">{match.name}</span>
                            <span className="deactivated-restore-desc">
                              {match.documentType}-{match.documentNumber} • {match.contact.email}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn-reactivate"
                            onClick={() => handleReactivatePatient(match.id)}
                          >
                            <RotateCcw size={13} />
                            <span>Reactivar</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

      {/* Modal: Edit Patient */}
      {isEditModalOpen && editTargetPatient && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Información de Paciente</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEditPatient}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Tipo Doc.</label>
                    <select
                      className="patients-mgmt__select"
                      style={{ width: '100%' }}
                      value={editDocType}
                      onChange={(e) => setEditDocType(e.target.value as 'CC' | 'CE' | 'TI' | 'PAS')}
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
                      value={editDocNum}
                      onChange={(e) => setEditDocNum(e.target.value)}
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
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value as GenderType)}
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
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value ? Number(e.target.value) : '')}
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
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Tipo de Sangre</label>
                    <select
                      className="patients-mgmt__select"
                      style={{ width: '100%' }}
                      value={editBloodType}
                      onChange={(e) => setEditBloodType(e.target.value)}
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
                      value={editAllergies}
                      onChange={(e) => setEditAllergies(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Actualizar Paciente
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
