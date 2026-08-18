import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

export async function GET(req, { params }) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user");

    if (!userId) {
        return NextResponse.json(
            { ok: false, error: "El parámetro 'user' es requerido." },
            { status: 400 }
        );
    }

    try {
        const { id } = await params;

        const query = `
            SELECT 
                ov.*,
                c.nombre AS cliente_nombre,
                u.fullname AS usuario_nombre,
                u.comision AS comision_vendedor,
                e.descripcion AS envio_descripcion,
                e.precio AS envio_precio,
                uAgent.fullname AS nombre_agente,
                uAgent.comision AS comision_agente,
                c.telefono AS cliente_telefono,
                c.email AS cliente_email,
                c.estado AS cliente_estado,
                c.ciudad AS cliente_ciudad,
                c.colonia AS cliente_colonia,
                c.domicilio AS cliente_domicilio,
                c.frecuente as cliente_frecuente,
                ov.iva,
                ov.precioNormal,
                ov.precioNormalconDescuento,
                ov.precioReal,
                pt.nombre as tipo_proyecto_nombre
            FROM 
                listado_ov AS ov
            LEFT JOIN clientes AS c ON ov.idCliente = c.id
            LEFT JOIN users_data AS u ON ov.idUser = u.id
            LEFT JOIN envio AS e ON ov.id_envio = e.id
            LEFT JOIN users_data AS uAgent ON ov.idAgente = uAgent.id
            LEFT JOIN tipo_proyecto pt ON pt.id = ov.idTipoproyecto
            WHERE ov.id = ? AND ov.autorizado = 1
        `;
        const [result] = await pool.query(query, [id]);

        if (result.length === 0) {
            return NextResponse.json({ message: "Venta no encontrada" }, { status: 404 });
        }

        const productQuery = `
            SELECT 
                pov.*, 
                p.nombre as producto_nombre, 
                p.tipo as producto_tipo,
                p.costo as actual_costo,
                p.precio as actual_precio,
                p.sku
            FROM products_ov pov
            JOIN productos p ON pov.idProducto = p.id
            WHERE pov.idCotizacion = ?
        `;
        const [productsResult] = await pool.query(productQuery, [id]);

        const isAdminQuery = `
            SELECT externo from users where userID = ?
        `;
        const [isAdminResult] = await pool.query(isAdminQuery, [userId]);

        // Historial de cambios (original vs modificado) para el área de compras.
        let cambiosResult = [];
        try {
            const cambiosQuery = `
                SELECT * FROM producto_cambios
                WHERE idCotizacion = ?
                ORDER BY id DESC
            `;
            const [cambios] = await pool.query(cambiosQuery, [id]);
            cambiosResult = cambios;
        } catch (e) {
            // Tabla aún no creada (migración pendiente): no se devuelve historial.
            cambiosResult = [];
        }

        return NextResponse.json({
            venta: result[0],
            productos: productsResult,
            cambios: cambiosResult,
            isAdmin: isAdminResult.length > 0 ? (isAdminResult[0].externo ? true : false) : false
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { idCliente, idUser, idTipoproyecto, id_envio, idAgente, estatus } = body;

        const isOnlyStatusChange = Object.keys(body).length === 1 && body.estatus;

        if (estatus === "Cancelar") {
            const query = `UPDATE listado_ov SET estatus = ?, autorizado = 0 WHERE id = ?`;
            await pool.query(query, ["Cancelado", id]);
        } else if (isOnlyStatusChange) {
            const query = `UPDATE listado_ov SET estatus = ? WHERE id = ?`;
            await pool.query(query, [estatus, id]);
        } else {
            const query = `UPDATE listado_ov
                SET idCliente = ?, idUser = ?, idTipoproyecto = ?, id_envio = ?, idAgente = ?
                WHERE id = ?`;
            await pool.query(query, [idCliente, idUser, idTipoproyecto, id_envio, idAgente, id]);
        }

        return NextResponse.json({ ok: true, message: "Venta actualizada" });
    } catch (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
