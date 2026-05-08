import React, { useEffect, useMemo, useState } from 'react';
import usuariosApi, { type UsuarioResponse } from '@/api/usuarios';
import type { RolUsuario } from '@/api/auth';
import PageTitle from '@/components/ui/PageTitle';
import { useToast } from '@/components/ui/ToastProvider';
import { formatShortId } from '@/utils/formatters';

const roles: RolUsuario[] = ['ADMINISTRADOR', 'GERENTE', 'TESORERO', 'JEFE_MESA'];

const roleLabels: Record<RolUsuario, string> = {
  ADMINISTRADOR: 'Administrador',
  GERENTE: 'Gerente',
  TESORERO: 'Tesorero',
  JEFE_MESA: 'Jefe de mesa',
};

const UsersPage: React.FC = () => {
  const toast = useToast();
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rol, setRol] = useState<RolUsuario>('GERENTE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsuarios(await usuariosApi.listar());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarUsuarios();
  }, []);

  const resumen = useMemo(
    () => ({
      total: usuarios.length,
      activos: usuarios.filter((usuario) => usuario.activo).length,
      administradores: usuarios.filter((usuario) => usuario.rol === 'ADMINISTRADOR' && usuario.activo).length,
    }),
    [usuarios]
  );

  const crearUsuario = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const creado = await usuariosApi.crear({ nombre, contrasena, rol });
      setUsuarios((prev) => [...prev, creado].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNombre('');
      setContrasena('');
      setRol('GERENTE');
      toast.success('Usuario creado', `${creado.nombre} ya puede ingresar al sistema.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible crear el usuario.';
      setError(message);
      toast.error('No fue posible crear el usuario', message);
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async (usuario: UsuarioResponse) => {
    try {
      setError(null);
      const actualizado = usuario.activo
        ? await usuariosApi.desactivar(usuario.id)
        : await usuariosApi.activar(usuario.id);
      setUsuarios((prev) => prev.map((item) => (item.id === actualizado.id ? actualizado : item)));
      toast.success(
        actualizado.activo ? 'Usuario activado' : 'Usuario desactivado',
        `${actualizado.nombre} quedo ${actualizado.activo ? 'activo' : 'inactivo'}.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible actualizar el usuario.';
      setError(message);
      toast.error('No fue posible actualizar el usuario', message);
    }
  };

  const canSubmit = nombre.trim().length > 0 && contrasena.length >= 6 && !saving;

  return (
    <section className="space-y-6">
      <PageTitle
        eyebrow="Administracion"
        title="Usuarios"
        description="Creacion y control de acceso de usuarios internos del sistema."
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={crearUsuario} className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A8841C]">Nuevo acceso</p>
            <h2 className="font-serif text-2xl font-black text-stone-950">Crear usuario</h2>
            <p className="mt-1 text-sm font-medium text-stone-600">
              La contrasena se almacena con hash bcrypt; nunca se guarda en texto plano.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-black uppercase tracking-[0.18em] text-stone-500">
              Nombre de usuario
              <input
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-stone-900 focus:border-[#A8841C] focus:ring-[#A8841C]/20"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ejemplo: paola.castro"
              />
            </label>

            <label className="block text-xs font-black uppercase tracking-[0.18em] text-stone-500">
              Contrasena temporal
              <input
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-stone-900 focus:border-[#A8841C] focus:ring-[#A8841C]/20"
                type="password"
                value={contrasena}
                onChange={(event) => setContrasena(event.target.value)}
                placeholder="Minimo 6 caracteres"
              />
            </label>

            <label className="block text-xs font-black uppercase tracking-[0.18em] text-stone-500">
              Rol
              <select
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-stone-900 focus:border-[#A8841C] focus:ring-[#A8841C]/20"
                value={rol}
                onChange={(event) => setRol(event.target.value as RolUsuario)}
              >
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {roleLabels[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-5 w-full rounded-xl bg-[#A8841C] px-4 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-[#7A5E10] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
          >
            {saving ? 'Creando usuario...' : 'Crear usuario'}
          </button>
        </form>

        <section className="rounded-2xl border border-stone-300 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-stone-200 p-5 md:grid-cols-3">
            <SummaryCard label="Usuarios" value={resumen.total} />
            <SummaryCard label="Activos" value={resumen.activos} tone="green" />
            <SummaryCard label="Admins activos" value={resumen.administradores} tone="gold" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-[#f4ead8] text-[11px] uppercase tracking-[0.16em] text-stone-600">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center font-semibold text-stone-500">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center font-semibold text-stone-500">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-[#fbf8f2]">
                      <td className="px-4 py-3">
                        <p className="font-black text-stone-950">{usuario.nombre}</p>
                        <p className="text-xs font-semibold text-stone-500">{formatShortId(usuario.id, 'USR-')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-black text-stone-700">
                          {roleLabels[usuario.rol]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            usuario.activo ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => cambiarEstado(usuario)}
                          className={`rounded-xl border px-3 py-2 text-xs font-black transition-colors ${
                            usuario.activo
                              ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                              : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {usuario.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
};

function SummaryCard({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'green' | 'gold' }) {
  const color = {
    neutral: 'text-stone-950',
    green: 'text-green-700',
    gold: 'text-[#A8841C]',
  }[tone];

  return (
    <div className="rounded-2xl border border-stone-200 bg-[#fbf8f2] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className={`mt-1 font-serif text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

export default UsersPage;
