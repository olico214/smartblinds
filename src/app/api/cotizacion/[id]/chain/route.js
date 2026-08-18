import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

async function findRootId(id) {
    const [rows] = await pool.query("SELECT id, parent_id FROM listado_ov WHERE id = ?", [id]);
    if (rows.length === 0) return null;
    const current = rows[0];
    if (!current.parent_id) return current.id;
    return findRootId(current.parent_id);
}

async function collectDescendants(rootId) {
    const [rows] = await pool.query("SELECT id, parent_id FROM listado_ov WHERE parent_id = ?", [rootId]);
    let result = [rootId];
    for (const row of rows) {
        const children = await collectDescendants(row.id);
        result = result.concat(children);
    }
    return result;
}

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        const rootId = await findRootId(id);
        if (!rootId) {
            return NextResponse.json({ ok: false, error: "Cotización no encontrada" }, { status: 404 });
        }

        const allIds = await collectDescendants(rootId);

        if (allIds.length === 0) {
            return NextResponse.json({ ok: true, chain: [] });
        }

        const query = `
            SELECT
                ov.id,
                ov.parent_id,
                ov.nombreProyecto,
                ov.estatus,
                ov.linea_cotizada,
                ov.autorizado,
                ov.createdDate,
                c.nombre AS cliente_nombre
            FROM listado_ov ov
            LEFT JOIN clientes c ON ov.idCliente = c.id
            WHERE ov.id IN (?)
            ORDER BY ov.id ASC
        `;
        const [chain] = await pool.query(query, [allIds]);

        return NextResponse.json({ ok: true, chain, rootId });
    } catch (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
