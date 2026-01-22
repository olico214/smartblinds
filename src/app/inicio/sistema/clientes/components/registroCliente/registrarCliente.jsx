"use client";
import React, { useState, useEffect } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Input, Select, SelectItem, Checkbox, Textarea, Divider,
    useDisclosure
} from "@nextui-org/react";
import { User, Phone, Mail, MapPin, Briefcase } from "lucide-react";

// Si tienes el componente para crear canales rápidos, descomenta la importación y su uso abajo
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

    // 1. Lógica para manejar si el modal se abre desde fuera (props) o desde dentro (hook)
    const { isOpen: isOpenInternal, onOpen: onOpenInternal, onOpenChange: onOpenChangeInternal } = useDisclosure();

    const isControlled = isOpenProp !== undefined;
    const isOpen = isControlled ? isOpenProp : isOpenInternal;
    const onOpenChange = isControlled ? onOpenChangeProp : onOpenChangeInternal;

    // 2. Cargar canales de venta al abrir
    useEffect(() => {
        if (isOpen) {
            fetch('/api/canales')
                .then(res => res.json())
                .then(d => {
                    if (d.ok) setCanalesVenta(d.data);
                })
                .catch(e => console.error("Error cargando canales", e));
        }
    }, [isOpen]);

    // 3. Cargar datos si es edición o limpiar si es nuevo
    useEffect(() => {
        if (isOpen) {
            if (clientToEdit) {
                // Limpiar prefijo 521 si existe para mostrarlo limpio en el input
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

        // Limpiar error específico al escribir
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null, general: null }));
        }
    };

    // 4. Validaciones
    const validateForm = () => {
        const newErrors = {};
        const { email, telefono, nombre } = clientData;
        const cleanPhone = telefono ? telefono.replace(/\D/g, "") : "";

        if (!nombre?.trim()) {
            newErrors.nombre = "El nombre es obligatorio.";
        }

        if (!email?.trim() && !cleanPhone) {
            const msg = "Debe ingresar al menos un teléfono o email.";
            newErrors.email = msg;
            newErrors.telefono = msg;
            newErrors.general = msg;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email?.trim() && !emailRegex.test(email)) {
            newErrors.email = "El formato del correo es inválido.";
        }

        // Si hay teléfono, forzamos 10 dígitos
        if (cleanPhone && cleanPhone.length !== 10) {
            newErrors.telefono = "El teléfono debe tener 10 dígitos.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (onCloseFn) => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            // Formatear teléfono para guardar (agregar 521)
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
                onCloseFn(); // Cerrar el modal
            } else {
                alert("Error: " + json.error);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al guardar cliente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Botón de apertura (solo se muestra si NO es controlado externamente) */}
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
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 border-b">
                                <h2 className="text-xl font-bold text-primary">
                                    {clientToEdit ? `Editar: ${clientToEdit.nombre}` : "Registrar Nuevo Cliente"}
                                </h2>
                            </ModalHeader>
                            <ModalBody className="py-6">
                                {/* SECCIÓN 1: DATOS GENERALES */}
                                <div className="flex items-center gap-2 mb-2 text-primary"><User size={18} /> Información</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Nombre Completo"
                                        name="nombre"
                                        value={clientData.nombre}
                                        onChange={handleChange}
                                        isRequired
                                        isInvalid={!!errors.nombre}
                                        errorMessage={errors.nombre}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-primary"><Phone size={18} /> Contacto</div>
                                        <div className="space-y-3">
                                            <Input
                                                label="Teléfono"
                                                name="telefono"
                                                value={clientData.telefono}
                                                onChange={handleChange}
                                                startContent={<span className="text-small text-default-400">+521</span>}
                                                isInvalid={!!errors.telefono}
                                                errorMessage={errors.telefono}
                                                description={!errors.telefono && "Ingresa los 10 dígitos"}
                                            />
                                            <Input
                                                label="Email"
                                                name="email"
                                                value={clientData.email}
                                                onChange={handleChange}
                                                startContent={<Mail size={16} />}
                                                isInvalid={!!errors.email}
                                                errorMessage={errors.email}
                                            />
                                            {errors.general && (
                                                <p className="text-tiny text-danger font-semibold mt-1">* {errors.general}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-primary"><Briefcase size={18} /> Origen</div>
                                        <div className="flex gap-2 items-center">
                                            <Select
                                                label="Canal de Venta"
                                                className="flex-grow"
                                                selectedKeys={clientData.selected_canal_venta ? [String(clientData.selected_canal_venta)] : []}
                                                onChange={(e) => handleChange({ target: { name: 'selected_canal_venta', value: e.target.value } })}
                                            >
                                                {canalesVenta.map((c) => (<SelectItem key={c.id}>{c.nombre}</SelectItem>))}
                                            </Select>
                                            {/* Si usas el componente de crear canal, descomenta esto: */}
                                            <CanalVentaComponent />
                                        </div>
                                        <Checkbox
                                            className="mt-4"
                                            isSelected={clientData.frecuente}
                                            onValueChange={(v) => setClientData(p => ({ ...p, frecuente: v }))}
                                        >
                                            Cliente Frecuente
                                        </Checkbox>
                                    </div>
                                </div>

                                <Divider className="my-4" />

                                {/* SECCIÓN 3: UBICACIÓN */}
                                <div className="flex items-center gap-2 mb-2 text-primary"><MapPin size={18} /> Ubicación</div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Textarea
                                        label="Domicilio"
                                        name="domicilio"
                                        value={clientData.domicilio}
                                        onChange={handleChange}
                                        className="md:col-span-4"
                                        minRows={2}
                                    />
                                    <Input label="C.P." name="cp" value={clientData.cp} onChange={handleChange} />
                                    <Input label="Estado" name="estado" value={clientData.estado} onChange={handleChange} />
                                    <Input label="Ciudad" name="ciudad" value={clientData.ciudad} onChange={handleChange} />
                                    <Input label="Colonia" name="colonia" value={clientData.colonia} onChange={handleChange} />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>Cancelar</Button>
                                <Button color="primary" isLoading={loading} onPress={() => handleSubmit(onClose)}>
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