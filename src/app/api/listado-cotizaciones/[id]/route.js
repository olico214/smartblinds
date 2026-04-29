import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

// OBTENER una cotización específica por ID
export async function GET(req, { params }) {
    try {
        const { id } = await params;

        const query = `
            SELECT
                ov.id,
                ov.estatus,
                ov.createdDate,
                ov.autorizado,
                ov.idCliente,
                ov.idUser,
                ov.idAgente,
                ov.idTipoproyecto,
                ov.id_envio,
                ov.nombreProyecto,
                ov.linea_cotizada,
                ov.precioNormal,
                ov.precioNormalconDescuento,
                ov.precioReal,
                ov.iva,
                c.nombre AS cliente_nombre,
                c.telefono AS cliente_telefono,
                c.email AS cliente_email,
                u.fullname AS usuario_nombre,
                uAgent.fullname AS nombre_agente,
                tp.nombre AS tipo_proyecto_nombre,
                e.descripcion AS envio_descripcion,
                e.precio AS envio_precio
            FROM
                listado_ov AS ov
            LEFT JOIN
                clientes AS c ON ov.idCliente = c.id
            LEFT JOIN
                users_data AS u ON ov.idUser = u.id
            LEFT JOIN
                users_data AS uAgent ON ov.idAgente = uAgent.id
            LEFT JOIN
                tipo_proyecto tp ON ov.idTipoproyecto = tp.id
            LEFT JOIN
                envio e ON ov.id_envio = e.id
            WHERE
                ov.id = ?
        `;

        const [result] = await pool.query(query, [id]);

        if (result.length === 0) {
            return NextResponse.json(
                { ok: false, error: "Cotización no encontrada" },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true, data: result[0] });
    } catch (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
