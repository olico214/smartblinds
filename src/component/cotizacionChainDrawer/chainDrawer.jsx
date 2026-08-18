"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Drawer, DrawerContent, DrawerHeader, DrawerBody,
    Button, useDisclosure, Chip, Divider, Spinner,
    Card, CardBody
} from "@nextui-org/react";
import { FaLink, FaEye, FaList } from "react-icons/fa";
import { IoIosCreate } from "react-icons/io";
import Swal from "sweetalert2";

const statusColorMap = {
    Nuevo: "secondary",
    Finalizado: "warning",
    Autorizado: "success",
    Cancelado: "danger",
};

function ChainProductsTable({ productos, isAdmin }) {
    const formatCurrency = (value) => Number(value || 0).toFixed(2);
    return (
        <Card shadow="sm" className="border border-default-200 mt-2 mb-1">
            <CardBody className="p-2">
                <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="border-b border-default-100 text-default-400">
                                <th className="text-left pb-1 font-medium">SKU</th>
                                <th className="text-left pb-1 font-medium">Medidas</th>
                                <th className="text-left pb-1 font-medium">Descripción</th>
                                <th className="text-right pb-1 font-medium">Cant.</th>
                                {isAdmin && <th className="text-right pb-1 font-medium">Margen</th>}
                                <th className="text-right pb-1 font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productos.map((p) => (
                                <tr key={p.id} className="border-b border-default-50 last:border-0">
                                    <td className="py-1.5 pr-1 text-default-700 font-medium">{p.sku}</td>
                                    <td className="py-1.5 pr-1 text-default-500 truncate max-w-[50px]">{p.medidas || "-"}</td>
                                    <td className="py-1.5 pr-1 text-default-500 truncate max-w-[70px]">{p.description || p.producto_nombre || "-"}</td>
                                    <td className="py-1.5 pr-1 text-right text-default-600">{p.cantidad}</td>
                                    {isAdmin && <td className="py-1.5 pr-1 text-right text-purple-600 font-medium">{p.pormargen ? `${p.pormargen}%` : "-"}</td>}
                                    <td className="py-1.5 text-right text-default-800 font-bold">${formatCurrency(p.preciototal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardBody>
        </Card>
    );
}

export default function CotizacionChainDrawer({ currentId, viewMode, user, parentData, isAdmin }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const router = useRouter();
    const [chain, setChain] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [hasChain, setHasChain] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [previewProducts, setPreviewProducts] = useState({});

    const formatCurrency = (value) => Number(value || 0).toFixed(2);

    const fetchChain = async () => {
        if (!currentId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/cotizacion/${currentId}/chain`);
            const data = await res.json();
            if (data.ok && data.chain && data.chain.length > 1) {
                setChain(data.chain);
                setHasChain(true);
            } else {
                setChain([]);
                setHasChain(false);
            }
        } catch (e) {
            console.error("Error fetching chain:", e);
            setHasChain(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChain();
    }, [currentId]);

    const getHref = (item) => {
        if (viewMode === "edit" && item.estatus === 'Nuevo') {
            return `/inicio/sistema/crear-cotizacion/${item.id}`;
        }
        return item.autorizado == 1
            ? `/inicio/sistema/ventas/${item.id}`
            : `/inicio/sistema/${item.id}`;
    };

    const handleCreateLinked = async () => {
        if (!parentData || !user) return;

        setCreating(true);
        try {
            const res = await fetch("/api/listado_ov", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user}`
                },
                body: JSON.stringify({
                    idCliente: parentData.idCliente,
                    idUser: parentData.idUser,
                    idAgente: parentData.idAgente,
                    idTipoproyecto: parentData.idTipoproyecto,
                    id_envio: parentData.id_envio || null,
                    nombreProyecto: (parentData.nombreProyecto || "") + " (vinculada)",
                    lineaCotizada: parentData.linea_cotizada,
                    parent_id: currentId
                }),
            });

            const data = await res.json();
            if (!data.ok) throw new Error(data.error || "Error al crear cotización vinculada");

            onOpenChange(false);

            await Swal.fire({
                title: "¡Cotización Vinculada Creada!",
                text: "Redirigiendo a la configuración de productos...",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });

            router.push(`/inicio/sistema/crear-cotizacion/${data.id}`);
        } catch (error) {
            Swal.fire("Error", error.message || "No se pudo crear la cotización vinculada", "error");
        } finally {
            setCreating(false);
        }
    };

    const handleToggleProducts = async (itemId) => {
        if (expandedId === itemId) {
            setExpandedId(null);
            return;
        }
        if (previewProducts[itemId]) {
            setExpandedId(itemId);
            return;
        }
        setExpandedId(itemId);
        try {
            const res = await fetch(`/api/cotizacion/${itemId}?user=${user}`);
            const data = await res.json();
            if (data.productos) {
                setPreviewProducts(prev => ({ ...prev, [itemId]: data.productos }));
            }
        } catch (e) {
            console.error("Error fetching products for item:", itemId, e);
        }
    };

    const handleGoTo = (item) => {
        onOpenChange(false);
        router.push(getHref(item));
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const options = { year: "numeric", month: "short", day: "numeric" };
        return new Date(dateString).toLocaleDateString("es-MX", options);
    };

    const chainCount = hasChain ? chain.length : 0;

    return (
        <>
            <div className="fixed bottom-24 right-4 z-50">
                <Button
                    onPress={() => { fetchChain(); onOpen(); }}
                    color="secondary"
                    size="lg"
                    className="shadow-2xl font-bold hidden md:flex"
                    startContent={<FaLink />}
                >
                    Cotizaciones Vinculadas{chainCount > 0 ? ` (${chainCount})` : ""}
                </Button>
                <Button
                    onPress={() => { fetchChain(); onOpen(); }}
                    color="secondary"
                    isIconOnly
                    size="lg"
                    className="shadow-2xl font-bold md:hidden rounded-full w-14 h-14"
                >
                    <FaLink size={20} />
                </Button>
            </div>

            <Drawer
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="sm"
            >
                <DrawerContent>
                    <DrawerHeader className="border-b bg-gray-50">
                        <span className="font-bold">Cotizaciones Vinculadas</span>
                    </DrawerHeader>
                    <DrawerBody className="p-4">
                        <Button
                            color="success"
                            size="lg"
                            className="font-bold mb-4"
                            startContent={<IoIosCreate />}
                            onPress={handleCreateLinked}
                            isLoading={creating}
                            isDisabled={!parentData}
                        >
                            Nueva Cotización Vinculada
                        </Button>

                        <Divider className="my-2" />

                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <Spinner size="lg" color="secondary" />
                            </div>
                        ) : hasChain ? (
                            <div className="flex flex-col gap-1 mt-2">
                                {chain.map((item, index) => (
                                    <div key={item.id}>
                                        {index > 0 && <Divider className="my-1" />}
                                        <div className={`p-3 rounded-xl transition-all ${
                                            String(item.id) === String(currentId)
                                                ? "bg-secondary-50 border border-secondary-300"
                                                : "hover:bg-default-50"
                                        }`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-sm">
                                                            #{item.id}
                                                        </span>
                                                        <Chip
                                                            color={statusColorMap[item.estatus] || "default"}
                                                            size="sm"
                                                            variant="flat"
                                                        >
                                                            {item.estatus}
                                                        </Chip>
                                                    </div>
                                                    <span className="text-xs text-default-500 truncate">
                                                        {item.nombreProyecto || "Sin nombre"}
                                                    </span>
                                                    <span className="text-xs text-default-400">
                                                        {item.cliente_nombre} &middot; {formatDate(item.createdDate)}
                                                    </span>
                                                </div>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color="primary"
                                                    className="shrink-0"
                                                >
                                                    {item.linea_cotizada || "N/A"}
                                                </Chip>
                                            </div>

                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="secondary"
                                                    startContent={<FaList size={12} />}
                                                    className="text-xs flex-1"
                                                    onPress={() => handleToggleProducts(item.id)}
                                                >
                                                    {expandedId === item.id ? "Ocultar productos" : "Ver productos"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="primary"
                                                    startContent={<FaEye size={12} />}
                                                    className="text-xs flex-1"
                                                    onPress={() => handleGoTo(item)}
                                                    isDisabled={String(item.id) === String(currentId)}
                                                >
                                                    {String(item.id) === String(currentId) ? "Actual" : "Ir a cotización"}
                                                </Button>
                                            </div>

                                            {expandedId === item.id && (
                                                previewProducts[item.id] ? (
                                                    <ChainProductsTable productos={previewProducts[item.id]} isAdmin={isAdmin} />
                                                ) : (
                                                    <div className="flex justify-center py-4">
                                                        <Spinner size="sm" color="secondary" />
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-default-400 text-center mt-4">
                                No hay cotizaciones vinculadas. Crea una nueva para comenzar una cadena.
                            </p>
                        )}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
}
