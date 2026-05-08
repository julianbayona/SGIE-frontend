import React from 'react';
import ClientTableRow from '@/features/clients/components/ClientTableRow';
import type { Client } from '@/features/clients/types';

interface ClientsTableProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
}

const ClientsTable: React.FC<ClientsTableProps> = ({ clients, onEditClient }) => {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-stone-50/70 border-b border-border">
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3">Cédula</th>
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3">Nombre completo</th>
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3">Teléfono</th>
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3">Correo electrónico</th>
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3">Tipo</th>
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3 text-center">Estado</th>
          <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-text3 text-right">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {clients.map((client) => (
          <ClientTableRow key={client.id} client={client} onEditClient={onEditClient} />
        ))}
      </tbody>
    </table>
  );
};

export default ClientsTable;
