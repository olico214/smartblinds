import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

// GUARDAR (SOBREESCRIBIR) TODOS los productos de una cotización
export async function POST(req, { params }) {
    const connection = await pool.getConnection(); // Obtener una conexión del pool

    try {
        const { id } = await params;
        const body = await req.json();
        const { products, precioNormal, precioReal, iva, descuento, toleracion } = body;
        console.log(body)
        // 1. Validar estatus antes de hacer cualquier cambio
        const [cotizacion] = await connection.query("SELECT estatus FROM listado_ov WHERE id = ?", [id]);
        const estatusActual = cotizacion[0]?.estatus;

        if (estatusActual === 'Autorizado' || estatusActual === 'Cancelado') {
            return NextResponse.json({ message: "No se pueden modificar los productos de una cotización autorizada o cancelada." }, { status: 403 });
        }

        // 2. Iniciar una transacción
        await connection.beginTransaction();

        // 3. Borrar todos los productos existentes para esta cotización
        await connection.query("DELETE FROM products_ov WHERE idCotizacion = ?", [id]);

        // 4. Si no hay productos nuevos para guardar, solo terminamos.
        if (!products || products.length === 0) {
            await connection.commit(); // Confirmar la transacción (solo el borrado)
            return NextResponse.json({ message: "Productos eliminados. No se agregaron nuevos." });
        }
        // 5. Preparar la consulta para insertar los nuevos productos
        const query = `
            INSERT INTO products_ov (
                idCotizacion, idproducto, cantidad, costo_pieza, proteccion, instalacion, 
                margen, pormargen, preciounico, preciototal, alto, ancho, ubicacion, 
                comision_agente, comision_vendedor, descuento,medidas,description
            ) VALUES ?
        `;

        // 6. Mapear el arreglo de productos al formato de la consulta masiva (arreglo de arreglos)
        const values = products.map(p => [
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
            p.newMedidas,
            p.newDescription
        ]);

        // 7. Ejecutar la inserción masiva
        await connection.query(query, [values]);


        const precioconDescuento = precioNormal - (precioNormal * (descuento * 0.01));

        const updatequery = `UPDATE listado_ov SET  estatus = ?,iva=?,precioNormal=?,precioReal=?,precioNormalconDescuento =?,descuento=?,tolerancia=? WHERE id = ? `;
        await pool.query(updatequery, ['Finalizado', iva, precioNormal, precioReal, precioconDescuento, descuento, toleracion, id]);



        await connection.commit();

        return NextResponse.json({ message: "Productos guardados con éxito" });

    } catch (error) {
        // Si hay algún error, revertir la transacción
        if (connection) await connection.rollback();
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}