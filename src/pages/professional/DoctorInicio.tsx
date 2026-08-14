import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  Activity,
  Award,
  Building,
  CheckSquare,
  Square,
  Search,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAppointmentsApi } from '../../services/appointments.service';
import { resolveMedicoIdForUser } from '../../services/professionals.service';
import medicoAvatar from '../../assets/images/medico1.jpeg';
import './DoctorInicio.css';

interface TodayAppointment {
  id: string | number;
  time: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  service: string;
  status: 'Atendida' | 'En sala de espera' | 'Confirmada';
  reason: string;
}

interface DoctorTask {
  id: number;
  title: string;
  patient: string;
  completed: boolean;
  priority: 'Alta' | 'Media' | 'Baja';
}

const todayIsoLocal = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const formatTodayLabel = (): string =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

const DoctorInicio: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const doctorName = user?.name || 'Doctor';

  const [tasks, setTasks] = useState<DoctorTask[]>([]);
  const [todayApps, setTodayApps] = useState<TodayAppointment[]>([]);
  const [followUpPatientCount, setFollowUpPatientCount] = useState(0);

  useEffect(() => {
    const loadTodayAppointments = async () => {
      const apps = await getAppointmentsApi();
      const medicoId = await resolveMedicoIdForUser(user);
      if (Array.isArray(apps)) {
        const today = todayIsoLocal();
        const allDoctorApps = apps.filter((a) =>
          (medicoId
            ? String(a.professionalId) === medicoId
            : a.professionalName.toLowerCase().includes(doctorName.toLowerCase())),
        );
        setFollowUpPatientCount(new Set(allDoctorApps.map((a) => String(a.patientId))).size);
        const doctorApps = allDoctorApps.filter((a) =>
          a.date === today &&
          (medicoId
            ? String(a.professionalId) === medicoId
            : a.professionalName.toLowerCase().includes(doctorName.toLowerCase())),
        );
        const mapped: TodayAppointment[] = doctorApps.map((a) => ({
          id: a.id,
          time: a.time,
          patientName: a.patientName,
          patientAge: a.patientAge,
          patientGender: a.patientGender,
          service: a.serviceName,
          status: a.status === 'Atendida' ? 'Atendida' : 'Confirmada',
          reason: a.notes || 'Consulta Médica Programada',
        }));
        setTodayApps(mapped);
      }
    };
    void loadTodayAppointments();
  }, [user, doctorName]);

  const attendedToday = todayApps.filter((app) => app.status === 'Atendida').length;
  const waitingToday = todayApps.filter((app) => app.status === 'Confirmada').length;

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="doc-inicio-view">
      {/* 1. HERO WELCOME BANNER */}
      <div className="doc-hero-banner">
        <div className="doc-hero-banner__content">
          <div className="doc-hero-banner__avatar-wrapper">
            <img src={medicoAvatar} alt={doctorName} className="doc-hero-banner__avatar" />
            <span className="doc-hero-banner__online-dot" />
          </div>

          <div className="doc-hero-banner__info">
            <div className="doc-hero-banner__badge">
              <Activity size={13} color="#0A9396" />
              <span>Panel Principal del Médico</span>
            </div>

            <h1 className="doc-hero-banner__title">¡Bienvenido de nuevo, {doctorName}!</h1>
            <p className="doc-hero-banner__subtitle">
              Cardiología Intervencionista • Consultorio 302 | Tiene <strong>{todayApps.length} citas programadas para hoy</strong>.
            </p>

            <div className="doc-hero-banner__tags">
              <span className="doc-tag">
                <Award size={13} color="#0A9396" />
                <span>Lic: CMP-45882</span>
              </span>
              <span className="doc-tag">
                <Building size={13} color="#3B82F6" />
                <span>Torre B - Piso 3</span>
              </span>
              <span className="doc-tag doc-tag--active">
                ● En Consulta
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="doc-metrics-grid">
        <div className="doc-metric-card doc-metric-card--teal">
          <div className="doc-metric-card__icon">
            <Calendar size={20} />
          </div>
          <div className="doc-metric-card__details">
            <span className="doc-metric-card__label">Citas de Hoy</span>
            <span className="doc-metric-card__value">{todayApps.length} Citas</span>
            <span className="doc-metric-card__sub">{attendedToday} atendidas • {waitingToday} en espera</span>
          </div>
        </div>

        <div className="doc-metric-card doc-metric-card--blue">
          <div className="doc-metric-card__icon">
            <Users size={20} />
          </div>
          <div className="doc-metric-card__details">
            <span className="doc-metric-card__label">Pacientes en Seguimiento</span>
            <span className="doc-metric-card__value">{followUpPatientCount} Pacientes</span>
            <span className="doc-metric-card__sub">Con citas registradas a su cargo</span>
          </div>
        </div>

        <div className="doc-metric-card doc-metric-card--purple">
          <div className="doc-metric-card__icon">
            <CheckCircle2 size={20} />
          </div>
          <div className="doc-metric-card__details">
            <span className="doc-metric-card__label">Atenciones de la Semana</span>
            <span className="doc-metric-card__value">18 Consultas</span>
            <span className="doc-metric-card__sub">94% asistencia</span>
          </div>
        </div>

        <div className="doc-metric-card doc-metric-card--amber">
          <div className="doc-metric-card__icon">
            <Clock size={20} />
          </div>
          <div className="doc-metric-card__details">
            <span className="doc-metric-card__label">Duración Promedio</span>
            <span className="doc-metric-card__value">25 min</span>
            <span className="doc-metric-card__sub">Tiempo óptimo de consulta</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN TWO-COLUMN LAYOUT */}
      <div className="doc-inicio-grid">
        {/* LEFT COLUMN: TODAY'S SCHEDULE & QUICK RECENT PATIENTS */}
        <div className="doc-main-col">
          {/* Card: Citas de Hoy */}
          <div className="doc-card">
            <div className="doc-card__header">
              <div className="doc-card__title-group">
                <h3 className="doc-card__title">Agenda y Atenciones de Hoy</h3>
                <span className="doc-card__subtitle">{formatTodayLabel()}</span>
              </div>
              <button
                type="button"
                className="doc-link-btn"
                onClick={() => navigate('/agenda-medico')}
              >
                <span>Ver agenda completa</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="doc-schedule-list">
              {todayApps.map((app) => (
                <div key={app.id} className="doc-schedule-item">
                  <div className="doc-schedule-item__time-badge">
                    <Clock size={13} />
                    <span>{app.time}</span>
                  </div>

                  <div className="doc-schedule-item__info">
                    <div className="doc-schedule-item__top">
                      <span className="doc-schedule-item__patient-name">{app.patientName}</span>
                      <span className={`doc-status-badge doc-status-badge--${app.status.toLowerCase().replace(/ /g, '-')}`}>
                        {app.status}
                      </span>
                    </div>

                    <span className="doc-schedule-item__meta">
                      {app.patientGender}, {app.patientAge} años • <strong>{app.service}</strong>
                    </span>
                    <span className="doc-schedule-item__reason">
                      <strong>Motivo:</strong> {app.reason}
                    </span>
                  </div>

                  <div className="doc-schedule-item__action">
                    <button
                      type="button"
                      className="doc-btn-sm"
                      onClick={() => navigate('/agenda-medico')}
                    >
                      <span>{app.status === 'Atendida' ? 'Ver Atención' : 'Atender Paciente'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Accesos Rápidos a Pacientes */}
          <div className="doc-card">
            <div className="doc-card__header">
              <div className="doc-card__title-group">
                <h3 className="doc-card__title">Pacientes Recientes en Seguimiento</h3>
                <span className="doc-card__subtitle">Últimas consultas registradas</span>
              </div>
              <button
                type="button"
                className="doc-link-btn"
                onClick={() => navigate('/pacientes')}
              >
                <span>Ver expediente general</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="doc-recent-patients-grid">
              <div className="doc-patient-quick-card">
                <div className="doc-patient-quick-card__avatar">MR</div>
                <div className="doc-patient-quick-card__info">
                  <span className="doc-patient-quick-card__name">Maria Rodriguez</span>
                  <span className="doc-patient-quick-card__sub">Femenino, 34 años • O+</span>
                  <span className="doc-patient-quick-card__diag">Hipertensión estadio 1</span>
                </div>
              </div>

              <div className="doc-patient-quick-card">
                <div className="doc-patient-quick-card__avatar doc-patient-quick-card__avatar--blue">CM</div>
                <div className="doc-patient-quick-card__info">
                  <span className="doc-patient-quick-card__name">Carlos Mendoza</span>
                  <span className="doc-patient-quick-card__sub">Masculino, 52 años • A+</span>
                  <span className="doc-patient-quick-card__diag">Evaluación ventricular</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TASKS, WIDGETS & QUICK ACTIONS */}
        <div className="doc-side-col">
          {/* Card: Tareas Médicas Pendientes */}
          <div className="doc-card">
            <div className="doc-card__header">
              <h3 className="doc-card__title">Pendientes y Tareas Clínicas</h3>
            </div>

            <div className="doc-tasks-list">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`doc-task-item${task.completed ? ' doc-task-item--completed' : ''}`}
                  onClick={() => toggleTask(task.id)}
                >
                  <button type="button" className="doc-task-checkbox">
                    {task.completed ? <CheckSquare size={16} color="#0A9396" /> : <Square size={16} color="#94A3B8" />}
                  </button>
                  <div className="doc-task-content">
                    <span className="doc-task-title">{task.title}</span>
                    <span className="doc-task-sub">Paciente: {task.patient}</span>
                  </div>
                  <span className={`doc-priority-tag doc-priority-tag--${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Accesos Directos */}
          <div className="doc-card">
            <div className="doc-card__header">
              <h3 className="doc-card__title">Acciones Rápidas</h3>
            </div>

            <div className="doc-quick-actions-list">

              <button
                type="button"
                className="doc-quick-action-btn"
                onClick={() => navigate('/pacientes')}
              >
                <Search size={16} color="#3B82F6" />
                <span>Buscar Expediente</span>
              </button>

              <button
                type="button"
                className="doc-quick-action-btn"
                onClick={() => navigate('/historial-atencion')}
              >
                <FileText size={16} color="#8B5CF6" />
                <span>Historial de Atenciones</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorInicio;
