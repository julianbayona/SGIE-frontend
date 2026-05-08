import React, { useEffect, useState } from 'react';
import catalogosApi from '@/api/catalogos';
import salonesApi from '@/api/salones';
import PageTitle from '@/components/ui/PageTitle';
import { useToast } from '@/components/ui/ToastProvider';
import type {
  CatalogoBasicoResponse,
  TipoAdicionalResponse,
  SalonResponse,
  PlatoResponse,
  TipoMomentoMenuResponse,
  ColorResponse,
  MantelResponse,
  SobremantelResponse,
  PlatoMomentoResponse,
} from '@/api/types';
import { formatShortId } from '@/utils/formatters';

type CatalogKey =
  | 'tipo_evento'
  | 'tipo_comida'
  | 'tipo_mesa'
  | 'tipo_silla'
  | 'mantel'
  | 'sobremantel'
  | 'color'
  | 'tipo_adicional'
  | 'salon'
  | 'plato'
  | 'tipo_momento_menu'
  | 'plato_momento';

interface CatalogTab {
  key: CatalogKey;
  label: string;
  description: string;
}

const catalogTabs: CatalogTab[] = [
  { key: 'tipo_evento', label: 'Tipos de evento', description: 'Categorias de eventos disponibles.' },
  { key: 'tipo_comida', label: 'Tipos de comida', description: 'Servicios de alimentacion disponibles.' },
  { key: 'tipo_mesa', label: 'Tipos de mesa', description: 'Catalogo usado en el montaje de mesas.' },
  { key: 'tipo_silla', label: 'Tipos de silla', description: 'Sillas disponibles para montaje.' },
  { key: 'mantel', label: 'Manteles', description: 'Cada mantel debe quedar asociado a un color.' },
  { key: 'sobremantel', label: 'Sobremanteles', description: 'Cada sobremantel debe quedar asociado a un color.' },
  { key: 'color', label: 'Colores', description: 'Catalogo de colores con nombre y codigo hex.' },
  { key: 'tipo_adicional', label: 'Tipos de adicional', description: 'Adicionales del montaje con modo de cobro y precio base.' },
  { key: 'plato', label: 'Platos', description: 'Catalogo base de platos disponibles para menu.' },
  { key: 'tipo_momento_menu', label: 'Momentos de menu', description: 'Momentos configurables del flujo gastronomico.' },
  { key: 'plato_momento', label: 'Platos por momento', description: 'Asociacion entre platos y momentos del menu.' },
  { key: 'salon', label: 'Salones', description: 'Espacios fisicos reservables para eventos.' },
];

type GenericRow =
  | CatalogoBasicoResponse
  | TipoAdicionalResponse
  | SalonResponse
  | PlatoResponse
  | TipoMomentoMenuResponse
  | ColorResponse
  | MantelResponse
  | SobremantelResponse
  | PlatoMomentoRow;

interface PlatoMomentoRow {
  id: string;
  nombre: string;
  activo: boolean;
  platoId: string;
  tipoMomentoId: string;
  platoNombre: string;
  momentoNombre: string;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const getRowColorId = (row: MantelResponse | SobremantelResponse): string | null => {
  return row.colorId ?? row.idColor ?? row.color?.id ?? null;
};

const buildPlatoMomentoRows = (
  relaciones: PlatoMomentoResponse[],
  platos: PlatoResponse[],
  momentos: TipoMomentoMenuResponse[]
): PlatoMomentoRow[] => {
  const platosById = new Map(platos.map((plato) => [plato.id, plato]));
  const momentosById = new Map(momentos.map((momento) => [momento.id, momento]));

  return relaciones.map((relacion) => {
    const platoNombre = platosById.get(relacion.platoId)?.nombre ?? formatShortId(relacion.platoId, 'PLA-');
    const momentoNombre = momentosById.get(relacion.tipoMomentoId)?.nombre ?? formatShortId(relacion.tipoMomentoId, 'MOM-');

    return {
      id: `${relacion.platoId}|${relacion.tipoMomentoId}`,
      nombre: `${platoNombre} / ${momentoNombre}`,
      activo: true,
      platoId: relacion.platoId,
      tipoMomentoId: relacion.tipoMomentoId,
      platoNombre,
      momentoNombre,
    };
  });
};

const CatalogsPage: React.FC = () => {
  const toast = useToast();
  const [activeCatalog, setActiveCatalog] = useState<CatalogKey>('tipo_evento');
  const [rows, setRows] = useState<GenericRow[]>([]);
  const [colors, setColors] = useState<ColorResponse[]>([]);
  const [platosCatalogo, setPlatosCatalogo] = useState<PlatoResponse[]>([]);
  const [momentosCatalogo, setMomentosCatalogo] = useState<TipoMomentoMenuResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCapacidad, setFormCapacidad] = useState(0);
  const [formModoCobro, setFormModoCobro] = useState<'UNIDAD' | 'SERVICIO'>('SERVICIO');
  const [formPrecioBase, setFormPrecioBase] = useState(0);
  const [formCodigoHex, setFormCodigoHex] = useState('#C9A46A');
  const [formColorId, setFormColorId] = useState('');
  const [formPlatoId, setFormPlatoId] = useState('');
  const [formMomentoId, setFormMomentoId] = useState('');
  const [saving, setSaving] = useState(false);

