import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

// OBTENER la lista de cotizaciones con nombres de cliente y usuario
export async function GET() {
    try {
        const query = `
            SELECT
                ov.id,
                ov.estatus,
                ov.createdDate,
                ov.autorizado,
                c.nombre AS cliente_nombre,
                u.fullname AS usuario_nombre,
                uAgent.fullname AS nombre_agente
            FROM
                listado_ov AS ov
            LEFT JOIN
                clientes AS c ON ov.idCliente = c.id
            LEFT JOIN
                users_data AS u ON ov.idUser = u.id
            LEFT JOIN
                users_data AS uAgent ON ov.idAgente = uAgent.id
                where ov.estatus!='Nuevo'
            ORDER BY
                ov.id DESC;
        `;
        const [result] = await pool.query(query);
        return NextResponse.json({ ok: true, data: result });
    } catch (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}

// CREAR una nueva cotización (el encabezado)
export async function POST(req) {
    try {
        const { idCliente, idUser, idTipoproyecto, id_envio, idAgente } = await req.json();

        if (!idCliente || !idTipoproyecto) {
            return NextResponse.json({ ok: false, error: "Cliente, usuario y tipo de proyecto son requeridos." }, { status: 400 });
        }

        const query = `
            INSERT INTO listado_ov (idCliente, idUser,idAgente, idTipoproyecto, id_envio, estatus, createdDate)
            VALUES (?, ?,?,?, ?, 'Nuevo', NOW())
        `;
        const values = [idCliente, idUser, idAgente, idTipoproyecto, id_envio || null];

        const [result] = await pool.query(query, values);

        // Devolvemos el ID de la cotización recién creada, es crucial para la redirección
        return NextResponse.json({ ok: true, id: result.insertId, message: "Cotización creada" });

    } catch (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}