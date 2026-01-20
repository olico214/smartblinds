import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

export async function GET() {
    try {
        // Obtenemos los mensajes ordenados por tu columna 'sort_order'
        const [rows] = await pool.query("SELECT * FROM whatsapp ORDER BY sort_order ASC");
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const data = await req.json();
        const { id, name, type, content, media_url, visible } = data;

        if (id) {
            // --- ACTUALIZAR EXISTENTE ---
            await pool.query(
                "UPDATE whatsapp SET name=?, type=?, content=?, media_url=?, visible=? WHERE id=?",
                [name, type, content, media_url, visible ? 1 : 0, id]
            );
            return NextResponse.json({ message: "Actualizado correctamente" });
        } else {
            // --- CREAR NUEVO ---
            // Primero obtenemos el último orden para ponerlo al final
            const [lastOrder] = await pool.query("SELECT MAX(sort_order) as maxOrder FROM whatsapp");
            const nextOrder = (lastOrder[0].maxOrder || 0) + 1;

            const [result] = await pool.query(
                "INSERT INTO whatsapp (name, type, content, media_url, visible, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
                [name, type, content, media_url, visible ? 1 : 0, nextOrder]
            );
            return NextResponse.json({ id: result.insertId, message: "Creado correctamente" });
        }
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    // Agrego DELETE por si necesitas borrar
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        await pool.query("DELETE FROM whatsapp WHERE id = ?", [id]);
        return NextResponse.json({ message: "Eliminado" });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}