"use client";

import { useState, useEffect, useCallback } from "react";
import { Spinner } from "@nextui-org/react";
import VentaHeader from "./components/header";
import VentaProducts from "./components/products";
import VentaProductsUsuarios from "./components/productsusuarios";
import CotizacionChainDrawer from "@/component/cotizacionChainDrawer/chainDrawer";

export default function VentaDetailComponent({ user, id }) {
    const [data, setData] = useState({ venta: null, productos: [], cambios: [] });
    const [catalogs, setCatalogs] = useState({ productos: [], clientes: [], usuarios: [], tiposProyecto: [], envios: [], descuento: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [comisionVendedor, setComisionVendedor] = useState(0);
    const [comisionAgente, setComisionAgente] = useState(0);
    const [proteccion, setProteccion] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [instalacion, setInstalacion] = useState([]);
    const [aumentos, setAumentos] = useState([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [ventaRes, catalogsRes] = await Promise.all([
                fetch(`/api/ventas/${id}?user=${user}`),
                fetch(`/api/initial-data?user=${user}`)
            ]);

            const ventaData = await ventaRes.json();
            const catalogsData = await catalogsRes.json();

            if (ventaData.venta) {
                setData({
                    venta: ventaData.venta,
                    productos: ventaData.productos,
                    cambios: ventaData.cambios || []
                });
                setProteccion(ventaData.venta.proteccion || 5);
                setComisionVendedor(ventaData.venta.comision_vendedor || 0);
                setComisionAgente(ventaData.venta.comision_agente || 0);
            }

            if (catalogsData.ok) {
                setCatalogs(catalogsData.data);
                setIsAdmin(catalogsData.data.esExterno);
            }

            let newInstalacion = [
                { id: 1, minimo: 1, maximo: 10000, precio: "0" },
            ];

            if (ventaData.venta?.tipo_proyecto_nombre?.toLowerCase().includes("br p")) {
                setInstalacion(newInstalacion);
            } else if (catalogsData.data?.instalacion) {
                setInstalacion(catalogsData.data.instalacion);
            }

            setAumentos(catalogsData.data?.aumentos || []);
        } catch (error) {
            console.error("Error al cargar los datos de la venta:", error);
        } finally {
            setIsLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id, fetchData]);

    if (isLoading) return <Spinner size="lg" className="flex justify-center items-center h-screen" />;
    if (!data.venta) return <p className="p-8">Venta no encontrada o error al cargar.</p>;

    const descuentoValor = catalogs?.descuento?.[0]?.descuento ?? 28;

    return (
        <div className="p-4 sm:p-8 space-y-8">
            <VentaHeader
                venta={data.venta}
                catalogs={catalogs}
                onUpdate={fetchData}
                isAdmin={isAdmin}
            />
            {isAdmin ?
                <VentaProducts
                    quoteId={id}
                    quoteStatus={data.venta.estatus}
                    quoteAutorizado={data.venta.autorizado}
                    initialProducts={data.productos}
                    cambios={data.cambios}
                    productCatalog={catalogs.productos}
                    descuento={descuentoValor}
                    onUpdate={fetchData}
                    comisionVendedor={comisionVendedor}
                    comisionAgente={comisionAgente}
                    proteccion={proteccion}
                    isAdmin={isAdmin}
                    preciosInstalacion={instalacion}
                    aumentos={aumentos}
                    user={user}
                />
                :
                <VentaProductsUsuarios
                    quoteId={id}
                    quoteStatus={data.venta.estatus}
                    quoteAutorizado={data.venta.autorizado}
                    initialProducts={data.productos}
                    cambios={data.cambios}
                    productCatalog={catalogs.productos}
                    descuento={descuentoValor}
                    onUpdate={fetchData}
                    comisionVendedor={comisionVendedor}
                    comisionAgente={comisionAgente}
                    proteccion={proteccion}
                    isAdmin={isAdmin}
                    preciosInstalacion={instalacion}
                    aumentos={aumentos}
                    user={user}
                />
            }
            <CotizacionChainDrawer currentId={id} viewMode="detail" user={user} parentData={data.venta} isAdmin={isAdmin} />
        </div>
    );
}
