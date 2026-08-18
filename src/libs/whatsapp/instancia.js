import os from "os";
import path from "path";

export function getPm2Name() {
    return process.env.WHATSAPP_PM2_NAME || "whatsapp";
}

// Ruta del archivo version.txt de la app de WhatsApp.
// Por defecto usa el home del usuario que corre smartblinds (root -> /root/whats/src/version.txt).
export function getVersionFile() {
    const configured = process.env.WHATSAPP_VERSION_FILE;
    if (configured) return path.resolve(configured);
    return path.join(os.homedir(), "whats", "src", "version.txt");
}
