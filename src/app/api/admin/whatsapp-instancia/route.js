import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";
import { isAdmin } from "@/libs/usercontroller/checkAdmin";
import { getPm2Name, getVersionFile } from "@/libs/whatsapp/instancia";

const execAsync = promisify(exec);

async function readVersion() {
    try {
        return (await readFile(getVersionFile(), "utf8")).trim();
    } catch {
        return null;
    }
}

async function getPm2Info() {
    try {
        const { stdout } = await execAsync("pm2 jlist");
        const list = JSON.parse(stdout);
        const app = list.find((p) => p.name === getPm2Name());
        if (!app) return null;
        return {
            status: app.pm2_env?.status ?? "unknown",
            pid: app.pid ?? null,
            restarts: app.pm2_env?.restart_time ?? 0,
            uptime: app.pm2_env?.pm_uptime ?? null,
        };
    } catch {
        return null;
    }
}

export async function GET() {
    if (!(await isAdmin())) {
        return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }
    const version = await readVersion();
    const info = await getPm2Info();
    return NextResponse.json({
        ok: true,
        name: getPm2Name(),
        version,
        versionFile: getVersionFile(),
        ...(info || { status: "unknown", pid: null, restarts: 0, uptime: null }),
    });
}

export async function POST(req) {
    if (!(await isAdmin())) {
        return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }
    const { action } = await req.json();
    if (!["stop", "start", "restart"].includes(action)) {
        return NextResponse.json({ ok: false, error: "Acción inválida" }, { status: 400 });
    }
    try {
        await execAsync(`pm2 ${action} ${getPm2Name()}`);
        return NextResponse.json({ ok: true, message: `Acción ${action} ejecutada` });
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
