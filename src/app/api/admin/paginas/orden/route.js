import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";
export async function POST(req) {
  try {
    const items = await req.json(); // Recibimos el array de items reordenados

    // Validamos que llegue algo
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { ok: false, message: "Datos inválidos" },
        { status: 400 }
      );
    }

    console.log(items)
    // Usamos una conexión del pool para hacer las updates
    // La estrategia es recorrer el array y actualizar la posición y la columna (apps)
    const promises = items.map((item, index) => {
      const query = "UPDATE views SET position = ?, apps = ? WHERE id = ?";
      // index + 1 porque visualmente el orden suele empezar en 1, no en 0
      const values = [index + 1, item.apps, item.id];
      return pool.query(query, values);
    });

    // Ejecutamos todas las actualizaciones en paralelo
    await Promise.all(promises);

    return NextResponse.json({ ok: true, message: "Orden actualizado" });
  } catch (error) {
    console.error("Error actualizando orden:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}