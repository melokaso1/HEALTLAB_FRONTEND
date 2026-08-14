import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Filter,
  Download,
  Printer,
  Edit,
  X,
  CheckCircle2,
  Check,
  UserCheck,
} from 'lucide-react';
import Pagination from '../../../components/common/Pagination';
import { getPatientsApi, createPatientApi, updatePatientApi } from '../../../services/patients.service';
import './Pacientes.css';

interface PatientRecord {
  id: string;
  documento: string;
  nombre: string;
  iniciales: string;
  avatarBg: 'mint' | 'purple' | 'gray';
  genero: 'F' | 'M';
  edad: number;
  telefono: string;
  email: string;
  estado: 'Activo' | 'Inactivo';
}

const isValidDocument = (type: string, value: string): boolean =>
  type === 'PAS'
    ? /^[a-z0-9]+$/i.test(value) && value.length <= 30
    : /^\d{6,30}$/.test(value);

const RecepPacientes: React.FC = () => {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<'Todos' | 'Activo' | 'Inactivo'>('Todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [newPatientDocType, setNewPatientDocType] = useState('CC');
  const [newPatientPhoneType, setNewPatientPhoneType] = useState('Móvil');

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getPatientsApi();
        const colors: Array<'mint' | 'purple' | 'gray'> = ['mint', 'purple', 'gray'];
        const mapped: PatientRecord[] = response.map((patient, index) => {
          const bg = colors[index % 3];
          return {
            id: String(patient.id),
            documento: `${patient.documentType} ${patient.documentNumber}`,
            nombre: patient.name,
            iniciales: patient.initials,
            avatarBg: bg,
            genero: patient.gender === 'Femenino' ? 'F' : 'M',
            edad: patient.age,
            telefono: patient.contact.phone,
            email: patient.contact.email,
            estado: patient.status === 'active' ? 'Activo' : 'Inactivo',
          } satisfies PatientRecord;
        });
        setPatients(mapped);
      } catch {
        setError('Error de conexión al cargar pacientes');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, []);


  // Modal States
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredPatients = useMemo(() => {
    if (estadoFilter === 'Todos') return patients;
    return patients.filter((p) => p.estado === estadoFilter);
  }, [patients, estadoFilter]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const paginatedPatients = useMemo(() => {
    return filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredPatients, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [estadoFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredPatients.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreatePatient = async (newP: Omit<PatientRecord, 'id' | 'iniciales' | 'avatarBg'>) => {
    if (isCreatingPatient) return;
  const handleCreatePatient = async (newP: Omit<PatientRecord, 'id' | 'iniciales' | 'avatarBg'> & {
    direccion?: string;
    tipoSangre?: string;
    alergias?: string;
    fechaNacimiento?: string;
  }) => {
    if (!isValidDocument(newPatientDocType, newP.documento)) {
      showToast(newPatientDocType === 'PAS'
        ? 'El pasaporte debe ser alfanumérico y tener máximo 30 caracteres.'
        : 'CC, TI y CE deben contener entre 6 y 30 dígitos.');
      return;
    }
    try {
      setIsCreatingPatient(true);
      const created = await createPatientApi({
        name: newP.nombre,
        gender: newP.genero === 'F' ? 'Femenino' : 'Masculino',
        birthDate: newP.fechaNacimiento,
        age: newP.edad,
        documentType: newPatientDocType as 'CC' | 'TI' | 'CE' | 'PAS',
        documentNumber: newP.documento,
        contact: {
          phone: newP.telefono,
          email: newP.email,
          address: newP.direccion || 'Dirección no registrada',
        },
        medicalData: {
          bloodType: newP.tipoSangre || 'O+',
          allergies: newP.alergias ? newP.alergias.split(',').map((a) => a.trim()) : ['Ninguna'],
        },
      });

      const fresh = await getPatientsApi();
      if (fresh && fresh.length > 0) {
        setPatients(
          fresh.map((p) => ({
            id: String(p.id),
            documento: `${p.documentType}-${p.documentNumber}`,
            nombre: p.name,
            iniciales: p.initials || 'P',
            avatarBg: 'mint',
            genero: p.gender === 'Femenino' ? 'F' : 'M',
            edad: p.age,
            telefono: p.contact.phone,
            email: p.contact.email,
            estado: p.status === 'active' ? 'Activo' : 'Inactivo',
          }))
        );
      } else {
        setPatients((previous) => [{
          id: String(created.id),
          documento: `${created.documentType}-${created.documentNumber}`,
          nombre: created.name,
          iniciales: created.initials || 'P',
          avatarBg: 'mint',
          genero: created.gender === 'Femenino' ? 'F' : 'M',
          edad: created.age,
          telefono: created.contact.phone,
          email: created.contact.email,
          estado: created.status === 'active' ? 'Activo' : 'Inactivo',
        }, ...previous]);
      }
      setIsNewPatientOpen(false);
      showToast(`Paciente ${newP.nombre} registrado exitosamente.`);
    } catch (error) {
      console.error('[Pacientes.tsx] Error al crear paciente:', error);
      showToast('Error al registrar el paciente en la API');
    } finally {
      setIsCreatingPatient(false);
    }
  };

  const handleUpdatePatient = async (updated: PatientRecord) => {
    try {
      await updatePatientApi(updated.id, {
        name: updated.nombre,
        gender: updated.genero === 'F' ? 'Femenino' : 'Masculino',
        age: updated.edad,
        contact: {
          phone: updated.telefono,
          email: updated.email,
          address: '',
        },
      });

      const fresh = await getPatientsApi();
      if (fresh && fresh.length > 0) {
        setPatients(
          fresh.map((p) => ({
            id: String(p.id),
            documento: `${p.documentType}-${p.documentNumber}`,
            nombre: p.name,
            iniciales: p.initials || 'P',
            avatarBg: 'mint',
            genero: p.gender === 'Femenino' ? 'F' : 'M',
            edad: p.age,
            telefono: p.contact.phone,
            email: p.contact.email,
            estado: p.status === 'active' ? 'Activo' : 'Inactivo',
          }))
        );
      }
      setEditingPatient(null);
      showToast(`Información de ${updated.nombre} actualizada.`);
    } catch (error) {
      console.error('[Pacientes.tsx] Error al actualizar paciente:', error);
      showToast('Error al actualizar la información en la API');
    }
  };

  const handleExport = () => {
    showToast('Exportando directorio de pacientes a CSV...');
  };

  const handlePrint = () => {
    showToast('Imprimiendo reporte del directorio de pacientes...');
  };

  return (
    <div className="recep-pacientes-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-banner success">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Title Section */}
      <div className="recep-pacientes-header">
        <div className="recep-pacientes-header__text">
          <h1 className="recep-pacientes-header__title">Directorio de Pacientes</h1>
          <p className="recep-pacientes-header__subtitle">
            Gestione la información de los pacientes registrados en la clínica.
          </p>
        </div>

        <button className="btn-nuevo-paciente" onClick={() => setIsNewPatientOpen(true)}>
          <Plus size={18} />
          <span>Nuevo paciente</span>
        </button>
      </div>

      {/* Main Patients Card */}
      <div className="recep-pacientes-card">
        {/* Controls Toolbar */}
        <div className="recep-pacientes-toolbar">
          <div className="toolbar-left">
            <div className="toolbar-select-wrapper">
              <Filter size={15} className="toolbar-filter-icon" />
              <select
                className="toolbar-select"
                value={estadoFilter}
                onChange={(e) =>
                  setEstadoFilter(e.target.value as 'Todos' | 'Activo' | 'Inactivo')
                }
              >
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Solo Activos</option>
                <option value="Inactivo">Solo Inactivos</option>
              </select>
            </div>
          </div>

          <div className="toolbar-right-actions">
            <button
              className="btn-toolbar-icon"
              title="Exportar archivo CSV"
              onClick={handleExport}
            >
              <Download size={16} />
            </button>
            <button
              className="btn-toolbar-icon"
              title="Imprimir listado"
              onClick={handlePrint}
            >
              <Printer size={16} />
            </button>
          </div>
        </div>

        {/* Patients Table */}
        <div className="recep-pacientes-table-wrapper">
          <table className="pacientes-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={
                      filteredPatients.length > 0 &&
                      selectedIds.length === filteredPatients.length
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th>DOCUMENTO</th>
                <th>PACIENTE</th>
                <th>CONTACTO</th>
                <th>ESTADO</th>
                <th style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    Cargando pacientes...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#EF4444' }}>
                    {error}
                  </td>
                </tr>
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    No se encontraron pacientes registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => handleSelectOne(p.id)}
                      />
                    </td>

                    <td>
                      <span className="doc-number">{p.documento}</span>
                    </td>

                    <td>
                      <div className="patient-profile-cell">
                        <div className={`patient-avatar-box ${p.avatarBg}`}>
                          {p.iniciales}
                        </div>
                        <div className="patient-profile-info">
                          <span className="patient-name">{p.nombre}</span>
                          <span className="patient-submeta">
                            {p.genero} • {p.edad} años
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="contact-info-cell">
                        <span className="contact-phone">{p.telefono}</span>
                        <span className="contact-email">{p.email}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`patient-status-badge ${
                          p.estado === 'Activo' ? 'activo' : 'inactivo'
                        }`}
                      >
                        {p.estado}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-icon"
                          title="Editar paciente"
                          onClick={() => setEditingPatient(p)}
                        >
                          <Edit size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="recep-pacientes-footer" style={{ padding: 0 }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPatients.length}
            itemsPerPage={itemsPerPage}
            itemLabel="pacientes"
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      {/* Modal 1: Nuevo Paciente */}
      {isNewPatientOpen && (
        <div className="modal-overlay" onClick={() => !isCreatingPatient && setIsNewPatientOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <UserCheck size={18} color="#00A896" />
                Registrar Nuevo Paciente
              </h3>
              <button className="btn-icon" type="button" onClick={() => setIsNewPatientOpen(false)} disabled={isCreatingPatient}>
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const docNum = (form.elements.namedItem('documento') as HTMLInputElement).value;
                const nom = (form.elements.namedItem('nombre') as HTMLInputElement).value;
                const gen = (form.elements.namedItem('genero') as HTMLSelectElement).value as 'F' | 'M';
                const fechaNac = (form.elements.namedItem('fechaNacimiento') as HTMLInputElement).value;
                const phoneType = newPatientPhoneType;
                const telNum = (form.elements.namedItem('telefono') as HTMLInputElement).value;
                const em = (form.elements.namedItem('email') as HTMLInputElement).value;
                const dir = (form.elements.namedItem('direccion') as HTMLInputElement)?.value || '';
                const sangre = (form.elements.namedItem('tipoSangre') as HTMLSelectElement)?.value || 'O+';
                const alg = (form.elements.namedItem('alergias') as HTMLInputElement)?.value || '';

                let calculatedEdad = 30;
                if (fechaNac) {
                  const birthDateObj = new Date(fechaNac);
                  const today = new Date();
                  let age = today.getFullYear() - birthDateObj.getFullYear();
                  const m = today.getMonth() - birthDateObj.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) age--;
                  calculatedEdad = Math.max(0, age);
                }

<<<<<<< HEAD
                await handleCreatePatient({
=======
                handleCreatePatient({
>>>>>>> b3379ee185f9021621db48263e58f6ebae4ab1e2
                  documento: docNum,
                  nombre: nom,
                  genero: gen,
                  edad: calculatedEdad,
                  telefono: `${phoneType}: ${telNum}`,
                  email: em,
                  direccion: dir,
                  tipoSangre: sangre,
                  alergias: alg,
                  fechaNacimiento: fechaNac,
                  estado: 'Activo',
                });
              }}
            >
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    name="nombre"
                    className="form-input"
                    required
                    placeholder="Ej. María Carmen Silva"
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Documento</label>
                    <div className="doc-search-wrapper">
                      <select
                        className="doc-type-inline-select"
                        value={newPatientDocType}
                        onChange={(e) => setNewPatientDocType(e.target.value)}
                      >
                        <option value="CC">CC</option>
                        <option value="TI">TI</option>
                        <option value="CE">CE</option>
                        <option value="PAS">PAS</option>
                      </select>
                      <input
                        type="text"
                        name="documento"
                        className="form-input"
                        required
                        placeholder="Número de documento..."
                        inputMode={newPatientDocType === 'PAS' ? 'text' : 'numeric'}
                        maxLength={30}
                        onChange={(e) => {
                          e.target.value = newPatientDocType === 'PAS'
                            ? e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 30)
                            : e.target.value.replace(/\D/g, '').slice(0, 30);
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Género</label>
                    <select name="genero" className="form-select" defaultValue="F">
                      <option value="F">Femenino (F)</option>
                      <option value="M">Masculino (M)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      name="fechaNacimiento"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <div className="doc-search-wrapper">
                      <select
                        className="doc-type-inline-select"
                        value={newPatientPhoneType}
                        onChange={(e) => setNewPatientPhoneType(e.target.value)}
                      >
                        <option value="Móvil">Móvil</option>
                        <option value="Fijo">Fijo</option>
                      </select>
                      <input
                        type="text"
                        name="telefono"
                        className="form-input"
                        required
                        placeholder="Número de teléfono..."
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="maria.silva@email.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    className="form-input"
                    placeholder="Ej. Calle 123 #45-67"
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Tipo de Sangre</label>
                    <select name="tipoSangre" className="form-select" defaultValue="O+">
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alergias</label>
                    <input
                      type="text"
                      name="alergias"
                      className="form-input"
                      placeholder="Ej. Penicilina, Sulfa"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-recep-outline"
                  onClick={() => setIsNewPatientOpen(false)}
                  disabled={isCreatingPatient}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-nuevo-paciente" disabled={isCreatingPatient}>
                  <Check size={16} />
                  {isCreatingPatient ? 'Guardando…' : 'Guardar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Editar Paciente */}
      {editingPatient && (
        <div className="modal-overlay" onClick={() => setEditingPatient(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Edit size={18} color="#00A896" />
                Editar Paciente #{editingPatient.documento}
              </h3>
              <button className="btn-icon" type="button" onClick={() => setEditingPatient(null)}>
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const nom = (form.elements.namedItem('nombre') as HTMLInputElement).value;
                const tel = (form.elements.namedItem('telefono') as HTMLInputElement).value;
                const em = (form.elements.namedItem('email') as HTMLInputElement).value;
                const est = (form.elements.namedItem('estado') as HTMLSelectElement).value as 'Activo' | 'Inactivo';

                handleUpdatePatient({
                  ...editingPatient,
                  nombre: nom,
                  telefono: tel,
                  email: em,
                  estado: est,
                });
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    name="nombre"
                    className="form-input"
                    defaultValue={editingPatient.nombre}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="text"
                      name="telefono"
                      className="form-input"
                      defaultValue={editingPatient.telefono}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select
                      name="estado"
                      className="form-select"
                      defaultValue={editingPatient.estado}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    defaultValue={editingPatient.email}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-recep-outline"
                  onClick={() => setEditingPatient(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-nuevo-paciente">
                  <Check size={16} />
                  Actualizar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecepPacientes;
