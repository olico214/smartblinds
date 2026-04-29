"use client"
import { Card, CardHeader, CardBody, Divider, Chip, Button } from "@nextui-org/react";
import { useState } from "react";
import Swal from "sweetalert2";

// --- Sub-componente para mostrar el encabezado ---
export default function CotizacionHeaderView({ cotizacion, isAdmin }) {
    const [autorizando, setAutorizando] = useState(false);

    const InfoBlock = ({ label, value }) => (
        <div>
            <p className="text-xs text-default-500 uppercase font-semibold">{label}</p>
            <p className="text-sm text-default-800">{value || 'N/A'}</p>
        </div>
    );

    const statusColorMap = {
        Autorizado: "success",
        "En proceso": "primary",
        Nuevo: "secondary",
        Cancelado: "danger",
        Finalizado: "warning",
    };

    const handleAutorizar = async () => {
        const result = await Swal.fire({
            title: '¿Autorizar Cotización?',
            text: `Estás a punto de autorizar la cotización #${cotizacion.id} para el cliente ${cotizacion.cliente_nombre}. Una vez autorizada, no se podrán modificar los productos.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, Autorizar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setAutorizando(true);
            try {
                const res = await fetch(`/api/cotizacion/${cotizacion.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estatus: 'Autorizar' }),
                });
                const data = await res.json();
                if (data.ok) {
                    await Swal.fire({
                        icon: 'success',
                        title: '✅ ¡Cotización Autorizada!',
                        text: 'La cotización ha sido autorizada exitosamente.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    window.location.reload();
                } else {
                    throw new Error(data.error || 'Error al autorizar');
                }
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            } finally {
                setAutorizando(false);
            }
        }
    };

    const puedeAutorizar = cotizacion.estatus === 'Finalizado' && cotizacion.autorizado !== 1;

    return (
        <Card shadow="sm" className="border-1 border-default-200">
            <CardHeader className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold">Resumen de Cotización #{cotizacion.id}</h1>
                    <p className="text-sm text-default-500">Información guardada</p>
                </div>
                <div className="flex items-center gap-2">
                    {cotizacion.autorizado == 1 && (
                        <Chip color="success" size="sm" variant="solid">
                            ✓ AUTORIZADO
                        </Chip>
                    )}
                    <Chip color={statusColorMap[cotizacion.estatus]} size="sm" variant="flat">
                        {cotizacion.estatus}
                    </Chip>
                </div>
            </CardHeader>
            <Divider />
            <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
                    <InfoBlock label="Cliente" value={cotizacion.cliente_nombre} />
                    <InfoBlock label="Vendedor" value={cotizacion.usuario_nombre} />
                    <InfoBlock label="Agente" value={cotizacion.nombre_agente} />
                    <InfoBlock label="Método de Envío" value={cotizacion.envio_descripcion} />
                    <InfoBlock label="Nombre Proyecto" value={cotizacion.nombreProyecto || ''} />
                    <InfoBlock label="Linea Cotizada" value={cotizacion.linea_cotizada || ''} />
                    {isAdmin ?
                        <>
                            <InfoBlock label="Comisión Vendedor" value={`${cotizacion.comision_vendedor || 0}%`} />
                            <InfoBlock label="Comisión Agente" value={`${cotizacion.comision_agente || 0}%`} />
                            <InfoBlock label="Costo de Envío" value={`$${Number(cotizacion.envio_precio || 0).toFixed(2)}`} />
                            <InfoBlock label="Protección Telas" value={`${cotizacion.proteccion || 0}%`} />
                        </>
                        :
                        null
                    }
                </div>

                {/* Botón de Autorizar */}
                {puedeAutorizar && (
                    <div className="mt-6 pt-4 border-t border-default-200 flex justify-end">
                        <Button
                            color="success"
                            size="lg"
                            className="font-bold text-white shadow-md px-8"
                            onPress={handleAutorizar}
                            isLoading={autorizando}
                        >
                            {autorizando ? "Autorizando..." : "✓ Autorizar Cotización"}
                        </Button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}