  const isSalon = activeCatalog === 'salon';
  const isTipoAdicional = activeCatalog === 'tipo_adicional';
  const isPlato = activeCatalog === 'plato';
  const isTipoMomentoMenu = activeCatalog === 'tipo_momento_menu';
  const isPlatoMomento = activeCatalog === 'plato_momento';
  const isColor = activeCatalog === 'color';
  const isTextil = activeCatalog === 'mantel' || activeCatalog === 'sobremantel';
  const activeTab = catalogTabs.find((tab) => tab.key === activeCatalog)!;

  const resetForm = () => {
    setEditingId(null);
    setFormNombre('');
    setFormDescripcion('');
    setFormCapacidad(0);
    setFormModoCobro('SERVICIO');
    setFormPrecioBase(0);
    setFormCodigoHex('#C9A46A');
    setFormColorId(colors[0]?.id ?? '');
    setFormPlatoId(platosCatalogo.find((item) => item.activo)?.id ?? '');
    setFormMomentoId(momentosCatalogo.find((item) => item.activo)?.id ?? '');
  };

  const loadCatalog = async (key: CatalogKey) => {
    setLoading(true);
    setError(null);

    try {
      const needsColors = key === 'color' || key === 'mantel' || key === 'sobremantel';
      const colorPromise = needsColors ? catalogosApi.colores.listar() : Promise.resolve([] as ColorResponse[]);
      const platoPromise = key === 'plato_momento' ? catalogosApi.platos.listar() : Promise.resolve([] as PlatoResponse[]);
      const momentoPromise = key === 'plato_momento' ? catalogosApi.tiposMomentoMenu.listar() : Promise.resolve([] as TipoMomentoMenuResponse[]);

      let dataPromise: Promise<GenericRow[] | PlatoMomentoResponse[]>;

      switch (key) {
        case 'tipo_evento': dataPromise = catalogosApi.tiposEvento.listar(); break;
        case 'tipo_comida': dataPromise = catalogosApi.tiposComida.listar(); break;
        case 'tipo_mesa': dataPromise = catalogosApi.tiposMesa.listar(); break;
        case 'tipo_silla': dataPromise = catalogosApi.tiposSilla.listar(); break;
        case 'mantel': dataPromise = catalogosApi.manteles.listar(); break;
        case 'sobremantel': dataPromise = catalogosApi.sobremanteles.listar(); break;
        case 'color': dataPromise = catalogosApi.colores.listar(); break;
        case 'tipo_adicional': dataPromise = catalogosApi.tiposAdicional.listar(); break;
        case 'plato': dataPromise = catalogosApi.platos.listar(); break;
        case 'tipo_momento_menu': dataPromise = catalogosApi.tiposMomentoMenu.listar(); break;
        case 'plato_momento':
          dataPromise = catalogosApi.platoMomentos.obtener();
          break;
        case 'salon': dataPromise = salonesApi.listar(); break;
      }

      const [data, colorData, platoData, momentoData] = await Promise.all([dataPromise, colorPromise, platoPromise, momentoPromise]);
      setRows(key === 'plato_momento'
        ? buildPlatoMomentoRows(data as PlatoMomentoResponse[], platoData, momentoData)
        : data as GenericRow[]
      );
      setColors(colorData);
      setPlatosCatalogo(platoData);
      setMomentosCatalogo(momentoData);
      if (key === 'plato_momento') {
        setFormPlatoId((current) => current || platoData.find((item) => item.activo)?.id || '');
        setFormMomentoId((current) => current || momentoData.find((item) => item.activo)?.id || '');
      }
      if ((key === 'mantel' || key === 'sobremantel') && colorData.length > 0) {
        setFormColorId((current) => current || colorData[0]!.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el catalogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog(activeCatalog);
    setEditingId(null);
    setFormNombre('');
    setFormDescripcion('');
    setFormCapacidad(0);
    setFormModoCobro('SERVICIO');
    setFormPrecioBase(0);
    setFormCodigoHex('#C9A46A');
    setFormColorId('');
    setFormPlatoId('');
    setFormMomentoId('');
  }, [activeCatalog]);

  const startEdit = (row: GenericRow) => {
    if (activeCatalog === 'plato_momento') {
      return;
    }

    setEditingId(row.id);
    setFormNombre('nombre' in row ? row.nombre : '');
    setFormDescripcion('descripcion' in row ? row.descripcion ?? '' : '');
    setFormCapacidad('capacidad' in row ? (row as SalonResponse).capacidad : 0);
    setFormModoCobro('modoCobro' in row ? (row as TipoAdicionalResponse).modoCobro : 'SERVICIO');
    setFormPrecioBase('precioBase' in row ? Number((row as TipoAdicionalResponse | PlatoResponse).precioBase) : 0);
    setFormCodigoHex('codigoHex' in row ? (row as ColorResponse).codigoHex : '#C9A46A');
    setFormColorId(
      activeCatalog === 'mantel' || activeCatalog === 'sobremantel'
        ? getRowColorId(row as MantelResponse | SobremantelResponse) ?? ''
        : ''
    );
  };

  const handleSave = async () => {
    if (!isPlatoMomento && !formNombre.trim()) {
      return;
    }

    if (isPlatoMomento && (!formPlatoId || !formMomentoId)) {
      return;
    }

    if (isTextil && !formColorId) {
      return;
    }

    setSaving(true);

    try {
      const wasEditing = Boolean(editingId);
      const basicData = { nombre: formNombre.trim(), descripcion: formDescripcion.trim() || undefined };
      const salonData = {
        nombre: formNombre.trim(),
        capacidad: formCapacidad,
        descripcion: formDescripcion.trim() || undefined,
      };
      const tipoAdicionalData = {
        nombre: formNombre.trim(),
        modoCobro: formModoCobro,
        precioBase: formPrecioBase,
      };
      const platoData = {
        nombre: formNombre.trim(),
        descripcion: formDescripcion.trim() || undefined,
        precioBase: formPrecioBase,
      };
      const tipoMomentoMenuData = {
        nombre: formNombre.trim(),
      };
      const colorData = {
        nombre: formNombre.trim(),
        codigoHex: formCodigoHex.trim(),
      };
      const textilData = {
        nombre: formNombre.trim(),
        colorId: formColorId,
      };

      if (editingId) {
        switch (activeCatalog) {
          case 'tipo_evento': await catalogosApi.tiposEvento.actualizar(editingId, basicData); break;
          case 'tipo_comida': await catalogosApi.tiposComida.actualizar(editingId, basicData); break;
          case 'tipo_mesa': await catalogosApi.tiposMesa.actualizar(editingId, basicData); break;
          case 'tipo_silla': await catalogosApi.tiposSilla.actualizar(editingId, basicData); break;
          case 'mantel': await catalogosApi.manteles.actualizar(editingId, textilData); break;
          case 'sobremantel': await catalogosApi.sobremanteles.actualizar(editingId, textilData); break;
          case 'color': await catalogosApi.colores.actualizar(editingId, colorData); break;
          case 'tipo_adicional': await catalogosApi.tiposAdicional.actualizar(editingId, tipoAdicionalData); break;
          case 'plato': await catalogosApi.platos.actualizar(editingId, platoData); break;
          case 'tipo_momento_menu': await catalogosApi.tiposMomentoMenu.actualizar(editingId, tipoMomentoMenuData); break;
          default: break;
        }
      } else {
        switch (activeCatalog) {
          case 'tipo_evento': await catalogosApi.tiposEvento.crear(basicData); break;
          case 'tipo_comida': await catalogosApi.tiposComida.crear(basicData); break;
          case 'tipo_mesa': await catalogosApi.tiposMesa.crear(basicData); break;
          case 'tipo_silla': await catalogosApi.tiposSilla.crear(basicData); break;
          case 'mantel': await catalogosApi.manteles.crear(textilData); break;
          case 'sobremantel': await catalogosApi.sobremanteles.crear(textilData); break;
          case 'color': await catalogosApi.colores.crear(colorData); break;
          case 'tipo_adicional': await catalogosApi.tiposAdicional.crear(tipoAdicionalData); break;
          case 'plato': await catalogosApi.platos.crear(platoData); break;
          case 'tipo_momento_menu': await catalogosApi.tiposMomentoMenu.crear(tipoMomentoMenuData); break;
          case 'plato_momento': await catalogosApi.platoMomentos.crear({ platoId: formPlatoId, tipoMomentoId: formMomentoId }); break;
          case 'salon': await salonesApi.registrar(salonData); break;
        }
      }

      await loadCatalog(activeCatalog);
      resetForm();
      toast.success(
        wasEditing ? 'Registro actualizado' : 'Registro creado',
        `${activeTab.label}: la informacion quedo guardada correctamente.`,
      );
    } catch (err) {
      toast.error('No fue posible guardar el registro', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDesactivar = async (id: string) => {
    try {
      switch (activeCatalog) {
        case 'tipo_evento': await catalogosApi.tiposEvento.desactivar(id); break;
        case 'tipo_comida': await catalogosApi.tiposComida.desactivar(id); break;
        case 'tipo_mesa': await catalogosApi.tiposMesa.desactivar(id); break;
        case 'tipo_silla': await catalogosApi.tiposSilla.desactivar(id); break;
        case 'mantel': await catalogosApi.manteles.desactivar(id); break;
        case 'sobremantel': await catalogosApi.sobremanteles.desactivar(id); break;
        case 'color': await catalogosApi.colores.desactivar(id); break;
        case 'tipo_adicional': await catalogosApi.tiposAdicional.desactivar(id); break;
        case 'plato': await catalogosApi.platos.desactivar(id); break;
        case 'tipo_momento_menu': await catalogosApi.tiposMomentoMenu.desactivar(id); break;
        case 'plato_momento': {
          const [platoId, tipoMomentoId] = id.split('|');
          if (platoId && tipoMomentoId) {
            await catalogosApi.platoMomentos.eliminar({ platoId, tipoMomentoId });
          }
          break;
        }
        default: return;
      }

      await loadCatalog(activeCatalog);
      toast.success(
        activeCatalog === 'plato_momento' ? 'Relacion eliminada' : 'Estado actualizado',
        `${activeTab.label}: el cambio quedo aplicado correctamente.`,
      );
    } catch (err) {
      toast.error('No fue posible actualizar el registro', err instanceof Error ? err.message : undefined);
    }
  };

  const colorById = new Map(colors.map((color) => [color.id, color]));

  return (
    <section className="space-y-6">
      <PageTitle
        eyebrow="Administracion"
        title="Catalogos"
        description="Gestion operativa de catalogos base usados en salones, montaje y adicionales."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_340px] gap-5">
        <aside className="bg-surface-container-lowest border border-border rounded-lg p-3 h-fit">
          <nav className="space-y-1">
            {catalogTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCatalog(tab.key)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  tab.key === activeCatalog ? 'bg-gold-bg text-gold-d' : 'text-text2 hover:bg-hover'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="bg-surface-container-lowest border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-xl font-display font-bold text-on-surface">{activeTab.label}</h2>
            <p className="text-sm text-on-surface-variant mt-1">{activeTab.description}</p>
          </div>

          {error ? (
            <div className="mx-5 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-on-surface-variant text-sm">
              Cargando...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    {isSalon ? <th className="px-4 py-3">Capacidad</th> : null}
                    {isTextil ? <th className="px-4 py-3">Color</th> : null}
                    {isColor ? <th className="px-4 py-3">Codigo hex</th> : null}
                    {isTipoAdicional ? <th className="px-4 py-3">Modo cobro</th> : null}
                    {isTipoAdicional ? <th className="px-4 py-3">Precio base</th> : null}
                    {isPlato ? <th className="px-4 py-3">Precio base</th> : null}
                    {isPlatoMomento ? <th className="px-4 py-3">Plato</th> : null}
                    {isPlatoMomento ? <th className="px-4 py-3">Momento</th> : null}
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {rows.map((row) => {
                    const isActive = 'activo' in row ? row.activo : true;
                    const textilColor =
                      isTextil
                        ? colorById.get(getRowColorId(row as MantelResponse | SobremantelResponse) ?? '') ??
                          (row as MantelResponse | SobremantelResponse).color ??
                          null
                        : null;

                    return (
                      <tr key={row.id} className="hover:bg-stone-50/70">
                        <td className="px-4 py-3 text-sm font-semibold text-on-surface">
                          {'nombre' in row ? row.nombre : ''}
                          {'descripcion' in row && row.descripcion ? (
                            <p className="text-xs text-on-surface-variant font-normal mt-0.5">{row.descripcion}</p>
                          ) : null}
                        </td>
                        {isSalon ? (
                          <td className="px-4 py-3 text-sm text-on-surface-variant">
                            {(row as SalonResponse).capacidad} pax
                          </td>
                        ) : null}
                        {isTextil ? (
                          <td className="px-4 py-3 text-sm text-on-surface-variant">
                            {textilColor ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-block h-4 w-4 rounded-full border border-black/10"
                                  style={{ backgroundColor: textilColor.codigoHex }}
                                ></span>
                                <span>{textilColor.nombre}</span>
                              </div>
                            ) : (
                              'Sin color'
                            )}
                          </td>
                        ) : null}
                        {isColor ? (
                          <td className="px-4 py-3 text-sm text-on-surface-variant">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-4 w-4 rounded-full border border-black/10"
                                style={{ backgroundColor: (row as ColorResponse).codigoHex }}
                              ></span>
                              <span>{(row as ColorResponse).codigoHex}</span>
                            </div>
                          </td>
                        ) : null}
                        {isTipoAdicional ? (
                          <>
                            <td className="px-4 py-3 text-sm text-on-surface-variant">
                              {(row as TipoAdicionalResponse).modoCobro === 'UNIDAD' ? 'Por unidad' : 'Por servicio'}
                            </td>
                            <td className="px-4 py-3 text-sm text-on-surface-variant">
                              {formatCOP(Number((row as TipoAdicionalResponse).precioBase))}
                            </td>
                          </>
                        ) : null}
                        {isPlato ? (
                          <td className="px-4 py-3 text-sm text-on-surface-variant">
                            {formatCOP(Number((row as PlatoResponse).precioBase))}
                          </td>
                        ) : null}
                        {isPlatoMomento ? (
                          <>
                            <td className="px-4 py-3 text-sm text-on-surface-variant">
                              {(row as PlatoMomentoRow).platoNombre}
                            </td>
                            <td className="px-4 py-3 text-sm text-on-surface-variant">
                              {(row as PlatoMomentoRow).momentoNombre}
                            </td>
                          </>
                        ) : null}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold ${
                            isActive ? 'bg-green-bg text-green-text' : 'bg-surface-container-low text-on-surface-variant'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green' : 'bg-stone-400'}`}></span>
                            {isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {!isPlatoMomento ? (
                              <button
                                type="button"
                                onClick={() => startEdit(row)}
                                className="px-3 py-1.5 rounded border border-border text-xs font-semibold text-text2 hover:bg-hover"
                              >
                                Editar
                              </button>
                            ) : null}
                            {!isSalon ? (
                              <button
                                type="button"
                                onClick={() => handleDesactivar(row.id)}
                                className={`px-3 py-1.5 rounded border text-xs font-semibold ${
                                  isActive
                                    ? 'border-red-border text-red-text hover:bg-red-bg'
                                    : 'border-green-border text-green-text hover:bg-green-bg'
                                }`}
                              >
                                {isPlatoMomento ? 'Eliminar' : isActive ? 'Desactivar' : 'Activar'}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-on-surface-variant">
                        No hay registros en este catalogo.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <aside className="bg-surface-container-lowest border border-border rounded-lg p-5 h-fit shadow-sm">
          <h3 className="text-lg font-display font-bold text-on-surface">
            {editingId ? 'Editar registro' : 'Nuevo registro'}
          </h3>
          <p className="text-sm text-on-surface-variant mt-1 mb-5">
            {isPlatoMomento
              ? 'Asocia platos activos con los momentos de menu disponibles.'
              : 'Los registros se desactivan para preservar trazabilidad.'}
          </p>

          <div className="space-y-4">
            {isPlatoMomento ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-2">Plato *</label>
                  <select
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                    value={formPlatoId}
                    onChange={(e) => setFormPlatoId(e.target.value)}
                  >
                    <option value="">Selecciona un plato</option>
                    {platosCatalogo.filter((plato) => plato.activo).map((plato) => (
                      <option key={plato.id} value={plato.id}>
                        {plato.nombre} - {formatCOP(Number(plato.precioBase))}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-2">Momento de menu *</label>
                  <select
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                    value={formMomentoId}
                    onChange={(e) => setFormMomentoId(e.target.value)}
                  >
                    <option value="">Selecciona un momento</option>
                    {momentosCatalogo.filter((momento) => momento.activo).map((momento) => (
                      <option key={momento.id} value={momento.id}>
                        {momento.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">Nombre *</label>
                <input
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Nombre del registro"
                />
              </div>
            )}

            {!isSalon && !isTipoAdicional && !isTipoMomentoMenu && !isTextil && !isColor && !isPlatoMomento ? (
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">Descripcion</label>
                <input
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                  type="text"
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            ) : null}

            {isSalon ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-2">Capacidad maxima *</label>
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                    type="number"
                    min={1}
                    value={formCapacidad}
                    onChange={(e) => setFormCapacidad(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-2">Descripcion</label>
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                    type="text"
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </>
            ) : null}

            {isColor ? (
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">Codigo hex *</label>
                <div className="flex items-center gap-3">
                  <input
                    className="h-10 w-12 rounded border border-outline-variant/40 bg-surface-container-low p-1"
                    type="color"
                    value={formCodigoHex}
                    onChange={(e) => setFormCodigoHex(e.target.value)}
                  />
                  <input
                    className="flex-1 bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                    type="text"
                    value={formCodigoHex}
                    onChange={(e) => setFormCodigoHex(e.target.value)}
                    placeholder="#C9A46A"
                  />
                </div>
              </div>
            ) : null}

            {isTextil ? (
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">Color asociado *</label>
                <select
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                  value={formColorId}
                  onChange={(e) => setFormColorId(e.target.value)}
                >
                  <option value="">Selecciona un color</option>
                  {colors.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.nombre} - {color.codigoHex}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {isTipoAdicional ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-2">Modo de cobro *</label>
                  <select
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                    value={formModoCobro}
                    onChange={(e) => setFormModoCobro(e.target.value as 'UNIDAD' | 'SERVICIO')}
                  >
                    <option value="SERVICIO">Por servicio</option>
                    <option value="UNIDAD">Por unidad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-2">Precio base *</label>
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                    type="number"
                    min={0}
                    value={formPrecioBase}
                    onChange={(e) => setFormPrecioBase(Number(e.target.value) || 0)}
                  />
                </div>
              </>
            ) : null}

            {isPlato ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-2">Descripcion</label>
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                    type="text"
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-2">Precio base *</label>
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-md px-3 py-2.5 text-sm"
                    type="number"
                    min={0}
                    value={formPrecioBase}
                    onChange={(e) => setFormPrecioBase(Number(e.target.value) || 0)}
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-md border border-border text-sm font-semibold text-text2 hover:bg-hover"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={
                (!isPlatoMomento && !formNombre.trim()) ||
                saving ||
                (isSalon && formCapacidad < 1) ||
                ((isTipoAdicional || isPlato) && formPrecioBase < 0) ||
                (isTextil && !formColorId) ||
                (isColor && !formCodigoHex.trim()) ||
                (isPlatoMomento && (!formPlatoId || !formMomentoId))
              }
              className="px-5 py-2 rounded-md bg-primary-gold text-white text-sm font-bold hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default CatalogsPage;
