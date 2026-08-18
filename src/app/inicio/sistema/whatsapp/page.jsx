
import RenderComponents from "./rednderComponents";

export default function WhatsappPage() {
    const urlinterna = process.env.URL_INTERNA_IMAGES;
    const urlwhats = process.env.URL_INTERNA_WHATS;
    return (
        <RenderComponents urlinterna={urlinterna} urlwhats={urlwhats} />
    )
}