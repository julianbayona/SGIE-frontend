import type { PlatoResponse, TipoMomentoMenuResponse } from '@/api/types';

export const fallbackMomentosMenu: TipoMomentoMenuResponse[] = [
  { id: 'momento-entrada', nombre: 'Entrada', activo: true },
  { id: 'momento-consome', nombre: 'Consome', activo: true },
  { id: 'momento-plato-fuerte', nombre: 'Plato fuerte', activo: true },
  { id: 'momento-postre', nombre: 'Postre', activo: true },
  { id: 'momento-bebidas', nombre: 'Bebidas', activo: true },
];

export const fallbackPlatos: PlatoResponse[] = [
  {
    id: 'plato-carpaccio',
    nombre: 'Carpaccio de res con alcaparras',
    descripcion: 'Catalogo temporal local',
    precioBase: 25000,
    activo: true,
  },
  {
    id: 'plato-consome-pavo',
    nombre: 'Consome de pavo artesanal',
    descripcion: 'Catalogo temporal local',
    precioBase: 9000,
    activo: true,
  },
  {
    id: 'plato-crema-esparragos',
    nombre: 'Crema de esparragos',
    descripcion: 'Catalogo temporal local',
    precioBase: 8500,
    activo: true,
  },
  {
    id: 'plato-medallon',
    nombre: 'Medallon de lomo en salsa pimienta',
    descripcion: 'Catalogo temporal local',
    precioBase: 65000,
    activo: true,
  },
  {
    id: 'plato-salmon',
    nombre: 'Salmon a la parrilla con finas hierbas',
    descripcion: 'Catalogo temporal local',
    precioBase: 68000,
    activo: true,
  },
  {
    id: 'plato-mousse',
    nombre: 'Mousse de chocolate al 70%',
    descripcion: 'Catalogo temporal local',
    precioBase: 12000,
    activo: true,
  },
  {
    id: 'plato-cheesecake',
    nombre: 'Cheesecake de frutos amarillos',
    descripcion: 'Catalogo temporal local',
    precioBase: 13000,
    activo: true,
  },
  {
    id: 'plato-jugo-agua',
    nombre: 'Jugo natural + agua',
    descripcion: 'Catalogo temporal local',
    precioBase: 15000,
    activo: true,
  },
];
