import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

// OBTENER el conteo de cotizaciones aprobadas por cliente
export async function GET() {
    try {
        const query = `
            SELECT 
                c.id AS cliente_id,
                c.nombre AS cliente_nombre,
                COUNT(ov.id) AS cotizaciones_aprobadas,
                COALESCE(SUM(ov.precioReal), 0) AS total_ventas
            FROM 
                clientes AS c
            LEFT JOIN
                listado_ov AS ov ON c.id = ov.idCliente AND ov.autorizado = 1
            GROUP BY 
                c.id, c.nombre
            ORDER BY 
                cotizaciones_aprobadas DESC, c.nombre ASC;
        `;

        const [result] = await pool.query(query);

        return NextResponse.json({ ok: true, data: result });

    } catch (error) {
        console.error("Error al obtener cotizaciones aprobadas por cliente:", error);
        return NextResponse.json(
            { ok: false, error: "Error al obtener los datos." },
            { status: 500 }
        );
    }
}
