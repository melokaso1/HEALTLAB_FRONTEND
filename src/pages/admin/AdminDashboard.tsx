import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  TrendingUp,
  Search,
  UserCheck,
} from 'lucide-react';
import './AdminDashboard.css';
import Loading from '../../components/common/Loading';
import { getAppointmentsApi } from '../../services/appointments.service';
import { getProfessionalsApi } from '../../services/professionals.service';
import type { Appointment } from '../../types/appointment.types';

// ─── Interfaces ───────────────────────────────────────────────────────────
interface CitaTabla {
  id: string | number;
  paciente: string;
  doctor: string;
  hora: string;
  tipo: string;
  estado: 'confirmada' | 'cancelada' | 'pendiente';
}

interface ActividadItem {
  id: number;
  texto: React.ReactNode;
  tiempo: string;
  avatarBg: string;
}

interface AgendaSlot {
  hora: string;
  paciente?: string;
  especialidad?: string;
}

// ─── Actividad reciente (sin endpoint aún — se mantiene estática) ─────────
const actividadesData: ActividadItem[] = [
  {
    id: 1,
    texto: (<><strong>Dr. Smith updated medical records for</strong> Maria Rodriguez.</>),
    tiempo: '10 minutes ago',
    avatarBg: '#00A896',
  },
  {
    id: 2,
    texto: (<><strong>New patient Sarah Jenkins registered</strong> via online portal.</>),
    tiempo: '45 minutes ago',
    avatarBg: '#6366F1',
  },
  {
    id: 3,
    texto: (<><strong>Appointment cancelled by Tom Harris</strong> for tomorrow.</>),
    tiempo: '1 hour ago',
    avatarBg: '#EC4899',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
const todayISO = (): string => new Date().toISOString().split('T')[0];

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

const mapToAgendaSlot = (app: Appointment): AgendaSlot => ({
  hora: timeToSortable(app.time),
  paciente: app.patientName,
  especialidad: app.professionalSpecialty || app.serviceName,
});

// Horas fijas del día para mostrar aunque no haya citas
const HORAS_DIA = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

// ─── Componente ───────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [citasData, setCitasData] = useState<CitaTabla[]>([]);
  const [agendaSlots, setAgendaSlots] = useState<AgendaSlot[]>(
    HORAS_DIA.map(h => ({ hora: h }))
  );
  const [loading, setLoading] = useState(true);
  const [todayCitasCount, setTodayCitasCount] = useState(0);
  const [totalProfessionals, setTotalProfessionals] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appointments, professionals] = await Promise.all([
          getAppointmentsApi(),
          getProfessionalsApi(),
        ]);

        const today = todayISO();

        // ── Tabla: todas las citas ──────────────────────────────────────
        const mappedCitas: CitaTabla[] = appointments.map((app, index) => {
          let estado: 'confirmada' | 'cancelada' | 'pendiente' = 'pendiente';
          if (app.status === 'Atendida')  estado = 'confirmada';
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

        // ── Agenda del Día: citas de HOY no canceladas, ordenadas ──────
        const todayApps = appointments
          .filter(a => a.date === today && a.status !== 'Cancelada')
          .sort((a, b) => timeToSortable(a.time).localeCompare(timeToSortable(b.time)));

        // Construir mapa de horas → slot con cita (si existe)
        const slotsMap = new Map<string, AgendaSlot>(
          HORAS_DIA.map(h => [h, { hora: h }])
        );
        todayApps.forEach(app => {
          const sortable = timeToSortable(app.time);
          slotsMap.set(sortable, mapToAgendaSlot(app));
        });

        setAgendaSlots(Array.from(slotsMap.values()));
        setTodayCitasCount(todayApps.length);
        setTotalProfessionals(professionals.length);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading text="Cargando panel de administración..." size="lg" />;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__grid">

        {/* ── Left Section ─────────────────────────────────────────────── */}
        <div className="admin-dashboard__left-col">

          {/* Header */}
          <div className="admin-dashboard__header-row">
            <div className="admin-dashboard__title-group">
              <h1 className="admin-dashboard__title">Inicio</h1>
              <p className="admin-dashboard__subtitle">{todayLabel()}</p>
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

            <div className="card kpi-card kpi-card--chart">
              <div className="kpi-card__header">
                <span className="kpi-card__title">Pacientes por Profesional</span>
              </div>
              <div className="kpi-card__chart-wrapper">
                <svg className="donut-chart" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="35" fill="transparent" stroke="#00A896" strokeWidth="16" strokeDasharray="95 125" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="35" fill="transparent" stroke="#0EA5E9" strokeWidth="16" strokeDasharray="60 160" strokeDashoffset="-95" />
                  <circle cx="50" cy="50" r="35" fill="transparent" stroke="#64748B" strokeWidth="16" strokeDasharray="45 175" strokeDashoffset="-155" />
                </svg>
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
              {citasData.length === 0 ? (
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
              )}
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="card activity-card">
            <h2 className="activity-card__title">Actividad Reciente</h2>
            <div className="activity-list">
              {actividadesData.map((act) => (
                <div key={act.id} className="activity-item">
                  <div className="activity-item__avatar" style={{ backgroundColor: act.avatarBg }}>
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

        {/* ── Right Section: Agenda del Día ────────────────────────────── */}
        <div className="admin-dashboard__right-col">
          <div className="card agenda-panel">
            <h2 className="agenda-panel__title">Agenda del Día</h2>
            <div className="agenda-panel__list">
              {agendaSlots.map((slot, idx) => (
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
