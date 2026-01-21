"use client";
import React, { useState, useEffect } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Input, Select, SelectItem, Checkbox, Textarea, Divider
} from "@nextui-org/react";
import { User, Phone, Mail, MapPin, Briefcase } from "lucide-react";
import CanalVentaComponent from "./canal_venta/registrarCanalVenta";

const initialClientState = {
    nombre: '', telefono: '', email: '', domicilio: '',
    estado: '', ciudad: '', colonia: '', frecuente: false,
    selected_canal_venta: '', cp: '', tipo: ''
};

export default function ClienteModal({ isOpen, onClose, onOpenChange, clientToEdit, refreshTable }) {
    const [clientData, setClientData] = useState(initialClientState);
    const [canalesVenta, setCanalesVenta] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({}); // Estado para errores

    // Cargar canales de venta al montar
    useEffect(() => {
        if (isOpen) {
            fetch('/api/canales').then(res => res.json()).then(d => {
                if (d.ok) setCanalesVenta(d.data);
            });
        }
    }, [isOpen]);

    // Detectar si es Edición o Creación
    useEffect(() => {
        if (clientToEdit) {
            const cleanPhone = clientToEdit.telefono?.startsWith('521')
                ? clientToEdit.telefono.substring(3)
                : clientToEdit.telefono;

            setClientData({ ...clientToEdit, telefono: cleanPhone });
        } else {
            setClientData(initialClientState);
        }
        setErrors({}); // Limpiar errores al abrir/cambiar modo
    }, [clientToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setClientData(prev => ({ ...prev, [name]: value }));

        // Limpiar el error del campo que se está escribiendo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null, general: null }));
        }
    };

    // --- FUNCIÓN DE VALIDACIÓN ---
    const validateForm = () => {
        const newErrors = {};
        const { email, telefono, nombre } = clientData;

        // Limpiamos el teléfono de caracteres no numéricos para validar longitud
        const cleanPhone = telefono.replace(/\D/g, "");

        // 1. Validación de Nombre
        if (!nombre.trim()) {
            newErrors.nombre = "El nombre es obligatorio.";
        }

        // 2. Validación: Al menos uno (Teléfono o Email)
        if (!email.trim() && !cleanPhone) {
            const msg = "Debe ingresar al menos un teléfono o email.";
            newErrors.email = msg;
            newErrors.telefono = msg;
            newErrors.general = msg;
        }

        // 3. Validación de formato de Email (si no está vacío)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.trim() && !emailRegex.test(email)) {
            newErrors.email = "El formato del correo es inválido.";
        }

        // 4. Validación de longitud de Teléfono (si no está vacío)
        // Como tu lógica posterior espera 10 dígitos para agregar el 521, forzamos los 10 dígitos.
        if (cleanPhone && cleanPhone.length !== 10) {
            newErrors.telefono = "El teléfono debe tener 10 dígitos.";
        }

        setErrors(newErrors);
        // Si el objeto newErrors está vacío, retorna true (válido)
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        // Ejecutar validación antes de enviar
        if (!validateForm()) {
            return; // Detiene la ejecución si hay errores
        }

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
                refreshTable();
                onClose();
            } else {
                alert("Error: " + json.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" scrollBehavior="inside" backdrop="blur">
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
                                <Select label="Tipo" selectedKeys={clientData.tipo ? [clientData.tipo] : []} onChange={(e) => handleChange({ target: { name: 'tipo', value: e.target.value } })}>
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
                                        {/* Mensaje general si faltan ambos */}
                                        {errors.general && (
                                            <p className="text-tiny text-danger font-semibold mt-1">* {errors.general}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-primary"><Briefcase size={18} /> Origen</div>

                                    <div className="flex ">
                                        <Select label="Canal de Venta" selectedKeys={clientData.selected_canal_venta ? [String(clientData.selected_canal_venta)] : []} onChange={(e) => handleChange({ target: { name: 'selected_canal_venta', value: e.target.value } })}>
                                            {canalesVenta.map((c) => (<SelectItem key={c.id}>{c.nombre}</SelectItem>))}
                                        </Select>
                                        <CanalVentaComponent />
                                    </div>
                                    <Checkbox className="mt-2" isSelected={clientData.frecuente} onValueChange={(v) => setClientData(p => ({ ...p, frecuente: v }))}>Cliente Frecuente</Checkbox>
                                </div>
                            </div>

                            <Divider className="my-4" />

                            {/* SECCIÓN 3: UBICACIÓN */}
                            <div className="flex items-center gap-2 mb-2 text-primary"><MapPin size={18} /> Ubicación</div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Textarea label="Domicilio" name="domicilio" value={clientData.domicilio} onChange={handleChange} className="md:col-span-4" />
                                <Input label="C.P." name="cp" value={clientData.cp} onChange={handleChange} />
                                <Input label="Estado" name="estado" value={clientData.estado} onChange={handleChange} />
                                <Input label="Ciudad" name="ciudad" value={clientData.ciudad} onChange={handleChange} />
                                <Input label="Colonia" name="colonia" value={clientData.colonia} onChange={handleChange} />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>Cancelar</Button>
                            <Button color="primary" isLoading={loading} onPress={handleSubmit}>
                                {clientToEdit ? "Guardar Cambios" : "Crear Cliente"}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}