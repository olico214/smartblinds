import { cookies } from "next/headers";
import pool from "@/libs/mysql-safe";

// Verifica que la petición venga de un usuario administrador (externo).
export async function isAdmin() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("name")?.value;
        if (!userId) return false;
        const [rows] = await pool.query("SELECT externo FROM users WHERE userID = ?", [userId]);
        return rows.length > 0 && !!rows[0].externo;
    } catch (e) {
        console.error("Error verificando admin:", e);
        return false;
    }
}
