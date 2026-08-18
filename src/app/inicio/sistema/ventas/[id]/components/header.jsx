"use client";

import React, { useState, useEffect } from "react";
import {
    Card, CardHeader, CardBody, Select, SelectItem, Button, Modal,
    ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
    Divider, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection
} from "@nextui-org/react";
import Swal from "sweetalert2";

const EditIcon = (props) => <svg {...props} aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
const MoreVerticalIcon = (props) => <svg {...props} aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>;

const InfoBlock = ({ label, value }) => (
    <div>
        <p className="text-xs text-default-500 uppercase font-semibold">{label}</p>
        <p className="text-sm text-default-800">{value}</p>
    </div>
);

export default function VentaHeader({ venta, catalogs, onUpdate, isAdmin }) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [editFormData, setEditFormData] = useState(venta);

    useEffect(() => {
        setEditFormData(venta);
    }, [venta]);

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateHeader = async () => {
        await fetch(`/api/ventas/${venta.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editFormData),
        });
        onOpenChange();
        onUpdate();
    };

    const handleCancelar = async () => {
        const result = await Swal.fire({
            title: '¿Cancelar Venta?',
            text: `Estás a punto de cancelar la venta #${venta.numero_venta || venta.id}. Esta acción revertirá la autorización.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, Cancelar Venta',
            cancelButtonText: 'No'
        });
        if (!result.isConfirmed) return;

        await fetch(`/api/ventas/${venta.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estatus: 'Cancelar' }),
        });
        onUpdate();
    };

    const canModify = isAdmin && venta.estatus !== 'Cancelado';

    return (
        <>
            <Card shadow="sm" className="border-1 border-default-200">
                <CardHeader className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-xl font-bold">
                            Venta {venta.numero_venta ? `#${venta.numero_venta}` : `#${venta.id}`}
                        </h1>
                        <p className="text-sm text-default-500">Resumen de la venta confirmada</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Chip color="success" size="sm" variant="solid">
                            VENTA CONFIRMADA
                        </Chip>
                        <Chip size="sm" variant="flat" color="success">
                            {venta.estatus}
                        </Chip>

                        {isAdmin && canModify && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button isIconOnly variant="light" size="sm">
                                        <MoreVerticalIcon className="w-5 h-5 text-default-600" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Acciones de la venta" onAction={(key) => key === 'edit' ? onOpen() : handleCancelar()}>
                                    <DropdownSection title="Acciones">
                                        <DropdownItem key="edit" startContent={<EditIcon className="w-4 h-4" />}>
                                            Editar Encabezado
                                        </DropdownItem>
                                    </DropdownSection>
                                    <DropdownSection title="Cambiar Estatus">
                                        <DropdownItem key="Cancelar" className="text-danger-600">
                                            Cancelar Venta
                                        </DropdownItem>
                                    </DropdownSection>
                                </DropdownMenu>
                            </Dropdown>
                        )}
                    </div>
                </CardHeader>
                <Divider />
                <CardBody>
                    {/* GUID y Número de Venta */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                        {venta.numero_venta && (
                            <InfoBlock label="Número de Venta" value={venta.numero_venta} />
                        )}
                        {venta.guid && (
                            <div className="col-span-1">
                                <p className="text-xs text-default-500 uppercase font-semibold">GUID</p>
                                <p className="text-xs text-default-400 font-mono truncate">{venta.guid}</p>
                            </div>
                        )}
                        <InfoBlock label="Folio Cotización Original" value={`#${venta.id}`} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
                        <InfoBlock label="Cliente" value={venta.cliente_nombre || 'N/A'} />
                        <InfoBlock label="Vendedor" value={venta.usuario_nombre || 'N/A'} />
                        <InfoBlock label="Agente" value={venta.nombre_agente || 'N/A'} />
                        <InfoBlock label="Método de Envío" value={venta.envio_descripcion || 'N/A'} />
                        <InfoBlock label="Nombre Proyecto" value={venta.nombreProyecto || ''} />
                        <InfoBlock label="Tipo Proyecto" value={venta.tipo_proyecto_nombre || ''} />
                        <InfoBlock label="Línea Cotizada" value={venta.linea_cotizada || ''} />

                        {isAdmin &&
                            <>
                                <InfoBlock label="Comisión Vendedor" value={`${venta.comision_vendedor || 0}%`} />
                                <InfoBlock label="Comisión Agente" value={`${venta.comision_agente || 0}%`} />
                                <InfoBlock label="Costo de Envío" value={`$${Number(venta.envio_precio || 0).toFixed(2)}`} />
                                <InfoBlock label="Protección Telas" value={`${venta.proteccion || 0}%`} />
                                <InfoBlock label="Precio Normal" value={`$${Number(venta.precioNormal || 0).toFixed(2)}`} />
                                <InfoBlock label="Precio Real" value={`$${Number(venta.precioReal || 0).toFixed(2)}`} />
                                <InfoBlock label="IVA" value={`$${Number(venta.iva || 0).toFixed(2)}`} />
                            </>
                        }
                    </div>

                    {venta.cliente_telefono && (
                        <Divider className="my-4" />
                    )}
                    {venta.cliente_telefono && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                            <InfoBlock label="Teléfono Cliente" value={venta.cliente_telefono} />
                            <InfoBlock label="Email Cliente" value={venta.cliente_email || 'N/A'} />
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Modal para editar encabezado */}
            {isAdmin && (
                <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>Editar Encabezado de la Venta</ModalHeader>
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
            )}
        </>
    );
}
