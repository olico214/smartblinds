import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

// OBTENER los detalles de un cliente con todas sus cotizaciones
export async function GET(req, { params }) {
    try {
        const { id } = await params;

        // 1. Obtener datos del cliente
        const clienteQuery = `
            SELECT 
                c.*,
                cv.nombre AS canal_venta_nombre
            FROM 
                clientes AS c
            LEFT JOIN 
                canal_venta AS cv ON c.selected_canal_venta = cv.id
            WHERE 
                c.id = ?
        `;
        const [clienteResult] = await pool.query(clienteQuery, [id]);

        if (clienteResult.length === 0) {
            return NextResponse.json(
                { ok: false, error: "Cliente no encontrado" },
                { status: 404 }
            );
        }

        // 2. Obtener todas las cotizaciones del cliente
        const cotizacionesQuery = `
            SELECT 
                ov.id,
                ov.estatus,
                ov.autorizado,
                ov.createdDate,
                ov.precioReal,
                ov.precioNormal,
                ov.nombreProyecto,
                ov.linea_cotizada,
                u.fullname AS usuario_nombre,
                uAgent.fullname AS nombre_agente,
                tp.nombre AS tipo_proyecto_nombre
            FROM 
                listado_ov AS ov
            LEFT JOIN 
                users_data AS u ON ov.idUser = u.id
            LEFT JOIN 
                users_data AS uAgent ON ov.idAgente = uAgent.id
            LEFT JOIN 
                tipo_proyecto tp ON tp.id = ov.idTipoproyecto
            WHERE 
                ov.idCliente = ?
            ORDER BY 
                ov.id DESC
        `;
        const [cotizacionesResult] = await pool.query(cotizacionesQuery, [id]);

        // 3. Calcular estadísticas
        const totalCotizaciones = cotizacionesResult.length;
        const aprobadas = cotizacionesResult.filter(c => c.autorizado == 1);
        const totalAprobadas = aprobadas.length;
        const totalVentas = aprobadas.reduce((sum, c) => sum + parseFloat(c.precioReal || 0), 0);

        return NextResponse.json({
            ok: true,
            data: {
                cliente: clienteResult[0],
                cotizaciones: cotizacionesResult,
                stats: {
                    totalCotizaciones,
                    totalAprobadas,
                    totalVentas
                }
            }
        });

    } catch (error) {
        console.error("Error al obtener cliente:", error);
        return NextResponse.json(
            { ok: false, error: "Error al obtener los datos del cliente." },
            { status: 500 }
        );
    }
}
