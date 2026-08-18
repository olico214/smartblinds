"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Chip, Tooltip, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@nextui-org/react";
import { Search, Eye, Filter, ArrowUpDown, ShoppingCart, LayoutDashboard, DollarSign, Hash } from "lucide-react";

const statusColorMap = {
    Autorizado: { color: "success", bg: "bg-green-50 text-green-700 border-green-200" },
    Cancelado: { color: "danger", bg: "bg-red-50 text-red-700 border-red-200" },
};

const formatMoney = (val) => {
    const v = Math.max(parseFloat(val) || 0, 0);
    return `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function VentasTable({ initialData }) {
    const [filterValue, setFilterValue] = useState("");
    const [sortField, setSortField] = useState("id");
    const [sortDirection, setSortDirection] = useState("desc");

    const filteredData = useMemo(() => {
        let data = [...initialData];

        if (filterValue) {
            const search = filterValue.toLowerCase();
            data = data.filter(item =>
                item.cliente_nombre?.toLowerCase().includes(search) ||
                item.usuario_nombre?.toLowerCase().includes(search) ||
                String(item.id).includes(search) ||
                item.numero_venta?.toLowerCase().includes(search)
            );
        }

        data.sort((a, b) => {
            let valA, valB;
            switch (sortField) {
                case "id": valA = a.id; valB = b.id; break;
                case "cliente": valA = a.cliente_nombre || ""; valB = b.cliente_nombre || ""; break;
                case "fecha": valA = new Date(a.createdDate); valB = new Date(b.createdDate); break;
                case "precioReal": valA = parseFloat(a.precioReal) || 0; valB = parseFloat(b.precioReal) || 0; break;
                case "numero_venta": valA = a.numero_venta || ""; valB = b.numero_venta || ""; break;
                default: valA = a.id; valB = b.id;
            }
            if (sortDirection === "asc") return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });

        return data;
    }, [initialData, filterValue, sortField, sortDirection]);

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

    const totalVentas = useMemo(() => {
        return initialData.reduce((acc, item) => acc + Math.max(parseFloat(item.precioReal) || 0, 0), 0);
    }, [initialData]);

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
                                <ShoppingCart size={24} className="text-green-600" />
                                Ventas
                            </h1>
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">
                        {filteredData.length} de {initialData.length} ventas confirmadas
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-50 text-green-600">
                            <ShoppingCart size={20} />
                        </div>
                        <span className="text-xs text-slate-400 uppercase font-semibold">Total Ventas</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{initialData.length}</h3>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-xs text-slate-400 uppercase font-semibold">Monto Total</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{formatMoney(totalVentas)}</h3>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <Hash size={20} />
                        </div>
                        <span className="text-xs text-slate-400 uppercase font-semibold">Ticket Promedio</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">
                        {initialData.length > 0 ? formatMoney(totalVentas / initialData.length) : "$0.00"}
                    </h3>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder="Buscar por cliente, vendedor, folio o # venta..."
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
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-left">
                                    <button onClick={() => toggleSort("numero_venta")} className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors">
                                        # Venta <ArrowUpDown size={12} />
                                    </button>
                                </th>
                                <th className="p-4 text-left">
                                    <button onClick={() => toggleSort("id")} className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors">
                                        Folio Cotización <ArrowUpDown size={12} />
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
                                <th className="p-4 text-right">
                                    <button onClick={() => toggleSort("precioReal")} className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors ml-auto">
                                        Monto <ArrowUpDown size={12} />
                                    </button>
                                </th>
                                <th className="p-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center">
                                        <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-400 font-medium">No hay ventas confirmadas</p>
                                        <p className="text-xs text-slate-300 mt-1">Las cotizaciones autorizadas aparecerán aquí</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-green-50/50 transition-colors group">
                                        <td className="p-4">
                                            {item.numero_venta ? (
                                                <span className="font-mono text-sm font-bold text-green-700">{item.numero_venta}</span>
                                            ) : (
                                                <span className="font-mono text-xs text-slate-400">Pendiente</span>
                                            )}
                                        </td>
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
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-bold text-slate-800">{formatMoney(item.precioReal)}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Tooltip content="Ver y editar venta" placement="left" color="primary">
                                                    <Button
                                                        as={Link}
                                                        href={`/inicio/sistema/ventas/${item.id}`}
                                                        variant="light"
                                                        size="sm"
                                                        className="text-green-600 hover:bg-green-50 rounded-lg min-w-0 px-3"
                                                        startContent={<Eye size={16} />}
                                                    >
                                                        Detalles
                                                    </Button>
                                                </Tooltip>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                        Mostrando {filteredData.length} de {initialData.length} ventas
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                        Total: {formatMoney(totalVentas)}
                    </span>
                </div>
            </div>
        </div>
    );
}
