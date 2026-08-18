import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";
import { isAdmin } from "@/libs/usercontroller/checkAdmin";

const execAsync = promisify(exec);

const PM2_NAME = () => process.env.WHATSAPP_PM2_NAME || "whatsapp";
const VERSION_FILE = () => process.env.WHATSAPP_VERSION_FILE || "/root/whats/src/version.txt";

async function readVersion() {
    try {
        return (await readFile(VERSION_FILE(), "utf8")).trim();
    } catch {
        return null;
    }
}

async function getPm2Info() {
    try {
        const { stdout } = await execAsync("pm2 jlist");
        const list = JSON.parse(stdout);
        const app = list.find((p) => p.name === PM2_NAME());
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
        name: PM2_NAME(),
        version,
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
        await execAsync(`pm2 ${action} ${PM2_NAME()}`);
        return NextResponse.json({ ok: true, message: `Acción ${action} ejecutada` });
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
