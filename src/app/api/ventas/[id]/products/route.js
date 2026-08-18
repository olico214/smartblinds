import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

// Actualizar los productos de una venta (cotización autorizada).
// Solo se modifican los campos del producto (producto, cantidad, medidas,
// descripción, ubicación). Los precios de productos existentes permanecen
// intactos; para productos nuevos se insertan los valores calculados.
// Además se registra un historial (original vs modificado) en `producto_cambios`
// para el área de compras.
export async function POST(req, { params }) {
    const connection = await pool.getConnection();

    const TRACKED_FIELDS = [
        { field: "cantidad", label: "Cantidad" },
        { field: "alto", label: "Alto" },
        { field: "ancho", label: "Ancho" },
        { field: "ubicacion", label: "Ubicación" },
        { field: "medidas", label: "Medidas" },
        { field: "description", label: "Descripción" },
    ];

    const norm = (v) => (v === null || v === undefined ? "" : String(v));

    try {
        const { id } = await params;
        const body = await req.json();
        const { products, deletedIds, user } = body;

        const [ventaRows] = await connection.query(
            "SELECT id, autorizado FROM listado_ov WHERE id = ?",
            [id]
        );
        if (ventaRows.length === 0) {
            return NextResponse.json({ ok: false, message: "Venta no encontrada" }, { status: 404 });
        }

        // Valores actuales en BD (para detectar cambios) y SKU de los productos.
        const [currentRows] = await connection.query(
            "SELECT * FROM products_ov WHERE idCotizacion = ?",
            [id]
        );
        const currentMap = {};
        for (const row of currentRows) currentMap[row.id] = row;

        const idproductos = (products || []).map((p) => p.idproducto).filter(Boolean);
        const skuMap = {};
        if (idproductos.length > 0) {
            const [prodRows] = await connection.query(
                "SELECT id, sku FROM productos WHERE id IN (?)",
                [idproductos]
            );
            for (const r of prodRows) skuMap[r.id] = r.sku;
        }

        await connection.beginTransaction();

        if (Array.isArray(deletedIds) && deletedIds.length > 0) {
            await connection.query(
                "DELETE FROM products_ov WHERE idCotizacion = ? AND id IN (?)",
                [id, deletedIds]
            );
        }

        for (const p of products || []) {
            const isNew = p.id == null || String(p.id).startsWith("local-");

            if (!isNew) {
                const old = currentMap[p.id];

                // Producto existente: solo se actualizan campos del producto, el precio queda intacto.
                await connection.query(
                    `UPDATE products_ov
                     SET idproducto = ?, cantidad = ?, alto = ?, ancho = ?, ubicacion = ?, description = ?, medidas = ?
                     WHERE id = ? AND idCotizacion = ?`,
                    [p.idproducto, p.cantidad, p.alto, p.ancho, p.ubicacion, p.description, p.medidas, p.id, id]
                );

                // Registrar historial de cambios (original vs modificado).
                if (old) {
                    const cambios = [];
                    for (const { field, label } of TRACKED_FIELDS) {
                        const original = norm(old[field]);
                        const nuevo = norm(p[field]);
                        if (original !== nuevo) {
                            cambios.push([
                                id,
                                p.id,
                                skuMap[p.idproducto] || null,
                                label,
                                original,
                                nuevo,
                                user || null,
                            ]);
                        }
                    }
                    if (cambios.length > 0) {
                        try {
                            await connection.query(
                                `INSERT INTO producto_cambios
                                    (idCotizacion, idProductoOv, sku, campo, valor_original, valor_nuevo, usuario)
                                 VALUES ?`,
                                [cambios]
                            );
                        } catch (e) {
                            // Si la tabla aún no existe (migración pendiente), no bloqueamos el guardado.
                            console.warn("No se pudo registrar el historial de cambios:", e.message);
                        }
                    }
                }
            } else {
                // Producto nuevo: se inserta con los valores calculados desde el cliente.
                await connection.query(
                    `INSERT INTO products_ov (
                        idCotizacion, idproducto, cantidad, costo_pieza, proteccion, instalacion,
                        margen, pormargen, preciounico, preciototal, alto, ancho, ubicacion,
                        comision_agente, comision_vendedor, descuento, medidas, description
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        p.idproducto,
                        p.cantidad,
                        p.costo_pieza,
                        p.proteccion,
                        p.instalacion,
                        p.margen,
                        p.pormargen,
                        p.preciounico,
                        p.preciototal,
                        p.alto,
                        p.ancho,
                        p.ubicacion,
                        p.comision_agente,
                        p.comision_vendedor,
                        p.descuento,
                        p.medidas,
                        p.description,
                    ]
                );
            }
        }

        await connection.commit();
        return NextResponse.json({ ok: true, message: "Productos de la venta actualizados" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error al actualizar productos de la venta:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
