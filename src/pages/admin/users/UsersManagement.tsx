import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Calendar,
  FileText,
  Settings,
  Lock,
  KeyRound,
  RotateCcw,
  X,
} from 'lucide-react';
import type { ManagedUser, UserRoleType, PermissionGroup, PermissionItem } from '../../../types/user.types';
import Pagination from '../../../components/common/Pagination';
import {
  getRolePermissions,
  getRoleLabel,
  getUsersApi,
  createUserApi,
  changeUserRoleApi,
  getRoleIdForType,
  toggleUserStatusApi,
  canDeactivateOrDemoteAdmin,
} from '../../../services/users.service';
import { getEspecialidadesApi, type CatalogOption } from '../../../services/catalogs.service';
import { getPermisosApi, getRolPermisosByRolIdApi } from '../../../services/permissions.service';
import CustomSelect from '../../../components/common/CustomSelect';
import './UsersManagement.css';

/* SVG 1: Checkmark Icon */
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    height="16px"
    viewBox="0 -960 960 960"
    width="16px"
    fill="currentColor"
  >
    <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
  </svg>
);

/* SVG 2: Cross Icon */
const CrossIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    height="16px"
    viewBox="0 -960 960 960"
    width="16px"
    fill="currentColor"
  >
    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
  </svg>
);

/* SVG 3: Admin Icon */
const AdminRoleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    height="16px"
    viewBox="0 -960 960 960"
    width="16px"
    fill="currentColor"
  >
    <path d="M480-560q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-720q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720q0 33 23.5 56.5T480-640ZM160-80v-271q0-34 17-62.5t47-44.5q51-26 115.5-44T480-520q76 0 140.5 18T736-458q30 16 47 44.5t17 62.5v191q0 33-23.5 56.5T720-80H390q-46 0-78-32t-32-78q0-46 32-78t78-32h113l62-132q-20-4-41-6t-44-2q-72 0-128 17.5T261-386q-10 5-15.5 14.5T240-351v271h-80Zm230-80h48l28-60h-76q-12 0-21 9t-9 21q0 12 9 21t21 9Zm136 0h194v-191q0-11-5.5-20.5T700-386q-12-6-26-12.5T644-411L526-160Zm-46-560Zm0 426Z" />
  </svg>
);

/* SVG 4: Headset / Receptionist Icon */
const ReceptionistRoleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    height="16px"
    viewBox="0 -960 960 960"
    width="16px"
    fill="currentColor"
  >
    <path d="M480-40v-80h280v-40H600v-320h160v-40q0-116-82-198t-198-82q-116 0-198 82t-82 198v40h160v320H200q-33 0-56.5-23.5T120-240v-280q0-74 28.5-139.5T226-774q49-49 114.5-77.5T480-880q74 0 139.5 28.5T734-774q49 49 77.5 114.5T840-520v400q0 33-23.5 56.5T760-40H480ZM200-240h80v-160h-80v160Zm480 0h80v-160h-80v160ZM200-400h80-80Zm480 0h80-80Z" />
  </svg>
);

/* SVG 5: Professional Doctor Shield Icon */
const ProfessionalRoleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    height="16px"
    viewBox="0 -960 960 960"
    width="16px"
    fill="currentColor"
  >
    <path d="M722.5-297.5Q740-315 740-340t-17.5-42.5Q705-400 680-400t-42.5 17.5Q620-365 620-340t17.5 42.5Q655-280 680-280t42.5-17.5ZM680-160q31 0 57-14.5t42-38.5q-22-13-47-20t-52-7q-27 0-52 7t-47 20q16 24 42 38.5t57 14.5ZM480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v227q-19-8-39-14.5t-41-9.5v-147l-240-90-240 90v188q0 47 12.5 94t35 89.5Q310-290 342-254t71 60q11 32 29 61t41 52q-1 0-1.5.5t-1.5.5Zm200 0q-83 0-141.5-58.5T480-280q0-83 58.5-141.5T680-480q83 0 141.5 58.5T880-280q0 83-58.5 141.5T680-80ZM480-494Z" />
  </svg>
);

