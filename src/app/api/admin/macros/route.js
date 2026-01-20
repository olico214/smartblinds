import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const sequence_id = searchParams.get("sequence_id");

        if (sequence_id) {
            // MODO 1: Obtener PASOS
            // Desestructuramos [results] para obtener solo el primer arreglo
            const [results] = await pool.query(
                "SELECT * FROM whatsapp_sequence_steps WHERE sequence_id = ? ORDER BY sort_order ASC",
                [sequence_id]
            );

            const processed = results.map(item => ({
                ...item,
                media_url: item.media_url ? JSON.parse(item.media_url || '[]') : [],
                delay_seconds: item.delay_seconds || 0
            }));
            return NextResponse.json(processed);
        } else {
            // MODO 2: Obtener LISTA DE MACROS
            // Aquí también usamos [results] para ignorar los metadatos
            const [results] = await pool.query("SELECT * FROM whatsapp_sequences ORDER BY id DESC");

            // Ahora results será exactamente lo que necesitas (un [] si no hay nada)
            return NextResponse.json(results);
        }
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const data = await req.json();
        const { action } = data; // 'create_sequence' o 'save_step'

        // CREAR/EDITAR MACRO (PADRE)
        if (action === 'create_sequence') {
            const { id, name, description } = data;
            if (id) {
                await pool.query("UPDATE whatsapp_sequences SET name=?, description=? WHERE id=?", [name, description, id]);
                return NextResponse.json({ message: "Macro actualizada" });
            } else {
                const res = await pool.query("INSERT INTO whatsapp_sequences (name, description) VALUES (?, ?)", [name, description]);
                return NextResponse.json({ id: res.insertId, message: "Macro creada" });
            }
        }

        // CREAR/EDITAR PASO (HIJO)
        if (action === 'save_step') {
            let { id, sequence_id, type, content, media_url, delay_seconds, active } = data;
            let finalMedia = JSON.stringify(Array.isArray(media_url) ? media_url : []);

            if (id) {
                await pool.query(
                    "UPDATE whatsapp_sequence_steps SET type=?, content=?, media_url=?, delay_seconds=?, active=? WHERE id=?",
                    [type, content, finalMedia, delay_seconds, active ? 1 : 0, id]
                );
            } else {
                // Obtener el ultimo orden
                const lastOrderRes = await pool.query("SELECT MAX(sort_order) as maxOrder FROM whatsapp_sequence_steps WHERE sequence_id=?", [sequence_id]);
                const nextOrder = (lastOrderRes[0]?.maxOrder || 0) + 1;

                await pool.query(
                    "INSERT INTO whatsapp_sequence_steps (sequence_id, type, content, media_url, delay_seconds, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [sequence_id, type, content, finalMedia, delay_seconds, active ? 1 : 0, nextOrder]
                );
            }
            return NextResponse.json({ message: "Paso guardado" });
        }

        return NextResponse.json({ message: "Acción no válida" }, { status: 400 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const type = searchParams.get("type"); // 'sequence' o 'step'

        if (type === 'sequence') {
            await pool.query("DELETE FROM whatsapp_sequences WHERE id = ?", [id]);
        } else {
            await pool.query("DELETE FROM whatsapp_sequence_steps WHERE id = ?", [id]);
        }
        return NextResponse.json({ message: "Eliminado" });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}