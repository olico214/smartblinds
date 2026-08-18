import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile } from "fs/promises";
import { isAdmin } from "@/libs/usercontroller/checkAdmin";

const execAsync = promisify(exec);

const PM2_NAME = () => process.env.WHATSAPP_PM2_NAME || "whatsapp";
const VERSION_FILE = () => process.env.WHATSAPP_VERSION_FILE || "/root/whats/src/version.txt";

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
    try {
        await writeFile(VERSION_FILE(), cleaned + "\n", "utf8");
        await execAsync(`pm2 restart ${PM2_NAME()}`);
        return NextResponse.json({ ok: true, version: cleaned });
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
