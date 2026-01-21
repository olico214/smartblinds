"use client";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Button,
    useDisclosure,
    Listbox,
    ListboxItem,
    Chip
} from "@nextui-org/react";
import { FaEnvelope, FaWhatsapp, FaFilePdf, FaArrowLeft, FaMagic } from "react-icons/fa";
import { useEffect, useState } from "react";
import { generatePDF } from "./generatepdf";
import MacroSelector from "./MacroSelector";
import Swal from "sweetalert2";

export default function DrawerOptionsComponent({ id, urlinterna }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [data, setData] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [macros, setMacros] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState("menu"); // menu | templates | macros
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [email, setEmail] = useState(false)
    const [whatsapp, setWhatsapp] = useState(false)

    // 1. Carga de datos iniciales
    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/cotizacion/${id}/generate`);
                const result = await response.json();
                const { cotizacion } = result;
                cotizacion.cliente_telefono ? setWhatsapp(true) : setWhatsapp(false)
                cotizacion.cliente_email ? setEmail(true) : setEmail(false)
                setData(result);
            } catch (error) { console.error(error); }
        };

        const fetchConfig = async () => {
            try {
                const [resT, resM] = await Promise.all([
                    fetch("/api/admin/whatsapp"),
                    fetch("/api/admin/macros")
                ]);
                const jsonT = await resT.json();
                const jsonM = await resM.json();
                if (Array.isArray(jsonT)) setTemplates(jsonT.filter(t => t.visible));
                if (Array.isArray(jsonM)) setMacros(jsonM);
            } catch (e) { console.error(e); }
        };

        fetchData();
        fetchConfig();
    }, [id]);

    const processMessage = (templateContent) => {
        if (!data || !templateContent) return "";
        const { cotizacion } = data;
        let text = templateContent;
        const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        text = text.replace(/{{nombre}}/g, cotizacion.cliente_nombre || "Cliente");
        text = text.replace(/{{descuento}}/g, cotizacion.descuento || "0");
        text = text.replace(/{{total}}/g, formatMoney(cotizacion.precioNormal));
        text = text.replace(/{{final}}/g, formatMoney(cotizacion.precioReal));
        return text;
    };

    // FUNCIÓN CLAVE: Ejecuta la Macro paso a paso
    const executeMacro = async (macroId) => {
        if (!data) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/macros?sequence_id=${macroId}`);
            const steps = await res.json();



            for (const step of steps) {
                if (!step.active) continue;

                let payload = {};
                if (step.type === "image") {
                    payload = {
                        number: data.cotizacion.cliente_telefono,
                        message: step.content,
                        urlMedia: step.type === "image" ? step.media_url[0] : null,
                    };
                } else {
                    payload = {
                        number: data.cotizacion.cliente_telefono,
                        message: step.content,
                    };
                }
                if (step.delay_seconds > 0) {
                    await new Promise(r => setTimeout(r, step.delay_seconds * 1000));
                }
                await fetch(`${urlinterna}/v1/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });


            }

            Swal.fire({
                icon: "success",
                title: "Secuencia enviada",
                timer: 1500,
                showConfirmButton: false,
            });

            onOpenChange(false);
            setView("menu");

        } catch (error) {
            Swal.fire("Error", "No se pudo ejecutar la macro", "error");
        } finally {
            setLoading(false);
        }
    };


    const handleSend = async (templateItem) => {
        if (!data) return;
        setLoading(true);

        try {
            const finalMessage = templateItem.type === 'template'
                ? processMessage(templateItem.content)
                : `Cotización: ${templateItem.name}`;
            const total = parseFloat(data.cotizacion.precioReal);
            const fullname = `MXVT1${data.cotizacion.id} ${data.cotizacion.cliente_nombre} ${total}`
            const pdfBlob = generatePDF(data, 'blob');
            const formData = new FormData();
            formData.append("pdf", pdfBlob, `cotizacion_${id}.pdf`);
            formData.append("type", selectedChannel);
            formData.append("id", id);
            formData.append("message", finalMessage);
            formData.append("phone", data.cotizacion.cliente_telefono);
            formData.append("email", data.cotizacion.cliente_email);
            formData.append("fullname", fullname);

            const res = await fetch("/api/send-document", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Error en envío");

            setLoading(false);

            if (selectedChannel === 'whatsapp') {
                const { isConfirmed } = await Swal.fire({
                    title: '¡PDF Enviado!',
                    text: "¿Deseas enviar una macro multimedia de seguimiento?",
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, ver macros',
                    cancelButtonText: 'No, finalizar',
                    confirmButtonColor: '#25D366'
                });

                if (isConfirmed) {
                    setView("macros");
                    return;
                }
            } else {
                Swal.fire("¡Enviado!", "Correo enviado con éxito", "success");
            }

            setView("menu");
        } catch (error) {
            setLoading(false);
            Swal.fire("Error", "No se pudo realizar el envío", "error");
        }
    };

    return (
        <>
            <div className="fixed bottom-4 right-4 z-50">
                <Button onPress={onOpen} color="primary" size="lg" className="shadow-2xl font-bold">Opciones de Envío</Button>
            </div>

            <Drawer isOpen={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) setView("menu"); }} size="sm">
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <DrawerHeader className="border-b bg-gray-50">
                                <div className="flex items-center gap-2">
                                    {view !== "menu" && (
                                        <Button isIconOnly variant="light" size="sm" onPress={() => setView("menu")}><FaArrowLeft /></Button>
                                    )}
                                    <span className="font-bold">{view === "menu" ? "Canal de Envío" : view === "templates" ? "Seleccionar Plantilla" : "Macros Disponibles"}</span>
                                </div>
                            </DrawerHeader>

                            <DrawerBody className="p-4 relative">
                                {view === "menu" && (
                                    <div className="flex flex-col gap-3">
                                        {email ?
                                            <Button className="bg-blue-600 text-white" size="lg" startContent={<FaEnvelope />} onPress={() => { setSelectedChannel('email'); setView('templates'); }}>Enviar por Email {data.cotizacion.cliente_email}</Button>

                                            :
                                            null}
                                        {whatsapp ?
                                            <Button className="bg-green-600 text-white" size="lg" startContent={<FaWhatsapp />} onPress={() => { setSelectedChannel('whatsapp'); setView('templates'); }}>Enviar por WhatsApp {data.cotizacion.cliente_telefono}</Button>
                                            :
                                            null
                                        }
                                        <Button color="secondary" variant="flat" onPress={() => generatePDF(data, 'download')} startContent={<FaFilePdf />}>Descargar PDF</Button>
                                    </div>
                                )}

                                {view === "templates" && (
                                    <Listbox onAction={(key) => handleSend(templates.find(t => t.id == key))}>
                                        {templates.map(t => (
                                            <ListboxItem key={t.id} textValue={t.name} className="border-b py-3 last:border-0">
                                                <div className="flex items-center gap-2 font-medium"><FaMagic className="text-purple-500" /> {t.name}</div>
                                            </ListboxItem>
                                        ))}
                                    </Listbox>
                                )}

                                {view === "macros" && (
                                    <MacroSelector macros={macros} onSelect={executeMacro} loading={loading} />
                                )}

                                {loading && (
                                    <div className="absolute inset-0 bg-white/70 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                        <p className="text-xs font-bold mt-2 text-primary">Procesando...</p>
                                    </div>
                                )}
                            </DrawerBody>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    );
}