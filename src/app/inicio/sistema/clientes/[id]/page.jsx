import { validateCookie } from "@/libs/usercontroller/usercontroller";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import ClienteDetailComponent from "./components/clienteDetail";

export default async function ClienteDetailPage({ params }) {
    const { id } = await params;
    const user = await validateCookie();
    if (!user.value) {
        return redirect("/login");
    }

    // Construir URL base dinámica para fetch interno
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // Cargar datos del cliente con sus cotizaciones
    const res = await fetch(`${baseUrl}/api/clientes/${id}`, { cache: 'no-store' });
    const data = await res.json();

    if (!data.ok || !data.data) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Cliente no encontrado</h1>
                <p className="text-default-500">No se pudo cargar la información del cliente.</p>
            </div>
        );
    }

    return (
        <div>
            <ClienteDetailComponent 
                cliente={data.data.cliente} 
                cotizaciones={data.data.cotizaciones} 
                stats={data.data.stats}
                userId={user.value}
            />
        </div>
    );
}
