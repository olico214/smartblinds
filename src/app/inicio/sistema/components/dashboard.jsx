"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import {
    TrendingUp, TrendingDown, DollarSign, FileText, CheckCircle, XCircle,
    Clock, Activity, Users, ShoppingCart, ArrowUpRight, ArrowDownRight,
    RefreshCw, Calendar, Percent, List, Plus
} from "lucide-react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#84CC16"];

const formatMoney = (val) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatMoneyShort = (val) => {
    const v = val || 0;
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
};
const formatNumber = (val) => (val || 0).toLocaleString('es-MX');

export default function DashboardSmartBlinds() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState("all");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/dashboard");
            const json = await res.json();
            if (json.ok) {
                setData(json.data);
            } else {
                setError(json.error);
            }
        } catch (e) {
            setError("Error al cargar datos del dashboard");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 text-center max-w-md">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Error al cargar</h3>
                    <p className="text-slate-500 mb-4">{error}</p>
                    <button onClick={fetchData} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm inline-flex items-center gap-2">
                        <RefreshCw size={16} /> Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { totales, porMes, topClientes, recientes, porVendedor } = data;

    // Preparar datos para gráfico de comparativa mensual
    const mesData = porMes.map(m => ({
        ...m,
        noAprobadas: parseInt(m.total) - parseInt(m.aprobadas)
    }));

    // Datos para el gráfico de estatus (pastel)
    const estatusData = [
        { name: "Aprobadas", value: parseInt(totales.total_aprobadas), color: "#10B981" },
        { name: "Canceladas", value: parseInt(totales.total_canceladas), color: "#EF4444" },
        { name: "En Proceso", value: parseInt(totales.total_en_proceso), color: "#F59E0B" },
        { name: "Finalizadas", value: parseInt(totales.total_finalizadas), color: "#8B5CF6" },
    ].filter(d => d.value > 0);

    // Calcular tendencia (comparar últimos 2 meses)
    const ultimosMeses = porMes.slice(-2);
    const tendencia = ultimosMeses.length === 2
        ? ((parseFloat(ultimosMeses[1].total) - parseFloat(ultimosMeses[0].total)) / parseFloat(ultimosMeses[0].total || 1) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-6 lg:p-8 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                            <Activity className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                            <p className="text-sm text-slate-500">Panel general de cotizaciones y ventas</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/inicio/sistema/cotizaciones"
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-600 flex items-center gap-2 shadow-sm"
                    >
                        <List size={15} /> Cotizaciones
                    </Link>
                    <Link
                        href="/inicio/sistema/crear-cotizacion"
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-600 transition-all text-sm font-medium text-slate-600 flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={15} /> Nueva
                    </Link>
                    <button
                        onClick={fetchData}
                        className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-sm text-slate-500 flex items-center gap-1 shadow-sm"
                        title="Actualizar datos"
                    >
                        <RefreshCw size={15} />
                    </button>
                    <Link
                        href="/inicio/sistema/reportes"
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <BarChart size={15} /> Reportes
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Card: Cotizaciones Totales */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                            <FileText size={20} />
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${tendencia >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {tendencia >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(tendencia).toFixed(1)}%
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{formatNumber(totales.total_cotizaciones)}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Cotizaciones Totales</p>
                    <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(totales.tasaAprobacion, 100)}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">{totales.tasaAprobacion.toFixed(1)}% aprobadas</p>
                </div>

                {/* Card: Aprobadas */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-green-100 transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
                            <CheckCircle size={20} />
                        </div>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            {totales.total_cotizaciones > 0 ? ((totales.total_aprobadas / totales.total_cotizaciones) * 100).toFixed(1) : 0}%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{formatNumber(totales.total_aprobadas)}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Aprobadas</p>
                    <p className="text-[11px] text-green-600 mt-1.5 font-medium">
                        {formatMoney(totales.ventas_aprobadas)} en ventas
                    </p>
                </div>

                {/* Card: Diferencia Cotizado vs Aprobado */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-amber-100 transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                            <Percent size={20} />
                        </div>
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            Diferencia
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{formatMoney(totales.diferenciaCotizadoAprobado)}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Cotizado vs Aprobado</p>
                    <p className="text-[11px] text-amber-600 mt-1.5 font-medium">
                        {formatMoney(totales.precio_normal_total)} cotizado · {formatMoney(totales.ventas_aprobadas)} aprobado
                    </p>
                </div>

                {/* Card: Ventas Totales */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-purple-100 transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                            Total
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{formatMoney(totales.ventas_totales)}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Ventas Totales</p>
                    <p className="text-[11px] text-purple-600 mt-1.5 font-medium">
                        {formatNumber(totales.total_finalizadas)} finalizadas
                    </p>
                </div>
            </div>

            {/* Fila 1: Gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Comparativa Mensual: Cotizaciones vs Aprobadas */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Calendar size={18} className="text-blue-500" />
                            Cotizaciones vs Aprobadas por Mes
                        </h3>
                        <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-slate-500">Cotizadas</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-slate-500">Aprobadas</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mesData} barGap={4} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickFormatter={(v) => {
                                    const [y, m] = v.split('-');
                                    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                                    return `${meses[parseInt(m) - 1]}`;
                                }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '12px' }}
                                    labelFormatter={(v) => {
                                        const [y, m] = v.split('-');
                                        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                                        return `${meses[parseInt(m) - 1]} ${y}`;
                                    }}
                                    formatter={(val, name) => {
                                        if (name === 'total') return [formatNumber(val), 'Cotizadas'];
                                        if (name === 'aprobadas') return [formatNumber(val), 'Aprobadas'];
                                        return [val, name];
                                    }}
                                />
                                <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="aprobadas" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribución de Estatus */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity size={18} className="text-blue-500" />
                        Distribución de Estatus
                    </h3>
                    <div className="h-72 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={estatusData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={4}
                                >
                                    {estatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                                    formatter={(val, name) => [formatNumber(val), name]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={50}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Fila 2: Top Clientes + Actividad Reciente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top Clientes */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Users size={18} className="text-blue-500" />
                            Top Clientes
                        </h3>
                        <Link href="/inicio/sistema/clientes" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            Ver todos →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {topClientes.map((cliente, index) => {
                            const tasa = cliente.total_cotizaciones > 0
                                ? (cliente.aprobadas / cliente.total_cotizaciones * 100)
                                : 0;
                            return (
                                <div key={cliente.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                                        'bg-slate-200 text-slate-500'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">{cliente.nombre}</p>
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span>{formatNumber(cliente.total_cotizaciones)} cotizaciones</span>
                                            <span className="text-green-600 font-medium">{cliente.aprobadas} aprobadas</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-700">{formatMoneyShort(cliente.total_ventas)}</p>
                                        <p className="text-[10px] text-slate-400">{tasa.toFixed(0)}% tasa</p>
                                    </div>
                                </div>
                            );
                        })}
                        {topClientes.length === 0 && (
                            <p className="text-center text-slate-400 py-8 text-sm">Sin datos de clientes</p>
                        )}
                    </div>
                </div>

                {/* Actividad Reciente */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Clock size={18} className="text-blue-500" />
                            Actividad Reciente
                        </h3>
                        <Link href="/inicio/sistema/cotizaciones" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            Ver todas →
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {recientes.map((item) => {
                            const statusColors = {
                                'Autorizado': 'bg-green-100 text-green-700 border-green-200',
                                'Cancelado': 'bg-red-100 text-red-700 border-red-200',
                                'En proceso': 'bg-amber-100 text-amber-700 border-amber-200',
                                'Finalizado': 'bg-purple-100 text-purple-700 border-purple-200',
                                'Nuevo': 'bg-blue-100 text-blue-700 border-blue-200',
                            };
                            const statusColor = statusColors[item.estatus] || 'bg-slate-100 text-slate-700 border-slate-200';
                            return (
                                <Link
                                    key={item.id}
                                    href={`/inicio/sistema/${item.id}`}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-200"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                                        #{item.id}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                                            {item.cliente_nombre || "Cliente"}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {item.usuario_nombre || "N/A"} · {new Date(item.createdDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${statusColor}`}>
                                            {item.estatus}
                                        </span>
                                        {item.autorizado == 1 && (
                                            <CheckCircle size={14} className="text-green-500 shrink-0" />
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                        {recientes.length === 0 && (
                            <p className="text-center text-slate-400 py-8 text-sm">Sin actividad reciente</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Fila 3: Rendimiento por Vendedor */}
            {porVendedor && porVendedor.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Users size={18} className="text-blue-500" />
                            Rendimiento por Vendedor
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Vendedor</th>
                                    <th className="text-right py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Cotizaciones</th>
                                    <th className="text-right py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Aprobadas</th>
                                    <th className="text-right py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Tasa</th>
                                    <th className="text-right py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {porVendedor.map((v, i) => {
                                    const tasa = v.total_cotizaciones > 0 ? (v.aprobadas / v.total_cotizaciones * 100) : 0;
                                    return (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-2 font-medium text-slate-700">{v.nombre || "Sin asignar"}</td>
                                            <td className="py-3 px-2 text-right text-slate-600">{formatNumber(v.total_cotizaciones)}</td>
                                            <td className="py-3 px-2 text-right text-green-600 font-medium">{formatNumber(v.aprobadas)}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                    tasa >= 50 ? 'bg-green-50 text-green-600' :
                                                    tasa >= 30 ? 'bg-amber-50 text-amber-600' :
                                                    'bg-red-50 text-red-600'
                                                }`}>
                                                    {tasa.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right font-bold text-slate-700">{formatMoney(v.ventas)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer info */}
            <div className="text-center text-xs text-slate-400 py-4">
                Datos actualizados en tiempo real · SmartBlinds Dashboard v2.0
            </div>
        </div>
    );
}
