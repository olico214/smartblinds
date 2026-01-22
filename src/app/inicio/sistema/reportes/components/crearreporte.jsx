"use client";
import React, { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { Download, Filter, ArrowLeft, ArrowRight, Search, DollarSign, ShoppingBag, Layers, Activity, Calendar } from "lucide-react";

// Colores profesionales
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1"];

const formatMoney = (val) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatNumber = (val) => (val || 0).toLocaleString('es-MX');

export default function DashboardReportes() {
    const [data, setData] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Vista: 'monto' (dinero) o 'cantidad' (número de operaciones)
    const [metricView, setMetricView] = useState('monto');

    const [filters, setFilters] = useState({
        fechaInicio: "",
        fechaFin: "",
        agente: "",
        tipo: ""
    });
    const [page, setPage] = useState(1);
    const LIMIT = 50;

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: LIMIT.toString(), ...filters });
            const res = await fetch(`/api/reportes?${params.toString()}`);
            const json = await res.json();
            if (json.ok) {
                setData(json.data);
                setStats(json.stats);
            }
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [page]);

    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
    const applyFilters = () => { setPage(1); fetchData(); };

    // CSV Export
    const downloadCSV = (dataJson, filename) => {
        if (!dataJson.length) return;
        const headers = Object.keys(dataJson[0]);
        const csv = [headers.join(","), ...dataJson.map(row => headers.map(h => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(","))].join("\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        link.download = filename;
        link.click();
    };

    const handleExportTodo = async () => {
        if (!confirm("¿Descargar reporte completo?")) return;
        setExporting(true);
        try {
            const params = new URLSearchParams({ export: "true", ...filters });
            const res = await fetch(`/api/reportes?${params.toString()}`);
            const json = await res.json();
            if (json.ok) downloadCSV(json.data, "reporte_completo.csv");
        } catch (e) { console.error(e); }
        finally { setExporting(false); }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Reportes SmartBlinds</h1>
                    <p className="text-slate-500">Dashboard General de Ventas</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => downloadCSV(data, "vista_actual.csv")} className="px-4 py-2 border rounded bg-white hover:bg-gray-50 flex gap-2 items-center text-sm font-medium"><Download size={16} /> Vista</button>
                    <button onClick={handleExportTodo} disabled={exporting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex gap-2 items-center text-sm font-medium disabled:opacity-50">{exporting ? "Generando..." : <><Download size={16} /> Todo CSV</>}</button>
                </div>
            </div>

            {/* FILTROS */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div><label className="text-xs font-bold text-slate-500 mb-1 block">Desde</label><input type="date" name="fechaInicio" onChange={handleFilterChange} className="w-full border p-2 rounded text-sm bg-slate-50" /></div>
                <div><label className="text-xs font-bold text-slate-500 mb-1 block">Hasta</label><input type="date" name="fechaFin" onChange={handleFilterChange} className="w-full border p-2 rounded text-sm bg-slate-50" /></div>
                <div className="md:col-span-2 relative">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Buscar</label>
                    <Search className="absolute left-3 top-[34px] text-gray-400" size={16} />
                    <input type="text" name="agente" placeholder="Agente o Cliente..." onChange={handleFilterChange} className="w-full border p-2 pl-9 rounded text-sm bg-slate-50" />
                </div>
                <button onClick={applyFilters} className="bg-slate-900 text-white p-2 rounded hover:bg-black flex justify-center items-center gap-2 h-[38px]"><Filter size={16} /> Filtrar</button>
            </div>

            {/* RENDERIZADO DE ESTADISTICAS */}
            {stats && (
                <>
                    {/* 4 TARJETAS KPI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-5 rounded-xl border-l-4 border-green-500 shadow-sm flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Ventas Totales</p>
                                <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mt-1">{formatMoney(stats.general.ventas)}</h3>
                                <p className="text-xs text-green-600 mt-1 font-medium">Ticket Prom: {formatMoney(stats.general.promedioTicket)}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-full text-green-600"><DollarSign size={20} /></div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border-l-4 border-blue-500 shadow-sm flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Pedidos</p>
                                <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mt-1">{formatNumber(stats.general.pedidos)}</h3>
                                <p className="text-xs text-blue-600 mt-1 font-medium">Ordenes</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-full text-blue-600"><ShoppingBag size={20} /></div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border-l-4 border-purple-500 shadow-sm flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Prod. Vendidos</p>
                                <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mt-1">{formatNumber(stats.general.productos)}</h3>
                                <p className="text-xs text-purple-600 mt-1 font-medium">Piezas Totales</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-full text-purple-600"><Layers size={20} /></div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border-l-4 border-orange-500 shadow-sm flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Prod / Ticket</p>
                                <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mt-1">{stats.general.promedioProductos.toFixed(1)}</h3>
                                <p className="text-xs text-orange-600 mt-1 font-medium">Promedio</p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-full text-orange-600"><Activity size={20} /></div>
                        </div>
                    </div>

                    {/* SWITCHER DE VISTA: DINERO O CANTIDAD */}
                    {/* <div className="flex justify-end mb-4">
                        <div className="bg-white border rounded-lg p-1 flex gap-1 shadow-sm">
                            <button onClick={() => setMetricView('monto')} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${metricView === 'monto' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Dinero ($)</button>
                            <button onClick={() => setMetricView('cantidad')} className={`px-3 py-1 text-xs font-bold rounded transition-colors ${metricView === 'cantidad' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Cantidad (#)</button>
                        </div>
                    </div> */}

                    {/* FILA 1 DE GRÁFICOS: TIEMPO + AGENTES */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* LINE CHART */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Calendar size={16} /> Evolución Temporal</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.charts.tiempo}>
                                    <defs>
                                        <linearGradient id="colorVenta" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickMargin={10} minTickGap={30} />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={metricView === 'monto' ? (v) => `$${v / 1000}k` : v} />
                                    <Tooltip formatter={(val) => metricView === 'monto' ? formatMoney(val) : val} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey={metricView === 'monto' ? "total" : "cantidad"} stroke="#3B82F6" fill="url(#colorVenta)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {/* BAR CHART AGENTES */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
                            <h4 className="font-bold text-slate-700 mb-4">Top Agentes</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.charts.agentes} layout="vertical" margin={{ left: 0, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={(val) => metricView === 'monto' ? formatMoney(val) : val} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey={metricView === 'monto' ? "total" : "cantidad"} fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* FILA 2 DE GRÁFICOS: TIPOS + CANALES */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* PIE CHART PROYECTOS */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
                            <h4 className="font-bold text-slate-700 mb-4">Tipo de Proyecto</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.charts.tipos}
                                        dataKey={metricView === 'monto' ? "total" : "cantidad"}
                                        nameKey="name"
                                        cx="50%" cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                    >
                                        {stats.charts.tipos.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => metricView === 'monto' ? formatMoney(val) : val} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* PIE CHART CANALES */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
                            <h4 className="font-bold text-slate-700 mb-4">Canales de Venta</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.charts.canales}
                                        dataKey={metricView === 'monto' ? "total" : "cantidad"}
                                        nameKey="name"
                                        cx="50%" cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                    >
                                        {stats.charts.canales.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => metricView === 'monto' ? formatMoney(val) : val} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}

            {/* TABLA DETALLADA */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Detalle de Ventas</h3>
                    <span className="text-xs bg-white border px-2 py-1 rounded text-slate-500">Página {page}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-100 text-slate-600 font-bold text-xs uppercase">
                            <tr>
                                <th className="p-3">ID</th>
                                <th className="p-3">Fecha</th>
                                <th className="p-3">Cliente</th>
                                <th className="p-3">Creador</th>
                                <th className="p-3">Proyecto / Canal</th>
                                <th className="p-3">Producto</th>
                                <th className="p-3 text-center">Cant.</th>
                                <th className="p-3">Medidas</th>
                                <th className="p-3 text-right">Total ($)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (<tr><td colSpan="9" className="p-10 text-center text-slate-400">Cargando...</td></tr>) :
                                data.map((row, i) => (
                                    <tr key={i} className="hover:bg-blue-50 transition-colors">
                                        <td className="p-3 font-mono text-blue-600 font-medium">{row.id}</td>
                                        <td className="p-3 text-slate-500">{new Date(row.fecha).toLocaleDateString()}</td>
                                        <td className="p-3 font-medium text-slate-800">{row.cliente}<div className="text-xs text-slate-400 font-normal">{row.ciudad}</div></td>
                                        <td className="p-3 text-slate-600">{row.creador}</td>
                                        <td className="p-3 text-slate-600">
                                            <div className="font-medium">{row.tipo_proyecto || "N/A"}</div>
                                            <div className="text-xs text-slate-400">{row.canal_venta || "N/A"}</div>
                                        </td>
                                        <td className="p-3 text-slate-700">{row.sku_producto}</td>
                                        <td className="p-3 text-center font-bold text-slate-700 bg-slate-50">{row.cantidad || 1}</td>
                                        <td className="p-3 text-xs text-slate-500">{row.ancho} x {row.alto}</td>
                                        <td className="p-3 font-bold text-slate-700 text-right font-mono">{formatMoney(row.precioReal)}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t flex justify-end gap-2 bg-slate-50">
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"><ArrowLeft size={16} /></button>
                    <button onClick={() => setPage(p => p + 1)} className="p-2 border rounded bg-white hover:bg-gray-100"><ArrowRight size={16} /></button>
                </div>
            </div>
        </div>
    );
}