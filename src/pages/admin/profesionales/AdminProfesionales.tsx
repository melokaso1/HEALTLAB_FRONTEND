import React, { useState, useMemo, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  Edit3,
  Calendar as CalendarIcon,
  Clock,
  Building,
  Stethoscope,
  CheckCircle2,
  Settings,
  UserPlus,
  Briefcase,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import type {
  Professional,
  MedicalAppointment,
  DiaSemana,
  Jornada,
  ScheduleSlot,
} from './profesional.types';
import { initialProfesionales } from './mockProfesionales';
import { getSchedulableProfessionalsApi, createProfessionalApi } from '../../../services/professionals.service';
import { getAppointmentsApi, getServicesApi } from '../../../services/appointments.service';
import { createAppointmentFromInput } from '../../../services/createAppointment.logic';
import { getPatientByDocumentApi } from '../../../services/patients.service';
import { useAuth } from '../../../context/AuthContext';
import CustomSelect from '../../../components/common/CustomSelect';
import './AdminProfesionales.css';

// Helper: Calculate Sunday / Monday start of a week
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday
  const diff = d.getDate() - day; // Adjust to Sunday
  return new Date(d.setDate(diff));
};

const localDateISO = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatTimeLabel = (hourStr: string): string => {
  const [h] = hourStr.split(':').map(Number);
  if (h === 12) return '12:00 p. m.';
  if (h > 12) return `${h - 12}:00 p. m.`;
  return `${h}:00 a. m.`;
};

const HOURLY_SLOTS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

import type { ProfessionalOption } from '../../../types/appointment.types';

const mapBackendProfToLocal = (p: ProfessionalOption): Professional => {
  // Parse "Dr. Nombre Apellido" → split parts
  const nameParts = p.name.replace(/^(Dr\.|Dra\.|Dr|Dra)\s+/i, '').trim().split(' ');
  const nombre = nameParts[0] ?? '';
  const apellido = nameParts.slice(1).join(' ') || '';
  const tituloPrefix = p.name.match(/^(Dra\.)/i) ? 'Dra.' : 'Dr.';

  return {
    id: p.id,
    nombre,
    apellido,
    tituloPrefix,
    especialidad: p.specialty,
    registroProfesional: '',
    consultorio: '',
    estado: 'Activo',
    citasHoy: 0,
    disponibleHoy: true,
    foto: '',
    disponibilidad: [],
    citas: [],
  };
};

