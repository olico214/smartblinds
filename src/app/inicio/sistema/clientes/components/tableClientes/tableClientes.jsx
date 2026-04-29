"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Input, Chip, Pagination, Spinner, Tooltip, Button, useDisclosure
} from "@nextui-org/react";
import { Search, Edit2, PlusCircle, CheckCircle, Eye, Users, Phone, Mail, MapPin } from "lucide-react";
import ClienteModal from "../registroCliente/registrarCliente";
import Link from "next/link";

const columns = [
    { key: "nombre", label: "CLIENTE" },
    { key: "contacto", label: "CONTACTO" },
    { key: "ubicacion", label: "UBICACIÓN" },
    { key: "canal_venta_nombre", label: "CANAL" },
    { key: "frecuente", label: "FRECUENTE" },
    { key: "cotizaciones_aprobadas", label: "APROBADAS" },
    { key: "actions", label: "ACCIONES" },
];

export default function ClientesTable() {
    const [clientes, setClientes] = useState([]);
    const [cotizacionesAprobadas, setCotizacionesAprobadas] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [filterValue, setFilterValue] = useState("");
    const [selectedClient, setSelectedClient] = useState(null);
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const fetchClientes = async () => {
        setIsLoading(true);
        try {
            const [clientesRes, aprobadasRes] = await Promise.all([
                fetch('/api/clientes'),
                fetch('/api/clientes/cotizaciones-aprobadas')
            ]);
            const clientesJson = await clientesRes.json();
            const aprobadasJson = await aprobadasRes.json();

            if (clientesJson.ok) setClientes(clientesJson.data);

            if (aprobadasJson.ok) {
                const aprobadasMap = {};
                aprobadasJson.data.forEach(item => {
                    aprobadasMap[item.cliente_id] = {
                        count: item.cotizaciones_aprobadas,
                        total: item.total_ventas
                    };
                });
                setCotizacionesAprobadas(aprobadasMap);
            }
        } catch (error) {
            console.error("Error cargando clientes", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchClientes(); }, []);

    const handleCreateNew = () => {
        setSelectedClient(null);
        onOpen();
    };

    const handleEdit = (cliente) => {
        setSelectedClient(cliente);
        onOpen();
    };

    const renderCell = useCallback((cliente, columnKey) => {
        const cellValue = cliente[columnKey];
        switch (columnKey) {
            case "nombre":
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {cliente.nombre?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-700 text-sm">{cliente.nombre}</p>
                            {cliente.tipo && (
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{cliente.tipo}</span>
                            )}
                        </div>
                    </div>
                );
            case "contacto":
                return (
                    <div className="space-y-1">
                        {cliente.email && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Mail size={12} className="text-slate-400" />
                                <span className="truncate max-w-[160px]">{cliente.email}</span>
                            </div>
                        )}
                        {cliente.telefono && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Phone size={12} className="text-slate-400" />
                                <span>{cliente.telefono}</span>
                            </div>
                        )}
                        {!cliente.email && !cliente.telefono && (
                            <span className="text-xs text-slate-400">Sin contacto</span>
                        )}
                    </div>
                );
            case "ubicacion":
                return (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">
                            {[cliente.ciudad, cliente.estado].filter(Boolean).join(", ") || "N/A"}
                        </span>
                    </div>
                );
            case "canal_venta_nombre":
                return (
                    <Chip
                        variant="flat"
                        size="sm"
                        className="bg-blue-50 text-blue-600 border border-blue-100"
                    >
                        {cellValue || "N/A"}
                    </Chip>
                );
            case "frecuente":
                return (
                    <Chip
                        color={cellValue ? "success" : "default"}
                        size="sm"
                        variant="flat"
                        classNames={{
                            base: cellValue ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200",
                            content: cellValue ? "text-green-700" : "text-slate-400"
                        }}
                    >
                        {cellValue ? "Sí" : "No"}
                    </Chip>
                );
            case "cotizaciones_aprobadas": {
                const info = cotizacionesAprobadas[cliente.id];
                const count = info ? parseInt(info.count) : 0;
                const total = info ? parseFloat(info.total) : 0;
                return (
                    <div>
                        {count > 0 ? (
                            <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200 w-fit">
                                    <CheckCircle size={12} />
                                    {count} aprobada{count !== 1 ? 's' : ''}
                                </span>
                                <span className="text-[11px] text-green-600 font-medium mt-0.5">
                                    ${total.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                </span>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                                Sin aprobadas
                            </span>
                        )}
                    </div>
                );
            }
            case "actions":
                return (
                    <div className="flex items-center gap-1">
                        <Tooltip content="Ver detalle del cliente" placement="left">
                            <Button
                                as={Link}
                                href={`/inicio/sistema/clientes/${cliente.id}`}
                                variant="light"
                                size="sm"
                                isIconOnly
                                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                                <Eye size={18} />
                            </Button>
                        </Tooltip>
                        <Tooltip content="Editar cliente" placement="right">
                            <Button
                                variant="light"
                                size="sm"
                                isIconOnly
                                onPress={() => handleEdit(cliente)}
                                className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            >
                                <Edit2 size={18} />
                            </Button>
                        </Tooltip>
                    </div>
                );
            default:
                return cellValue;
        }
    }, [cotizacionesAprobadas]);

    const filteredItems = useMemo(() => {
        if (!filterValue) return clientes;
        const search = filterValue.toLowerCase();
        return clientes.filter(c =>
            c.nombre.toLowerCase().includes(search) ||
            c.email?.toLowerCase().includes(search) ||
            c.telefono?.includes(search) ||
            c.ciudad?.toLowerCase().includes(search)
        );
    }, [clientes, filterValue]);

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return filteredItems.slice(start, start + rowsPerPage);
    }, [page, filteredItems]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users size={24} className="text-blue-600" />
                        Clientes
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        {filteredItems.length} clientes registrados
                    </p>
                </div>
                <Button
                    color="primary"
                    onPress={handleCreateNew}
                    startContent={<PlusCircle size={18} />}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-200 font-medium"
                >
                    Nuevo Cliente
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <Input
                    isClearable
                    placeholder="Buscar por nombre, email, teléfono o ciudad..."
                    startContent={<Search size={18} className="text-slate-400" />}
                    value={filterValue}
                    onValueChange={(val) => { setFilterValue(val); setPage(1); }}
                    classNames={{
                        input: "text-sm",
                        inputWrapper: "bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors"
                    }}
                    variant="bordered"
                    radius="lg"
                />
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <Table
                    aria-label="Tabla Clientes"
                    removeWrapper
                    bottomContent={
                        <div className="flex w-full justify-center p-4 border-t border-slate-100">
                            <Pagination
                                isCompact
                                showControls
                                color="primary"
                                page={page}
                                total={Math.ceil(filteredItems.length / rowsPerPage) || 1}
                                onChange={setPage}
                                classNames={{
                                    item: "rounded-lg",
                                    cursor: "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md"
                                }}
                            />
                        </div>
                    }
                    classNames={{
                        th: "bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider",
                        td: "py-4",
                        tr: "hover:bg-blue-50/50 transition-colors"
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                    </TableHeader>
                    <TableBody
                        items={items}
                        isLoading={isLoading}
                        loadingContent={
                            <div className="flex items-center justify-center py-12">
                                <Spinner size="lg" color="primary" label="Cargando clientes..." />
                            </div>
                        }
                        emptyContent={
                            <div className="py-12 text-center">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-400 font-medium">No hay clientes registrados</p>
                                <p className="text-xs text-slate-300 mt-1">Crea un nuevo cliente para comenzar</p>
                            </div>
                        }
                    >
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <ClienteModal
                isOpenProp={isOpen}
                onOpenChangeProp={onOpenChange}
                clientToEdit={selectedClient}
                refreshTable={fetchClientes}
            />
        </div>
    );
}
