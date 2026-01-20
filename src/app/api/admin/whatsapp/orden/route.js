import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

export async function POST(req) {
    try {
        const items = await req.json();

        // Actualizamos el 'sort_order' de cada item
        const promises = items.map((item, index) => {
            return pool.query("UPDATE whatsapp SET sort_order = ? WHERE id = ?", [index + 1, item.id]);
        });

        await Promise.all(promises);
        return NextResponse.json({ message: "Orden actualizado" });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}