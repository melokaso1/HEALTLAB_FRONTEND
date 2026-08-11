import React, { useState } from 'react';
import {
  Calendar,
  Users,
  TrendingUp,
  Search,
  UserCheck,
} from 'lucide-react';
import './AdminDashboard.css';

// Interface for appointments
interface CitaTabla {
  id: number;
  paciente: string;
  doctor: string;
  hora: string;
  tipo: string;
  estado: 'confirmada' | 'cancelada' | 'pendiente';
}

// Interface for timeline items
interface ActividadItem {
  id: number;
  texto: React.ReactNode;
  tiempo: string;
  avatarBg: string;
}

// Interface for daily agenda
interface AgendaSlot {
  hora: string;
  paciente?: string;
  especialidad?: string;
}

const citasData: CitaTabla[] = [
  {
    id: 1,
    paciente: 'M. Rodriguez',
    doctor: 'Dr. Smith (Cardiology)',
    hora: '09:00 AM',
    tipo: 'Follow-up',
    estado: 'confirmada',
  },
  {
    id: 2,
    paciente: 'James Wilson',
    doctor: 'Dr. Lee (General)',
    hora: '08:30 AM',
    tipo: 'Checkup',
    estado: 'cancelada',
  },
  {
    id: 3,
    paciente: 'Ana Garcia',
    doctor: 'Dr. Smith (Cardiology)',
    hora: '10:15 AM',
    tipo: 'Consultation',
    estado: 'pendiente',
  },
  {
    id: 4,
    paciente: 'Robert Chen',
    doctor: 'Dr. Evans (Neurology)',
    hora: '11:00 AM',
    tipo: 'Test Results',
    estado: 'pendiente',
  },
];

const actividadesData: ActividadItem[] = [
  {
    id: 1,
    texto: (
      <>
        <strong>Dr. Smith updated medical records for</strong> Maria Rodriguez.
      </>
    ),
    tiempo: '10 minutes ago',
    avatarBg: '#00A896',
  },
  {
    id: 2,
    texto: (
      <>
        <strong>New patient Sarah Jenkins registered</strong> via online portal.
      </>
    ),
    tiempo: '45 minutes ago',
    avatarBg: '#6366F1',
  },
  {
    id: 3,
    texto: (
      <>
        <strong>Appointment cancelled by Tom Harris</strong> for tomorrow.
      </>
    ),
    tiempo: '1 hour ago',
    avatarBg: '#EC4899',
  },
];

const agendaData: AgendaSlot[] = [
  { hora: '08:00' },
  { hora: '09:00', paciente: 'M. Rodriguez', especialidad: 'Cardio' },
  { hora: '09:30', paciente: 'James Wilson', especialidad: 'Cardio' },
  { hora: '10:00', paciente: 'James Wilson', especialidad: 'Cardio' },
  { hora: '11:00', paciente: 'M. Rodriguez', especialidad: 'Cardio' },
  { hora: '12:00', paciente: 'James Wilson', especialidad: 'Cardio' },
  { hora: '13:00', paciente: 'M. Rodriguez', especialidad: 'Cardio' },
  { hora: '14:00', paciente: 'James Wilson', especialidad: 'Cardio' },
  { hora: '16:00', paciente: 'M. Rodriguez', especialidad: 'Cardio' },
  { hora: '16:00', paciente: 'James Wilson', especialidad: 'Cardio' },
  { hora: '17:00', paciente: 'M. Rodriguez', especialidad: 'Cardio' },
  { hora: '18:00', paciente: 'M. Rodriguez', especialidad: 'Cardio' },
];

const AdminDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="admin-dashboard">
      {/* Top Title & Search Row */}
      <div className="admin-dashboard__header-row">
        <div>
          <h1 className="admin-dashboard__title">Inicio</h1>
          <p className="admin-dashboard__subtitle">Martes, Nov 12, 2023</p>
        </div>

        <div className="admin-dashboard__search-wrapper">
          <Search size={18} className="admin-dashboard__search-icon" />
          <input
            type="text"
            className="admin-dashboard__search-input"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Layout Grid (Left 2-Columns / Right 1-Column Agenda) */}
      <div className="admin-dashboard__grid">
        {/* Left Section (KPIs, Table, Activity) */}
        <div className="admin-dashboard__left-col">
          {/* Row 1: KPI Cards */}
          <div className="admin-dashboard__kpi-row">
            {/* KPI Card 1: Citas de hoy */}
            <div className="card kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__title">Citas de hoy</span>
                <Calendar size={18} className="kpi-card__icon" />
              </div>
              <div className="kpi-card__body">
                <span className="kpi-card__value">28</span>
                <span className="kpi-card__trend kpi-card__trend--up">
                  <TrendingUp size={14} />
                  <span>+12%</span>
                </span>
              </div>
            </div>

            {/* KPI Card 2: Nuevos Pacientes */}
            <div className="card kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__title">Nuevos Pacientes</span>
                <Users size={18} className="kpi-card__icon" />
              </div>
              <div className="kpi-card__body">
                <span className="kpi-card__value">15</span>
                <span className="kpi-card__trend kpi-card__trend--up">
                  <TrendingUp size={14} />
                  <span>+8%</span>
                </span>
              </div>
            </div>

            {/* KPI Card 3: Pacientes por Profesional (Donut Chart) */}
            <div className="card kpi-card kpi-card--chart">
              <div className="kpi-card__header">
                <span className="kpi-card__title">Pacientes por Profesional</span>
              </div>
              <div className="kpi-card__chart-wrapper">
                <svg className="donut-chart" viewBox="0 0 100 100">
                  {/* Segment 1: Teal */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="transparent"
                    stroke="#00A896"
                    strokeWidth="16"
                    strokeDasharray="95 125"
                    strokeDashoffset="0"
                  />
                  {/* Segment 2: Cyan */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="transparent"
                    stroke="#0EA5E9"
                    strokeWidth="16"
                    strokeDasharray="60 160"
                    strokeDashoffset="-95"
                  />
                  {/* Segment 3: Slate */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="transparent"
                    stroke="#64748B"
                    strokeWidth="16"
                    strokeDasharray="45 175"
                    strokeDashoffset="-155"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Row 2: Próximas Citas Table */}
          <div className="card table-card">
            <div className="table-card__header">
              <h2 className="table-card__title">Próximas Citas</h2>
              <button type="button" className="table-card__link">
                Ver todas
              </button>
            </div>
            <div className="table-card__wrapper">
              <table className="citas-table">
                <thead>
                  <tr>
                    <th>PACIENTE</th>
                    <th>DOCTOR</th>
                    <th>HORA</th>
                    <th>TIPO</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {citasData.map((cita) => (
                    <tr key={cita.id}>
                      <td className="citas-table__paciente">{cita.paciente}</td>
                      <td className="citas-table__doctor">{cita.doctor}</td>
                      <td className="citas-table__hora">{cita.hora}</td>
                      <td className="citas-table__tipo">{cita.tipo}</td>
                      <td>
                        <span
                          className={`status-dot status-dot--${cita.estado}`}
                          title={cita.estado}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 3: Actividad Reciente Timeline */}
          <div className="card activity-card">
            <h2 className="activity-card__title">Actividad Reciente</h2>
            <div className="activity-list">
              {actividadesData.map((act) => (
                <div key={act.id} className="activity-item">
                  <div
                    className="activity-item__avatar"
                    style={{ backgroundColor: act.avatarBg }}
                  >
                    <UserCheck size={16} />
                  </div>
                  <div className="activity-item__details">
                    <p className="activity-item__text">{act.texto}</p>
                    <span className="activity-item__time">{act.tiempo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Agenda del Día Panel */}
        <div className="admin-dashboard__right-col">
          <div className="card agenda-panel">
            <h2 className="agenda-panel__title">Agenda del Día</h2>
            <div className="agenda-panel__list">
              {agendaData.map((slot, idx) => (
                <div key={idx} className="agenda-slot">
                  <span className="agenda-slot__time">{slot.hora}</span>
                  <div className="agenda-slot__divider" />
                  <div className="agenda-slot__content">
                    {slot.paciente && (
                      <div className="agenda-slot__card">
                        <span className="agenda-slot__name">{slot.paciente}</span>
                        <span className="agenda-slot__spec">{slot.especialidad}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
