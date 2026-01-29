"use client";
import React, { useState, useEffect } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Input, Select, SelectItem, Checkbox, Textarea, Divider,
    useDisclosure
} from "@nextui-org/react";
import { User, Phone, Mail, MapPin, Briefcase } from "lucide-react";

// Si tienes el componente para crear canales rápidos, descomenta la importación
import CanalVentaComponent from "./canal_venta/registrarCanalVenta";

const initialClientState = {
    nombre: '', telefono: '', email: '', domicilio: '',
    estado: '', ciudad: '', colonia: '', frecuente: false,
    selected_canal_venta: '', cp: '', tipo: ''
};

export default function ClienteModal({ clientToEdit, refreshTable, type = 'new', isOpenProp, onOpenChangeProp }) {
    const [clientData, setClientData] = useState(initialClientState);
    const [canalesVenta, setCanalesVenta] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // 1. Lógica de apertura interna/externa
    const { isOpen: isOpenInternal, onOpen: onOpenInternal, onOpenChange: onOpenChangeInternal } = useDisclosure();
    const isControlled = isOpenProp !== undefined;
    const isOpen = isControlled ? isOpenProp : isOpenInternal;
    const onOpenChange = isControlled ? onOpenChangeProp : onOpenChangeInternal;

    // 2. Cargar canales
    useEffect(() => {
        if (isOpen) {
            // Simulación de carga si no hay endpoint real en este ejemplo
            fetch('/api/canales')
                .then(res => res.json())
                .then(d => { if (d.ok) setCanalesVenta(d.data); })
                .catch(e => console.error("Error cargando canales", e));
        }
    }, [isOpen]);

    // 3. Cargar datos de edición
    useEffect(() => {
        if (isOpen) {
            if (clientToEdit) {
                const cleanPhone = clientToEdit.telefono?.startsWith('521')
                    ? clientToEdit.telefono.substring(3)
                    : clientToEdit.telefono;
                setClientData({ ...clientToEdit, telefono: cleanPhone });
            } else {
                setClientData(initialClientState);
            }
            setErrors({});
        }
    }, [clientToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setClientData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null, general: null }));
    };

    // 4. Validaciones
    const validateForm = () => {
        const newErrors = {};
        const { email, telefono, nombre } = clientData;
        const cleanPhone = telefono ? telefono.replace(/\D/g, "") : "";

        if (!nombre?.trim()) newErrors.nombre = "El nombre es obligatorio.";

        if (!email?.trim() && !cleanPhone) {
            const msg = "Debe ingresar al menos un teléfono o email.";
            newErrors.email = msg;
            newErrors.telefono = msg;
            newErrors.general = msg;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email?.trim() && !emailRegex.test(email)) newErrors.email = "Formato inválido.";
        if (cleanPhone && cleanPhone.length !== 10) newErrors.telefono = "Debe tener 10 dígitos.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (onCloseFn) => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const rawPhone = clientData.telefono.replace(/\D/g, "");
            const finalPhone = rawPhone.length === 10 ? `521${rawPhone}` : rawPhone;
            const payload = { ...clientData, telefono: finalPhone };
            const method = clientToEdit?.id ? 'PUT' : 'POST';

            const res = await fetch('/api/clientes', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();

            if (json.ok) {
                if (refreshTable) refreshTable();
                onCloseFn();
            } else {
                alert("Error: " + json.error);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {!isControlled && (
                type === 'new'
                    ? <Button onPress={onOpenInternal} color="primary" startContent={<User size={16} />}>Registrar Cliente</Button>
                    : <Button onPress={onOpenInternal} color="primary" variant="light">Editar</Button>
            )}

            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="4xl"
                scrollBehavior="inside"
                backdrop="blur"
                isDismissable={false}
                placement="top-center" /* Mejora la vista en móviles al no centrarlo verticalmente forzado */
                classNames={{
                    base: "mx-2 sm:mx-0" /* Margen lateral en móviles muy pequeños */
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 border-b px-4 md:px-6">
                                <h2 className="text-lg md:text-xl font-bold text-primary truncate">
                                    {clientToEdit ? `Editar: ${clientToEdit.nombre}` : "Registrar Nuevo Cliente"}
                                </h2>
                            </ModalHeader>

                            <ModalBody className="py-4 px-4 md:py-6 md:px-6">
                                {/* SECCIÓN 1: DATOS GENERALES */}
                                <div className="flex items-center gap-2 mb-1 text-primary font-medium">
                                    <User size={18} /> Información
                                </div>
                                {/* Cambio: Grid responsive (1 col en móvil, 2 en sm/md) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                    <Input
                                        label="Nombre Completo"
                                        name="nombre"
                                        value={clientData.nombre}
                                        onChange={handleChange}
                                        isRequired
                                        isInvalid={!!errors.nombre}
                                        errorMessage={errors.nombre}
                                        className="sm:col-span-1" // En móvil ocupa todo, en SM ocupa 1
                                    />
                                    <Select
                                        label="Tipo"
                                        selectedKeys={clientData.tipo ? [clientData.tipo] : []}
                                        onChange={(e) => handleChange({ target: { name: 'tipo', value: e.target.value } })}
                                    >
                                        <SelectItem key="Final">Final</SelectItem>
                                        <SelectItem key="Intermediario">Intermediario</SelectItem>
                                    </Select>
                                </div>

                                <Divider className="my-4" />

                                {/* SECCIÓN 2: CONTACTO Y ORIGEN */}
                                {/* Cambio: En móvil se apilan las secciones verticalmente, en md se ponen lado a lado */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Columna Contacto */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                                            <Phone size={18} /> Contacto
                                        </div>
                                        <div className="space-y-3">
                                            <Input
                                                label="Teléfono"
                                                name="telefono"
                                                // type="tel" ayuda al teclado numérico en móvil
                                                type="tel"
                                                value={clientData.telefono}
                                                onChange={handleChange}
                                                startContent={<span className="text-small text-default-400">+521</span>}
                                                isInvalid={!!errors.telefono}
                                                errorMessage={errors.telefono}
                                            />
                                            <Input
                                                label="Email"
                                                name="email"
                                                type="email"
                                                value={clientData.email}
                                                onChange={handleChange}
                                                startContent={<Mail size={16} />}
                                                isInvalid={!!errors.email}
                                                errorMessage={errors.email}
                                            />
                                            {errors.general && (
                                                <p className="text-tiny text-danger font-semibold mt-1 text-center md:text-left">
                                                    * {errors.general}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Columna Origen */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                                            <Briefcase size={18} /> Origen
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                            <Select
                                                label="Canal de Venta"
                                                className="w-full sm:flex-grow"
                                                selectedKeys={clientData.selected_canal_venta ? [String(clientData.selected_canal_venta)] : []}
                                                onChange={(e) => handleChange({ target: { name: 'selected_canal_venta', value: e.target.value } })}
                                            >
                                                {canalesVenta.map((c) => (<SelectItem key={c.id}>{c.nombre}</SelectItem>))}
                                            </Select>
                                            <CanalVentaComponent />
                                        </div>

                                        <div className="mt-4">
                                            <Checkbox
                                                isSelected={clientData.frecuente}
                                                onValueChange={(v) => setClientData(p => ({ ...p, frecuente: v }))}
                                            >
                                                Cliente Frecuente
                                            </Checkbox>
                                        </div>
                                    </div>
                                </div>

                                <Divider className="my-4" />

                                {/* SECCIÓN 3: UBICACIÓN */}
                                <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                                    <MapPin size={18} /> Ubicación
                                </div>
                                {/* Cambio: Grid muy adaptable: 1 col móvil, 2 cols tablet, 4 cols desktop */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                    <Textarea
                                        label="Domicilio"
                                        name="domicilio"
                                        value={clientData.domicilio}
                                        onChange={handleChange}
                                        className="col-span-1 sm:col-span-2 md:col-span-4" /* Ocupa todo el ancho en desktop */
                                        minRows={2}
                                    />
                                    {/* Estos inputs se acomodan de 1 en 1 (móvil), 2 en 2 (tablet) o todos en fila (desktop) */}
                                    <Input label="C.P." name="cp" inputMode="numeric" value={clientData.cp} onChange={handleChange} />
                                    <Input label="Estado" name="estado" value={clientData.estado} onChange={handleChange} />
                                    <Input label="Ciudad" name="ciudad" value={clientData.ciudad} onChange={handleChange} />
                                    <Input label="Colonia" name="colonia" value={clientData.colonia} onChange={handleChange} />
                                </div>
                            </ModalBody>

                            {/* Cambio: Footer con flex-col-reverse para que 'Guardar' quede arriba en móvil */}
                            <ModalFooter className="flex flex-col-reverse sm:flex-row gap-2 px-4 md:px-6 py-4">
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}
                                    className="w-full sm:w-auto"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    isLoading={loading}
                                    onPress={() => handleSubmit(onClose)}
                                    className="w-full sm:w-auto font-medium shadow-md"
                                >
                                    {clientToEdit ? "Guardar Cambios" : "Crear Cliente"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}