const AdminProfesionales: React.FC = () => {
  const { user } = useAuth();
  // State
  const [profesionales, setProfesionales] = useState<Professional[]>(initialProfesionales);

  useEffect(() => {
    Promise.all([getSchedulableProfessionalsApi(), getAppointmentsApi()]).then(([profs, apps]) => {
      if (Array.isArray(profs)) {
        const localProfs = profs.map(mapBackendProfToLocal);

        const abrevMap: Record<number, DiaSemana> = {
          0: 'DOM', 1: 'LUN', 2: 'MAR', 3: 'MIÉ', 4: 'JUE', 5: 'VIE', 6: 'SÁB',
        };

        const updatedProfs = localProfs.map((prof) => {
          const profApps = (apps || []).filter(
            (a) => String(a.professionalId) === String(prof.id) || (a.professionalName && a.professionalName.includes(prof.nombre))
          );
          const mappedCitas: MedicalAppointment[] = profApps.map((a) => {
            const dateParts = a.date ? a.date.split('-') : [];
            let diaAbrev: DiaSemana = 'LUN';
            if (dateParts.length === 3) {
              const d = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
              diaAbrev = abrevMap[d.getDay()] || 'LUN';
            }
            return {
              id: String(a.id),
              pacienteNombre: a.patientName,
              diaAbrev,
              fecha: a.date,
              horaInicio: a.time,
              horaFin: a.time,
              estado: a.status === 'Agendada'
                ? 'Confirmada'
                : a.status === 'Atendida'
                  ? 'Atendida'
                  : a.status === 'No asistió'
                    ? 'No asistió'
                    : 'Cancelada',
              motivoConsulta: a.notes || a.serviceName,
            };
          });
          return { ...prof, citas: mappedCitas, citasHoy: mappedCitas.length };
        });

        setProfesionales(updatedProfs);
        setSelectedId(updatedProfs[0]?.id ?? '');
      }
    });
  }, []);
  const [selectedId, setSelectedId] = useState<string>(initialProfesionales[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSpecialty, setActiveSpecialty] = useState<string>('Todos');

  const handleSetDoctorStatus = (profId: string, statusVal: string) => {
    const isActivo = statusVal === 'Activo';
    setProfesionales((prev) =>
      prev.map((p) => {
        if (p.id === profId) {
          return {
            ...p,
            disponibleHoy: isActivo,
            estado: isActivo ? 'Activo' : 'Inactivo',
          };
        }
        return p;
      })
    );
  };

  // Week Date State
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(
    getWeekStart(new Date())
  );

  // Modal States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isConfigureScheduleOpen, setIsConfigureScheduleOpen] = useState<boolean>(false);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<MedicalAppointment | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState<boolean>(false);
  const [newAppointmentSlot, setNewAppointmentSlot] = useState<{ dayAbrev: DiaSemana; timeStr: string } | null>(null);

  // Image error state
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Selected Professional object
  const selectedProf = useMemo(() => {
    return profesionales.find((p) => p.id === selectedId) || (profesionales.length > 0 ? profesionales[0] : null);
  }, [profesionales, selectedId]);

  // Information card state (right click or selection)
  const [infoCardProf, setInfoCardProf] = useState<Professional | null>(null);

  useEffect(() => {
    if (selectedProf && !infoCardProf) {
      setInfoCardProf(selectedProf);
    }
  }, [selectedProf]);

  // Dynamic Specialties list for chips
  const specialtyOptions = useMemo(() => {
    const setSpecs = new Set<string>();
    profesionales.forEach((p) => {
      if (p.subespecialidad) {
        setSpecs.add(p.subespecialidad);
      } else {
        const main = p.especialidad.split(' ')[0];
        setSpecs.add(main);
      }
    });
    return ['Todos', ...Array.from(setSpecs)];
  }, [profesionales]);

  // Filtered Professionals List
  const filteredProfesionales = useMemo(() => {
    return profesionales.filter((prof) => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${prof.tituloPrefix} ${prof.nombre} ${prof.apellido}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchLower) ||
        prof.especialidad.toLowerCase().includes(searchLower) ||
        prof.consultorio.toLowerCase().includes(searchLower) ||
        prof.registroProfesional.toLowerCase().includes(searchLower);

      const matchesSpecialty =
        activeSpecialty === 'Todos' ||
        prof.especialidad.toLowerCase().includes(activeSpecialty.toLowerCase()) ||
        (prof.subespecialidad && prof.subespecialidad.toLowerCase().includes(activeSpecialty.toLowerCase()));

      return matchesSearch && matchesSpecialty;
    });
  }, [profesionales, searchTerm, activeSpecialty]);

  // Week Days Array (7 Days starting from Sunday)
  const weekDays = useMemo(() => {
    const days = [];
    const abrevMap: Record<number, DiaSemana> = {
      0: 'DOM',
      1: 'LUN',
      2: 'MAR',
      3: 'MIÉ',
      4: 'JUE',
      5: 'VIE',
      6: 'SÁB',
    };

    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedWeekStart);
      d.setDate(selectedWeekStart.getDate() + i);
      const abrev = abrevMap[d.getDay()];
      const dayNum = d.getDate();
      const monthName = d.toLocaleString('es-ES', { month: 'short' });

      days.push({
        dateObj: d,
        diaAbrev: abrev,
        dayNum,
        monthName,
        label: abrev,
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }
    return days;
  }, [selectedWeekStart]);

  // Week Date Range Label (e.g. "09 ago. 2026 - 15 ago. 2026")
  const weekRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    const start = weekDays[0].dateObj;
    const end = weekDays[6].dateObj;
    const startStr = `${start.getDate()} ${start.toLocaleString('es-ES', { month: 'short' })}.`;
    const endStr = `${end.getDate()} ${end.toLocaleString('es-ES', { month: 'short' })}. ${end.getFullYear()}`;
    return `${startStr} - ${endStr}`;
  }, [weekDays]);

  // Week Navigation Handlers
  const handlePrevWeek = () => {
    const prev = new Date(selectedWeekStart);
    prev.setDate(prev.getDate() - 7);
    setSelectedWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedWeekStart);
    next.setDate(next.getDate() + 7);
    setSelectedWeekStart(next);
  };

  const handleCurrentWeek = () => {
    setSelectedWeekStart(getWeekStart(new Date()));
  };

  // Total calculated weekly hours for selected doctor
  const totalWeeklyHours = useMemo(() => {
    if (!selectedProf) return 0;
    let totalMinutes = 0;
    selectedProf.disponibilidad.forEach((slot) => {
      if (slot.activo && slot.horaInicio && slot.horaFin) {
        const [hStart, mStart] = slot.horaInicio.split(':').map(Number);
        const [hEnd, mEnd] = slot.horaFin.split(':').map(Number);
        const diffMins = hEnd * 60 + mEnd - (hStart * 60 + mStart);
        if (diffMins > 0) totalMinutes += diffMins;
      }
    });
    return Math.round(totalMinutes / 60);
  }, [selectedProf]);

  // Handler: Update Professional Profile
  const handleSaveProfile = (updatedData: Partial<Professional>) => {
    if (!selectedProf) return;
    setProfesionales((prev) =>
      prev.map((p) => (p.id === selectedProf.id ? { ...p, ...updatedData } : p))
    );
    setIsEditProfileOpen(false);
    showToast(`Perfil de ${selectedProf.tituloPrefix} ${selectedProf.nombre} ${selectedProf.apellido} actualizado.`);
  };

  // Handler: Save Schedule Configuration
  const handleSaveSchedule = (updatedSchedule: ScheduleSlot[]) => {
    if (!selectedProf) return;
    setProfesionales((prev) =>
      prev.map((p) => {
        if (p.id === selectedProf.id) {
          return { ...p, disponibilidad: updatedSchedule };
        }
        return p;
      })
    );
    setIsConfigureScheduleOpen(false);
    showToast('Disponibilidad semanal configurada correctamente.');
  };
  // Handler: Add New Professional
  const handleAddNewDoctor = async (newDoctor: Omit<Professional, 'id'>) => {
    try {
      const createdOpt = await createProfessionalApi({
        nombre: newDoctor.nombre,
        apellido: newDoctor.apellido,
        numeroDocumento: newDoctor.numeroDocumento || '',
        email: newDoctor.email || '',
        password: newDoctor.password || '',
        telefono: newDoctor.telefono || '',
        direccion: newDoctor.direccion || '',
        especialidad: newDoctor.especialidad,
        registroProfesional: newDoctor.registroProfesional,
        consultorio: newDoctor.consultorio,
      });

      const mappedProf = mapBackendProfToLocal(createdOpt);
      const fullProf: Professional = {
        ...newDoctor,
        ...mappedProf,
        id: createdOpt.id,
        nombre: newDoctor.nombre || mappedProf.nombre,
        apellido: newDoctor.apellido || mappedProf.apellido,
        especialidad: newDoctor.especialidad || mappedProf.especialidad,
        disponibilidad: newDoctor.disponibilidad || mappedProf.disponibilidad || [],
      };

      setProfesionales((prev) => [fullProf, ...prev.filter((p) => String(p.id) !== String(fullProf.id))]);
      setSelectedId(fullProf.id);
      setIsAddDoctorOpen(false);
      showToast(`Nuevo profesional ${fullProf.tituloPrefix} ${fullProf.nombre} ${fullProf.apellido} registrado.`);
    } catch (error) {
      console.error('[AdminProfesionales] Error al crear médico:', error);
      showToast('Error al registrar el profesional en el servidor.');
    }
  };

  // Handler: Create New Appointment
  const handleCreateAppointment = async (
    newApp: Omit<MedicalAppointment, 'id'> & { pacienteCedula?: string },
  ) => {
    if (!selectedProf) return;

    const abrevMap: Record<number, DiaSemana> = {
      0: 'DOM', 1: 'LUN', 2: 'MAR', 3: 'MIÉ', 4: 'JUE', 5: 'VIE', 6: 'SÁB',
    };

    try {
      const document = newApp.pacienteCedula?.trim();
      if (!document) {
        throw new Error('Ingrese la cédula del paciente antes de agendar.');
      }
      const patient = await getPatientByDocumentApi(document);
      if (!patient) {
        throw new Error('No existe un paciente con esa cédula. Regístrelo antes de agendar.');
      }
      const services = await getServicesApi();
      const service = services.find((item) =>
        item.name.trim().toLowerCase() === newApp.motivoConsulta.trim().toLowerCase(),
      ) ?? services.find((item) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id));
      if (!service) {
        throw new Error('No hay un tipo de cita válido disponible en el servidor.');
      }
      const result = await createAppointmentFromInput({
        patientId: patient.id,
        patientName: patient.name,
        professionalId: selectedProf.id,
        professionalName: `${selectedProf.tituloPrefix} ${selectedProf.nombre} ${selectedProf.apellido}`.trim(),
        professionalSpecialty: selectedProf.especialidad,
        serviceId: service.id,
        serviceName: service.name,
        date: newApp.fecha || localDateISO(),
        time: newApp.horaInicio || '09:00',
        notes: newApp.motivoConsulta,
        usuarioCreacionId: user?.id,
      });
      if (!result.ok) throw new Error(result.error);
      const createdBackend = result.appointment;

      const dateParts = (newApp.fecha || '').split('-');
      let diaAbrev: DiaSemana = newApp.diaAbrev || 'LUN';
      if (dateParts.length === 3) {
        const d = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
        diaAbrev = abrevMap[d.getDay()] || 'LUN';
      }

      const createdLocal: MedicalAppointment = {
        ...newApp,
        id: String(createdBackend.id),
        diaAbrev,
      };

      setProfesionales((prev) =>
        prev.map((p) => {
          if (p.id === selectedProf.id) {
            return { ...p, citas: [...p.citas, createdLocal], citasHoy: p.citasHoy + 1 };
          }
          return p;
        })
      );
      setIsNewAppointmentOpen(false);
      setNewAppointmentSlot(null);
      showToast(`Cita médica agendada exitosamente en la base de datos para ${newApp.pacienteNombre}.`);
    } catch (error: any) {
      console.error('[AdminProfesionales] Error al agendar cita en backend:', error);
      showToast(error.message || 'Error al guardar la cita en la base de datos.');
    }
  };

  // Utility: Check if doctor is available in a given day and hour
  const isAvailableSlot = (diaAbrev: DiaSemana, hourStr: string): boolean => {
    if (!selectedProf) return false;
    const hourNum = parseInt(hourStr.split(':')[0], 10);
    const jornada: Jornada = hourNum < 14 ? 'Mañana' : 'Tarde';
    const slot = selectedProf.disponibilidad.find(
      (s) => s.dia === diaAbrev && s.jornada === jornada
    );
    if (!slot || !slot.activo) return false;

    const [startH] = slot.horaInicio.split(':').map(Number);
    const [endH] = slot.horaFin.split(':').map(Number);
    return hourNum >= startH && hourNum < endH;
  };

  // Utility: Find appointment at specific day and hour slot
  const getAppointmentAtSlot = (diaAbrev: DiaSemana, hourStr: string): MedicalAppointment | undefined => {
    if (!selectedProf) return undefined;
    return selectedProf.citas.find((c) => {
      if (c.diaAbrev !== diaAbrev) return false;
      const appStartHour = c.horaInicio.split(':')[0];
      const slotHour = hourStr.split(':')[0];
      return appStartHour === slotHour;
    });
  };

  return (
    <div className="profesionales-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-banner success">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="profesionales-header">
        <div className="profesionales-header__title-group">
          <h1 className="profesionales-header__title">
            <UserCheck className="title-icon" size={26} color="#00A896" />
            Gestión de Profesionales
          </h1>
          <p className="profesionales-header__subtitle">
            Directorio médico, agenda semanal de citas y configuración de disponibilidad
          </p>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="profesionales-layout">
        {/* ====================================================
            COLUMNA IZQUIERDA — Directorio (30%)
            ==================================================== */}
        <div className="hl-card directory-card">
          {/* Directory Title Row */}
          <div className="directory-card__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="directory-card__title">Directorio</h2>
              <span className="directory-card__count">
                {filteredProfesionales.length}
              </span>
            </div>
          </div>

          {/* Controls: Search + Specialty Filter Chips */}
          <div className="directory-card__controls">
            {/* Search Input */}
            <div className="search-input-wrapper">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar profesional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                  }}
                  onClick={() => setSearchTerm('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Specialty Dropdown Select */}
            <CustomSelect
              value={activeSpecialty}
              onChange={(val) => setActiveSpecialty(val)}
              options={specialtyOptions.map((spec) => ({
                value: spec,
                label: spec === 'Todos' ? 'Todas las especialidades' : spec,
              }))}
            />
          </div>

          {/* Directory Professionals List */}
          <div className="doctor-list">
            {filteredProfesionales.length === 0 ? (
              <div
                style={{
                  padding: '30px 16px',
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: '13px',
                }}
              >
                No se encontraron profesionales con los filtros aplicados.
              </div>
            ) : (
              filteredProfesionales.map((prof) => {
                const isSelected = selectedProf?.id === prof.id;
                const fullName = `${prof.tituloPrefix} ${prof.nombre} ${prof.apellido}`.trim();
                return (
                  <div
                    key={prof.id}
                    className={`doctor-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedId(prof.id);
                      setInfoCardProf(prof);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedId(prof.id);
                      setInfoCardProf(prof);
                      showToast(`Mostrando información detallada de ${fullName}`);
                    }}
                    onDoubleClick={() => {
                      setSelectedId(prof.id);
                      setIsEditProfileOpen(true);
                    }}
                    title={`Clic derecho para ver información. Doble clic para editar a ${fullName}`}
                  >
                    {/* Doctor Avatar */}
                    <div className="doctor-avatar-wrapper">
                      {prof.foto && !imageErrors[prof.id] ? (
                        <img
                          src={prof.foto}
                          alt={fullName}
                          className="doctor-avatar"
                          onError={() => handleImageError(prof.id)}
                        />
                      ) : (
                        <div className="doctor-avatar-fallback">
                          {prof.nombre[0]}
                          {prof.apellido[0]}
                        </div>
                      )}
                      <span
                        className={`status-dot-indicator ${
                          prof.disponibleHoy ? 'online' : 'offline'
                        }`}
                        title={prof.disponibleHoy ? 'Activo hoy' : 'Inactivo'}
                      />
                    </div>

                    {/* Doctor Info */}
                    <div className="doctor-info" title={fullName}>
                      <h3 className="doctor-name" title={fullName}>
                        {fullName}
                      </h3>
                      <p className="doctor-specialty" title={prof.especialidad}>{prof.especialidad}</p>
                      <div className="doctor-appointments">
                        <CalendarIcon size={12} color="#64748B" />
                        <span>{prof.citasHoy} citas hoy</span>
                      </div>
                    </div>

                    {/* Quick Status CustomSelect Dropdown */}
                    <div className="doctor-status-badge" onClick={(e) => e.stopPropagation()}>
                      <CustomSelect
                        value={prof.disponibleHoy ? 'Activo' : 'Inactivo'}
                        onChange={(val) => handleSetDoctorStatus(prof.id, val)}
                        options={[
                          { value: 'Activo', label: '● Activo' },
                          { value: 'Inactivo', label: '● Inactivo' },
                        ]}
                        className={`doctor-status-custom-select ${
                          prof.disponibleHoy
                            ? 'doctor-status-custom-select--active'
                            : 'doctor-status-custom-select--inactive'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ====================================================
            COLUMNA DERECHA — Información y Calendario (70%)
            ==================================================== */}
        <div className="detail-column">
          {selectedProf ? (
            <>
              {/* AGENDA SEMANAL DE CITAS */}
              <div className="hl-card calendar-card">
                {/* Toolbar Above Calendar: Selector de fechas por semana */}
                <div className="calendar-toolbar">
                  <div className="calendar-toolbar__left">
                    <div className="week-selector-group">
                      <button
                        className="btn-week-nav"
                        title="Semana anterior"
                        onClick={handlePrevWeek}
                      >
                        <ChevronLeft size={18} />
                      </button>

                      {/* Botón selector de fechas por semana */}
                      <button
                        className="week-date-trigger"
                        title="Seleccionar semana"
                        onClick={handleCurrentWeek}
                      >
                        <CalendarIcon size={16} color="#00A896" />
                        <span>{weekRangeLabel}</span>
                      </button>

                      <button
                        className="btn-week-nav"
                        title="Semana siguiente"
                        onClick={handleNextWeek}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>

                    <button
                      className="btn-today-shortcut"
                      onClick={handleCurrentWeek}
                    >
                      Semana actual
                    </button>
                  </div>

                  <div className="calendar-toolbar__right">
                    <button
                      className="btn-primary"
                      style={{ padding: '5px 12px', fontSize: '12px' }}
                      title="Configurar disponibilidad"
                      onClick={() => setIsConfigureScheduleOpen(true)}
                    >
                      <Settings size={14} />
                      <span>Configurar Horario</span>
                    </button>
                  </div>
                </div>

                {/* Timetable CSS Grid View */}
                <div className="calendar-grid-container">
                  {/* Header Row: Column Days */}
                  <div className="calendar-grid-header">
                    <div className="time-header-cell">HORA</div>
                    {weekDays.map((d) => (
                      <div
                        key={d.diaAbrev}
                        className={`day-header-col ${
                          d.isToday ? 'is-today' : ''
                        } ${d.diaAbrev === 'MIÉ' ? 'is-selected-day' : ''}`}
                      >
                        <div className="day-header-badge">
                          {d.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Body Rows: Vertical Hours Axis (07:00 a.m. - 20:00 p.m.) */}
                  <div className="calendar-grid-body">
                    {HOURLY_SLOTS.map((hourStr) => (
                      <div key={hourStr} className="calendar-hour-row">
                        {/* Y-Axis Hour Label */}
                        <div className="time-axis-cell">
                          {formatTimeLabel(hourStr)}
                        </div>

                        {/* 7 Days Columns for this hour */}
                        {weekDays.map((day) => {
                          const app = getAppointmentAtSlot(day.diaAbrev, hourStr);
                          const available = isAvailableSlot(day.diaAbrev, hourStr);

                          return (
                            <div
                              key={`${day.diaAbrev}-${hourStr}`}
                              className={`grid-day-cell ${
                                available ? 'is-available-slot' : ''
                              }`}
                              onClick={() => {
                                if (!app && available) {
                                  setNewAppointmentSlot({
                                    dayAbrev: day.diaAbrev,
                                    timeStr: hourStr,
                                  });
                                  setIsNewAppointmentOpen(true);
                                }
                              }}
                            >
                              {app ? (
                                <div
                                  className={`appointment-card-block status-${app.estado.toLowerCase()}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAppointment(app);
                                  }}
                                >
                                  <h4 className="appointment-card-header">
                                    <Stethoscope size={12} />
                                    <span>{app.motivoConsulta}</span>
                                  </h4>

                                  <p className="appointment-patient-name">
                                    {app.pacienteNombre}
                                  </p>

                                  <div className="appointment-time-badge">
                                    <span>
                                      {app.horaInicio === app.horaFin ? app.horaInicio : `${app.horaInicio} - ${app.horaFin}`}
                                    </span>
                                    <span
                                      className={`status-chip-mini ${app.estado.toLowerCase()}`}
                                    >
                                      {app.estado}
                                    </span>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Legend */}
                <div className="calendar-grid-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={15} color="#00A896" />
                    <span>
                      Total horas configuradas: <strong>{totalWeeklyHours}h semanales</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '2px',
                          backgroundColor: 'rgba(0, 168, 150, 0.08)',
                          border: '1px solid var(--hl-primary-border)',
                        }}
                      />
                      <span>Horario de Atención</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '2px',
                          backgroundColor: 'var(--hl-primary)',
                        }}
                      />
                      <span>Cita Médica Agendada</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD DE INFORMACIÓN DETALLADA DEL PROFESIONAL MÉDICO */}
              {infoCardProf && (
                <div className="hl-card prof-info-detail-card" style={{ marginTop: '16px' }}>
                  <div className="prof-info-card__header">
                    <div className="prof-info-card__identity">
                      <div className="prof-info-card__avatar">
                        {infoCardProf.foto && !imageErrors[infoCardProf.id] ? (
                          <img src={infoCardProf.foto} alt={infoCardProf.nombre} />
                        ) : (
                          <span>{infoCardProf.nombre[0]}{infoCardProf.apellido[0]}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="prof-info-card__name">
                          {infoCardProf.tituloPrefix} {infoCardProf.nombre} {infoCardProf.apellido}
                        </h3>
                        <p className="prof-info-card__spec">{infoCardProf.especialidad}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: infoCardProf.disponibleHoy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: infoCardProf.disponibleHoy ? '#10B981' : '#EF4444',
                        }}
                      >
                        ● {infoCardProf.disponibleHoy ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        type="button"
                        className="btn-icon"
                        title="Cerrar información del profesional"
                        onClick={() => setInfoCardProf(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--hl-text-sub)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          borderRadius: '6px',
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="prof-info-card__grid">
                    <div className="prof-info-item">
                      <span className="prof-info-label">Documento</span>
                      <span className="prof-info-val">{infoCardProf.numeroDocumento || 'CC - 1098765432'}</span>
                    </div>
                    <div className="prof-info-item">
                      <span className="prof-info-label">Registro Profesional</span>
                      <span className="prof-info-val">{infoCardProf.registroProfesional || 'CMP-45892'}</span>
                    </div>
                    <div className="prof-info-item">
                      <span className="prof-info-label">Consultorio</span>
                      <span className="prof-info-val">{infoCardProf.consultorio || 'Consultorio 302'}</span>
                    </div>
                    <div className="prof-info-item">
                      <span className="prof-info-label">Correo Electrónico</span>
                      <span className="prof-info-val">{infoCardProf.email || `${infoCardProf.nombre.toLowerCase()}@healtlab.com`}</span>
                    </div>
                    <div className="prof-info-item">
                      <span className="prof-info-label">Teléfono</span>
                      <span className="prof-info-val">{infoCardProf.telefono || '+57 300 123 4567'}</span>
                    </div>
                    <div className="prof-info-item">
                      <span className="prof-info-label">Citas de Hoy</span>
                      <span className="prof-info-val">{infoCardProf.citasHoy} citas</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="hl-card empty-selection-state">
              <div className="empty-icon-circle">
                <Stethoscope size={32} />
              </div>
              <h3 style={{ margin: 0, color: 'var(--hl-text-main)' }}>
                Selecciona un profesional
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--hl-text-sub)' }}>
                Elige un médico del directorio para consultar su perfil y agenda semanal de citas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================
          MODAL 1: EDITAR PERFIL DEL PROFESIONAL
          ==================================================== */}
      {isEditProfileOpen && selectedProf && (
        <EditProfileModal
          professional={selectedProf}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* ====================================================
          MODAL 2: CONFIGURAR DISPONIBILIDAD SEMANAL
          ==================================================== */}
      {isConfigureScheduleOpen && selectedProf && (
        <ConfigureScheduleModal
          currentSchedule={selectedProf.disponibilidad}
          onClose={() => setIsConfigureScheduleOpen(false)}
          onSave={handleSaveSchedule}
        />
      )}

      {/* ====================================================
          MODAL 3: REGISTRAR NUEVO PROFESIONAL
          ==================================================== */}
      {isAddDoctorOpen && (
        <AddProfessionalModal
          onClose={() => setIsAddDoctorOpen(false)}
          onSave={handleAddNewDoctor}
        />
      )}

      {/* ====================================================
          MODAL 4: DETALLES DE CITA MÉDICA
          ==================================================== */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      {/* ====================================================
          MODAL 5: AGENDAR NUEVA CITA MÉDICA
          ==================================================== */}
      {isNewAppointmentOpen && (
        <NewAppointmentModal
          initialSlot={newAppointmentSlot}
          onClose={() => {
            setIsNewAppointmentOpen(false);
            setNewAppointmentSlot(null);
          }}
          onSave={handleCreateAppointment}
        />
      )}
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT MODAL 1: Edit Profile Modal
   ========================================================================= */
interface EditProfileModalProps {
  professional: Professional;
  onClose: () => void;
  onSave: (updated: Partial<Professional>) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  professional,
  onClose,
  onSave,
}) => {
  const [nombre, setNombre] = useState(professional.nombre);
  const [apellido, setApellido] = useState(professional.apellido);
  const [tituloPrefix, setTituloPrefix] = useState(professional.tituloPrefix);
  const [especialidad, setEspecialidad] = useState(professional.especialidad);
  const [registroProfesional, setRegistroProfesional] = useState(professional.registroProfesional);
  const [consultorio, setConsultorio] = useState(professional.consultorio);
  const [estado, setEstado] = useState(professional.estado);
  const foto = professional.foto;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nombre,
      apellido,
      tituloPrefix,
      especialidad,
      registroProfesional,
      consultorio,
      estado,
      foto,
      disponibleHoy: estado === 'Activo',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Edit3 size={18} color="#00A896" />
            Editar Perfil del Profesional
          </h3>
          <button className="btn-icon" type="button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prefijo Título</label>
                <select
                  className="form-select"
                  value={tituloPrefix}
                  onChange={(e) => setTituloPrefix(e.target.value)}
                >
                  <option value="Dra.">Dra.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Lic.">Lic.</option>
                  <option value="Mg.">Mg.</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Especialidad</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Registro / Lic. Profesional</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={registroProfesional}
                  onChange={(e) => setRegistroProfesional(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Consultorio / Ubicación</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={consultorio}
                  onChange={(e) => setConsultorio(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={estado}
                onChange={(e) => setEstado(e.target.value as 'Activo' | 'Inactivo')}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT MODAL 2: Configure Schedule Modal
   ========================================================================= */
interface ConfigureScheduleModalProps {
  currentSchedule: ScheduleSlot[];
  onClose: () => void;
  onSave: (newSchedule: ScheduleSlot[]) => void;
}

const ConfigureScheduleModal: React.FC<ConfigureScheduleModalProps> = ({
  currentSchedule,
  onClose,
  onSave,
}) => {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(
    JSON.parse(JSON.stringify(currentSchedule))
  );

  const [targetDay, setTargetDay] = useState<string>('TODOS');
  const [targetJornada, setTargetJornada] = useState<Jornada | 'AMBAS'>('AMBAS');
  const [horaInicio, setHoraInicio] = useState<string>('08:00');
  const [horaFin, setHoraFin] = useState<string>('18:00');
  const [activo, setActivo] = useState<boolean>(true);

  const handleJornadaChange = (val: Jornada | 'AMBAS') => {
    setTargetJornada(val);
    if (val === 'Mañana') {
      setHoraInicio('08:00');
      setHoraFin('12:00');
    } else if (val === 'Tarde') {
      setHoraInicio('13:00');
      setHoraFin('18:00');
    } else {
      setHoraInicio('08:00');
      setHoraFin('18:00');
    }
  };

  const handleToggleSlot = (index: number) => {
    setSchedule((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, activo: !slot.activo } : slot))
    );
  };

  const handleSlotTimeChange = (
    index: number,
    field: 'horaInicio' | 'horaFin',
    val: string
  ) => {
    setSchedule((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: val } : slot))
    );
  };

  const handleApplyBatch = () => {
    setSchedule((prev) =>
      prev.map((slot) => {
        const matchesDay = targetDay === 'TODOS' || slot.dia === targetDay;

        if (matchesDay) {
          if (targetJornada === 'AMBAS') {
            return {
              ...slot,
              horaInicio: slot.jornada === 'Mañana' ? '08:00' : '13:00',
              horaFin: slot.jornada === 'Mañana' ? '12:00' : '18:00',
              activo,
            };
          }

          if (slot.jornada === targetJornada) {
            return {
              ...slot,
              horaInicio: horaInicio || slot.horaInicio,
              horaFin: horaFin || slot.horaFin,
              activo: true,
            };
          } else {
            // Desactivar la jornada opuesta cuando se selecciona un turno especifico (ej: solo Mañana)
            return {
              ...slot,
              activo: false,
            };
          }
        }
        return slot;
      })
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Settings size={18} color="#00A896" />
            Configurar Disponibilidad Semanal
          </h3>
          <button className="btn-icon" type="button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--hl-bg-page)',
              borderRadius: '8px',
              border: '1px solid var(--hl-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hl-text-main)' }}>
              Configuración rápida por bloque
            </span>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Día</label>
                <select
                  className="form-select"
                  value={targetDay}
                  onChange={(e) => setTargetDay(e.target.value)}
                >
                  <option value="TODOS">Todos los días</option>
                  <option value="LUN">Lunes</option>
                  <option value="MAR">Martes</option>
                  <option value="MIÉ">Miércoles</option>
                  <option value="JUE">Jueves</option>
                  <option value="VIE">Viernes</option>
                  <option value="SÁB">Sábado</option>
                  <option value="DOM">Domingo</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Jornada</label>
                <select
                  className="form-select"
                  value={targetJornada}
                  onChange={(e) => handleJornadaChange(e.target.value as Jornada | 'AMBAS')}
                >
                  <option value="AMBAS">Ambas (Mañana y Tarde)</option>
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hora Inicio</label>
                <input
                  type="time"
                  className="form-input"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hora Fin</label>
                <input
                  type="time"
                  className="form-input"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                />
                Marcar como Disponible
              </label>

              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={handleApplyBatch}
              >
                Aplicar a la selección
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hl-text-main)' }}>
              Detalle día por día
            </span>

            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid var(--hl-border)',
                borderRadius: '8px',
              }}
            >
              {schedule.map((slot, idx) => (
                <div
                  key={`${slot.dia}-${slot.jornada}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: idx < schedule.length - 1 ? '1px solid var(--hl-border)' : 'none',
                    backgroundColor: slot.activo ? 'var(--hl-card-bg)' : 'var(--hl-bg-page)',
                  }}
                >
                  <div style={{ minWidth: '130px', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--hl-text-main)' }}>
                      {slot.diaNombre}
                    </span>
                    <span style={{ fontSize: '11px', color: slot.jornada === 'Mañana' ? '#00A896' : '#4C62D6', fontWeight: 600 }}>
                      {slot.jornada}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="time"
                      disabled={!slot.activo}
                      value={slot.horaInicio}
                      onChange={(e) => handleSlotTimeChange(idx, 'horaInicio', e.target.value)}
                      style={{ padding: '4px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                    />
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>a</span>
                    <input
                      type="time"
                      disabled={!slot.activo}
                      value={slot.horaFin}
                      onChange={(e) => handleSlotTimeChange(idx, 'horaFin', e.target.value)}
                      style={{ padding: '4px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                    />
                  </div>

                  <button
                    type="button"
                    style={{
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: slot.activo ? '#ECFDF5' : '#F1F5F9',
                      color: slot.activo ? '#10B981' : '#64748B',
                    }}
                    onClick={() => handleToggleSlot(idx)}
                  >
                    {slot.activo ? '● Activo' : '○ Sin turnos'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onSave(schedule)}
          >
            <Check size={16} />
            Guardar Disponibilidad
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT MODAL 3: Add New Professional Modal
   ========================================================================= */
interface AddProfessionalModalProps {
  onClose: () => void;
  onSave: (doctor: Omit<Professional, 'id'>) => Promise<void>;
}

const AddProfessionalModal: React.FC<AddProfessionalModalProps> = ({
  onClose,
  onSave,
}) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [tituloPrefix, setTituloPrefix] = useState('Dra.');
  const [especialidad, setEspecialidad] = useState('');
  const [registroProfesional, setRegistroProfesional] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [consultorio, setConsultorio] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const DIAS_KEYS: DiaSemana[] = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const defaultSchedule: ScheduleSlot[] = DIAS_KEYS.flatMap((d) => [
      {
        dia: d,
        diaNombre: d === 'LUN' ? 'Lunes' : d === 'MAR' ? 'Martes' : d === 'MIÉ' ? 'Miércoles' : d === 'JUE' ? 'Jueves' : d === 'VIE' ? 'Viernes' : d === 'SÁB' ? 'Sábado' : 'Domingo',
        jornada: 'Mañana',
        horaInicio: '08:00',
        horaFin: '13:00',
        activo: d !== 'DOM',
      },
      {
        dia: d,
        diaNombre: d === 'LUN' ? 'Lunes' : d === 'MAR' ? 'Martes' : d === 'MIÉ' ? 'Miércoles' : d === 'JUE' ? 'Jueves' : d === 'VIE' ? 'Viernes' : d === 'SÁB' ? 'Sábado' : 'Domingo',
        jornada: 'Tarde',
        horaInicio: '14:00',
        horaFin: '18:00',
        activo: d !== 'SÁB' && d !== 'DOM',
      },
    ]);

    try {
      setIsSubmitting(true);
      await onSave({
        nombre,
        apellido,
        tituloPrefix,
        especialidad,
        registroProfesional,
        numeroDocumento,
        email,
        password,
        telefono,
        direccion,
        consultorio,
        estado: 'Activo',
        citasHoy: 0,
        disponibleHoy: true,
        foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
        disponibilidad: defaultSchedule,
        citas: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <UserPlus size={18} color="#00A896" />
            Registrar Nuevo Profesional
          </h3>
          <button className="btn-icon" type="button" onClick={onClose} disabled={isSubmitting}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prefijo Título</label>
                <select
                  className="form-select"
                  value={tituloPrefix}
                  onChange={(e) => setTituloPrefix(e.target.value)}
                >
                  <option value="Dra.">Dra.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Lic.">Lic.</option>
                  <option value="Mg.">Mg.</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej. Sarah"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  className="form-input"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej. Jenkins"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Especialidad Médica</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej. Cardiología Intervencionista"
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Licencia / Registro Médico</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej. CMP-45892"
                  value={registroProfesional}
                  onChange={(e) => setRegistroProfesional(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Documento</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  maxLength={30}
                  placeholder="Documento de identidad"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Consultorio Asignado</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej. Consultorio 302"
                  value={consultorio}
                  onChange={(e) => setConsultorio(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Check size={16} />
              {isSubmitting ? 'Registrando…' : 'Registrar Profesional'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT MODAL 4: Appointment Detail Modal
   ========================================================================= */
interface AppointmentDetailModalProps {
  appointment: MedicalAppointment;
  onClose: () => void;
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  onClose,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Stethoscope size={18} color="#00A896" />
            Detalle de Cita Médica
          </h3>
          <button className="btn-icon" type="button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--hl-bg-page)',
              borderRadius: '10px',
              border: '1px solid var(--hl-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--hl-text-main)' }}>
                {appointment.motivoConsulta}
              </span>
              <span className={`status-chip-mini ${appointment.estado.toLowerCase()}`}>
                {appointment.estado}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hl-text-sub)' }}>
                <User size={15} color="#00A896" />
                <span>
                  Paciente: <strong style={{ color: 'var(--hl-text-main)' }}>{appointment.pacienteNombre}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                <Clock size={15} color="#4C62D6" />
                <span>
                  Horario: <strong>{appointment.horaInicio} - {appointment.horaFin}</strong> ({appointment.diaAbrev})
                </span>
              </div>

              {appointment.consultorio && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                  <Building size={15} color="#10B981" />
                  <span>Ubicación: <strong>{appointment.consultorio}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   SUB-COMPONENT MODAL 5: New Appointment Modal
   ========================================================================= */
interface NewAppointmentModalProps {
  initialSlot: { dayAbrev: DiaSemana; timeStr: string } | null;
  onClose: () => void;
  onSave: (app: Omit<MedicalAppointment, 'id'> & { pacienteCedula?: string }) => void;
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  initialSlot,
  onClose,
  onSave,
}) => {
  const [pacienteCedula, setPacienteCedula] = useState('');
  const [pacienteNombre, setPacienteNombre] = useState('');
  const [motivoConsulta, setMotivoConsulta] = useState('Consulta Especializada');
  const [diaAbrev, setDiaAbrev] = useState<DiaSemana>(initialSlot?.dayAbrev || 'LUN');
  const [fechaExacta, setFechaExacta] = useState<string>(() => {
    return localDateISO();
  });
  const [horaInicio, setHoraInicio] = useState(initialSlot?.timeStr || '09:00');
  const [horaFin, setHoraFin] = useState('10:00');

  const handleDateChange = (val: string) => {
    setFechaExacta(val);
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const abrevMap: Record<number, DiaSemana> = {
          0: 'DOM', 1: 'LUN', 2: 'MAR', 3: 'MIÉ', 4: 'JUE', 5: 'VIE', 6: 'SÁB',
        };
        setDiaAbrev(abrevMap[d.getDay()] || 'LUN');
      }
    }
  };

  const handleDaySelectChange = (day: DiaSemana) => {
    setDiaAbrev(day);
    const dayIndexMap: Record<DiaSemana, number> = {
      DOM: 0, LUN: 1, MAR: 2, MIÉ: 3, JUE: 4, VIE: 5, SÁB: 6,
    };
    const currentD = new Date(fechaExacta + 'T00:00:00');
    const currentDayIdx = currentD.getDay();
    const targetDayIdx = dayIndexMap[day];
    const diff = targetDayIdx - currentDayIdx;
    currentD.setDate(currentD.getDate() + diff);
    setFechaExacta(localDateISO(currentD));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      pacienteNombre: pacienteNombre.trim(),
      pacienteCedula: pacienteCedula.trim(),
      motivoConsulta,
      diaAbrev,
      fecha: fechaExacta,
      horaInicio,
      horaFin,
      estado: 'Confirmada',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Plus size={18} color="#00A896" />
            Agendar Nueva Cita Médica
          </h3>
          <button className="btn-icon" type="button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Cédula / Documento del Paciente</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. 1098472635"
                required
                value={pacienteCedula}
                onChange={(e) => setPacienteCedula(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre del Paciente</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej. Roberto Gómez"
                value={pacienteNombre}
                onChange={(e) => setPacienteNombre(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Motivo de Consulta / Servicio</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej. Consulta Cardiológica"
                value={motivoConsulta}
                onChange={(e) => setMotivoConsulta(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha de la Cita</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={fechaExacta}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Día de la Semana</label>
                <select
                  className="form-select"
                  value={diaAbrev}
                  onChange={(e) => handleDaySelectChange(e.target.value as DiaSemana)}
                >
                  <option value="LUN">Lunes</option>
                  <option value="MAR">Martes</option>
                  <option value="MIÉ">Miércoles</option>
                  <option value="JUE">Jueves</option>
                  <option value="VIE">Viernes</option>
                  <option value="SÁB">Sábado</option>
                  <option value="DOM">Domingo</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hora Inicio</label>
                <input
                  type="time"
                  className="form-input"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hora Fin</label>
                <input
                  type="time"
                  className="form-input"
                  required
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              Agendar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfesionales;
