import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

export async function GET() {
    try {
        const query = `
            SELECT
                ov.id,
                ov.estatus,
                ov.createdDate,
                ov.autorizado,
                ov.guid,
                ov.numero_venta,
                ov.precioNormal,
                ov.precioNormalconDescuento,
                ov.precioReal,
                ov.iva,
                ov.descuento,
                c.nombre AS cliente_nombre,
                c.telefono AS cliente_telefono,
                c.email AS cliente_email,
                u.fullname AS usuario_nombre,
                uAgent.fullname AS nombre_agente,
                tp.nombre AS tipo_proyecto_nombre
            FROM
                listado_ov AS ov
            LEFT JOIN
                clientes AS c ON ov.idCliente = c.id
            LEFT JOIN
                users_data AS u ON ov.idUser = u.id
            LEFT JOIN
                users_data AS uAgent ON ov.idAgente = uAgent.id
            LEFT JOIN
                tipo_proyecto AS tp ON ov.idTipoproyecto = tp.id
            WHERE ov.autorizado = 1
            ORDER BY
                ov.id DESC
        `;
        const [result] = await pool.query(query);
        return NextResponse.json({ ok: true, data: result });
    } catch (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
