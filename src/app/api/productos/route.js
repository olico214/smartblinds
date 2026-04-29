import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

// --- GUARDAR UN NUEVO PRODUCTO ---
export async function POST(req) {
    try {
        // 1. Extraemos todos los posibles datos del formulario del cuerpo de la petición
        const {
            nombre, sku, descripcion, tamano, tipo, medidas,
            modeloSB, colorSB, modeloProveedor, colorProveedor,
            costo, stockinicial, precio, margen, is_automatizacion, is_persiana
        } = await req.json();

        // 2. Creamos la consulta SQL para insertar en la tabla `productos`
        const query = `
      INSERT INTO productos (
        nombre, sku, descripcion, tamano, tipo, medidas,
        modeloSB, colorSB, modeloProveedor, colorProveedor,
        costo, stockinicial, precio, margen, is_automatizacion, is_persiana,type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        // 3. Preparamos los valores en el orden correcto
        //    Usamos '|| null' para convertir strings vacíos a NULL y evitar errores en campos numéricos
        const values = [
            nombre,
            sku,
            descripcion,
            tamano,
            tipo,
            medidas,
            modeloSB,
            colorSB,
            modeloProveedor,
            colorProveedor,
            costo || null,
            stockinicial || null,
            precio || null,
            margen || null,
            is_automatizacion || false,
            is_persiana || false,
            tipo == "Telas" ? nombre : null
        ];

        // 4. Ejecutamos la consulta
        const [result] = await pool.query(query, values);

        // 5. Devolvemos una respuesta exitosa
        return NextResponse.json({
            ok: true,
            message: "Producto guardado correctamente",
            id: result.insertId // Devolvemos el ID del nuevo producto
        });

    } catch (error) {
        console.error("Error en POST /api/productos:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}

// --- OBTENER TODOS LOS PRODUCTOS CON FILTROS DINÁMICOS (TODOS LOS CAMPOS) ---
export async function GET(req) {
    try {
        // 1. Extraemos los parámetros de búsqueda del query string
        const { searchParams } = new URL(req.url);

        // 2. Construimos la consulta SQL dinámicamente con filtros para TODOS los campos
        let query = `SELECT * FROM productos WHERE 1=1`;
        const values = [];

        // Configuración de cada campo y su tipo de filtro:
        // - 'like': búsqueda parcial case-insensitive (para texto)
        // - 'exact': coincidencia exacta (para enum, boolean)
        // - 'range': rango numérico (formato: min_max, ej: "10_50" o "10" o "_50")
        const fieldConfig = {
            nombre: { type: 'like', param: 'nombre' },
            sku: { type: 'like', param: 'sku' },
            descripcion: { type: 'like', param: 'descripcion' },
            tamano: { type: 'like', param: 'tamano' },
            tipo: { type: 'exact', param: 'tipo' },
            medidas: { type: 'like', param: 'medidas' },
            modeloSB: { type: 'like', param: 'modeloSB' },
            colorSB: { type: 'like', param: 'colorSB' },
            modeloProveedor: { type: 'like', param: 'modeloProveedor' },
            colorProveedor: { type: 'like', param: 'colorProveedor' },
            is_automatizacion: { type: 'exact', param: 'is_automatizacion' },
            is_persiana: { type: 'exact', param: 'is_persiana' },
            margen: { type: 'range', param: 'margen' },
            precio: { type: 'range', param: 'precio' },
            costo: { type: 'range', param: 'costo' },
            stockinicial: { type: 'range', param: 'stockinicial' },
        };

        // Procesamos cada campo configurado dinámicamente
        for (const [field, config] of Object.entries(fieldConfig)) {
            const value = searchParams.get(config.param);
            if (!value) continue;

            if (config.type === 'like') {
                query += ` AND ${field} LIKE ?`;
                values.push(`%${value}%`);
            } else if (config.type === 'exact') {
                query += ` AND ${field} = ?`;
                values.push(value);
            } else if (config.type === 'range') {
                // Soporta formato: "min_max", "min", o "_max"
                const parts = value.split('_');
                const min = parts[0] ? parseFloat(parts[0]) : null;
                const max = parts[1] !== undefined ? parseFloat(parts[1]) : null;

                if (min !== null && !isNaN(min)) {
                    query += ` AND ${field} >= ?`;
                    values.push(min);
                }
                if (max !== null && !isNaN(max)) {
                    query += ` AND ${field} <= ?`;
                    values.push(max);
                }
            }
        }

        // 3. Ordenamos los resultados
        query += ' ORDER BY nombre ASC';

        // 4. Ejecutamos la consulta
        const [result] = await pool.query(query, values);

        // 5. Devolvemos el resultado
        return NextResponse.json({
            ok: true,
            data: result,
        });

    } catch (error) {
        console.error("Error en GET /api/productos:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}