import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  UserPlus,
  CalendarPlus,
  CheckCircle2,
  X,
  Check,
  MoreVertical,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Inicio.css';

interface ProximaCita {
  id: string;
  hora: string;
  pacienteNombre: string;
  pacienteIniciales: string;
  doctorNombre: string;
  estado: 'En sala' | 'Esperando' | 'Confirmado' | 'Cancelada';
}

interface DoctorShift {
  id: string;
  nombre: string;
  especialidad: string;
  consultorio: string;
  citasCount: number;
  foto?: string;
  estado: 'Disponible' | 'Ausente';
}

const mockProximasCitas: ProximaCita[] = [
  {
    id: 'c1',
    hora: '09:00 AM',
    pacienteNombre: 'Carlos Gómez',
    pacienteIniciales: 'CO',
    doctorNombre: 'Dr. J. Moore',
    estado: 'En sala',
  },
  {
    id: 'c2',
    hora: '09:30 AM',
    pacienteNombre: 'Lucía Mendoza',
    pacienteIniciales: 'LM',
    doctorNombre: 'Dra. S. Vega',
    estado: 'Esperando',
  },
  {
    id: 'c3',
    hora: '10:00 AM',
    pacienteNombre: 'Roberto Paz',
    pacienteIniciales: 'RP',
    doctorNombre: 'Dr. J. Moore',
    estado: 'Confirmado',
  },
  {
    id: 'c4',
    hora: '10:30 AM',
    pacienteNombre: 'Elena Suárez',
    pacienteIniciales: 'ES',
    doctorNombre: 'Dra. S. Vega',
    estado: 'Cancelada',
  },
];

const mockDoctorsShift: DoctorShift[] = [
  {
    id: 'd1',
    nombre: 'Dr. Julian Moore',
    especialidad: 'Cardiología',
    consultorio: 'Consultorio 1',
    citasCount: 12,
    foto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    estado: 'Disponible',
  },
  {
    id: 'd2',
    nombre: 'Dra. Silvia Vega',
    especialidad: 'Pediatría',
    consultorio: 'Consultorio 3',
    citasCount: 18,
    foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
    estado: 'Disponible',
  },
  {
    id: 'd3',
    nombre: 'Dr. Mario Rios',
    especialidad: 'Medicina General',
    consultorio: 'Consultorio 2',
    citasCount: 0,
    estado: 'Ausente',
  },
];

