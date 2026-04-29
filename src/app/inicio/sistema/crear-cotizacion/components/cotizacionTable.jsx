"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Chip, Tooltip, Input
} from "@nextui-org/react";
import CotizacionForm from "./registerCotizacion";
import { Search, Plus, Eye, FileText, ArrowUpDown } from "lucide-react";

const statusColorMap = {
    Nuevo: { color: "primary", bg: "bg-blue-50 text-blue-700 border-blue-200" },
    'En proceso': { color: "warning", bg: "bg-amber-50 text-amber-700 border-amber-200" },
    Autorizado: { color: "success", bg: "bg-green-50 text-green-700 border-green-200" },
    Cancelado: { color: "danger", bg: "bg-red-50 text-red-700 border-red-200" },
    Finalizado: { color: "secondary", bg: "bg-purple-50 text-purple-700 border-purple-200" },
};

export default function CotizacionesTable({ initialData, user }) {
    const [isOpen, setIsOpen] = useState(false);
    const [filterValue, setFilterValue] = useState("");

    const filteredData = useMemo(() => {
        if (!filterValue) return initialData;
        const search = filterValue.toLowerCase();
        return initialData.filter(item =>
            item.cliente_nombre?.toLowerCase().includes(search) ||
            String(item.id).includes(search)
        );
    }, [initialData, filterValue]);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-MX', options);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={24} className="text-blue-600" />
                        Cotizaciones Nuevas
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        {filteredData.length} cotizaciones en estado Nuevo
                    </p>
                </div>
                <Button
                    color="primary"
                    onPress={() => setIsOpen(true)}
                    startContent={<Plus size={18} />}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-200 font-medium"
                >
                    Nueva Cotización
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <Input
                    isClearable
                    placeholder="Buscar por cliente o folio..."
                    startContent={<Search size={18} className="text-slate-400" />}
                    value={filterValue}
                    onValueChange={setFilterValue}
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
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Folio</th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Vendedor</th>
                                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
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
                                        <p className="text-slate-400 font-medium">No hay cotizaciones nuevas</p>
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
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-slate-600">{formatDate(item.createdDate)}</span>
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
                                            <Tooltip content="Ir a cotización" placement="left" color="primary">
                                                <Button
                                                    prefetch={false}
                                                    as={Link}
                                                    href={`/inicio/sistema/crear-cotizacion/${item.id}`}
                                                    variant="light"
                                                    size="sm"
                                                    className="text-blue-600 hover:bg-blue-50 rounded-lg min-w-0 px-3"
                                                    startContent={<Eye size={16} />}
                                                >
                                                    Abrir
                                                </Button>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                        Mostrando {filteredData.length} de {initialData.length} cotizaciones nuevas
                    </span>
                </div>
            </div>

            <CotizacionForm isOpen={isOpen} onClose={() => setIsOpen(false)} user={user} />
        </div>
    );
}
