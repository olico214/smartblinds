import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe"; // Asegúrate de que esta ruta sea correcta

export async function POST(req) {
    try {
        // 1. Obtener los datos del cliente desde el cuerpo de la petición
        const {
            nombre,
            telefono,
            email,
            domicilio,
            estado,
            ciudad,
            colonia,
            frecuente,
            selected_canal_venta,
            cp,
            tipo
        } = await req.json();

        // 2. Validación básica de los datos (puedes añadir más validaciones)
        if (!nombre || !selected_canal_venta) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "El nombre y el canal de venta son campos requeridos."
                },
                { status: 400 } // Bad Request
            );
        }

        // 3. Crear la consulta SQL para insertar los datos en la tabla `clientes`
        const query = `
            INSERT INTO clientes (
                nombre, telefono, email, domicilio, estado,
                ciudad, colonia, frecuente, selected_canal_venta, tipo, cp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // 4. Crear el array de valores en el orden correcto
        const values = [
            nombre,
            telefono,
            email,
            domicilio,
            estado,
            ciudad,
            colonia,
            frecuente, // Esto será `true` o `false`
            selected_canal_venta,
            tipo,
            cp
        ];

        // 5. Ejecutar la consulta en la base de datos
        const [result] = await pool.query(query, values);

        // 6. Devolver una respuesta exitosa con el ID del nuevo cliente
        return NextResponse.json({
            ok: true,
            message: "Cliente guardado exitosamente",
            data: {
                id: result.insertId, // ID autoincremental generado por MySQL
                nombre,
                email
            }
        });

    } catch (error) {
        // 7. Manejar cualquier error que ocurra durante el proceso
        console.error("Error en POST /api/clientes:", error);
        return NextResponse.json(
            {
                ok: false,
                error: "Ocurrió un error al guardar el cliente. Por favor, inténtalo de nuevo."
            },
            { status: 500 } // Internal Server Error
        );
    }
}



// --- OBTENER TODOS LOS CLIENTES ---
export async function GET(req) {
    try {
        // La consulta une las tablas clientes y canal_venta para obtener el nombre del canal
        const query = `
            SELECT 
               c.*,
                cv.nombre AS canal_venta_nombre
            FROM 
                clientes AS c
            LEFT JOIN 
                canal_venta AS cv ON c.selected_canal_venta = cv.id
            ORDER BY 
                c.id ASC;
        `;

        const [result] = await pool.query(query);

        return NextResponse.json({ ok: true, data: result });

    } catch (error) {
        console.error("Error en GET /api/clientes:", error);
        return NextResponse.json(
            { ok: false, error: "Error al obtener los clientes." },
            { status: 500 }
        );
    }
}



export async function PUT(req) {
    try {
        const {
            id, // Necesitamos el ID para el WHERE
            nombre, telefono, email, domicilio, estado,
            ciudad, colonia, frecuente, selected_canal_venta, tipo, cp
        } = await req.json();

        if (!id) {
            return NextResponse.json({ ok: false, error: "ID de cliente no proporcionado." }, { status: 400 });
        }

        const query = `
            UPDATE clientes SET 
                nombre = ?, telefono = ?, email = ?, domicilio = ?, estado = ?, 
                ciudad = ?, colonia = ?, frecuente = ?, selected_canal_venta = ?, 
                tipo = ?, cp = ?
            WHERE id = ?
        `;

        const values = [
            nombre, telefono, email, domicilio, estado,
            ciudad, colonia, frecuente, selected_canal_venta, tipo, cp, id
        ];

        await pool.query(query, values);

        return NextResponse.json({ ok: true, message: "Cliente actualizado exitosamente" });

    } catch (error) {
        console.error("Error en PUT /api/clientes:", error);
        return NextResponse.json({ ok: false, error: "Error al actualizar el cliente." }, { status: 500 });
    }
}