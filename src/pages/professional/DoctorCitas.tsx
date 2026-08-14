import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Stethoscope,
  Pill,
  BookOpen,
  CheckCircle2,
  User,
  Activity,
  Lock,
} from 'lucide-react';
import type { Appointment, AppointmentStatus } from '../../types/appointment.types';
import {
  getAppointmentsApi,
  updateAppointmentStatusApi,
} from '../../services/appointments.service';
import { useAuth } from '../../context/AuthContext';
import { saveAppointmentNote } from '../../services/appointmentNotes.service';
import './DoctorCitas.css';

// Hourly timetable slots (matching screenshot layout)
const TIME_SLOTS_TIMETABLE = [
  { hour: 7, label: '7:00 a. m.' },
  { hour: 8, label: '8:00 a. m.' },
  { hour: 9, label: '9:00 a. m.' },
  { hour: 10, label: '10:00 a. m.' },
  { hour: 11, label: '11:00 a. m.' },
  { hour: 12, label: '12:00 p. m.' },
  { hour: 13, label: '1:00 p. m.' },
  { hour: 14, label: '2:00 p. m.' },
  { hour: 15, label: '3:00 p. m.' },
  { hour: 16, label: '4:00 p. m.' },
  { hour: 17, label: '5:00 p. m.' },
  { hour: 18, label: '6:00 p. m.' },
];

// Common CIE-10 Options
const CIE10_OPTIONS = [
  { value: 'J00', label: 'J00 - Nasofaringitis aguda (resfriado común)' },
  { value: 'J02.9', label: 'J02.9 - Faringitis aguda, no especificada' },
  { value: 'J20.9', label: 'J20.9 - Bronquitis aguda, no especificada' },
  { value: 'I10', label: 'I10 - Hipertensión esencial (primaria)' },
  { value: 'E11', label: 'E11 - Diabetes mellitus tipo 2' },
  { value: 'K29.7', label: 'K29.7 - Gastritis, no especificada' },
  { value: 'R50.9', label: 'R50.9 - Fiebre, no especificada' },
  { value: 'M54.5', label: 'M54.5 - Lumbago no especificado' },
  { value: 'R51', label: 'R51 - Cefalea / Dolor de cabeza' },
  { value: 'Otro', label: 'Otro código CIE-10' },
];