const RecepInicio: React.FC = () => {
  const navigate = useNavigate();
  const [citasList, setCitasList] = useState<ProximaCita[]>(mockProximasCitas);
  const [isRegisterPatientOpen, setIsRegisterPatientOpen] = useState(false);
  const [isScheduleAppointmentOpen, setIsScheduleAppointmentOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleRegisterPatient = (nombre: string) => {
    setIsRegisterPatientOpen(false);
    showToast(`Paciente ${nombre} registrado exitosamente.`);
  };

  const handleCreateAppointment = (paciente: string, doctor: string, hora: string) => {
    const newCita: ProximaCita = {
      id: `c-${Date.now()}`,
      hora,
      pacienteNombre: paciente,
      pacienteIniciales: paciente.substring(0, 2).toUpperCase(),
      doctorNombre: doctor,
      estado: 'Confirmado',
    };
    setCitasList((prev) => [newCita, ...prev]);
    setIsScheduleAppointmentOpen(false);
    showToast(`Cita agendada para ${paciente} a las ${hora}.`);
  };

  return (
    <div className="recep-inicio-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-banner success">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Greeting & Quick Actions */}
      <div className="recep-inicio-header">
        <div className="recep-inicio-header__text">
          <h1 className="recep-inicio-header__title">Buenos días, Ana</h1>
          <p className="recep-inicio-header__subtitle">
            Aquí está el resumen para hoy, Jueves 24 de Octubre.
          </p>
        </div>

        <div className="recep-inicio-header__actions">
          <button
            className="btn-recep-outline"
            onClick={() => setIsRegisterPatientOpen(true)}
          >
            <UserPlus size={18} />
            <span>Registrar Paciente</span>
          </button>

          <button
            className="btn-recep-primary"
            onClick={() => setIsScheduleAppointmentOpen(true)}
          >
            <CalendarPlus size={18} />
            <span>Agendar Cita</span>
          </button>
        </div>
      </div>

      {/* 3 KPI Stat Cards */}
      <div className="recep-stats-grid">
        {/* Card 1: Citas del Día */}
        <div className="recep-stat-card">
          <div className="recep-stat-info">
            <span className="recep-stat-label">Citas del Día</span>
            <div className="recep-stat-number-group">
              <span className="recep-stat-number">42</span>
              <span className="recep-stat-badge success">
                <TrendingUp size={12} />
                +4 de ayer
              </span>
            </div>
          </div>
          <div className="recep-stat-icon-circle mint">
            <Calendar size={22} />
          </div>
        </div>

        {/* Card 2: Pacientes en Espera */}
        <div className="recep-stat-card">
          <div className="recep-stat-info">
            <span className="recep-stat-label">Pacientes en Espera</span>
            <div className="recep-stat-number-group">
              <span className="recep-stat-number">5</span>
            </div>
            <span className="recep-stat-subtext">T. Promedio: 12 min</span>
          </div>
          <div className="recep-stat-icon-circle blue">
            <Clock size={22} />
          </div>
        </div>

        {/* Card 3: Cancelaciones */}
        <div className="recep-stat-card">
          <div className="recep-stat-info">
            <span className="recep-stat-label">Cancelaciones</span>
            <div className="recep-stat-number-group">
              <span className="recep-stat-number">2</span>
            </div>
            <span className="recep-stat-subtext danger">Revisar agenda</span>
          </div>
          <div className="recep-stat-icon-circle pink">
            <Calendar size={22} />
          </div>
        </div>
      </div>

      {/* Main Grid: Próximas Citas (~65%) + Doctores en Turno (~35%) */}
      <div className="recep-main-grid">
        {/* Left Column: Próximas Citas */}
        <div className="recep-card">
          <div className="recep-card-header">
            <h2 className="recep-card-title">
              <Clock size={18} color="#00A896" />
              Próximas Citas
            </h2>
            <button
              className="btn-link-text"
              onClick={() => navigate('/citas')}
            >
              Ver todas
            </button>
          </div>

          <div className="recep-table-wrapper">
            <table className="recep-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Doctor</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {citasList.map((cita) => (
                  <tr key={cita.id}>
                    <td className={`hora-cell ${cita.estado === 'Cancelada' ? 'is-cancelada' : ''}`}>
                      {cita.hora}
                    </td>
                    <td>
                      <div className="patient-cell">
                        <span className="patient-initials-badge">
                          {cita.pacienteIniciales}
                        </span>
                        <span>{cita.pacienteNombre}</span>
                      </div>
                    </td>
                    <td>{cita.doctorNombre}</td>
                    <td>
                      <span
                        className={`status-tag ${
                          cita.estado === 'En sala'
                            ? 'en-sala'
                            : cita.estado === 'Esperando'
                            ? 'esperando'
                            : cita.estado === 'Confirmado'
                            ? 'confirmado'
                            : 'cancelada'
                        }`}
                      >
                        {cita.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon"
                        style={{ width: '28px', height: '28px' }}
                        title="Ver acciones de cita"
                        onClick={() => showToast(`Cita de ${cita.pacienteNombre} seleccionada`)}
                      >
                        <MoreVertical size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Doctores en Turno */}
        <div className="recep-card">
          <div className="recep-card-header">
            <h2 className="recep-card-title">Doctores en Turno</h2>
          </div>

          <div className="doctors-shift-list">
            {mockDoctorsShift.map((doc) => (
              <div key={doc.id} className="doctor-shift-item">
                <div className="doctor-shift-left">
                  <div className="doctor-shift-avatar-wrapper">
                    {doc.foto && !imgErrors[doc.id] ? (
                      <img
                        src={doc.foto}
                        alt={doc.nombre}
                        className="doctor-shift-avatar"
                        onError={() => handleImageError(doc.id)}
                      />
                    ) : (
                      <div className="doctor-shift-avatar-fallback">
                        {doc.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <span
                      className={`status-indicator-dot ${
                        doc.estado === 'Disponible' ? 'on' : 'off'
                      }`}
                    />
                  </div>

                  <div className="doctor-shift-info">
                    <h3 className="doctor-shift-name">{doc.nombre}</h3>
                    <p className="doctor-shift-specialty">
                      {doc.especialidad} - {doc.consultorio}
                    </p>
                  </div>
                </div>

                <div className="doctor-shift-citas">
                  {doc.estado === 'Disponible' ? (
                    <>
                      <span className="citas-count-big">{doc.citasCount}</span>
                      <span className="citas-label-sub">Citas</span>
                    </>
                  ) : (
                    <span className="ausente-text">Ausente</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal 1: Registrar Paciente */}
      {isRegisterPatientOpen && (
        <div className="modal-overlay" onClick={() => setIsRegisterPatientOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <UserPlus size={18} color="#00A896" />
                Registrar Nuevo Paciente
              </h3>
              <button
                className="btn-icon"
                type="button"
                onClick={() => setIsRegisterPatientOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const nameInput = form.elements.namedItem('nombre') as HTMLInputElement;
                handleRegisterPatient(nameInput.value || 'Nuevo Paciente');
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    name="nombre"
                    className="form-input"
                    required
                    placeholder="Ej. Maria Lopez"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">DNI / Documento</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Ej. 74859201"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Ej. +51 987654321"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="maria@ejemplo.com"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-recep-outline"
                  onClick={() => setIsRegisterPatientOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-recep-primary">
                  <Check size={16} />
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Agendar Cita */}
      {isScheduleAppointmentOpen && (
        <div className="modal-overlay" onClick={() => setIsScheduleAppointmentOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <CalendarPlus size={18} color="#00A896" />
                Agendar Nueva Cita
              </h3>
              <button
                className="btn-icon"
                type="button"
                onClick={() => setIsScheduleAppointmentOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const pacInput = form.elements.namedItem('paciente') as HTMLInputElement;
                const docInput = form.elements.namedItem('doctor') as HTMLSelectElement;
                const horaInput = form.elements.namedItem('hora') as HTMLInputElement;
                handleCreateAppointment(
                  pacInput.value || 'Paciente Demo',
                  docInput.value || 'Dr. J. Moore',
                  horaInput.value || '11:00 AM'
                );
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Paciente</label>
                  <input
                    type="text"
                    name="paciente"
                    className="form-input"
                    required
                    placeholder="Ej. Mateo Ramírez"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Doctor / Especialista</label>
                  <select name="doctor" className="form-select" required>
                    <option value="Dr. J. Moore">Dr. Julian Moore (Cardiología)</option>
                    <option value="Dra. S. Vega">Dra. Silvia Vega (Pediatría)</option>
                    <option value="Dr. M. Rios">Dr. Mario Rios (Medicina General)</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      defaultValue="2026-10-24"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hora</label>
                    <input
                      type="text"
                      name="hora"
                      className="form-input"
                      required
                      defaultValue="11:30 AM"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-recep-outline"
                  onClick={() => setIsScheduleAppointmentOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-recep-primary">
                  <Check size={16} />
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecepInicio;
