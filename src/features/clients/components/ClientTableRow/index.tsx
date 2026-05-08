import React from 'react';
import type { Client } from '@/features/clients/types';

interface ClientTableRowProps {
  client: Client;
  onEditClient: (client: Client) => void;
}

const ClientTableRow: React.FC<ClientTableRowProps> = ({ client, onEditClient }) => {
  const isMember = client.category === 'Socio';
  const isActive = client.status === 'Activo';

  return (
    <tr className="hover:bg-stone-50/70 transition-colors">
      <td className="px-6 py-4">
        <p className="text-sm font-bold text-text1">{client.idNumber}</p>
        <p className="text-xs text-text3">Cédula</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-bold text-text1">{client.fullName}</p>
        <p className="text-xs text-text3">Registrado: {client.registeredAt}</p>
      </td>
      <td className="px-6 py-4 text-sm text-text2 font-medium">{client.phone}</td>
      <td className="px-6 py-4 text-sm text-text2">{client.email}</td>
      <td className="px-6 py-4">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isMember ? 'bg-green-bg text-green-text' : 'bg-stone-100 text-stone-600'
          }`}
        >
          {client.category}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${
            isActive ? 'bg-green-bg text-green-text' : 'bg-stone-100 text-stone-500'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green' : 'bg-stone-400/60'}`}></span>
          {client.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEditClient(client)}
            className="px-3 py-1.5 rounded border border-border text-xs font-semibold text-text2 hover:bg-panel hover:text-gold transition-colors"
          >
            Editar
          </button>
          <button
            type="button"
            className="p-1.5 hover:bg-panel rounded text-text3 hover:text-gold transition-colors"
            title="Más acciones"
          >
            <span className="material-symbols-outlined text-lg">more_horiz</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ClientTableRow;
