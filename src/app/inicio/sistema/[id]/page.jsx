import { validateCookie } from "@/libs/usercontroller/usercontroller";
import CotizacionHeaderView from "./components/header";
import CotizacionProductsView from "./components/productsview";
import { redirect } from "next/navigation";
import DrawerOptionsComponent from "./components/drawerOptions";
import CotizacionProductsViewtest from "./components/testview";

// --- Componente Principal de la Página ---
export default async function IdCotizacionViewPage({ params }) {
    const { id } = await params;
    const userid = await validateCookie();
    if (!userid.value) {
        return redirect("/login");
    }
    const urlinterna = process.env.URL_INTERNA_WHATS
    // Hacemos la carga de datos del lado del servidor
    const res = await fetch(`${process.env.FRONTEND_URL}/api/cotizacion/${id}?user=${userid.value}`, { cache: 'no-store' });
    const data = await res.json();

    if (!data.cotizacion) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Cotización no encontrada</h1>
                <p className="text-default-500">No se pudo cargar la información para la cotización con ID: {id}</p>
            </div>
        )
    }
    return (
        <div className="p-4 sm:p-8 space-y-8">
            <CotizacionHeaderView cotizacion={data.cotizacion} isAdmin={data.isAdmin} />
            {/* <CotizacionProductsView productos={data.productos} cotizacion={data.cotizacion} /> */}
            <CotizacionProductsViewtest productos={data.productos} cotizacion={data.cotizacion} />
            <DrawerOptionsComponent id={id} urlinterna={urlinterna} />
        </div>
    );
}