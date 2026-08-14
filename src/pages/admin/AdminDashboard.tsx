import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import './AdminDashboard.css';
import { getAppointmentsApi } from '../../services/appointments.service';
import { getProfessionalsApi } from '../../services/professionals.service';
import { getPatientsApi } from '../../services/patients.service';
import { useSignalR } from '../../context/SignalRContext';

// ─── Interfaces ───────────────────────────────────────────────────────────
interface CitaTabla {
  id: string | number;
  paciente: string;
  doctor: string;
  hora: string;
  tipo: string;
  estado: 'confirmada' | 'cancelada' | 'pendiente';
}


interface AgendaSlot {
  hora: string;
  sortKey: string;
  paciente?: string;
  especialidad?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
const todayISO = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const todayLabel = (): string =>
  new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/** Convierte "02:30 PM" → "14:30" para ordenar como string */
const timeToSortable = (slot: string): string => {
  const parts = slot.trim().split(' ');
  if (parts.length < 2) return slot; // ya viene en HH:mm
  const [time, period] = parts;
  const [h, m] = time.split(':').map(Number);
  let hour = h;
  if (period === 'PM' && h !== 12) hour += 12;
  if (period === 'AM' && h === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// ─── Componente ───────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const { recentActivities } = useSignalR();
  const [citasData, setCitasData] = useState<CitaTabla[]>([]);
  const [agendaSlots, setAgendaSlots] = useState<AgendaSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayCitasCount, setTodayCitasCount] = useState(0);
  const [totalProfessionals, setTotalProfessionals] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [appointments, professionals, patients] = await Promise.all([
          getAppointmentsApi(),
          getProfessionalsApi(),
          getPatientsApi(),
        ]);
        const today = todayISO();

        // ── Tabla: todas las citas ──────────────────────────────────────
        const mappedCitas: CitaTabla[] = appointments.map((app, index) => {
          let estado: 'confirmada' | 'cancelada' | 'pendiente' = 'confirmada';
          if (app.status === 'Cancelada') estado = 'cancelada';
          return {
            id: app.id ?? index,
            paciente: app.patientName,
            doctor: app.professionalName,
            hora: app.time,
            tipo: app.serviceName,
            estado,
          };
        });
        setCitasData(mappedCitas);

        const todayApps = appointments
          .filter((a) => {
            if (a.status === 'Cancelada') return false;
            if (!a.date) return true;
            return a.date.slice(0, 10) === today;
          })
          .sort((a, b) => timeToSortable(a.time).localeCompare(timeToSortable(b.time)));

        const activeSlots: AgendaSlot[] = todayApps.map((app) => ({
          hora: app.time,
          sortKey: timeToSortable(app.time),
          paciente: app.patientName,
          especialidad: app.serviceName || app.professionalSpecialty || 'Consulta',
        }));

        setAgendaSlots(activeSlots);
        setTodayCitasCount(todayApps.length);
        setTotalProfessionals(professionals.length);
        setTotalPatients(patients.length);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-dashboard__header-row">
        <div className="admin-dashboard__title-group">
          <h1 className="admin-dashboard__title">Inicio</h1>
          <p className="admin-dashboard__subtitle">{todayLabel()}</p>
        </div>
      </div>

      <div className="admin-dashboard__grid">
        {/* ── Left Section ─────────────────────────────────────────────── */}
        <div className="admin-dashboard__left-col">

          {/* KPI Cards */}
          <div className="admin-dashboard__kpi-row">
            <div className="card kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__title">Citas de hoy</span>
                <Calendar size={18} className="kpi-card__icon" />
              </div>
              <div className="kpi-card__body">
                <span className="kpi-card__value">{todayCitasCount}</span>
                <span className="kpi-card__trend kpi-card__trend--up">
                  <TrendingUp size={14} />
                  <span>Hoy</span>
                </span>
              </div>
            </div>

            <div className="card kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__title">Profesionales Activos</span>
                <Users size={18} className="kpi-card__icon" />
              </div>
              <div className="kpi-card__body">
                <span className="kpi-card__value">{totalProfessionals}</span>
                <span className="kpi-card__trend kpi-card__trend--up">
                  <TrendingUp size={14} />
                  <span>Total</span>
                </span>
              </div>
            </div>

            <div className="card kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__title">Total Pacientes</span>
                <UserCheck size={18} className="kpi-card__icon" />
              </div>
              <div className="kpi-card__body">
                <span className="kpi-card__value">{totalPatients}</span>
                <span className="kpi-card__trend kpi-card__trend--up">
                  <TrendingUp size={14} />
                  <span>Registrados</span>
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Citas */}
          <div className="card table-card">
            <div className="table-card__header">
              <h2 className="table-card__title">Próximas Citas</h2>
              <button type="button" className="table-card__link">Ver todas</button>
            </div>
            <div className="table-card__wrapper">
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                  Cargando citas...
                </div>
              ) : citasData.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                  No hay citas disponibles
                </div>
              ) : (
                <table className="citas-table">
                  <thead>
                    <tr>
                      <th>PACIENTE</th>
                      <th>DOCTOR</th>
                      <th>HORA</th>
                      <th>TIPO</th>
                      <th style={{ textAlign: 'center' }}>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasData.map((cita) => (
                      <tr key={cita.id}>
                        <td className="citas-table__paciente">{cita.paciente}</td>
                        <td className="citas-table__doctor">{cita.doctor}</td>
                        <td className="citas-table__hora">{cita.hora}</td>
                        <td className="citas-table__tipo">{cita.tipo}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="status-badge-container">
                            <span
                              className={`status-badge-bullet ${
                                cita.estado === 'cancelada'
                                  ? 'status-badge--inactive'
                                  : 'status-badge--active'
                              }`}
                            >
                              <span className="bullet-dot" />
                              <span>{cita.estado === 'cancelada' ? 'Inactivo' : 'Activo'}</span>
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="card activity-card">
            <h2 className="activity-card__title">Actividad Reciente</h2>
            <div className="activity-list">
              {recentActivities.map((act) => (
                <div key={act.id} className="activity-item">
                  <div className="activity-item__avatar" style={{ backgroundColor: act.avatarBg || '#00A896' }}>
                    <UserCheck size={16} />
                  </div>
                  <div className="activity-item__details">
                    <p className="activity-item__text">
                      <strong>{act.user}</strong> {act.action} <strong>{act.target}</strong>.
                    </p>
                    <span className="activity-item__time">{act.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Section: Agenda del Día ────────────────────────────── */}
        <div className="admin-dashboard__right-col">
          <div className="card agenda-panel">
            <div className="agenda-panel__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 className="agenda-panel__title">Agenda del Día</h2>
              <span className="count-badge" style={{ backgroundColor: 'rgba(0, 168, 150, 0.12)', color: '#00A896', fontSize: '11.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px' }}>
                {agendaSlots.length} {agendaSlots.length === 1 ? 'Cita' : 'Citas'}
              </span>
            </div>
            <div className="agenda-panel__list">
              {agendaSlots.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                  No hay citas programadas para hoy.
                </div>
              ) : (
                agendaSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="agenda-slot agenda-slot--has-appointment"
                  >
                    <span className="agenda-slot__time">{slot.hora}</span>
                    <div className="agenda-slot__divider" />
                    <div className="agenda-slot__content">
                      <div className="agenda-slot__card">
                        <span className="agenda-slot__name">{slot.paciente}</span>
                        <span className="agenda-slot__spec">{slot.especialidad}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