const DoctorCitas: React.FC = () => {
  // Data States
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Set default selected appointment ID to 1 ("Carlos Eduardo Mendoza") so the form is populated on page load
  const [selectedAppId, setSelectedAppId] = useState<number | string | null>(null);

  // Time Filter Mode: 'upcoming' (reads current PC hour) vs 'all'
  const [timeFilterMode, setTimeFilterMode] = useState<'upcoming' | 'all'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  // Clinical Form Fields (Pre-populated by default with rich mock data)
  const [sintomas, setSintomas] = useState('Paciente refiere cefalea intensa holocraneana de 24 horas de evolución, acompañada de malestar general, astenia y febrícula (37.8 °C). No presenta tos ni disnea.');
  const [resumenConsulta, setResumenConsulta] = useState('Paciente masculino de 34 años en aceptables condiciones generales. Orientado en tiempo, espacio y persona. Presión arterial: 125/82 mmHg, Frecuencia cardíaca: 76 bpm, Temperatura: 37.5 °C. Auscultación cardiopulmonar normal. Faringe levemente congestiva sin exudados.');
  
  // Tratamiento
  const [tratamientoNombre, setTratamientoNombre] = useState('Amoxicilina 500mg cápsulas + Paracetamol 500mg');
  const [tratamientoDescripcion, setTratamientoDescripcion] = useState('Antibiótico bactericida de amplio espectro y analgésico antipirético.');
  const [tratamientoDosis, setTratamientoDosis] = useState('1 cápsula / tableta (500 mg)');
  const [tratamientoFrecuencia, setTratamientoFrecuencia] = useState('Cada 8 horas (3 veces al día)');
  const [tratamientoDuracion, setTratamientoDuracion] = useState('7 días consecutivos');
  const [tratamientoIndicaciones, setTratamientoIndicaciones] = useState('Ingerir con abundante agua después de las comidas principales. No suspender el esquema médico antes del periodo indicado.');

  // Diagnóstico
  const [cie10Codigo, setCie10Codigo] = useState('J00');
  const [customCie10, setCustomCie10] = useState('');
  const [cie10Descripcion, setCie10Descripcion] = useState('J00 - Nasofaringitis aguda (resfriado común) con síndrome febril leve de evolución favorable.');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const loadAppointments = async () => {
      const data = await getAppointmentsApi();
      const today = new Date();
      const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const doctorAppointments = data.filter((appointment) =>
        appointment.date === todayIso &&
        (!user?.medicoId || String(appointment.professionalId) === user.medicoId),
      );
      setAppointments(doctorAppointments);
      setSelectedAppId(doctorAppointments[0]?.id ?? null);
    };
    void loadAppointments();
  }, [user?.medicoId]);

  // READ CURRENT HOUR DYNAMICALLY FROM PC SYSTEM TIME
  const pcCurrentHour = new Date().getHours();

  // Helper to extract integer hour from appointment time string (e.g. "1:00 p. m." -> 13, "10:00 a. m." -> 10)
  const extractHourInt = (timeStr: string): number => {
    if (!timeStr) return 8;
    const cleanStr = timeStr.trim().toUpperCase();
    const isPM = cleanStr.includes('P. M.') || cleanStr.includes('PM') || cleanStr.includes('P.M.');
    const numbersOnly = cleanStr.replace(/[^\d:]/g, '');
    const parts = numbersOnly.split(':');
    let h = parseInt(parts[0], 10) || 8;
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h;
  };

  // Visible Hour Timetable Slots based on PC Time
  const visibleHourSlots = useMemo(() => {
    if (timeFilterMode === 'all') {
      return TIME_SLOTS_TIMETABLE;
    }
    // Filter hours from current PC hour onwards (e.g., if PC is 13:00, show slots from 13 to 18)
    const filtered = TIME_SLOTS_TIMETABLE.filter((slot) => slot.hour >= pcCurrentHour);
    return filtered.length > 0 ? filtered : TIME_SLOTS_TIMETABLE;
  }, [timeFilterMode, pcCurrentHour]);

  // Selected Appointment Object
  const selectedAppointment = useMemo(() => {
    if (!selectedAppId) return appointments[0] || null;
    return appointments.find((a) => String(a.id) === String(selectedAppId)) || appointments[0] || null;
  }, [appointments, selectedAppId]);

  // Determine if Form is Locked (when status is 'Atendida')
  const isFormLocked = selectedAppointment?.status === 'Atendida';

  // Update Form fields when selected appointment changes
  const handleSelectAppointment = (app: Appointment) => {
    setSelectedAppId(app.id);
    setSintomas(app.notes || `Paciente refiere malestar general y dolor en consulta de ${app.serviceName}.`);
    setResumenConsulta(`Evaluación clínica realizada a ${app.patientName}. Signos vitales normales. Paciente clínicamente estable.`);
    setTratamientoNombre(`Tratamiento indicado para ${app.serviceName}`);
    setTratamientoDescripcion('Medicamento prescrito según protocolo médico.');
    setTratamientoDosis('1 dosis cada 8 horas');
    setTratamientoFrecuencia('Cada 8 horas (3 veces al día)');
    setTratamientoDuracion('7 días');
    setTratamientoIndicaciones('Tomar con alimentos. Mantener hidratación adecuada.');
    setCie10Codigo('J00');
    setCie10Descripcion(`Diagnóstico preliminar para ${app.serviceName}`);
  };

  // Submit Consultation Form (Locks Form upon Completion)
  const handleFinishConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      await updateAppointmentStatusApi(selectedAppointment.id, 'Atendida');
      let completedAppointment: Appointment | undefined;
      setAppointments((prev) =>
        prev.map((a) =>
          String(a.id) === String(selectedAppointment.id)
            ? (completedAppointment = {
                ...a,
                status: 'Atendida',
                notes: `[SÍNTOMAS]: ${sintomas} | [CIE-10 ${cie10Codigo}]: ${cie10Descripcion}`,
              })
            : a
        )
      );
      if (completedAppointment) saveAppointmentNote(completedAppointment);

      showToast(`🔒 Consulta clínica guardada y bloqueada de forma oficial.`);
    } catch (err) {
      showToast('Error al guardar la consulta médica.');
    }
  };

  const handleSaveDraft = () => {
    showToast('Borrador de la consulta médica guardado correctamente.');
  };

  // Render Status Badge
  const renderStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'Agendada':
        return <span className="doc-status-badge doc-status-badge--agendada">● Agendada</span>;
      case 'Atendida':
        return <span className="doc-status-badge doc-status-badge--atendida">● Atendida</span>;
      case 'Cancelada':
        return <span className="doc-status-badge doc-status-badge--cancelada">● Cancelada</span>;
      case 'No asistió':
        return <span className="doc-status-badge doc-status-badge--no-asistio">● No asistió</span>;
      default:
        return <span className="doc-status-badge">{status}</span>;
    }
  };

  return (
    <div className="doc-consultas-view">
      {/* Header Bar */}
      <div className="doc-consultas-header">
        <div className="doc-consultas-title-group">
          <h1 className="doc-consultas-title">Atención de Consultas Médicas</h1>
          <p className="doc-consultas-subtitle">
            Seleccione la cita médica en el horario del día para abrir y llenar el formulario clínico del paciente.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="doc-consultas-grid">
        
        {/* Left Column: Timetable Schedule Table */}
        <div className="doc-consultas-card doc-timetable-panel">
          <div className="doc-timetable-header">
            <div className="doc-timetable-header__top">
              <h2 className="doc-timetable-header__title">Citas de Hoy</h2>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className={`doc-timetable-filter-btn${timeFilterMode === 'upcoming' ? ' doc-timetable-filter-btn--active' : ''}`}
                  onClick={() => setTimeFilterMode('upcoming')}
                  title="Filtrar horas desde la hora actual del PC"
                >
                  Desde hora actual
                </button>
                <button
                  type="button"
                  className={`doc-timetable-filter-btn${timeFilterMode === 'all' ? ' doc-timetable-filter-btn--active' : ''}`}
                  onClick={() => setTimeFilterMode('all')}
                >
                  Todas las horas
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="doc-timetable-search">
              <Search size={14} color="#94A3B8" />
              <input
                type="text"
                className="doc-timetable-search-input"
                placeholder="Buscar por paciente o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Timetable Schedule Table */}
          <div className="doc-timetable-wrapper">
            <table className="doc-timetable-table">
              <thead>
                <tr>
                  <th className="th-hora">HORA</th>
                  <th>CITAS DE HOY</th>
                </tr>
              </thead>
              <tbody>
                {visibleHourSlots.map((slot) => {
                  const matchingApps = appointments.filter((app) => {
                    const appHour = extractHourInt(app.time);
                    if (appHour !== slot.hour) return false;

                    const q = searchTerm.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      app.patientName.toLowerCase().includes(q) ||
                      (app.patientDoc && app.patientDoc.includes(q)) ||
                      app.serviceName.toLowerCase().includes(q)
                    );
                  });

                  return (
                    <tr key={`slot-${slot.hour}`}>
                      <td className="td-hora">{slot.label}</td>
                      <td className="td-citas">
                        {matchingApps.length === 0 ? (
                          <div className="doc-slot-empty">Sin citas agendadas</div>
                        ) : (
                          matchingApps.map((app) => {
                            const isSelected = selectedAppointment && String(selectedAppointment.id) === String(app.id);
                            return (
                              <div
                                key={app.id}
                                className={`doc-slot-card${isSelected ? ' doc-slot-card--selected' : ''}`}
                                onClick={() => handleSelectAppointment(app)}
                              >
                                <div className="doc-slot-card__top">
                                  <span className="doc-slot-patient-name">{app.patientName}</span>
                                  {renderStatusBadge(app.status)}
                                </div>
                                <div className="doc-slot-service">
                                  DNI: {app.patientDoc || '1098472635'} • {app.serviceName}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Clinical Consultation Form */}
        <div className="doc-consultas-card doc-form-panel">
          {selectedAppointment ? (
            <form onSubmit={handleFinishConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Patient Banner */}
              <div className="doc-patient-banner">
                <div className="doc-patient-banner__info">
                  <div className="doc-patient-avatar">
                    {selectedAppointment.patientInitials || 'CM'}
                  </div>
                  <div>
                    <h2 className="doc-patient-name-title">{selectedAppointment.patientName}</h2>
                    <p className="doc-patient-sub-details">
                      DNI: <strong>{selectedAppointment.patientDoc || '1098472635'}</strong> • Cita: <strong>{selectedAppointment.time}</strong> • {selectedAppointment.serviceName}
                    </p>
                  </div>
                </div>

                <div className="doc-patient-status-chip">
                  Estado: {selectedAppointment.status} {isFormLocked && '🔒'}
                </div>
              </div>

              {/* Locked State Warning Banner */}
              {isFormLocked && (
                <div className="doc-locked-banner">
                  <Lock size={18} />
                  <span>
                    <strong>Consulta Médica Guardada y Bloqueada:</strong> Esta historia clínica ha sido finalizada de forma oficial. Todos los campos están bloqueados para proteger el registro médico del paciente.
                  </span>
                </div>
              )}

              {/* SECCIÓN 1: NOTA CLÍNICA / SÍNTOMAS */}
              <div className="doc-clinical-section">
                <h3 className="doc-section-title">
                  <div className="doc-section-icon">
                    <Stethoscope size={16} />
                  </div>
                  <span>1. Nota Clínica / Síntomas que Padece el Paciente</span>
                </h3>

                <div className="doc-form-group">
                  <label className="doc-field-label">
                    Síntomas expresados y motivo de consulta:
                  </label>
                  <textarea
                    className="doc-textarea"
                    rows={3}
                    placeholder="Describa los síntomas principales expresados por el paciente..."
                    value={sintomas}
                    onChange={(e) => setSintomas(e.target.value)}
                    disabled={isFormLocked}
                    required
                  />
                </div>
              </div>

              {/* SECCIÓN 2: RESUMEN DE LA CONSULTA */}
              <div className="doc-clinical-section">
                <h3 className="doc-section-title">
                  <div className="doc-section-icon">
                    <Activity size={16} />
                  </div>
                  <span>2. Resumen de la Consulta (Evaluación y Anamnesis)</span>
                </h3>

                <div className="doc-form-group">
                  <label className="doc-field-label">
                    Resumen del examen físico y hallazgos observados:
                  </label>
                  <textarea
                    className="doc-textarea"
                    rows={3}
                    placeholder="Resumen del examen físico realizado, signos vitales y hallazgos..."
                    value={resumenConsulta}
                    onChange={(e) => setResumenConsulta(e.target.value)}
                    disabled={isFormLocked}
                    required
                  />
                </div>
              </div>

              {/* SECCIÓN 3: TRATAMIENTO */}
              <div className="doc-clinical-section">
                <h3 className="doc-section-title">
                  <div className="doc-section-icon">
                    <Pill size={16} />
                  </div>
                  <span>3. Tratamiento y Prescripción Médica</span>
                </h3>

                <div className="doc-input-grid">
                  <div className="doc-form-group">
                    <label className="doc-field-label">Nombre del Tratamiento / Medicamento:</label>
                    <input
                      type="text"
                      className="doc-text-input"
                      placeholder="ej: Amoxicilina 500mg cápsulas"
                      value={tratamientoNombre}
                      onChange={(e) => setTratamientoNombre(e.target.value)}
                      disabled={isFormLocked}
                      required
                    />
                  </div>

                  <div className="doc-form-group">
                    <label className="doc-field-label">Descripción (Qué es el medicamento):</label>
                    <input
                      type="text"
                      className="doc-text-input"
                      placeholder="ej: Antibiótico de amplio espectro"
                      value={tratamientoDescripcion}
                      onChange={(e) => setTratamientoDescripcion(e.target.value)}
                      disabled={isFormLocked}
                    />
                  </div>

                  <div className="doc-form-group">
                    <label className="doc-field-label">Dosis:</label>
                    <input
                      type="text"
                      className="doc-text-input"
                      placeholder="ej: 1 cápsula (500 mg)"
                      value={tratamientoDosis}
                      onChange={(e) => setTratamientoDosis(e.target.value)}
                      disabled={isFormLocked}
                      required
                    />
                  </div>

                  <div className="doc-form-group">
                    <label className="doc-field-label">Frecuencia de consumo (cada cuántas horas):</label>
                    <input
                      type="text"
                      className="doc-text-input"
                      placeholder="ej: Cada 8 horas (3 veces al día)"
                      value={tratamientoFrecuencia}
                      onChange={(e) => setTratamientoFrecuencia(e.target.value)}
                      disabled={isFormLocked}
                      required
                    />
                  </div>

                  <div className="doc-form-group">
                    <label className="doc-field-label">Duración del tratamiento:</label>
                    <input
                      type="text"
                      className="doc-text-input"
                      placeholder="ej: 7 días consecutivos"
                      value={tratamientoDuracion}
                      onChange={(e) => setTratamientoDuracion(e.target.value)}
                      disabled={isFormLocked}
                      required
                    />
                  </div>
                </div>

                <div className="doc-form-group" style={{ marginTop: '8px' }}>
                  <label className="doc-field-label">Indicaciones adicionales para el consumo:</label>
                  <textarea
                    className="doc-textarea"
                    rows={2}
                    placeholder="ej: Tomar con abundante agua después de las comidas principales..."
                    value={tratamientoIndicaciones}
                    onChange={(e) => setTratamientoIndicaciones(e.target.value)}
                    disabled={isFormLocked}
                  />
                </div>
              </div>

              {/* SECCIÓN 4: DIAGNÓSTICO (CIE-10) */}
              <div className="doc-clinical-section">
                <h3 className="doc-section-title">
                  <div className="doc-section-icon">
                    <BookOpen size={16} />
                  </div>
                  <span>4. Diagnóstico Médico (CIE-10)</span>
                </h3>

                <div className="doc-input-grid">
                  <div className="doc-form-group">
                    <label className="doc-field-label">Código CIE-10:</label>
                    <select
                      className="doc-text-input"
                      value={cie10Codigo}
                      onChange={(e) => setCie10Codigo(e.target.value)}
                      disabled={isFormLocked}
                    >
                      {CIE10_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {cie10Codigo === 'Otro' && (
                      <input
                        type="text"
                        className="doc-text-input"
                        style={{ marginTop: '8px' }}
                        placeholder="Ingresar código personalizado..."
                        value={customCie10}
                        onChange={(e) => setCustomCie10(e.target.value)}
                        disabled={isFormLocked}
                      />
                    )}
                  </div>

                  <div className="doc-form-group">
                    <label className="doc-field-label">Descripción del Diagnóstico:</label>
                    <textarea
                      className="doc-textarea"
                      rows={2}
                      placeholder="Detalles clínicos e impresión diagnóstica..."
                      value={cie10Descripcion}
                      onChange={(e) => setCie10Descripcion(e.target.value)}
                      disabled={isFormLocked}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              {isFormLocked ? (
                <div className="doc-form-actions">
                  <div className="btn-locked-status">
                    <Lock size={16} />
                    <span>Consulta Guardada y Bloqueada (Registro Oficial)</span>
                  </div>
                </div>
              ) : (
                <div className="doc-form-actions">
                  <button
                    type="button"
                    className="btn-save-draft"
                    onClick={handleSaveDraft}
                  >
                    Guardar Borrador
                  </button>

                  <button type="submit" className="btn-finish-consultation">
                    <CheckCircle2 size={16} />
                    <span>Finalizar y Guardar Consulta</span>
                  </button>
                </div>
              )}
            </form>
          ) : (
            <div className="doc-empty-state">
              <div className="doc-empty-icon-bg">
                <User size={28} />
              </div>
              <h3 style={{ margin: '8px 0 4px 0', fontSize: '16px', color: '#0F172A' }}>
                Seleccione un paciente de la lista de horas
              </h3>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Haga clic en una cita de la tabla de la izquierda para cargar la ficha de atención clínica.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && <div className="doc-toast">{toastMessage}</div>}
    </div>
  );
};

export default DoctorCitas;
