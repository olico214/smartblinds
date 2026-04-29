"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Chip, Tooltip, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@nextui-org/react";
import { Search, Eye, Filter, ArrowUpDown, Plus, FileText, LayoutDashboard } from "lucide-react";

const statusColorMap = {
    Nuevo: { color: "primary", bg: "bg-blue-50 text-blue-700 border-blue-200" },
    'En proceso': { color: "warning", bg: "bg-amber-50 text-amber-700 border-amber-200" },
    Autorizado: { color: "success", bg: "bg-green-50 text-green-700 border-green-200" },
    Cancelado: { color: "danger", bg: "bg-red-50 text-red-700 border-red-200" },
    Finalizado: { color: "secondary", bg: "bg-purple-50 text-purple-700 border-purple-200" },
};

export default function CotizacionesTable({ initialData }) {
    const [filterValue, setFilterValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortField, setSortField] = useState("id");
    const [sortDirection, setSortDirection] = useState("desc");

    const filteredData = useMemo(() => {
        let data = [...initialData];

        // Filtro por búsqueda
        if (filterValue) {
            const search = filterValue.toLowerCase();
            data = data.filter(item =>
                item.cliente_nombre?.toLowerCase().includes(search) ||
                item.usuario_nombre?.toLowerCase().includes(search) ||
                String(item.id).includes(search)
            );
        }

        // Filtro por estatus
        if (statusFilter !== "all") {
            data = data.filter(item => item.estatus === statusFilter);
        }

        // Ordenamiento
        data.sort((a, b) => {
            let valA, valB;
            switch (sortField) {
                case "id": valA = a.id; valB = b.id; break;
                case "cliente": valA = a.cliente_nombre || ""; valB = b.cliente_nombre || ""; break;
                case "fecha": valA = new Date(a.createdDate); valB = new Date(b.createdDate); break;
                default: valA = a.id; valB = b.id;
            }
            if (sortDirection === "asc") return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });

        return data;
    }, [initialData, filterValue, statusFilter, sortField, sortDirection]);

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortDirection(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-MX', options);
    };

    const formatDateRelative = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Hoy';
        if (days === 1) return 'Ayer';
        if (days < 7) return `Hace ${days} días`;
        return formatDate(dateString);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link href="/inicio/sistema" className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all" title="Ir al Dashboard">
                            <LayoutDashboard size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText size={24} className="text-blue-600" />
                                Cotizaciones
                            </h1>
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">
                        {filteredData.length} de {initialData.length} registros
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/inicio/sistema/crear-cotizacion"
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <Plus size={16} /> Nueva Cotización
                    </Link>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder="Buscar por cliente, vendedor o folio..."
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full"
                        classNames={{
                            input: "pl-10 text-sm",
                            inputWrapper: "bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors"
                        }}
                        variant="bordered"
                        radius="lg"
                    />
                </div>
                <Dropdown>
                    <DropdownTrigger>
                        <Button
                            variant="bordered"
                            className="bg-white border-slate-200 rounded-xl shadow-sm min-w-[160px]"
                            startContent={<Filter size={16} />}
                        >
                            {statusFilter === "all" ? "Todos los estatus" : statusFilter}
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                        aria-label="Filtrar por estatus"
                        onAction={(key) => setStatusFilter(key)}
                        className="rounded-xl"
                    >
                        <DropdownItem key="all">Todos los estatus</DropdownItem>
                        <DropdownItem key="Nuevo">Nuevo</DropdownItem>
                        <DropdownItem key="En proceso">En proceso</DropdownItem>
                        <DropdownItem key="Autorizado">Autorizado</DropdownItem>
                        <DropdownItem key="Cancelado">Cancelado</DropdownItem>
                        <DropdownItem key="Finalizado">Finalizado</DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-left">
                                    <button onClick={() => toggleSort("id")} className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors">
                                        Folio <ArrowUpDown size={12} />
                                    </button>
                                </th>
                                <th className="p-4 text-left">
                                    <button onClick={() => toggleSort("cliente")} className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors">
                                        Cliente <ArrowUpDown size={12} />
                                    </button>
                                </th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Vendedor</th>
                                <th className="p-4 text-left">
                                    <button onClick={() => toggleSort("fecha")} className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors">
                                        Fecha <ArrowUpDown size={12} />
                                    </button>
                                </th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Estatus</th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Autorizado</th>
                                <th className="p-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center">
                                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-400 font-medium">No hay cotizaciones registradas</p>
                                        <p className="text-xs text-slate-300 mt-1">Crea una nueva cotización para comenzar</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="p-4">
                                            <span className="font-mono text-sm font-bold text-blue-600">#{item.id}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium text-slate-700">{item.cliente_nombre || "-"}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-slate-500 text-sm">{item.usuario_nombre || "-"}</span>
                                            {item.nombre_agente && (
                                                <span className="text-xs text-slate-400 block">Agente: {item.nombre_agente}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-600">{formatDate(item.createdDate)}</div>
                                            <div className="text-xs text-slate-400">{formatDateRelative(item.createdDate)}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColorMap[item.estatus]?.bg || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                {item.estatus}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {item.autorizado == 1 ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    Autorizado
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Tooltip content="Ver detalles y gestionar" placement="left" color="primary">
                                                <Button
                                                    prefetch={false}
                                                    as={Link}
                                                    href={`/inicio/sistema/${item.id}`}
                                                    variant="light"
                                                    size="sm"
                                                    className="text-blue-600 hover:bg-blue-50 rounded-lg min-w-0 px-3"
                                                    startContent={<Eye size={16} />}
                                                >
                                                    Detalles
                                                </Button>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                        Mostrando {filteredData.length} de {initialData.length} cotizaciones
                    </span>
                    <div className="flex gap-1">
                        {['Nuevo', 'En proceso', 'Autorizado', 'Cancelado', 'Finalizado'].map(s => {
                            const count = initialData.filter(i => i.estatus === s).length;
                            if (count === 0) return null;
                            return (
                                <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full ${statusColorMap[s]?.bg || ''}`}>
                                    {s}: {count}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
