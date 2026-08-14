import React, { useState, useEffect } from 'react';
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
import Loading from '../../../components/common/Loading';
import { getAppointmentsApi } from '../../../services/appointments.service';
import { getProfessionalsApi } from '../../../services/professionals.service';

const todayIsoLocal = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const formatTodayLabel = (): string =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

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

const RecepInicio: React.FC = () => {
  const navigate = useNavigate();
  const [citasList, setCitasList] = useState<ProximaCita[]>([]);
  const [doctorsShiftList, setDoctorsShiftList] = useState<DoctorShift[]>([]);
  const [isRegisterPatientOpen, setIsRegisterPatientOpen] = useState(false);
  const [isScheduleAppointmentOpen, setIsScheduleAppointmentOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const waitingCount = citasList.filter((cita) => cita.estado === 'Esperando').length;
  const cancelledCount = citasList.filter((cita) => cita.estado === 'Cancelada').length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appointmentsRes, professionalsRes] = await Promise.all([
          getAppointmentsApi(),
          getProfessionalsApi()
        ]);
        
        const allAppointments = Array.isArray(appointmentsRes) ? appointmentsRes : ((appointmentsRes as any)?.data || []);
        const professionals = Array.isArray(professionalsRes) ? professionalsRes : ((professionalsRes as any)?.data || []);
        
        // Filter for today's appointments
        const today = todayIsoLocal();
        const todaysAppointments = allAppointments.filter((app: any) => app.date === today);

        const mappedCitas: ProximaCita[] = todaysAppointments.map((app: any) => {
          let estado: 'En sala' | 'Esperando' | 'Confirmado' | 'Cancelada' = 'Confirmado';
          if (app.status === 'Agendada') estado = 'Esperando';
          if (app.status === 'Atendida') estado = 'En sala';
          if (app.status === 'Cancelada') estado = 'Cancelada';

          return {
            id: app.id ? app.id.toString() : Math.random().toString(),
            hora: app.time,
            pacienteNombre: app.patientName,
            pacienteIniciales: app.patientName ? app.patientName.substring(0, 2).toUpperCase() : '??',
            doctorNombre: app.professionalName,
            estado: estado,
          };
        });

        const mappedDoctors: DoctorShift[] = professionals.map((p: any) => {
          const docAppointments = todaysAppointments.filter((app: any) => app.professionalId === p.id);
          return {
            id: p.id ? p.id.toString() : Math.random().toString(),
            nombre: p.name,
            especialidad: p.specialty,
            consultorio: 'Consultorio',
            citasCount: docAppointments.length,
            estado: 'Disponible',
          };
        });

        setCitasList(mappedCitas);
        setDoctorsShiftList(mappedDoctors);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  if (loading) {
    return <Loading text="Cargando..." size="lg" />;
  }

  return (
    <div className="recep-inicio-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-banner success">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Greeting */}
      <div className="recep-inicio-header">
        <div className="recep-inicio-header__text">
          <h1 className="recep-inicio-header__title">Buenos días, Ana</h1>
          <p className="recep-inicio-header__subtitle">
            Aquí está el resumen para hoy, {formatTodayLabel()}.
          </p>
        </div>
      </div>

      {/* 3 KPI Stat Cards */}
      <div className="recep-stats-grid">
        {/* Card 1: Citas del Día */}
        <div className="recep-stat-card">
          <div className="recep-stat-info">
            <span className="recep-stat-label">Citas del Día</span>
            <div className="recep-stat-number-group">
              <span className="recep-stat-number">{citasList.length}</span>
              <span className="recep-stat-badge success">
                <TrendingUp size={12} />
                Agenda actual
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
              <span className="recep-stat-number">{waitingCount}</span>
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
              <span className="recep-stat-number">{cancelledCount}</span>
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
            {citasList.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>No hay citas para hoy</div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Right Column: Doctores en Turno */}
        <div className="recep-card">
          <div className="recep-card-header">
            <h2 className="recep-card-title">Doctores en Turno</h2>
          </div>

          <div className="doctors-shift-list">
            {doctorsShiftList.map((doc) => (
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
                  horaInput.value || '09:00'
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
                      name="fecha"
                      className="form-input"
                      required
                      defaultValue={todayIsoLocal()}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hora</label>
                    <input
                      type="text"
                      name="hora"
                      className="form-input"
                      required
                      defaultValue="09:00"
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
