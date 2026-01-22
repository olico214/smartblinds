"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Input, Chip, Pagination, Spinner, Tooltip, Button, useDisclosure
} from "@nextui-org/react";
import { Search, Edit2, PlusCircle } from "lucide-react"; // Asegúrate de tener PlusCircle importado
import ClienteModal from "../registroCliente/registrarCliente";

const columns = [
    { key: "nombre", label: "NOMBRE" },
    { key: "email", label: "EMAIL" },
    { key: "telefono", label: "TELÉFONO" },
    { key: "selected_canal_venta", label: "CANAL ID" },
    { key: "frecuente", label: "FRECUENTE" },
    { key: "actions", label: "ACCIONES" },
];

export default function ClientesTable() {
    const [clientes, setClientes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterValue, setFilterValue] = useState("");
    const [selectedClient, setSelectedClient] = useState(null);
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // CONTROL DEL MODAL DESDE EL PADRE
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const fetchClientes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/clientes');
            const json = await res.json();
            if (json.ok) setClientes(json.data);
        } catch (error) {
            console.error("Error cargando clientes", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchClientes(); }, []);

    // --- ACCIONES ---
    const handleCreateNew = () => {
        setSelectedClient(null); // Modo Crear
        onOpen(); // Abrimos el modal único
    };

    const handleEdit = (cliente) => {
        setSelectedClient(cliente); // Modo Editar con datos
        onOpen(); // Abrimos el modal único
    };

    // --- RENDERIZADO DE CELDAS ---
    const renderCell = useCallback((cliente, columnKey) => {
        const cellValue = cliente[columnKey];
        switch (columnKey) {
            case "frecuente":
                return (
                    <Chip color={cellValue ? "success" : "default"} size="sm" variant="flat">
                        {cellValue ? "Sí" : "No"}
                    </Chip>
                );
            case "actions":
                return (
                    <div className="flex items-center gap-2">
                        <Tooltip content="Editar usuario">
                            {/* AQUI ESTA EL CAMBIO CLAVE: Un botón simple, no el Modal */}
                            <span className="text-lg text-default-400 cursor-pointer active:opacity-50" onClick={() => handleEdit(cliente)}>
                                <Edit2 size={20} />
                            </span>
                        </Tooltip>
                    </div>
                );
            default:
                return cellValue;
        }
    }, []);

    // --- FILTRADO Y PAGINACIÓN (Igual que antes) ---
    const filteredItems = useMemo(() => {
        if (!filterValue) return clientes;
        return clientes.filter(c =>
            c.nombre.toLowerCase().includes(filterValue.toLowerCase()) ||
            c.email?.toLowerCase().includes(filterValue.toLowerCase())
        );
    }, [clientes, filterValue]);

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return filteredItems.slice(start, start + rowsPerPage);
    }, [page, filteredItems]);

    return (
        <div className="space-y-4">
            {/* BARRA SUPERIOR */}
            <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Buscar por nombre..."
                    startContent={<Search size={16} />}
                    value={filterValue}
                    onValueChange={(val) => { setFilterValue(val); setPage(1); }}
                />

                {/* Botón para CREAR (ahora usa la función del padre) */}
                <Button color="primary" onPress={handleCreateNew} startContent={<PlusCircle size={20} />}>
                    Nuevo Cliente
                </Button>
            </div>

            {/* TABLA */}
            <Table
                aria-label="Tabla Clientes"
                bottomContent={
                    <div className="flex w-full justify-center">
                        <Pagination isCompact showControls color="primary" page={page} total={Math.ceil(filteredItems.length / rowsPerPage) || 1} onChange={setPage} />
                    </div>
                }
            >
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody items={items} isLoading={isLoading} loadingContent={<Spinner />} emptyContent="No hay clientes">
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>


            <ClienteModal
                isOpenProp={isOpen}
                onOpenChangeProp={onOpenChange}
                clientToEdit={selectedClient}
                refreshTable={fetchClientes}
            />
        </div>
    );
}