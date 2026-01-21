import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
const urlinterna = process.env.URL_INTERNA_WHATS
const urlinternaimages = process.env.URL_INTERNA_IMAGES
// Configuración Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_ADDRESS,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: false }
});

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("pdf");
        const type = formData.get("type");
        const phone = formData.get("phone");
        const email = formData.get("email");
        const idCotizacion = formData.get("id");
        // --- RECIBIMOS EL MENSAJE PERSONALIZADO ---
        const messageBody = formData.get("message") || `Adjunto cotización #${idCotizacion}`;

        if (!file) {
            return NextResponse.json({ error: "No se recibió archivo PDF" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // --- ENVIAR EMAIL ---
        if (type === "email") {
            const mailOptions = {
                from: `"SmartBlinds Cotizaciones" <${process.env.SMTP_USERNAME || "oliverromero73@soiteg.com"}>`,
                to: email,
                subject: `Cotización #${idCotizacion} - SmartBlinds`,
                text: messageBody,
                attachments: [
                    {
                        filename: `cotizacion_${idCotizacion}.pdf`,
                        content: buffer,
                        contentType: "application/pdf",
                    },
                ],
            };

            await transporter.sendMail(mailOptions);
            return NextResponse.json({ success: true, message: "Correo enviado" });
        }

        // --- ENVIAR WHATSAPP ---
        if (type === "whatsapp") {
            const data = new FormData();

            const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
            data.append('foto', blob, file.name); // El tercer parámetro es vital para que Multer detecte el archivo
            const res = await fetch(`${urlinternaimages}/api/subir`, {
                method: "POST",
                body: data,
            });
            const result = await res.json();
            const whatsappPayload = {
                number: phone,
                message: messageBody,
                urlMedia: result.url
            };

            const whatsappRes = await fetch(`${urlinterna}/v1/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(whatsappPayload)
            });

            if (!whatsappRes.ok) throw new Error("Error bot WhatsApp");

            // Limpieza (Opcional pero recomendada)
            setTimeout(() => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }, 60000); // Borrar a los 60 seg

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Canal no válido" }, { status: 400 });

    } catch (error) {
        console.error("Error API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}