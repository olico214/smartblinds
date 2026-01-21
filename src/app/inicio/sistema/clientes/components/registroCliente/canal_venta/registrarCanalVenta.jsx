"use client";

import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, useDisclosure, Input,
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Tooltip, Divider
} from "@nextui-org/react";
import React, { useState, useEffect } from "react";

// import { PlusIcon } from "./PlusIcon"; // Un nuevo ícono para añadir (código abajo)
import { FaEdit } from "react-icons/fa";

export default function CanalVentaComponent() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    // Estados del componente
    const [canales, setCanales] = useState([]);
    const [currentItem, setCurrentItem] = useState(null);
    const [nombre, setNombre] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Función para obtener los datos de la API
    const fetchCanales = async () => {
        try {
            const res = await fetch('/api/canales');
            const data = await res.json();
            if (data.ok) {
                setCanales(data.data);
            }
        } catch (error) {
            console.error("Error al obtener los canales de venta:", error);
        }
    };

    // Cargar datos cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            fetchCanales();
        }
    }, [isOpen]);

    // Prepara el formulario para editar un canal existente
    const handleEditClick = (canal) => {
        setCurrentItem(canal);
        setNombre(canal.nombre);
    };

    // Prepara el formulario para crear un nuevo canal
    const handleNewClick = () => {
        setCurrentItem(null);
        setNombre("");
    };

    // Función para guardar (crear o actualizar)
    const handleSave = async () => {
        if (!nombre.trim()) return; // Evita guardar nombres vacíos

        setIsLoading(true);
        const url = '/api/canales';
        const method = currentItem ? 'PUT' : 'POST';
        const body = JSON.stringify(currentItem ? { id: currentItem.id, nombre } : { nombre });

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body,
            });

            if (!res.ok) throw new Error("Error al guardar el canal de venta");

            await fetchCanales(); // Refresca la tabla
            handleNewClick(); // Resetea el formulario al modo "nuevo"

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button onPress={onOpen} color="primary" variant="light" size="sm">Canales</Button>

            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="2xl"
                isDismissable={false}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Gestión de Canales de Venta
                            </ModalHeader>
                            <ModalBody>
                                <h3 className="font-semibold text-lg">{currentItem ? "Editando Canal" : "Nuevo Canal"}</h3>

                                {/* Formulario para Crear y Editar */}
                                <div className="flex items-center gap-2">
                                    <Input
                                        isRequired
                                        label="Nombre del Canal"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        onClear={() => handleNewClick()}
                                        isClearable
                                        autoFocus
                                    />
                                    <Button
                                        color="primary"
                                        isLoading={isLoading}
                                        onPress={handleSave}
                                    >
                                        {currentItem ? "Actualizar" : "Guardar"}
                                    </Button>
                                    {/* Muestra un botón "Nuevo" solo si estamos editando */}
                                    {currentItem && (
                                        <Button
                                            color="secondary"
                                            variant="ghost"
                                            onPress={handleNewClick}
                                        >
                                            Nuevo
                                        </Button>
                                    )}
                                </div>

                                <Divider className="my-4" />

                                {/* Tabla para mostrar los canales existentes */}
                                <h3 className="font-semibold text-lg mb-2">Canales Existentes</h3>
                                <Table
                                    aria-label="Tabla de canales de venta"
                                    className="max-h-[350px] overflow-auto"
                                >
                                    <TableHeader>
                                        <TableColumn>NOMBRE</TableColumn>
                                        <TableColumn>ACCIONES</TableColumn>
                                    </TableHeader>
                                    <TableBody items={canales} emptyContent={"No hay canales registrados."}>
                                        {(item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.nombre}</TableCell>
                                                <TableCell>
                                                    <Tooltip content="Editar canal">
                                                        <Button isIconOnly variant="light" size="sm" onPress={() => handleEditClick(item)}>
                                                            <FaEdit />
                                                        </Button>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cerrar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

// --- Íconos (puedes ponerlos en sus propios archivos) ---
