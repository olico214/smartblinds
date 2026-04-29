import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("user");

        // 1. Totales generales: cotizaciones totales vs aprobadas
        const [totalesResult] = await pool.query(`
            SELECT 
                COUNT(*) AS total_cotizaciones,
                SUM(CASE WHEN autorizado = 1 THEN 1 ELSE 0 END) AS total_aprobadas,
                SUM(CASE WHEN estatus = 'Cancelado' THEN 1 ELSE 0 END) AS total_canceladas,
                SUM(CASE WHEN estatus = 'Nuevo' THEN 1 ELSE 0 END) AS total_nuevas,
                SUM(CASE WHEN estatus = 'En proceso' THEN 1 ELSE 0 END) AS total_en_proceso,
                SUM(CASE WHEN estatus = 'Finalizado' THEN 1 ELSE 0 END) AS total_finalizadas,
                COALESCE(SUM(precioReal), 0) AS ventas_totales,
                COALESCE(SUM(CASE WHEN autorizado = 1 THEN precioReal ELSE 0 END), 0) AS ventas_aprobadas,
                COALESCE(SUM(precioNormal), 0) AS precio_normal_total,
                COALESCE(SUM(precioNormalconDescuento), 0) AS precio_con_descuento_total
            FROM listado_ov
            WHERE estatus != 'Nuevo'
        `);

        // 2. Cotizaciones por mes (comparativa)
        const [porMesResult] = await pool.query(`
            SELECT 
                DATE_FORMAT(createdDate, '%Y-%m') AS mes,
                COUNT(*) AS total,
                SUM(CASE WHEN autorizado = 1 THEN 1 ELSE 0 END) AS aprobadas,
                COALESCE(SUM(precioReal), 0) AS ventas,
                COALESCE(SUM(CASE WHEN autorizado = 1 THEN precioReal ELSE 0 END), 0) AS ventas_aprobadas
            FROM listado_ov
            WHERE estatus != 'Nuevo'
            GROUP BY DATE_FORMAT(createdDate, '%Y-%m')
            ORDER BY mes ASC
            LIMIT 12
        `);

        // 3. Top clientes por cotizaciones
        const [topClientesResult] = await pool.query(`
            SELECT 
                c.id,
                c.nombre,
                COUNT(ov.id) AS total_cotizaciones,
                SUM(CASE WHEN ov.autorizado = 1 THEN 1 ELSE 0 END) AS aprobadas,
                COALESCE(SUM(ov.precioReal), 0) AS total_ventas
            FROM clientes c
            LEFT JOIN listado_ov ov ON c.id = ov.idCliente AND ov.estatus != 'Nuevo'
            GROUP BY c.id, c.nombre
            HAVING total_cotizaciones > 0
            ORDER BY total_cotizaciones DESC
            LIMIT 10
        `);

        // 4. Porcentaje de aprobación general
        const totales = totalesResult[0];
        const tasaAprobacion = totales.total_cotizaciones > 0 
            ? (totales.total_aprobadas / totales.total_cotizaciones * 100) 
            : 0;

        // 5. Diferencia entre cotizado vs aprobado (en $)
        const diferenciaCotizadoAprobado = totales.precio_normal_total - totales.ventas_aprobadas;

        // 6. Últimas cotizaciones (para actividad reciente)
        const [recientesResult] = await pool.query(`
            SELECT 
                ov.id,
                ov.estatus,
                ov.autorizado,
                ov.createdDate,
                ov.precioReal,
                c.nombre AS cliente_nombre,
                u.fullname AS usuario_nombre
            FROM listado_ov ov
            LEFT JOIN clientes c ON ov.idCliente = c.id
            LEFT JOIN users_data u ON ov.idUser = u.id
            WHERE ov.estatus != 'Nuevo'
            ORDER BY ov.id DESC
            LIMIT 10
        `);

        // 7. Estadísticas por vendedor
        const [porVendedorResult] = await pool.query(`
            SELECT 
                u.fullname AS nombre,
                COUNT(ov.id) AS total_cotizaciones,
                SUM(CASE WHEN ov.autorizado = 1 THEN 1 ELSE 0 END) AS aprobadas,
                COALESCE(SUM(ov.precioReal), 0) AS ventas
            FROM listado_ov ov
            LEFT JOIN users_data u ON ov.idUser = u.id
            WHERE ov.estatus != 'Nuevo'
            GROUP BY u.fullname
            ORDER BY total_cotizaciones DESC
        `);

        return NextResponse.json({
            ok: true,
            data: {
                totales: {
                    ...totales,
                    tasaAprobacion: Math.round(tasaAprobacion * 100) / 100,
                    diferenciaCotizadoAprobado
                },
                porMes: porMesResult,
                topClientes: topClientesResult,
                recientes: recientesResult,
                porVendedor: porVendedorResult
            }
        });

    } catch (error) {
        console.error("Error en dashboard API:", error);
        return NextResponse.json(
            { ok: false, error: error.message },
            { status: 500 }
        );
    }
}
