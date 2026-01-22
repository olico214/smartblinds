import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

// --- FUNCIÓN DE LIMPIEZA DE DATOS ---
// Convierte los valores 'string' de MySQL en 'number' de JS para que los gráficos funcionen
const cleanData = (rows) => {
    return rows.map(row => ({
        name: row.name || "Sin Clasificar", // Nombre seguro
        cantidad: Number(row.cantidad || 0), // Forzar número
        total: Number(row.total || 0)        // Forzar número
    }));
};

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        // --- 1. PARÁMETROS ---
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = (page - 1) * limit;
        const exportMode = searchParams.get("export") === "true";

        const fechaInicio = searchParams.get("fechaInicio");
        const fechaFin = searchParams.get("fechaFin");
        const agente = searchParams.get("agente");
        const tipo = searchParams.get("tipo");

        // --- 2. FILTROS (WHERE) ---
        let whereClauses = ["ov.estatus != 'Nuevo'"];
        let params = [];

        if (fechaInicio) {
            whereClauses.push("ov.createdDate >= ?");
            params.push(`${fechaInicio} 00:00:00`);
        }
        if (fechaFin) {
            whereClauses.push("ov.createdDate <= ?");
            params.push(`${fechaFin} 23:59:59`);
        }
        if (agente) {
            whereClauses.push("(up.fullname LIKE ? OR c.nombre LIKE ?)");
            const searchParam = `%${agente}%`;
            params.push(searchParam, searchParam);
        }
        if (tipo) {
            whereClauses.push("tp.nombre = ?");
            params.push(tipo);
        }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // --- 3. CONSULTAS KPI y GRÁFICOS ---

        // A. Totales Generales
        const qTotales = `
            SELECT COUNT(ov.id) as pedidos, SUM(ov.precioReal) as ventas
            FROM listado_ov ov
            LEFT JOIN clientes c ON ov.idCliente = c.id
            LEFT JOIN users us ON us.userID = ov.createdBy COLLATE utf8mb4_unicode_ci
            LEFT JOIN user_profile up ON up.user = us.id
            LEFT JOIN tipo_proyecto tp ON ov.idTipoproyecto = tp.id
            ${whereSQL}
        `;

        // B. Total de Productos Vendidos
        const qProductos = `
            SELECT SUM(COALESCE(pv.cantidad, 1)) as total_items
            FROM listado_ov ov
            JOIN products_ov pv ON ov.id = pv.idCotizacion
            LEFT JOIN clientes c ON ov.idCliente = c.id
            LEFT JOIN users us ON us.userID = ov.createdBy COLLATE utf8mb4_unicode_ci
            LEFT JOIN user_profile up ON up.user = us.id
            LEFT JOIN tipo_proyecto tp ON ov.idTipoproyecto = tp.id
            ${whereSQL}
        `;

        // C. Gráfico: Agentes (Top 10)
        const qAgentes = `
            SELECT up.fullname as name, COUNT(ov.id) as cantidad, SUM(ov.precioReal) as total
            FROM listado_ov ov
            LEFT JOIN users us ON us.userID = ov.createdBy COLLATE utf8mb4_unicode_ci
            LEFT JOIN user_profile up ON up.user = us.id
            LEFT JOIN clientes c ON ov.idCliente = c.id
            LEFT JOIN tipo_proyecto tp ON ov.idTipoproyecto = tp.id
            ${whereSQL}
            GROUP BY up.fullname ORDER BY total DESC LIMIT 10
        `;

        // D. Gráfico: Canales
        const qCanales = `
            SELECT ca.nombre as name, COUNT(ov.id) as cantidad, SUM(ov.precioReal) as total
            FROM listado_ov ov
            LEFT JOIN clientes c ON ov.idCliente = c.id
            LEFT JOIN canal_venta ca ON c.selected_canal_venta = ca.id
            LEFT JOIN users us ON us.userID = ov.createdBy COLLATE utf8mb4_unicode_ci
            LEFT JOIN user_profile up ON up.user = us.id
            LEFT JOIN tipo_proyecto tp ON ov.idTipoproyecto = tp.id
            ${whereSQL}
            GROUP BY ca.nombre
        `;

        // E. Gráfico: Tipos de Proyecto
        const qTipos = `
            SELECT tp.nombre as name, COUNT(ov.id) as cantidad, SUM(ov.precioReal) as total
            FROM listado_ov ov
            LEFT JOIN clientes c ON ov.idCliente = c.id
            LEFT JOIN users us ON us.userID = ov.createdBy COLLATE utf8mb4_unicode_ci
            LEFT JOIN user_profile up ON up.user = us.id
            LEFT JOIN tipo_proyecto tp ON ov.idTipoproyecto = tp.id
            ${whereSQL}
            GROUP BY tp.nombre
        `;

        // F. Gráfico: Tiempo
        const qTiempo = `
            SELECT DATE_FORMAT(ov.createdDate, '%Y-%m-%d') as fecha, COUNT(ov.id) as cantidad, SUM(ov.precioReal) as total
            FROM listado_ov ov
            LEFT JOIN clientes c ON ov.idCliente = c.id
            LEFT JOIN users us ON us.userID = ov.createdBy COLLATE utf8mb4_unicode_ci
            LEFT JOIN user_profile up ON up.user = us.id
            LEFT JOIN tipo_proyecto tp ON ov.idTipoproyecto = tp.id
            ${whereSQL}
            GROUP BY DATE_FORMAT(ov.createdDate, '%Y-%m-%d')
            ORDER BY fecha ASC
        `;

        // --- 4. DATA TABLA DETALLADA ---
        const limitSQL = exportMode ? "" : `LIMIT ${limit} OFFSET ${offset}`;
        const dataQuery = `
            SELECT 
                CONCAT('XVT1', ov.id) AS id,
                ov.createdDate AS fecha,
                c.nombre AS cliente,
                c.ciudad,
                c.estado,
                up.fullname AS creador,
                ca.nombre AS canal_venta,
                tp.nombre AS tipo_proyecto,
                ov.precioReal,
                p.sku as sku_producto,
                pv.cantidad,
                pv.ancho, pv.alto,
                pv.preciototal as precio_linea
            FROM listado_ov AS ov
            LEFT JOIN clientes AS c ON ov.idCliente = c.id
            LEFT JOIN products_ov pv ON ov.id = pv.idCotizacion
            LEFT JOIN users us ON us.userID = ov.createdBy COLLATE utf8mb4_unicode_ci
            LEFT JOIN user_profile up ON up.user = us.id
            LEFT JOIN tipo_proyecto tp ON ov.idTipoproyecto = tp.id
            LEFT JOIN canal_venta ca ON c.selected_canal_venta = ca.id
            LEFT JOIN productos p ON p.id = pv.idproducto
            ${whereSQL}
            ORDER BY ov.id DESC
            ${limitSQL}
        `;

        // EJECUCIÓN
        const [rTotales, rProductos, rAgentes, rCanales, rTipos, rTiempo, rData] = await Promise.all([
            pool.query(qTotales, params),
            pool.query(qProductos, params),
            pool.query(qAgentes, params),
            pool.query(qCanales, params),
            pool.query(qTipos, params),
            pool.query(qTiempo, params),
            pool.query(dataQuery, params)
        ]);

        const totalVentas = parseFloat(rTotales[0][0].ventas || 0);
        const totalPedidos = parseInt(rTotales[0][0].pedidos || 0);
        const totalItems = parseInt(rProductos[0][0].total_items || 0);

        return NextResponse.json({
            ok: true,
            stats: {
                general: {
                    ventas: totalVentas,
                    pedidos: totalPedidos,
                    productos: totalItems,
                    promedioTicket: totalPedidos > 0 ? totalVentas / totalPedidos : 0,
                    promedioProductos: totalPedidos > 0 ? totalItems / totalPedidos : 0
                },
                charts: {
                    // AQUI APLICAMOS LA LIMPIEZA
                    agentes: cleanData(rAgentes[0]),
                    canales: cleanData(rCanales[0]),
                    tipos: cleanData(rTipos[0]),
                    tiempo: rTiempo[0].map(r => ({
                        fecha: r.fecha,
                        cantidad: Number(r.cantidad),
                        total: Number(r.total)
                    }))
                }
            },
            data: rData[0],
            meta: { page, limit }
        });

    } catch (error) {
        console.error("Error API Reportes:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}