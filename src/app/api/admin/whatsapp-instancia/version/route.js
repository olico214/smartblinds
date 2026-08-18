import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile } from "fs/promises";
import { isAdmin } from "@/libs/usercontroller/checkAdmin";
import { getPm2Name, getVersionFile } from "@/libs/whatsapp/instancia";

const execAsync = promisify(exec);

export async function POST(req) {
    if (!(await isAdmin())) {
        return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }
    const { version } = await req.json();
    const cleaned = String(version || "").replace(/\s+/g, "");
    if (!/^\d+,\d+,\d+$/.test(cleaned)) {
        return NextResponse.json(
            { ok: false, error: "Formato de versión inválido. Usa: 2,3000,1034001234" },
            { status: 400 }
        );
    }
    const file = getVersionFile();
    try {
        await writeFile(file, cleaned + "\n", "utf8");
        await execAsync(`pm2 restart ${getPm2Name()}`);
        return NextResponse.json({ ok: true, version: cleaned, versionFile: file });
    } catch (e) {
        return NextResponse.json(
            { ok: false, error: `No se pudo escribir ${file}: ${e.message}` },
            { status: 500 }
        );
    }
}
