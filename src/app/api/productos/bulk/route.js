import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

export async function PUT(req) {
    try {
        // Recibimos el arreglo de productos desde el frontend
        const { products } = await req.json();

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ ok: false, message: "No se enviaron productos para actualizar." }, { status: 400 });
        }

        // Creamos un arreglo de promesas para actualizar solo el margen y el precio
        const updatePromises = products.map((prod) => {
            const query = `UPDATE productos SET margen = ?, precio = ? WHERE id = ?`;
            return pool.query(query, [prod.margen, prod.precio, prod.id]);
        });

        // Ejecutamos todas las consultas en paralelo en el servidor
        await Promise.all(updatePromises);

        return NextResponse.json({
            ok: true,
            message: `Se actualizaron ${products.length} productos correctamente.`
        });

    } catch (error) {
        console.error("Error en PUT /api/productos/bulk:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}