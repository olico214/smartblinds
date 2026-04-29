"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@nextui-org/react";
import CotizacionHeader from "./components/header";
import CotizacionProducts from "./components/products";
import CotizacionProductsUsuarios from "./components/productsusuarios";

export default function CotizacionDetailPageComponent({ user }) {
    const { id } = useParams();

    const [data, setData] = useState({ cotizacion: null, productos: [] });
    const [catalogs, setCatalogs] = useState({ productos: [], clientes: [], usuarios: [], tiposProyecto: [], envios: [], descuento: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [comisionVendedor, setComisionVendedor] = useState(0);
    const [comisionAgente, setComisionAgente] = useState(0);
    const [proteccion, setProteccion] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false)
    const [instalacion, setInstalacion] = useState([])
    const [aumentos, setAumentos] = useState([])

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [cotizacionRes, catalogsRes] = await Promise.all([
                fetch(`/api/cotizacion/${id}?user=` + user),
                fetch('/api/initial-data?user=' + user)
            ]);

            const cotizacionData = await cotizacionRes.json();
            const catalogsData = await catalogsRes.json();
            console.log(cotizacionData.cotizacion.tipo_proyecto_nombre)
            // --- CORRECCIÓN: Se leen los datos directamente de la respuesta de la API ---
            // La API ya no devuelve un objeto { ok, data }, sino directamente { cotizacion, productos }
            if (cotizacionData.cotizacion) {
                setData({
                    cotizacion: cotizacionData.cotizacion,
                    productos: cotizacionData.productos
                });

                // Se accede a los datos usando la estructura correcta
                setProteccion(cotizacionData.cotizacion.proteccion || 5);
                setComisionVendedor(cotizacionData.cotizacion.comision_vendedor || 0);
                setComisionAgente(cotizacionData.cotizacion.comision_agente || 0);
            }

            if (catalogsData.ok) {
                setCatalogs(catalogsData.data);
            }
            let newInstalacion = [
                {
                    "id": 1,
                    "minimo": 1,
                    "maximo": 10000,
                    "precio": "0"
                },
            ]

            // Verifica si el nombre del proyecto (en minúsculas) incluye "br p"
            if (cotizacionData.cotizacion.tipo_proyecto_nombre.toLowerCase().includes("br p")) {
                setInstalacion(newInstalacion);
            } else {
                setInstalacion(catalogsData.data.instalacion);
            }
            setIsAdmin(catalogsData.data.esExterno)
            setAumentos(catalogsData.data.aumentos)
        } catch (error) {
            console.error("Error al cargar los datos:", error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id, fetchData]);

    if (isLoading) return <Spinner size="lg" className="flex justify-center items-center h-screen" />;
    if (!data.cotizacion) return <p className="p-8">Cotización no encontrada o error al cargar.</p>;

    // --- MEJORA: Acceso seguro a los datos para evitar errores ---
    const descuentoValor = catalogs?.descuento?.[0]?.descuento ?? 28;

    return (
        <div className="p-4 sm:p-8 space-y-8">
            <CotizacionHeader
                cotizacion={data.cotizacion}
                catalogs={catalogs}
                onUpdate={fetchData}
                isAdmin={isAdmin}
            />
            {isAdmin ?

                <CotizacionProducts
                    quoteId={id}
                    quoteStatus={data.cotizacion.estatus}
                    quoteAutorizado={data.cotizacion.autorizado}
                    initialProducts={data.productos}
                    productCatalog={catalogs.productos}
                    descuento={descuentoValor}
                    onUpdate={fetchData}
                    comisionVendedor={comisionVendedor}
                    comisionAgente={comisionAgente}
                    proteccion={proteccion}
                    isAdmin={isAdmin}
                    preciosInstalacion={instalacion}
                    aumentos={aumentos}
                />
                :
                <CotizacionProductsUsuarios
                    quoteId={id}
                    quoteStatus={data.cotizacion.estatus}
                    quoteAutorizado={data.cotizacion.autorizado}
                    initialProducts={data.productos}
                    productCatalog={catalogs.productos}
                    descuento={descuentoValor}
                    onUpdate={fetchData}
                    comisionVendedor={comisionVendedor}
                    comisionAgente={comisionAgente}
                    proteccion={proteccion}
                    isAdmin={isAdmin}
                    preciosInstalacion={instalacion}
                    aumentos={aumentos}
                />
            }
        </div>
    );
}