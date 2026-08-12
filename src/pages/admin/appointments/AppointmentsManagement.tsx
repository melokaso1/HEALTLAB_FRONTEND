import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
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
} from '../../../types/appointment.types';
import {
  mockAppointments,
  mockServices,
  AVAILABLE_TIME_SLOTS,
  checkScheduleConflict,
} from '../../../services/appointments.service';
import { mockProfessionals } from '../../../services/professionals.service';
import { mockPatients } from '../../../services/patients.service';
import { useAuth } from '../../../context/AuthContext';
import './AppointmentsManagement.css';

const AppointmentsManagement: React.FC = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'professional' || (user?.role as string) === 'medico';

  // Main Data States
  const [appointments, setPatientsAppointments] = useState<Appointment[]>(mockAppointments);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(1); // Default to first appointment
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-28'); // Current active date view

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

  const getEventBadgeClass = (appId: number) => {
    const colors = [
      'mini-calendar__event--blue',
      'mini-calendar__event--green',
      'mini-calendar__event--purple',
      'mini-calendar__event--orange',
      'mini-calendar__event--gray',
    ];
    return colors[appId % colors.length];
  };

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
    return appointments.find((a) => a.id === selectedAppId) || null;
  }, [appointments, selectedAppId]);

  const handleTogglePanel = (appId: number, e: React.MouseEvent) => {
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
  const [newPatientId, setNewPatientId] = useState<number>(mockPatients[0]?.id || 1);
  const [newProfId, setNewProfId] = useState<string>('prof-1');
  const [newServiceId, setNewServiceId] = useState<string>('srv-1');
  const [newDate, setNewDate] = useState<string>('2026-10-28');
  const [newTime, setNewTime] = useState<string>('10:00 AM');
  const [newNotes, setNewNotes] = useState<string>('');

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
  const handleStatusChange = (appId: number, newStatus: AppointmentStatus) => {
    setPatientsAppointments((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );
    showToast(`Estado de la cita actualizado a "${newStatus}"`);
  };

  // Handler: Reschedule Appointment
  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    if (rescheduleConflict) {
      showToast('No se puede reprogramar: existe un conflicto de horario con el profesional.');
      return;
    }

    const targetProf = mockProfessionals.find((p) => p.id === rescheduleProfId);
    const targetService = mockServices.find((s) => s.id === rescheduleServiceId);

    setPatientsAppointments((prev) =>
      prev.map((app) => {
        if (app.id === selectedAppointment.id) {
          return {
            ...app,
            professionalId: rescheduleProfId,
            professionalName: targetProf?.name || app.professionalName,
            professionalSpecialty: targetProf?.specialty || app.professionalSpecialty,
            serviceId: rescheduleServiceId,
            serviceName: targetService?.name || app.serviceName,
            date: rescheduleDate,
            time: rescheduleTime,
          };
        }
        return app;
      })
    );

    showToast(`Cita reprogramada exitosamente para ${rescheduleDate} a las ${rescheduleTime}`);
  };

  // Handler: Cancel Appointment
  const handleCancelAppointment = (appId: number) => {
    setPatientsAppointments((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: 'Cancelada' } : app))
    );
    showToast('La cita ha sido cancelada correctamente');
  };

  // Handler: Create New Appointment
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();

    if (newAppointmentConflict) {
      showToast('Conflicto detectado: el profesional no está disponible en este horario.');
      return;
    }

    const patientObj = mockPatients.find((p) => p.id === Number(newPatientId)) || mockPatients[0];
    const profObj = mockProfessionals.find((p) => p.id === newProfId) || mockProfessionals[0];
    const serviceObj = mockServices.find((s) => s.id === newServiceId) || mockServices[0];

    const created: Appointment = {
      id: Date.now(),
      patientId: patientObj.id,
      patientName: patientObj.name,
      patientAge: patientObj.age,
      patientGender: patientObj.gender,
      patientDoc: `${patientObj.documentType}-${patientObj.documentNumber}`,
      patientPhone: patientObj.contact.phone,
      patientEmail: patientObj.contact.email,
      patientAvatarBg: patientObj.avatarBg || '#0A9396',
      patientInitials: patientObj.initials,
      professionalId: profObj.id,
      professionalName: profObj.name,
      professionalSpecialty: profObj.specialty,
      serviceId: serviceObj.id,
      serviceName: serviceObj.name,
      date: newDate,
      time: newTime,
      status: 'Agendada',
      notes: newNotes.trim() || undefined,
    };

    setPatientsAppointments([created, ...appointments]);
    setSelectedAppId(created.id);
    setIsCreateModalOpen(false);
    setNewNotes('');
    showToast(`Nueva cita agendada para ${patientObj.name} con ${profObj.name}`);
  };

  // Filtered appointments list for table
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
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

      return matchesDoctorUser && matchesProf && matchesStatus && matchesSearch;
    });
  }, [appointments, isDoctor, user?.name, profFilter, statusFilter, searchTerm]);

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
      <div className={`citas-mgmt__grid${selectedAppId !== null ? ' citas-mgmt__grid--with-panel' : ''}`}>
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
                  <select
                    className="citas-select"
                    style={{ width: '100%' }}
                    value={profFilter}
                    onChange={(e) => setProfFilter(e.target.value)}
                  >
                    <option value="all">Todos los Médicos</option>
                    {mockProfessionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
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
                    onChange={(e) => setSelectedDate(e.target.value)}
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
                <Filter size={14} className="citas-filter-icon" />
                <select
                  className="citas-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Estado: Todos</option>
                  <option value="Agendada">Estado: Agendada</option>
                  <option value="Atendida">Estado: Atendida</option>
                  <option value="Cancelada">Estado: Cancelada</option>
                  <option value="No asistió">Estado: No asistió</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              className="citas-btn-quick-new"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={14} />
              <span>Nueva del día</span>
            </button>
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

            {/* Change Status Action Row */}
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

            {/* Reschedule Form */}
            <form onSubmit={handleRescheduleSubmit} className="reschedule-form">
              <div className="reschedule-form__title">REPROGRAMAR CITA</div>

              {/* Schedule Conflict Warning Banner */}
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

              {/* Professional Select */}
              <div className="form-group">
                <label className="form-label">Profesional</label>
                <select
                  className="citas-select"
                  style={{ width: '100%', ...(isDoctor ? { opacity: 0.85, cursor: 'not-allowed' } : {}) }}
                  value={rescheduleProfId}
                  onChange={(e) => setRescheduleProfId(e.target.value)}
                  disabled={isDoctor}
                >
                  {mockProfessionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Select */}
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

              {/* Date & Time Row */}
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

              {/* Action Buttons */}
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
                  <label className="form-label">Seleccionar Paciente</label>
                  <select
                    className="citas-select"
                    style={{ width: '100%' }}
                    value={newPatientId}
                    onChange={(e) => setNewPatientId(Number(e.target.value))}
                    required
                  >
                    {mockPatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Doc: {p.documentType}-{p.documentNumber})
                      </option>
                    ))}
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
                    {mockProfessionals.map((p) => (
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
