import React, { useEffect, useMemo, useState } from 'react';
import ClientsHeader from '@/features/clients/components/ClientsHeader';
import ClientsTable from '@/features/clients/components/ClientsTable';
import ClientsTablePagination from '@/features/clients/components/ClientsTablePagination';
import ClientFormModal, { type ClientFormValues } from '@/features/clients/components/ClientFormModal';
import type { Client, ClientsTab } from '@/features/clients/types';
import clientesApi from '@/api/clientes';
import type { ClienteResponse } from '@/api/types';
import { useToast } from '@/components/ui/ToastProvider';
import { formatShortId } from '@/utils/formatters';

/** Convierte la respuesta del backend al tipo que usa el frontend. */
function toClient(c: ClienteResponse): Client {
  return {
    id: c.id,
    idNumber: c.cedula,
    fullName: c.nombreCompleto,
    phone: c.telefono,
    email: c.correo,
    category: c.tipoCliente === 'SOCIO' ? 'Socio' : 'No Socio',
    status: c.activo ? 'Activo' : 'Suspendido',
    registeredAt: formatShortId(c.id, 'CLI-'),
  };
}

const PAGE_SIZE = 7;

const ClientsPage: React.FC = () => {
  const toast = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ClientsTab>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Carga inicial y búsqueda con debounce
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await clientesApi.listar(searchQuery.trim() || undefined);
        if (!cancelled) setClients(data.map(toClient));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar clientes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const editingClient = useMemo(
    () => clients.find((c) => c.id === editingClientId) ?? null,
    [clients, editingClientId]
  );

  const idNumbersInUse = useMemo(
    () =>
      clients
        .filter((c) => c.id !== editingClientId)
        .map((c) => c.idNumber.replace(/[^\d]/g, '')),
    [clients, editingClientId]
  );

  const openCreateForm = () => {
    setEditingClientId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (client: Client) => {
    setEditingClientId(client.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingClientId(null);
  };

  const saveClient = async (values: ClientFormValues) => {
    try {
      if (editingClientId) {
        const actualizado = await clientesApi.actualizar(editingClientId, {
          cedula: values.idNumber,
          nombreCompleto: values.fullName,
          telefono: values.phone,
          correo: values.email,
          tipoCliente: values.category === 'Socio' ? 'SOCIO' : 'NO_SOCIO',
        });
        setClients((prev) => prev.map((c) => (c.id === editingClientId ? toClient(actualizado) : c)));
        toast.success('Cliente actualizado', `${actualizado.nombreCompleto} quedo actualizado correctamente.`);
        closeForm();
        return;
      }

      const nuevo = await clientesApi.registrar({
        cedula: values.idNumber,
        nombreCompleto: values.fullName,
        telefono: values.phone,
        correo: values.email,
        tipoCliente: values.category === 'Socio' ? 'SOCIO' : 'NO_SOCIO',
      });

      setClients((prev) => [toClient(nuevo), ...prev]);
      toast.success('Cliente creado', `${nuevo.nombreCompleto} quedo registrado en el sistema.`);
      closeForm();
    } catch (err) {
      toast.error('No fue posible guardar el cliente', err instanceof Error ? err.message : undefined);
    }
  };

  const visibleClients = useMemo(() => {
    return clients.filter((c) => {
      if (activeTab === 'Socios') return c.category === 'Socio';
      if (activeTab === 'No Socios') return c.category === 'No Socio';
      return true;
    });
  }, [activeTab, clients]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const totalPages = Math.ceil(visibleClients.length / PAGE_SIZE);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedClients = visibleClients.slice(pageStart, pageStart + PAGE_SIZE);
  const from = visibleClients.length === 0 ? 0 : pageStart + 1;
  const to = Math.min(pageStart + PAGE_SIZE, visibleClients.length);

  return (
    <section className="space-y-6 relative isolate min-h-[calc(100vh-10rem)]">
      <ClientsHeader
        activeTab={activeTab}
        searchQuery={searchQuery}
        onTabChange={setActiveTab}
        onSearchChange={setSearchQuery}
        onCreateClient={openCreateForm}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-lg shadow-sm border border-border overflow-hidden flex-1 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-on-surface-variant text-sm">
            Cargando clientes…
          </div>
        ) : (
          <ClientsTable clients={paginatedClients} onEditClient={openEditForm} />
        )}
        <ClientsTablePagination
          from={from}
          to={to}
          total={visibleClients.length}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <ClientFormModal
        isOpen={isFormOpen}
        mode={editingClient ? 'edit' : 'create'}
        initialClient={editingClient}
        idNumbersInUse={idNumbersInUse}
        onCancel={closeForm}
        onSubmit={saveClient}
      />
    </section>
  );
};

export default ClientsPage;
