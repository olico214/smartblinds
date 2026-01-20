import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
const urlinterna = process.env.URL_INTERNA
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
                to: "oliverromero73@gmail.com", // Puedes hacerlo dinámico si envías el email en formData
                subject: `Cotización #${idCotizacion} - SmartBlinds`,
                // Usamos el mensaje seleccionado como cuerpo del correo
                text: messageBody,
                // Opcional: Si quieres que el template soporte HTML básico, podrías usar 'html': messageBody.replace(/\n/g, '<br>')
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
            // Guardar PDF temporalmente
            const tempFileName = `${uuidv4()}.pdf`;
            const publicPath = path.join(process.cwd(), "public", "temp");

            if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true });

            const filePath = path.join(publicPath, tempFileName);
            fs.writeFileSync(filePath, buffer);

            const protocol = req.headers.get('x-forwarded-proto') || 'http';
            const host = req.headers.get('host');
            const fileUrl = `${protocol}://${host}/temp/${tempFileName}`;

            // Enviar al Bot
            const whatsappPayload = {
                number: "5213328722353",
                message: messageBody, // <--- Aquí va el texto con variables rellenas (Hola Cliente...)
                urlMedia: fileUrl     // <--- Y aquí va el PDF de la cotización
            };

            const whatsappRes = await fetch(`${urlinterna}:3008/v1/messages`, {
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