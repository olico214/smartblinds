"use client";

import React, { useState, useEffect } from "react";
import {
    Card, CardHeader, CardBody, Select, SelectItem, Button, Modal,
    ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
    Divider, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection
} from "@nextui-org/react";
import Swal from "sweetalert2";

// --- Iconos ---
const EditIcon = (props) => <svg {...props} aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
const MoreVerticalIcon = (props) => <svg {...props} aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>;

// --- Componente reutilizable para mostrar información ---
const InfoBlock = ({ label, value }) => (
    <div>
        <p className="text-xs text-default-500 uppercase font-semibold">{label}</p>
        <p className="text-sm text-default-800">{value}</p>
    </div>
);

export default function CotizacionHeader({ cotizacion, catalogs, onUpdate, isAdmin }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [editFormData, setEditFormData] = useState(cotizacion);

    useEffect(() => {
        setEditFormData(cotizacion);
    }, [cotizacion]);

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateHeader = async () => {
        await fetch(`/api/cotizacion/${cotizacion.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editFormData),
        });
        onOpenChange();
        onUpdate();
    };

    const handleStatusChange = async (newStatus) => {
        if (!newStatus || newStatus === cotizacion.estatus) return;

        if (newStatus === 'Autorizar') {
            const result = await Swal.fire({
                title: '¿Autorizar Cotización?',
                text: `Estás a punto de autorizar la cotización #${cotizacion.id} para ${cotizacion.cliente_nombre}. Una vez autorizada, no se podrán modificar los productos.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, Autorizar',
                cancelButtonText: 'Cancelar'
            });
            if (!result.isConfirmed) return;
        }

        const updatedCotizacion = { ...cotizacion, estatus: newStatus };
        await fetch(`/api/cotizacion/${cotizacion.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCotizacion),
        });
        onUpdate();
    };

    const canModify = cotizacion.estatus !== 'Autorizado' && cotizacion.estatus !== 'Cancelado' && cotizacion.autorizado !== 1;

    const estatuses = cotizacion.estatus === 'Finalizado' ? ["Autorizar", "Cancelar"] : ["Cancelar"];
    const statusColorMap = {
        Cancelar: "danger",
        Autorizar: "success",
    };

    return (
        <>
            <Card shadow="sm" className="border-1 border-default-200">
                <CardHeader className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-xl font-bold">Cotización #{cotizacion.id}</h1>
                        <p className="text-sm text-default-500">Resumen del encabezado</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {cotizacion.autorizado == 1 && (
                            <Chip color="success" size="sm" variant="solid">
                                ✓ AUTORIZADO
                            </Chip>
                        )}
                        <Chip
                            color={statusColorMap[cotizacion.estatus]}
                            size="sm"
                            variant="flat"
                        >
                            {cotizacion.estatus}
                        </Chip>

                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly variant="light" size="sm" isDisabled={!canModify}>
                                    <MoreVerticalIcon className="w-5 h-5 text-default-600" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="Acciones de la cotización"
                                onAction={(key) => key === 'edit' ? onOpen() : handleStatusChange(key)}
                                disabledKeys={!canModify ? [] : [""]} // Habilita todas las acciones si se puede modificar
                            >
                                <DropdownSection title="Acciones">
                                    <DropdownItem key="edit" startContent={<EditIcon className="w-4 h-4" />}>
                                        Editar Encabezado
                                    </DropdownItem>
                                </DropdownSection>
                                <DropdownSection title="Cambiar Estatus">
                                    {estatuses.map((status) => (
                                        <DropdownItem key={status} className={status === 'Autorizar' ? 'text-success-600 font-bold' : 'text-danger-600'}>
                                            {status === 'Autorizar' ? '✓ Autorizar Cotización' : status}
                                        </DropdownItem>
                                    ))}
                                </DropdownSection>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
                        <InfoBlock label="Cliente" value={cotizacion.cliente_nombre || 'N/A'} />
                        <InfoBlock label="Vendedor" value={cotizacion.usuario_nombre || 'N/A'} />
                        <InfoBlock label="Agente" value={cotizacion.nombre_agente || 'N/A'} />
                        <InfoBlock label="Método de Envío" value={cotizacion.envio_descripcion || 'N/A'} />
                        <InfoBlock label="Nombre Proyecto" value={cotizacion.nombreProyecto || ''} />
                        <InfoBlock label="Linea Cotizada" value={cotizacion.linea_cotizada || ''} />

                        {isAdmin ?
                            <>
                                <InfoBlock label="Comisión Vendedor" value={`${cotizacion.comision_vendedor || 0}%`} />
                                <InfoBlock label="Comisión Agente" value={`${cotizacion.comision_agente || 0}%`} />
                                <InfoBlock label="Costo de Envío" value={`$${Number(cotizacion.envio_precio || 0).toFixed(2)}`} />
                            </>
                            :
                            null

                        }
                    </div>
                </CardBody>
            </Card>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Editar Encabezado de la Cotización</ModalHeader>
                            <ModalBody>
                                {editFormData && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select name="idCliente" label="Cliente" items={catalogs.clientes} selectedKeys={[String(editFormData.idCliente)]} onChange={handleEditFormChange} isRequired>
                                            {(item) => <SelectItem key={item.id}>{item.nombre}</SelectItem>}
                                        </Select>
                                        <Select name="idUser" label="Vendedor" items={catalogs.usuarios} selectedKeys={[String(editFormData.idUser)]} onChange={handleEditFormChange} isRequired>
                                            {(item) => <SelectItem key={item.id}>{item.fullname}</SelectItem>}
                                        </Select>
                                        <Select name="idAgente" label="Agente" items={catalogs.usuarios} selectedKeys={[String(editFormData.idAgente)]} onChange={handleEditFormChange} isRequired>
                                            {(item) => <SelectItem key={item.id}>{item.fullname}</SelectItem>}
                                        </Select>
                                        <Select name="idTipoproyecto" label="Tipo de Proyecto" items={catalogs.tiposProyecto} selectedKeys={[String(editFormData.idTipoproyecto)]} onChange={handleEditFormChange} isRequired>
                                            {(item) => <SelectItem key={item.id}>{item.nombre}</SelectItem>}
                                        </Select>
                                        <Select name="id_envio" label="Método de Envío" items={catalogs.envios} selectedKeys={[String(editFormData.id_envio)]} onChange={handleEditFormChange}>
                                            {(item) => <SelectItem key={item.id}>{item.descripcion}</SelectItem>}
                                        </Select>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>Cancelar</Button>
                                <Button color="primary" onPress={handleUpdateHeader}>Guardar Cambios</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}