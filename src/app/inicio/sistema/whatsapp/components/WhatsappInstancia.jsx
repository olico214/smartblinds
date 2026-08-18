"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, Button, Input, Chip, Spinner, Divider } from "@nextui-org/react";
import Swal from "sweetalert2";
import { FaWhatsapp, FaStop, FaPlay, FaRedo, FaSync } from "react-icons/fa";

const statusMap = {
    online: { label: "En línea", color: "success" },
    stopped: { label: "Detenido", color: "danger" },
    errored: { label: "Error", color: "danger" },
    launching: { label: "Iniciando", color: "warning" },
};

function Info({ label, value }) {
    return (
        <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] uppercase font-bold text-default-400">{label}</p>
            <p className="text-sm font-semibold text-default-800">{value ?? "—"}</p>
        </div>
    );
}

export default function WhatsappInstancia() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [versionInput, setVersionInput] = useState("");

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/whatsapp-instancia");
            const json = await res.json();
            if (res.ok) {
                setData(json);
                setVersionInput(json.version || "");
            } else {
                Swal.fire("Error", json.error || "No autorizado", "error");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const handleAction = async (action) => {
        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/whatsapp-instancia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const json = await res.json();
            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title:
                        action === "restart"
                            ? "Instancia reiniciada"
                            : action === "stop"
                                ? "Instancia detenida"
                                : "Instancia iniciada",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                Swal.fire("Error", json.error || "No se pudo ejecutar la acción", "error");
            }
        } catch (e) {
            Swal.fire("Error", e.message, "error");
        } finally {
            setActionLoading(false);
            setTimeout(fetchStatus, 1200);
        }
    };

    const handleUpdateVersion = async () => {
        if (!/^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*$/.test(versionInput)) {
            Swal.fire("Aviso", "Formato inválido. Usa: 2,3000,1034001234", "warning");
            return;
        }
        const result = await Swal.fire({
            title: "¿Actualizar versión?",
            text: `Se escribirá ${versionInput.trim()} y se reiniciará la instancia.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#f59e0b",
            confirmButtonText: "Actualizar y reiniciar",
            cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return;

        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/whatsapp-instancia/version", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ version: versionInput }),
            });
            const json = await res.json();
            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title: "Versión actualizada",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                Swal.fire("Error", json.error || "No se pudo actualizar la versión", "error");
            }
        } catch (e) {
            Swal.fire("Error", e.message, "error");
        } finally {
            setActionLoading(false);
            setTimeout(fetchStatus, 1500);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Spinner size="lg" />
            </div>
        );
    }

    const statusInfo = statusMap[data?.status] || { label: data?.status || "Desconocido", color: "default" };

    return (
        <div className="space-y-4">
            <Card className="shadow-sm border border-gray-200">
                <CardBody className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FaWhatsapp className="text-green-600 text-2xl" />
                            <div>
                                <h3 className="font-bold text-lg">Instancia de WhatsApp</h3>
                                <p className="text-xs text-default-400">Proceso pm2: {data?.name || "whatsapp"}</p>
                            </div>
                        </div>
                        <Chip color={statusInfo.color} variant="flat">
                            {statusInfo.label}
                        </Chip>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Info label="PID" value={data?.pid ?? "—"} />
                        <Info label="Reinicios" value={data?.restarts ?? 0} />
                        <Info label="Versión actual" value={data?.version || "—"} />
                    </div>

                    <Divider />

                    <div className="flex flex-wrap gap-2">
                        <Button color="danger" size="sm" startContent={<FaStop />} isLoading={actionLoading} onPress={() => handleAction("stop")}>
                            Detener
                        </Button>
                        <Button color="success" size="sm" startContent={<FaPlay />} isLoading={actionLoading} onPress={() => handleAction("start")}>
                            Iniciar
                        </Button>
                        <Button color="primary" size="sm" startContent={<FaRedo />} isLoading={actionLoading} onPress={() => handleAction("restart")}>
                            Reiniciar
                        </Button>
                        <Button variant="light" size="sm" startContent={<FaSync />} onPress={fetchStatus}>
                            Actualizar estado
                        </Button>
                    </div>
                </CardBody>
            </Card>

            <Card className="shadow-sm border border-gray-200">
                <CardBody className="space-y-3">
                    <div>
                        <h3 className="font-bold">Actualizar versión de Baileys</h3>
                        <p className="text-xs text-default-400">
                            Formato: 2,3000,&lt;número&gt;. Al guardar se escribe el archivo y se reinicia la instancia.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                        <Input
                            label="Versión"
                            labelPlacement="outside"
                            placeholder="2,3000,1034001234"
                            value={versionInput}
                            onValueChange={setVersionInput}
                            className="sm:max-w-xs"
                        />
                        <Button color="warning" isLoading={actionLoading} onPress={handleUpdateVersion}>
                            Actualizar versión
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
