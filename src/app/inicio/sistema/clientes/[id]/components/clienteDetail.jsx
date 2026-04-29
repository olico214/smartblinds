"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card, CardBody, CardHeader,
    Chip, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Tooltip, Divider, Spinner
} from "@nextui-org/react";
import {
    User, Mail, Phone, MapPin, Building2,
    FileText, CheckCircle, XCircle, DollarSign,
    BarChart3, PlusCircle, ArrowLeft, Eye, ExternalLink
} from "lucide-react";
import Link from "next/link";
import CotizacionForm from "../../../crear-cotizacion/components/registerCotizacion";

const statusColorMap = {
    Nuevo: "primary",
    'En proceso': "warning",
    Autorizado: "success",
    Cancelado: "danger",
    Finalizado: "secondary",
};

export default function ClienteDetailComponent({ cliente, cotizaciones, stats, userId }) {
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-MX', options);
    };

    const formatCurrency = (amount) => {
        return `$${parseFloat(amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    return (
        <div className="p-4 sm:p-8 space-y-6">
            {/* Botón Volver */}
            <Button
                variant="light"
                startContent={<ArrowLeft size={18} />}
                onPress={() => router.push('/inicio/sistema/clientes')}
                className="mb-2"
            >
                Volver a Clientes
            </Button>

            {/* Header - Información del Cliente */}
            <Card className="bg-white shadow-sm border border-gray-200">
                <CardBody className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <User className="text-blue-600" size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{cliente.nombre}</h1>
                                <p className="text-sm text-gray-500">
                                    Cliente #{cliente.id}
                                    {cliente.canal_venta_nombre && (
                                        <span className="ml-2">· {cliente.canal_venta_nombre}</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <Button
                            color="primary"
                            startContent={<PlusCircle size={18} />}
                            onPress={handleOpenCreateModal}
                            className="font-medium shadow-sm"
                        >
                            Nueva Cotización
                        </Button>
                    </div>

                    <Divider className="my-4" />

                    {/* Datos de contacto */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {cliente.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail size={16} className="text-gray-400" />
                                <span>{cliente.email}</span>
                            </div>
                        )}
                        {cliente.telefono && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={16} className="text-gray-400" />
                                <span>{cliente.telefono}</span>
                            </div>
                        )}
                        {cliente.direccion && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin size={16} className="text-gray-400" />
                                <span className="truncate">{cliente.direccion}</span>
                            </div>
                        )}
                        {cliente.selected_canal_venta && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Building2 size={16} className="text-gray-400" />
                                <span>Canal: {cliente.canal_venta_nombre || cliente.selected_canal_venta}</span>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-white shadow-sm border border-gray-200">
                    <CardBody className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Cotizaciones</p>
                                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalCotizaciones}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-full">
                                <FileText className="text-blue-500" size={24} />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-white shadow-sm border border-gray-200">
                    <CardBody className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Cotizaciones Aprobadas</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalAprobadas}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-full">
                                <CheckCircle className="text-green-500" size={24} />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-white shadow-sm border border-gray-200">
                    <CardBody className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total en Ventas</p>
                                <p className="text-3xl font-bold text-gray-800 mt-1">
                                    {formatCurrency(stats.totalVentas)}
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-full">
                                <DollarSign className="text-yellow-500" size={24} />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Tabla de Cotizaciones */}
            <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="px-6 pt-5 pb-0">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={20} className="text-gray-500" />
                            <h2 className="text-lg font-bold text-gray-800">Historial de Cotizaciones</h2>
                        </div>
                        <Chip size="sm" variant="flat" color="primary">
                            {cotizaciones.length} registro{cotizaciones.length !== 1 ? 's' : ''}
                        </Chip>
                    </div>
                </CardHeader>
                <CardBody className="p-6">
                    {cotizaciones.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">Este cliente no tiene cotizaciones registradas.</p>
                            <Button
                                color="primary"
                                variant="light"
                                startContent={<PlusCircle size={16} />}
                                onPress={handleOpenCreateModal}
                                className="mt-2"
                            >
                                Crear primera cotización
                            </Button>
                        </div>
                    ) : (
                        <Table aria-label="Cotizaciones del cliente" removeWrapper className="overflow-x-auto">
                            <TableHeader>
                                <TableColumn>FOLIO</TableColumn>
                                <TableColumn>FECHA</TableColumn>
                                <TableColumn>PROYECTO</TableColumn>
                                <TableColumn>LÍNEA</TableColumn>
                                <TableColumn>VENDEDOR</TableColumn>
                                <TableColumn>ESTATUS</TableColumn>
                                <TableColumn>AUTORIZADO</TableColumn>
                                <TableColumn>MONTO</TableColumn>
                                <TableColumn>ACCIONES</TableColumn>
                            </TableHeader>
                            <TableBody items={cotizaciones}>
                                {(item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <span className="font-medium text-gray-700">#{item.id}</span>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {formatDate(item.createdDate)}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-700">
                                            {item.nombreProyecto || (
                                                <span className="text-gray-400 italic">Sin proyecto</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-700">
                                            {item.linea_cotizada || "-"}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {item.usuario_nombre || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                color={statusColorMap[item.estatus] || "default"}
                                                size="sm"
                                                variant="flat"
                                            >
                                                {item.estatus || "Nuevo"}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            {item.autorizado == 1 ? (
                                                <Chip
                                                    color="success"
                                                    size="sm"
                                                    variant="solid"
                                                    startContent={<CheckCircle size={12} />}
                                                >
                                                    Autorizado
                                                </Chip>
                                            ) : (
                                                <Chip color="default" size="sm" variant="flat">
                                                    Pendiente
                                                </Chip>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-gray-700">
                                            {formatCurrency(item.precioReal)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Tooltip content="Ver cotización">
                                                    <Button
                                                        as={Link}
                                                        prefetch={false}
                                                        href={`/inicio/sistema/${item.id}`}
                                                        variant="light"
                                                        isIconOnly
                                                        size="sm"
                                                    >
                                                        <Eye size={16} />
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip content="Editar cotización">
                                                    <Button
                                                        as={Link}
                                                        prefetch={false}
                                                        href={`/inicio/sistema/crear-cotizacion/${item.id}`}
                                                        variant="light"
                                                        isIconOnly
                                                        size="sm"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </Button>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            {/* Modal de Nueva Cotización */}
            {isCreateModalOpen && (
                <CotizacionForm
                    isOpen={isCreateModalOpen}
                    onClose={handleCloseCreateModal}
                    user={userId}
                    preselectedClientId={cliente.id}
                />
            )}
        </div>
    );
}