/* SVG 6: Trash / Delete Icon provided by user */
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    height="18px"
    viewBox="0 -960 960 960"
    width="18px"
    fill="currentColor"
  >
    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
  </svg>
);

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        setUsersError(null);
        const data = await getUsersApi();
        setUsers(data);
      } catch (error) {
        console.error('[UsersManagement] Error al cargar usuarios:', error);
        setUsers([]);
        setUsersError(error instanceof Error ? error.message : 'No se pudieron cargar los usuarios.');
      } finally {
        setIsLoadingUsers(false);
      }
    };
    void loadUsers();
  }, []);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Modals & Side Panel state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState<boolean>(false);
  const [activePanelUserId, setActivePanelUserId] = useState<string | null>(null);
  const [lastPanelUser, setLastPanelUser] = useState<ManagedUser | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDocument, setNewUserDocument] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRoleType>('professional');
  const [newProfTitle, setNewProfTitle] = useState('Dr.');
  const [newProfSpecialty, setNewProfSpecialty] = useState('Medicina General');
  const [especialidades, setEspecialidades] = useState<CatalogOption[]>([]);
  const [newProfRegister, setNewProfRegister] = useState('');
  const [newProfOffice, setNewProfOffice] = useState('Consultorio Principal');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  useEffect(() => {
    const loadEspecialidades = async () => {
      try {
        const data = await getEspecialidadesApi();
        const items = Array.isArray(data) ? data : [];
        setEspecialidades(items);
        if (items.length > 0) {
          const medicinaGeneral = items.find(
            (item) => item.nombre?.trim().toLowerCase() === 'medicina general',
          );
          setNewProfSpecialty(medicinaGeneral?.nombre || items[0].nombre);
        }
      } catch (error) {
        console.error('[UsersManagement] Error al cargar especialidades:', error);
        setEspecialidades([]);
      }
    };
    void loadEspecialidades();
  }, []);

  // Edit role form state
  const [editTargetUser, setEditTargetUser] = useState<ManagedUser | null>(null);
  const [targetRole, setTargetRole] = useState<UserRoleType>('professional');

  const handleTogglePanel = (user: ManagedUser, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activePanelUserId === user.id) {
      setActivePanelUserId(null);
    } else {
      setActivePanelUserId(user.id);
      setLastPanelUser(user);
    }
  };

  const activeUser = users.find((u) => u.id === activePanelUserId);
  const isPanelOpen = activePanelUserId !== null && activeUser !== undefined;
  const panelUser = activeUser || lastPanelUser;

  const lastActiveAdminGuard =
    panelUser != null ? canDeactivateOrDemoteAdmin(users, panelUser) : { ok: true as const };
  const isOnlyActiveAdmin = !lastActiveAdminGuard.ok;
  const onlyActiveAdminMessage = !lastActiveAdminGuard.ok ? lastActiveAdminGuard.error : undefined;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleDeleteUser = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    const target = users.find((u) => String(u.id) === String(id));
    if (target) {
      const guard = canDeactivateOrDemoteAdmin(users, target);
      if (!guard.ok) {
        showToast(guard.error ?? 'No se puede desactivar el administrador.');
        return;
      }
    }
    try {
      await toggleUserStatusApi(id, 'active');
      setUsers((prev) =>
        prev.map((user) =>
          String(user.id) === String(id) ? { ...user, status: 'inactive' } : user
        )
      );
      if (activePanelUserId === id) {
        setActivePanelUserId(null);
      }
      showToast('Usuario deshabilitado en la base de datos PostgreSQL.');
    } catch (err: unknown) {
      console.error('[UsersManagement] Error al deshabilitar usuario:', err);
      showToast(err instanceof Error ? err.message : 'Error al deshabilitar usuario en el servidor.');
    }
  };

  const handleReactivateUser = async (id: string) => {
    try {
      await toggleUserStatusApi(id, 'inactive');
      setUsers((prev) =>
        prev.map((user) =>
          String(user.id) === String(id) ? { ...user, status: 'active' } : user
        )
      );
      setActivePanelUserId(id);
      setIsCreateModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      showToast('Usuario reactivado exitosamente en PostgreSQL.');
    } catch (err: unknown) {
      console.error('[UsersManagement] Error al reactivar usuario:', err);
      showToast(err instanceof Error ? err.message : 'Error al reactivar usuario en el servidor.');
    }
  };

  const handleOpenEditRole = (user: ManagedUser, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditTargetUser(user);
    setTargetRole(user.role);
    setIsEditRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTargetUser || isSubmittingUser) return;

    if (editTargetUser.role === 'admin' && targetRole !== 'admin') {
      const guard = canDeactivateOrDemoteAdmin(users, editTargetUser);
      if (!guard.ok) {
        showToast(guard.error ?? 'No se puede cambiar el rol del administrador.');
        return;
      }
    }

    try {
      setIsSubmittingUser(true);
      const rolId = await getRoleIdForType(targetRole);
      await changeUserRoleApi(editTargetUser.id, targetRole, rolId);
      setUsers((prev) =>
        prev.map((u) => (u.id === editTargetUser.id ? { ...u, role: targetRole } : u))
      );
      setIsEditRoleModalOpen(false);
      showToast(`Rol de ${editTargetUser.name} actualizado a ${getRoleLabel(targetRole)}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo actualizar el rol.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingUser) return;
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim() || !newUserDocument.trim()
      || ((newUserRole === 'professional' || newUserRole === 'receptionist') && (!newUserPhone.trim() || !newUserAddress.trim()))) {
      showToast('Completa nombre, documento, correo, contraseña y contacto obligatorio para este rol.');
      return;
    }

    if (newUserPassword.length < 8) {
      showToast('La contraseña debe tener al menos 8 caracteres para ser aceptada por el backend.');
      return;
    }

    const initials = newUserName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    try {
      setIsSubmittingUser(true);
      const created = await createUserApi({
        username: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        numeroDocumento: newUserDocument,
        telefono: newUserPhone,
        direccion: newUserAddress,
        roleType: newUserRole,
        especialidad: newProfSpecialty,
        registroProfesional: newProfRegister,
      });

      const newUser: ManagedUser = {
        ...created,
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        initials,
      };

      setUsers((prev) => [newUser, ...prev.filter((u) => String(u.id) !== String(newUser.id))]);
      setActivePanelUserId(newUser.id);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserDocument('');
      setNewUserPhone('');
      setNewUserAddress('');
      setIsCreateModalOpen(false);
      showToast(`Usuario ${newUser.name} creado exitosamente`);
    } catch (error: unknown) {
      console.error('[UsersManagement] Error al crear usuario:', error);
      showToast(error instanceof Error ? error.message : 'Error al registrar usuario en el servidor.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleResetPassword = () => {
    if (!panelUser) return;
    showToast(`Enlace de restablecimiento enviado a ${panelUser.email}`);
  };

  // Check if any deactivated users match current create modal input
  // Requires typing the FULL name or FULL email to avoid partial prefix matches (e.g. "dra")
  const deactivatedMatches = users.filter((u) => {
    if (u.status !== 'inactive') return false;

    const nameInput = newUserName.toLowerCase().trim();
    const emailInput = newUserEmail.toLowerCase().trim();

    if (!nameInput && !emailInput) return false;

    const userNameLower = u.name.toLowerCase().trim();
    const userEmailLower = u.email.toLowerCase().trim();

    // Strip medical prefixes (Dr., Dra., Dr, Dra) for clean full name comparison
    const nameClean = userNameLower.replace(/^(dra\.|dr\.|dra|dr)\s+/, '').trim();

    // Check exact full name, full name without title prefix, or full email
    const isExactFullName = nameInput !== '' && (nameInput === userNameLower || nameInput === nameClean);
    const isExactFullEmail = emailInput !== '' && emailInput === userEmailLower;

    return isExactFullName || isExactFullEmail;
  });

  // Filtered user list for table
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [panelPermissions, setPanelPermissions] = useState<PermissionGroup[]>([]);

  useEffect(() => {
    if (!panelUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear permissions when its backing user is removed.
      setPanelPermissions([]);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const rolPerms = await getRolPermisosByRolIdApi(panelUser.role);
        const allPerms = await getPermisosApi();

        const activePermIds = new Set(rolPerms.map((rp) => rp.permisoId || rp.permiso?.id));

        const groups: PermissionGroup[] = [
          {
            id: 'agenda',
            title: 'Agenda y Citas',
            icon: 'calendar',
            items: allPerms
              .filter((p) => (p.modulo || '').toLowerCase().includes('agenda') || p.nombre?.toLowerCase().includes('cita'))
              .map((p) => ({
                id: p.id,
                label: p.nombre,
                status: activePermIds.has(p.id) || panelUser.role === 'admin' ? 'allowed' : 'denied',
              })),
          },
          {
            id: 'fichas',
            title: 'Fichas Clínicas',
            icon: 'file',
            items: allPerms
              .filter((p) => (p.modulo || '').toLowerCase().includes('ficha') || p.nombre?.toLowerCase().includes('atencion'))
              .map((p) => ({
                id: p.id,
                label: p.nombre,
                status: activePermIds.has(p.id) || panelUser.role === 'admin' ? 'allowed' : 'denied',
              })),
          },
          {
            id: 'config',
            title: 'Configuración Sistema',
            icon: 'gear',
            items: allPerms
              .filter((p) => (p.modulo || '').toLowerCase().includes('config') || p.nombre?.toLowerCase().includes('usuario'))
              .map((p) => ({
                id: p.id,
                label: p.nombre,
                status: activePermIds.has(p.id) || panelUser.role === 'admin' ? 'allowed' : 'denied',
              })),
          },
        ];

        const hasItems = groups.some((g) => g.items.length > 0);
        if (hasItems) {
          setPanelPermissions(groups);
        } else {
          setPanelPermissions(getRolePermissions(panelUser.role));
        }
      } catch (error) {
        console.warn('[UsersManagement] Error al cargar permisos dinámicos:', error);
        setPanelPermissions(getRolePermissions(panelUser.role));
      }
    };

    fetchPermissions();
  }, [panelUser]);

  const activePermissions = panelPermissions.length > 0
    ? panelPermissions
    : panelUser
    ? getRolePermissions(panelUser.role)
    : getRolePermissions('receptionist');

  const renderRoleBadge = (role: UserRoleType) => {
    if (role === 'admin') {
      return (
        <span className="role-badge role-badge--admin">
          <AdminRoleIcon className="role-badge__icon" />
          <span>Administrador</span>
        </span>
      );
    }
    if (role === 'receptionist') {
      return (
        <span className="role-badge role-badge--receptionist">
          <ReceptionistRoleIcon className="role-badge__icon" />
          <span>Recepcionista</span>
        </span>
      );
    }
    return (
      <span className="role-badge role-badge--professional">
        <ProfessionalRoleIcon className="role-badge__icon" />
        <span>Professional</span>
      </span>
    );
  };

  return (
    <div className="users-mgmt">
      {/* Top Title & Filters Row */}
      <div className="users-mgmt__header-row">
        <div className="users-mgmt__title-group">
          <h1 className="users-mgmt__title">Gestión de Usuarios</h1>
          <p className="users-mgmt__subtitle">
            Administre el acceso y roles del personal de la clínica.
          </p>
        </div>

        <div className="users-mgmt__filters">
          {/* Búsqueda */}
          <div className="users-mgmt__search-box">
            <Search size={16} className="users-mgmt__search-icon" />
            <input
              type="text"
              className="users-mgmt__search-input"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Filtro por Rol */}
          <CustomSelect
            value={roleFilter}
            onChange={(val) => {
              setRoleFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: 'all', label: 'Todos los Roles' },
              { value: 'admin', label: 'Administrador' },
              { value: 'professional', label: 'Profesional' },
              { value: 'receptionist', label: 'Recepcionista' },
            ]}
          />

          {/* Filtro por Estado */}
          <CustomSelect
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={[
              { value: 'active', label: 'Estado: Activos' },
              { value: 'inactive', label: 'Estado: Inactivos / Eliminados' },
              { value: 'all', label: 'Estado: Todos' },
            ]}
          />

          {/* Botón Agregar Usuario */}
          <button
            type="button"
            className="users-mgmt__btn-add"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {usersError && (
        <div role="alert" style={{ marginBottom: '16px', color: '#B42318' }}>
          No se pudieron cargar los usuarios: {usersError}
        </div>
      )}

      {/* Grid Layout (Table Full-Width by default, 2-column when 3-dots clicked) */}
      <div className={`users-mgmt__grid${isPanelOpen ? ' users-mgmt__grid--with-panel' : ''}`}>
        {/* Left Column: Users Table */}
        <div className="users-card users-table-card">
          <div className="users-table__wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>USUARIO</th>
                  <th>CORREO ELECTRÓNICO</th>
                  <th>ROL</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}
                    >
                      {isLoadingUsers ? 'Cargando usuarios...' : 'No se encontraron usuarios con los filtros aplicados.'}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, idx) => {
                    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                    const isRowSelected = Boolean(activePanelUserId) && String(user.id) === String(activePanelUserId);
                    return (
                      <tr
                        key={user.id || `row-${idx}`}
                        className={isRowSelected ? 'users-table__row--selected' : ''}
                        onClick={() => handleTogglePanel(user)}
                      >
                        <td className="users-table__index">{globalIdx}</td>
                        <td>
                          <div className="user-identity">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="user-avatar"
                              />
                            ) : (
                              <div
                                className="user-avatar-initials"
                                style={{ backgroundColor: user.avatarBg || '#0A9396' }}
                              >
                                {user.initials || 'U'}
                              </div>
                            )}
                            <span className="user-identity__name">{user.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="user-email-cell">{user.email}</span>
                        </td>
                        <td>{renderRoleBadge(user.role)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Reusable Pagination */}
          <div className="users-table__footer">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
              itemLabel="usuarios"
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>

        {/* Right Column: Role Permissions Side Panel */}
        <div className={`users-mgmt__panel-wrapper${isPanelOpen ? ' users-mgmt__panel-wrapper--open' : ' users-mgmt__panel-wrapper--closed'}`}>
          {panelUser && (
            <div className="users-card permissions-panel">
              <div className="permissions-panel__top">
                {renderRoleBadge(panelUser.role)}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="permissions-panel__edit-btn"
                    onClick={() => handleOpenEditRole(panelUser)}
                  >
                    <Edit2 size={13} />
                    <span>Editar Rol</span>
                  </button>
                  {panelUser.status === 'active' ? (
                    <button
                      type="button"
                      className="trash-btn"
                      title={
                        isOnlyActiveAdmin
                          ? onlyActiveAdminMessage
                          : 'Desactivar usuario'
                      }
                      disabled={isOnlyActiveAdmin}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(panelUser.id, e);
                      }}
                    >
                      <TrashIcon className="trash-btn__icon" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="reactivate-icon-btn"
                      title="Reactivar usuario"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReactivateUser(panelUser.id);
                      }}
                    >
                      <RotateCcw size={13} />
                      <span>Reactivar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="modal-close-btn"
                    title="Cerrar panel de información"
                    onClick={() => setActivePanelUserId(null)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* User Identity */}
              <div className="permissions-panel__user-header">
                <h3 className="permissions-panel__user-name">{panelUser.name}</h3>
                <span className="permissions-panel__user-sub">
                  Última actividad: {panelUser.lastAccess || 'Ayer, 5:30 PM, actualizando perfil'}
                </span>
              </div>

              <div className="permissions-panel__section-title">
                PERMISOS DE ROL ASIGNADOS
              </div>

              {/* Groups */}
              <div className="permission-groups">
                {activePermissions.map((group) => (
                  <div key={group.id} className="permission-group">
                    <div className="permission-group__header">
                      {group.icon === 'calendar' && (
                        <Calendar size={16} className="permission-group__icon" />
                      )}
                      {group.icon === 'file' && (
                        <FileText size={16} className="permission-group__icon" />
                      )}
                      {group.icon === 'gear' && (
                        <Settings size={16} className="permission-group__icon" />
                      )}
                      <span>{group.title}</span>
                    </div>

                    <div className="permission-items">
                      {group.items.map((item: PermissionItem) => (
                        <div key={item.id} className="permission-item">
                          {item.status === 'allowed' && (
                            <CheckIcon className="perm-icon--allowed" />
                          )}
                          {item.status === 'denied' && (
                            <CrossIcon className="perm-icon--denied" />
                          )}
                          {item.status === 'restricted' && (
                            <Lock size={14} className="perm-icon--restricted" />
                          )}
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reset Password Action */}
              <button
                type="button"
                className="permissions-panel__btn-reset"
                onClick={handleResetPassword}
              >
                <KeyRound size={16} />
                <span>Restablecer Contraseña</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create User */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nuevo Usuario</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                {/* Deactivated Users Prompt */}
                {deactivatedMatches.length > 0 && (
                  <div className="deactivated-restore-section">
                    <span className="deactivated-restore-section-title">
                      ¡Usuarios desactivados previamente encontrados ({deactivatedMatches.length})!
                    </span>
                    <div className="deactivated-restore-list">
                      {deactivatedMatches.map((match) => (
                        <div key={match.id} className="deactivated-restore-card">
                          <div className="deactivated-restore-info">
                            <span className="deactivated-restore-title">{match.name}</span>
                            <span className="deactivated-restore-desc">
                              {match.email} • {getRoleLabel(match.role)}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn-reactivate"
                            onClick={() => handleReactivateUser(match.id)}
                          >
                            <RotateCcw size={13} />
                            <span>Reactivar</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Dra. Elena Vasquez"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Documento</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Documento de identidad"
                    value={newUserDocument}
                    onChange={(e) => setNewUserDocument(e.target.value)}
                    required
                    maxLength={30}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="ejemplo@medflow.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Teléfono {(newUserRole === 'professional' || newUserRole === 'receptionist') && '*'}
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    required={newUserRole === 'professional' || newUserRole === 'receptionist'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Dirección {(newUserRole === 'professional' || newUserRole === 'receptionist') && '*'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUserAddress}
                    onChange={(e) => setNewUserAddress(e.target.value)}
                    required={newUserRole === 'professional' || newUserRole === 'receptionist'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Mínimo 8 caracteres"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol Asignado</label>
                  <select
                    className="users-mgmt__select"
                    style={{ width: '100%' }}
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRoleType)}
                  >
                    <option value="professional">Profesional Médico</option>
                    <option value="receptionist">Recepcionista</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                {newUserRole === 'professional' && (
                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--hl-border, rgba(255,255,255,0.1))',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#00A896',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'block',
                        marginBottom: '12px',
                      }}
                    >
                      Datos del Perfil Profesional
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label className="form-label">Prefijo Título</label>
                        <select
                          className="users-mgmt__select"
                          style={{ width: '100%' }}
                          value={newProfTitle}
                          onChange={(e) => setNewProfTitle(e.target.value)}
                        >
                          <option value="Dr.">Dr.</option>
                          <option value="Dra.">Dra.</option>
                          <option value="Lic.">Lic.</option>
                          <option value="Mg.">Mg.</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Especialidad Médica</label>
                        <select
                          className="users-mgmt__select"
                          style={{ width: '100%' }}
                          value={newProfSpecialty}
                          onChange={(e) => setNewProfSpecialty(e.target.value)}
                          required={newUserRole === 'professional'}
                        >
                          {especialidades.length === 0 ? (
                            <option value="Medicina General">Medicina General</option>
                          ) : (
                            especialidades.map((item) => (
                              <option key={item.id} value={item.nombre}>
                                {item.nombre}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                      <div className="form-group">
                        <label className="form-label">Licencia / Reg. Profesional *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ej. CMP-45892"
                          value={newProfRegister}
                          onChange={(e) => setNewProfRegister(e.target.value)}
                          required={newUserRole === 'professional'}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Consultorio / Ubicación</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ej. Consultorio 301"
                          value={newProfOffice}
                          onChange={(e) => setNewProfOffice(e.target.value)}
                          required={newUserRole === 'professional'}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmittingUser}>
                  {isSubmittingUser ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User Role */}
      {isEditRoleModalOpen && editTargetUser && (
        <div className="modal-backdrop" onClick={() => setIsEditRoleModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Rol de Usuario</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEditRoleModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveRole}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                  Cambiando el rol de <strong>{editTargetUser.name}</strong> ({editTargetUser.email})
                </p>
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label className="form-label">Seleccionar Nuevo Rol</label>
                  <select
                    className="users-mgmt__select"
                    style={{ width: '100%' }}
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as UserRoleType)}
                  >
                    <option value="professional">Profesional Médico</option>
                    <option value="receptionist">Recepcionista</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditRoleModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmittingUser}>
                  {isSubmittingUser ? 'Actualizando...' : 'Actualizar Rol'}
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

export default UsersManagement;
