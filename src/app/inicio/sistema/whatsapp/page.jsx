
import RenderComponents from "./rednderComponents";

export default function WhatsappPage() {
    const urlinterna = process.env.URL_INTERNA;
    return (
        <RenderComponents urlinterna={urlinterna} />
    )
}