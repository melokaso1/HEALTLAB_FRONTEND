import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Clock,
  Stethoscope,
  FileText,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  UserX,
  CalendarDays,
  MoreVertical,
} from 'lucide-react';
import type {
  Appointment,
  AppointmentStatus,
  ProfessionalOption,
} from '../../../types/appointment.types';
import type { Patient } from '../../../types/patient.types';
import {
  mockAppointments,
  mockServices,
  AVAILABLE_TIME_SLOTS,
  checkScheduleConflict,
  getAppointmentsApi,
  createAppointmentApi,
  cancelAppointmentApi,
  updateAppointmentStatusApi,
  rescheduleAppointmentApi,
} from '../../../services/appointments.service';
import { mockProfessionals, getProfessionalsApi } from '../../../services/professionals.service';
import { mockPatients, getPatientsApi } from '../../../services/patients.service';
import { useAuth } from '../../../context/AuthContext';
import CustomSelect from '../../../components/common/CustomSelect';
import './AppointmentsManagement.css';

const AppointmentsManagement: React.FC = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'professional' || (user?.role as string) === 'medico';

  // Main Data States
  const [appointments, setPatientsAppointments] = useState<Appointment[]>(mockAppointments);
  const [patientsList, setPatientsList] = useState<Patient[]>(mockPatients);
  const [professionalsList, setProfessionalsList] = useState<ProfessionalOption[]>(mockProfessionals);

  const [filterByDate, setFilterByDate] = useState<boolean>(true);
  const [selectedAppId, setSelectedAppId] = useState<string | number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-28'); // Current active date view

  useEffect(() => {
    getAppointmentsApi().then((data) => {
      if (data && data.length > 0) {
        setPatientsAppointments(data);
        if (data[0]?.date) {
          setSelectedDate(data[0].date);
          const parts = data[0].date.split('-');
          if (parts.length === 3) {
            const yr = parseInt(parts[0], 10);
            const mo = parseInt(parts[1], 10) - 1;
            if (!isNaN(yr) && !isNaN(mo)) {
              setCalendarViewDate(new Date(yr, mo, 1));
            }
          }
        }
      }
    });
    getPatientsApi().then((data) => {
      if (data && data.length > 0) {
        setPatientsList(data);
      }
    });
    getProfessionalsApi().then((data) => {
      if (data && data.length > 0) {
        setProfessionalsList(data);
      }
    });
  }, []);

  // Dynamic Calendar Month Navigation State
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date(2026, 9, 1)); // Oct 2026

  const handlePrevMonth = () => {
    setCalendarViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Calendar Days Calculation & Event Attachment
  const calendarDaysInfo = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthTitle = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
    const totalDaysMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{
      dayNum: number;
      isCurrentMonth: boolean;
      dateStr: string;
      dayApps: Appointment[];
    }> = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = totalDaysPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dayNum: day,
        isCurrentMonth: false,
        dateStr,
        dayApps: appointments.filter((a) => a.date === dateStr),
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dayNum: day,
        isCurrentMonth: true,
        dateStr,
        dayApps: appointments.filter((a) => a.date === dateStr),
      });
    }

    // Next month padding to reach full grid cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dayNum: day,
        isCurrentMonth: false,
        dateStr,
        dayApps: appointments.filter((a) => a.date === dateStr),
      });
    }

    return { monthTitle, cells };
  }, [calendarViewDate, appointments]);

  // Filters
  const [profFilter, setProfFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Panels State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Selected Appointment for detail & reschedule
  const selectedAppointment = useMemo(() => {
    if (selectedAppId === null) return null;
    return appointments.find((a) => String(a.id) === String(selectedAppId)) || null;
  }, [appointments, selectedAppId]);

  const handleTogglePanel = (appId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedAppId === appId) {
      setSelectedAppId(null);
    } else {
      setSelectedAppId(appId);
    }
  };

  // Reschedule Form State (bound to selectedAppointment)
  const [rescheduleProfId, setRescheduleProfId] = useState<string>(
    selectedAppointment?.professionalId || 'prof-1'
  );
  const [rescheduleServiceId, setRescheduleServiceId] = useState<string>(
    selectedAppointment?.serviceId || 'srv-1'
  );
  const [rescheduleDate, setRescheduleDate] = useState<string>(
    selectedAppointment?.date || '2026-10-28'
  );
  const [rescheduleTime, setRescheduleTime] = useState<string>(
    selectedAppointment?.time || '10:00 AM'
  );

  // Update reschedule form state whenever selected appointment changes
  React.useEffect(() => {
    if (selectedAppointment) {
      setRescheduleProfId(selectedAppointment.professionalId);
      setRescheduleServiceId(selectedAppointment.serviceId);
      setRescheduleDate(selectedAppointment.date);
      setRescheduleTime(selectedAppointment.time);
    }
  }, [selectedAppointment]);

  // New Appointment Form State
  const [newPatientId, setNewPatientId] = useState<string | number>(mockPatients[0]?.id || 1);
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');
  const [newProfId, setNewProfId] = useState<string>('prof-1');
  const [newServiceId, setNewServiceId] = useState<string>('srv-1');
  const [newDate, setNewDate] = useState<string>('2026-10-28');
  const [newTime, setNewTime] = useState<string>('10:00 AM');
  const [newNotes, setNewNotes] = useState<string>('');

  const filteredPatientsList = useMemo(() => {
    if (!patientSearchQuery.trim()) return patientsList;
    const q = patientSearchQuery.trim().toLowerCase();
    return patientsList.filter(
      (p) =>
        (p.documentNumber && p.documentNumber.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q))
    );
  }, [patientsList, patientSearchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Real-time Schedule Conflict Validation for Reschedule Form
  const rescheduleConflict = useMemo(() => {
    if (!selectedAppointment) return undefined;
    return checkScheduleConflict(
      appointments,
      rescheduleProfId,
      rescheduleDate,
      rescheduleTime,
      selectedAppointment.id // exclude self
    );
  }, [appointments, rescheduleProfId, rescheduleDate, rescheduleTime, selectedAppointment]);

  // Real-time Schedule Conflict Validation for New Appointment Modal
  const newAppointmentConflict = useMemo(() => {
    if (!isCreateModalOpen) return undefined;
    return checkScheduleConflict(
      appointments,
      newProfId,
      newDate,
      newTime
    );
  }, [appointments, newProfId, newDate, newTime, isCreateModalOpen]);

  // Handler: Change Status Quickly
  const handleStatusChange = async (appId: string | number, newStatus: AppointmentStatus) => {
    try {
      await updateAppointmentStatusApi(appId, newStatus);
      const fresh = await getAppointmentsApi();
      if (fresh && fresh.length > 0) {
        setPatientsAppointments(fresh);
      } else {
        setPatientsAppointments((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
        );
      }
      showToast(`Estado de cita cambiado a ${newStatus}`);
    } catch (error) {
      console.error('[AppointmentsManagement] Error al cambiar estado de cita:', error);
      showToast('Error al actualizar el estado de la cita en el servidor');
    }
  };

  // Handler: Reschedule Appointment
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      await rescheduleAppointmentApi(selectedAppointment.id, rescheduleDate, rescheduleTime);
      const fresh = await getAppointmentsApi();
      if (fresh && fresh.length > 0) {
        setPatientsAppointments(fresh);
      }
      showToast(`Cita reprogramada exitosamente para ${rescheduleDate} a las ${rescheduleTime}`);
    } catch (error) {
      console.error('[AppointmentsManagement] Error al reprogramar cita:', error);
      showToast('Error al reprogramar la cita en el servidor');
    }
  };

  // Handler: Cancel Appointment
  const handleCancelAppointment = async (appId: string | number) => {
    try {
      await cancelAppointmentApi(appId);
      const fresh = await getAppointmentsApi();
      if (fresh && fresh.length > 0) {
        setPatientsAppointments(fresh);
      } else {
        setPatientsAppointments((prev) =>
          prev.map((app) => (app.id === appId ? { ...app, status: 'Cancelada' } : app))
        );
      }
      showToast('La cita ha sido cancelada correctamente');
    } catch (error) {
      console.error('[AppointmentsManagement] Error al cancelar cita:', error);
      showToast('Error al cancelar la cita en el servidor');
    }
  };

  // Handler: Create New Appointment
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newAppointmentConflict) {
      showToast('Conflicto detectado: el profesional no está disponible en este horario.');
      return;
    }

    const patientObj = patientsList.find((p) => String(p.id) === String(newPatientId)) || patientsList[0];
    const profObj = professionalsList.find((p) => String(p.id) === String(newProfId)) || professionalsList[0];
    const serviceObj = mockServices.find((s) => String(s.id) === String(newServiceId)) || mockServices[0];

    const created: Appointment = {
      id: Date.now(),
      patientId: patientObj?.id ?? String(newPatientId),
      patientName: patientObj?.name ?? 'Paciente Seleccionado',
      patientAge: patientObj?.age ?? 30,
      patientGender: patientObj?.gender ?? 'Femenino',
      patientDoc: patientObj ? `${patientObj.documentType || 'CC'}-${patientObj.documentNumber}` : 'CC-00000',
      patientPhone: patientObj?.contact?.phone ?? '',
      patientEmail: patientObj?.contact?.email ?? '',
      patientAvatarBg: patientObj?.avatarBg || '#0A9396',
      patientInitials: patientObj?.initials ?? 'P',
      professionalId: profObj?.id ?? newProfId,
      professionalName: profObj?.name ?? 'Médico Seleccionado',
      professionalSpecialty: profObj?.specialty ?? 'Medicina General',
      serviceId: serviceObj?.id ?? newServiceId,
      serviceName: serviceObj?.name ?? 'Consulta Médica',
      date: newDate,
      time: newTime,
      status: 'Agendada',
      notes: newNotes.trim() || undefined,
    };

    try {
      await createAppointmentApi(created);
      const fresh = await getAppointmentsApi();
      if (fresh && fresh.length > 0) {
        setPatientsAppointments(fresh);
      } else {
        setPatientsAppointments([created, ...appointments]);
      }
      setSelectedAppId(created.id);
      setIsCreateModalOpen(false);
      setNewNotes('');
      showToast(`Nueva cita agendada para ${created.patientName} con ${created.professionalName}`);
    } catch (error) {
      console.error('[AppointmentsManagement] Error al agendar cita:', error);
      showToast('Error al agendar la cita en el servidor');
    }
  };

  // Filtered appointments list for table
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      const matchesDate = !filterByDate || app.date === selectedDate;
      const matchesDoctorUser =
        !isDoctor ||
        app.professionalId === 'prof-1' ||
        app.professionalName.toLowerCase().includes((user?.name || '').toLowerCase());
      const matchesProf = isDoctor || profFilter === 'all' || app.professionalId === profFilter;
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesSearch =
        app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.professionalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.serviceName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDate && matchesDoctorUser && matchesProf && matchesStatus && matchesSearch;
    });
  }, [appointments, selectedDate, filterByDate, isDoctor, user?.name, profFilter, statusFilter, searchTerm]);

  // Helper render badge
  const renderStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'Agendada':
        return (
          <span className="citas-status-badge citas-status-badge--agendada">
            <Clock size={12} />
            <span>Agendada</span>
          </span>
        );
      case 'Atendida':
        return (
          <span className="citas-status-badge citas-status-badge--atendida">
            <CheckCircle2 size={12} />
            <span>Atendida</span>
          </span>
        );
      case 'Cancelada':
        return (
          <span className="citas-status-badge citas-status-badge--cancelada">
            <XCircle size={12} />
            <span>Cancelada</span>
          </span>
        );
      case 'No asistió':
        return (
          <span className="citas-status-badge citas-status-badge--no-asistio">
            <UserX size={12} />
            <span>No asistió</span>
          </span>
        );
      default:
        return <span className="citas-status-badge">{status}</span>;
    }
  };

  return (
    <div className="citas-mgmt">
      {/* Top Header Row */}
      <div className="citas-mgmt__header-row">
        <div className="citas-mgmt__title-group">
          <h1 className="citas-mgmt__title">Gestión de Citas</h1>
          <p className="citas-mgmt__subtitle">
            Agende, programe y administre las citas médicas de la clínica de forma eficiente.
          </p>
        </div>

        <button
          type="button"
          className="citas-mgmt__btn-add"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={16} />
          <span>Nueva Cita</span>
        </button>
      </div>

      {/* Grid Layout (Full width or 3-column depending on whether panel is open) */}
      <div className={`citas-mgmt__grid${selectedAppId !== null && selectedAppointment !== null ? ' citas-mgmt__grid--with-panel' : ''}`}>
        {/* Column 1: Left Widget Panel (Interactive Calendar & Upcoming Quick View) */}
        <div className="citas-card citas-left-panel">
          {/* Mini Calendar Widget */}
          <div className="mini-calendar">
            <div className="mini-calendar__header">
              <span className="mini-calendar__month-title">{calendarDaysInfo.monthTitle}</span>
              <div className="mini-calendar__nav">
                <button
                  type="button"
                  className="mini-calendar__btn"
                  title="Mes anterior"
                  onClick={handlePrevMonth}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  className="mini-calendar__btn"
                  title="Mes siguiente"
                  onClick={handleNextMonth}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="mini-calendar__days-header">
              <span>Dom</span>
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
            </div>

            {/* Calendar Grid */}
            <div className="mini-calendar__grid">
              {calendarDaysInfo.cells.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDate;
                const hasApps = cell.dayApps.length > 0;

                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    type="button"
                    className={`mini-calendar__day-btn${
                      !cell.isCurrentMonth ? ' mini-calendar__day-btn--muted' : ''
                    }${isSelected ? ' mini-calendar__day-btn--selected' : ''}`}
                    onClick={() => {
                      setSelectedDate(cell.dateStr);
                      setFilterByDate(true);
                      if (hasApps && cell.dayApps[0]) {
                        setSelectedAppId(cell.dayApps[0].id);
                      }
                    }}
                  >
                    <span className="mini-calendar__day-number">{cell.dayNum}</span>
                    {hasApps && cell.isCurrentMonth && (
                      <span className="mini-calendar__dot-indicator" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Filter Section: Próximas Citas */}
          <div className="upcoming-section">
            <div className="upcoming-section__header">
              <span className="upcoming-section__title">PRÓXIMAS CITAS</span>
            </div>

            <div className="upcoming-filters">
              <div className="upcoming-field">
                <label className="upcoming-label">Profesional</label>
                {isDoctor ? (
                  <div className="citas-prof-badge">
                    <Stethoscope size={14} />
                    <span>{user?.name || 'Dr. Julian Moore'}</span>
                  </div>
                ) : (
                  <CustomSelect
                    style={{ width: '100%' }}
                    value={profFilter}
                    onChange={(val) => setProfFilter(val)}
                    options={[
                      { value: 'all', label: 'Todos los Médicos' },
                      ...mockProfessionals.map((p) => ({ value: p.id, label: p.name })),
                    ]}
                  />
                )}
              </div>

              <div className="upcoming-field">
                <label className="upcoming-label">Vista del día</label>
                <div className="citas-date-box">
                  <CalendarDays size={14} className="citas-date-icon" />
                  <input
                    type="date"
                    className="citas-date-input"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setFilterByDate(true);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick List Cards */}
            <div className="upcoming-list">
              {appointments
                .filter((app) => app.date === selectedDate)
                .filter((app) => !isDoctor || app.professionalId === 'prof-1' || app.professionalName.toLowerCase().includes((user?.name || '').toLowerCase()))
                .slice(0, 4)
                .map((app) => {
                  const isSelected = app.id === selectedAppId;
                  return (
                    <div
                      key={app.id}
                      className={`upcoming-card${isSelected ? ' upcoming-card--selected' : ''}`}
                      onClick={() => setSelectedAppId(app.id)}
                    >
                      <div
                        className="upcoming-avatar"
                        style={{ backgroundColor: app.patientAvatarBg || '#0A9396' }}
                      >
                        {app.patientInitials}
                      </div>
                      <div className="upcoming-info">
                        <span className="upcoming-name">{app.patientName}</span>
                        <span className="upcoming-sub">
                          {app.patientGender}, {app.patientAge} años • {app.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Column 2: Center Appointments Main Table */}
        <div className="citas-card citas-center-panel">
          {/* Table Header Filter Bar */}
          <div className="citas-table-toolbar">
            <div className="citas-table-toolbar__filters">
              {/* Filter by Date Toggle Chip */}
              <button
                type="button"
                onClick={() => setFilterByDate((prev) => !prev)}
                title={filterByDate ? 'Clic para ver citas de todas las fechas' : 'Clic para filtrar por el día seleccionado'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: filterByDate ? 'rgba(10, 147, 150, 0.15)' : '#F1F5F9',
                  color: filterByDate ? '#0A9396' : '#64748B',
                  border: filterByDate ? '1px solid rgba(10, 147, 150, 0.4)' : '1px solid #CBD5E1',
                  transition: 'all 0.2s ease',
                }}
              >
                <CalendarDays size={14} />
                <span>{filterByDate ? `Día: ${selectedDate}` : 'Todas las fechas'}</span>
              </button>

              {/* Search Box */}
              <div className="citas-search-box">
                <Search size={15} className="citas-search-icon" />
                <input
                  type="text"
                  className="citas-search-input"
                  placeholder="Buscar profesional o paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="citas-filter-select-wrapper">
                <CustomSelect
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  options={[
                    { value: 'all', label: 'Estado: Todos' },
                    { value: 'Agendada', label: 'Estado: Agendada' },
                    { value: 'Atendida', label: 'Estado: Atendida' },
                    { value: 'Cancelada', label: 'Estado: Cancelada' },
                    { value: 'No asistió', label: 'Estado: No asistió' },
                  ]}
                />
              </div>
            </div>

            {!isDoctor && (
              <button
                type="button"
                className="citas-btn-quick-new"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={14} />
                <span>Nueva del día</span>
              </button>
            )}
          </div>

          {/* Table Viewport */}
          <div className="citas-table-wrapper">
            <table className="citas-table">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>HORA</th>
                  <th>PACIENTE</th>
                  <th>{isDoctor ? 'CONSULTORIO' : 'PROFESIONAL'}</th>
                  <th>SERVICIO</th>
                  <th style={{ textAlign: 'center' }}>ESTADO</th>
                  <th style={{ textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="citas-table__empty">
                      No hay citas registradas con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((app) => {
                    const isSelected = app.id === selectedAppId;
                    return (
                      <tr
                        key={app.id}
                        className={isSelected ? 'citas-table__row--selected' : ''}
                      >
                        <td className="citas-table__time-cell">{app.time}</td>
                        <td>
                          <div className="citas-table__patient">
                            <span className="citas-table__patient-name">{app.patientName}</span>
                          </div>
                        </td>
                        <td>
                          <div className="citas-table__prof">
                            <span className="citas-table__prof-name">
                              {isDoctor ? 'Consultorio 302' : app.professionalName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="citas-table__service">{app.serviceName}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {renderStatusBadge(app.status)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="citas-table__actions" style={{ justifyContent: 'center' }}>
                            <button
                              type="button"
                              className={`action-btn${isSelected ? ' action-btn--active' : ''}`}
                              title="Ver información y detalles"
                              onClick={(e) => handleTogglePanel(app.id, e)}
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

          {/* Table Footer */}
          <div className="citas-table-footer">
            <span>
              Mostrando {filteredAppointments.length > 0 ? 1 : 0} - {filteredAppointments.length} de{' '}
              {appointments.length} citas
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
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>...</span>
              <button type="button" className="pagination-btn">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Column 3: Right Panel (Appointment Summary, Reschedule & Actions) */}
        {selectedAppointment && (
          <div className="citas-card citas-right-panel">
            {/* Header Close Panel Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="status-selector-label">DETALLE Y GESTIÓN DE CITA</span>
              <button
                type="button"
                className="modal-close-btn"
                title="Cerrar panel de información"
                onClick={() => setSelectedAppId(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Header / Summary Card */}
            <div className="appointment-detail-header">
              <div
                className="appointment-detail-avatar"
                style={{ backgroundColor: selectedAppointment.patientAvatarBg || '#0A9396' }}
              >
                {selectedAppointment.patientInitials}
              </div>
              <div className="appointment-detail-info">
                <h3 className="appointment-detail-name">{selectedAppointment.patientName}</h3>
                <span className="appointment-detail-sub">
                  ({selectedAppointment.patientGender}, {selectedAppointment.patientAge} años)
                </span>
              </div>
            </div>

            <div className="appointment-detail-meta">
              <div className="meta-item">
                <Stethoscope size={15} className="meta-icon" />
                <span>
                  <strong>{selectedAppointment.professionalName}</strong> ({selectedAppointment.professionalSpecialty})
                </span>
              </div>
              <div className="meta-item">
                <FileText size={15} className="meta-icon" />
                <span>{selectedAppointment.serviceName}</span>
              </div>
              <div className="meta-item">
                <CalendarIcon size={15} className="meta-icon" />
                <span>
                  {selectedAppointment.date} - {selectedAppointment.time}
                </span>
              </div>
            </div>

            {/* Change Status & Reschedule Section - Hidden for Doctor role */}
            {!isDoctor ? (
              <>
                <div className="status-selector-section">
                  <label className="status-selector-label">CAMBIAR ESTADO RÁPIDO</label>
                  <div className="status-selector-buttons">
                    <button
                      type="button"
                      className={`btn-status-toggle btn-status-toggle--agendada${
                        selectedAppointment.status === 'Agendada' ? ' active' : ''
                      }`}
                      onClick={() => handleStatusChange(selectedAppointment.id, 'Agendada')}
                    >
                      Agendada
                    </button>
                    <button
                      type="button"
                      className={`btn-status-toggle btn-status-toggle--atendida${
                        selectedAppointment.status === 'Atendida' ? ' active' : ''
                      }`}
                      onClick={() => handleStatusChange(selectedAppointment.id, 'Atendida')}
                    >
                      Atendida
                    </button>
                    <button
                      type="button"
                      className={`btn-status-toggle btn-status-toggle--cancelada${
                        selectedAppointment.status === 'Cancelada' ? ' active' : ''
                      }`}
                      onClick={() => handleStatusChange(selectedAppointment.id, 'Cancelada')}
                    >
                      Cancelada
                    </button>
                    <button
                      type="button"
                      className={`btn-status-toggle btn-status-toggle--no-asistio${
                        selectedAppointment.status === 'No asistió' ? ' active' : ''
                      }`}
                      onClick={() => handleStatusChange(selectedAppointment.id, 'No asistió')}
                    >
                      No asistió
                    </button>
                  </div>
                </div>

                <form onSubmit={handleRescheduleSubmit} className="reschedule-form">
                  <div className="reschedule-form__title">REPROGRAMAR CITA</div>

                  {rescheduleConflict && (
                    <div className="conflict-alert" role="alert">
                      <AlertTriangle size={18} className="conflict-alert__icon" />
                      <div className="conflict-alert__text">
                        <strong>¡Conflicto de horario!</strong>
                        <span>
                          El {rescheduleConflict.professionalName} ya tiene una cita agendada el{' '}
                          {rescheduleDate} a las {rescheduleTime}.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Profesional</label>
                    <select
                      className="citas-select"
                      style={{ width: '100%' }}
                      value={rescheduleProfId}
                      onChange={(e) => setRescheduleProfId(e.target.value)}
                    >
                      {professionalsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {p.specialty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Servicio</label>
                    <select
                      className="citas-select"
                      style={{ width: '100%' }}
                      value={rescheduleServiceId}
                      onChange={(e) => setRescheduleServiceId(e.target.value)}
                    >
                      {mockServices.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (${s.price.toLocaleString('es-CO')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Fecha</label>
                      <input
                        type="date"
                        className="form-input"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hora</label>
                      <select
                        className="citas-select"
                        style={{ width: '100%' }}
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                      >
                        {AVAILABLE_TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="reschedule-actions">
                    <button
                      type="submit"
                      className="btn-reprogramar"
                      disabled={Boolean(rescheduleConflict)}
                    >
                      Reprogramar
                    </button>
                    <button
                      type="button"
                      className="btn-cancelar-cita"
                      onClick={() => handleCancelAppointment(selectedAppointment.id)}
                    >
                      Cancelar Cita
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                  🔒 Modo de Solo Lectura (Médico): La modificación, cancelación o reprogramación de citas está reservada al personal de Recepción y Administración.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Agendar Nueva Cita */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agendar Nueva Cita</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment}>
              <div className="modal-body">
                {/* Conflict Alert Banner inside Modal */}
                {newAppointmentConflict && (
                  <div className="conflict-alert" role="alert">
                    <AlertTriangle size={20} className="conflict-alert__icon" />
                    <div className="conflict-alert__text">
                      <strong>¡Conflicto de horario de atención!</strong>
                      <span>
                        El {newAppointmentConflict.professionalName} ya tiene una cita agendada para el{' '}
                        {newDate} a las {newTime}. Por favor selecciona otro horario o profesional.
                      </span>
                    </div>
                  </div>
                )}

                {/* Patient Selection */}
                <div className="form-group">
                  <label className="form-label">Seleccionar Paciente por Cédula / Documento</label>
                  <input
                    type="text"
                    className="citas-select"
                    style={{
                      width: '100%',
                      marginBottom: '8px',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                    }}
                    placeholder="🔍 Escriba el N° de Cédula para filtrar..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                  />
                  <select
                    className="citas-select"
                    style={{ width: '100%' }}
                    value={newPatientId}
                    onChange={(e) => setNewPatientId(e.target.value)}
                    required
                  >
                    {filteredPatientsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.documentNumber ? `Cédula: ${p.documentNumber} — ${p.name}` : p.name}
                      </option>
                    ))}
                    {filteredPatientsList.length === 0 && (
                      <option value="" disabled>
                        No se encontraron pacientes con esa cédula
                      </option>
                    )}
                  </select>
                </div>

                {/* Professional Selection */}
                <div className="form-group">
                  <label className="form-label">Seleccionar Profesional Médico</label>
                  <select
                    className="citas-select"
                    style={{ width: '100%', ...(isDoctor ? { opacity: 0.85, cursor: 'not-allowed' } : {}) }}
                    value={newProfId}
                    onChange={(e) => setNewProfId(e.target.value)}
                    disabled={isDoctor}
                    required
                  >
                    {professionalsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Selection */}
                <div className="form-group">
                  <label className="form-label">Servicio Médico</label>
                  <select
                    className="citas-select"
                    style={{ width: '100%' }}
                    value={newServiceId}
                    onChange={(e) => setNewServiceId(e.target.value)}
                    required
                  >
                    {mockServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (${s.price.toLocaleString('es-CO')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Fecha de la Cita</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora Disponibilidad</label>
                    <select
                      className="citas-select"
                      style={{ width: '100%' }}
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      required
                    >
                      {AVAILABLE_TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Observaciones o Notas */}
                <div className="form-group">
                  <label className="form-label">Observaciones / Motivo de consulta</label>
                  <textarea
                    className="form-input"
                    style={{ height: '70px', resize: 'vertical' }}
                    placeholder="Ej. Chequeo preventivo de rutina, evaluación sintomática..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
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
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={Boolean(newAppointmentConflict)}
                >
                  Agendar Cita
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

export default AppointmentsManagement;
