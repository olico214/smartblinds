import { NextResponse } from "next/server";
const ulrwhats = process.env.URL_INTERNA_WHATS

export async function POST(req) {
    const data = await req.json();
    const { steps, phone } = data
    try {

        console.log(steps)
        for (const step of steps) {
            if (!step.active) continue;

            let payload = {};
            if (step.type === "image") {
                payload = {
                    number: phone,
                    message: step.content,
                    urlMedia: step.type === "image" ? step.media_url[0] : null,
                };
            } else {
                payload = {
                    number: phone,
                    message: step.content,
                };
            }
            if (step.delay_seconds > 0) {
                await new Promise(r => setTimeout(r, step.delay_seconds * 1000));
            }
            await fetch(`${ulrwhats}/v1/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });


        }

        return NextResponse.json({ error: "Canal no válido" }, { status: 400 });

    } catch (error) {
        console.error("Error API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}