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

    console.log(items);

    // Calculamos la posición por cada columna (apps)
    // Esto asegura que los items de "Sistema" tengan posición 1,2,3...
    // y los de "Administracion" también tengan posición 1,2,3... independientemente
    const positionCounters = {};

    // Usamos un bucle secuencial para garantizar el orden de las posiciones
    // Promise.all no garantiza orden de ejecución
    const connection = await pool.getConnection();

    try {
      for (const item of items) {
        // Inicializamos el contador para esta app si no existe
        if (!positionCounters[item.apps]) {
          positionCounters[item.apps] = 1;
        }

        const query = "UPDATE views SET position = ?, apps = ? WHERE id = ?";
        const values = [positionCounters[item.apps], item.apps, item.id];

        await connection.query(query, values);

        // Incrementamos el contador para esta app
        positionCounters[item.apps]++;
      }

      return NextResponse.json({ ok: true, message: "Orden actualizado" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error actualizando orden:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
