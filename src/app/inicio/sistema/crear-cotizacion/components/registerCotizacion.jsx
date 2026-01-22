"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Select, SelectItem, Spinner,
    Autocomplete,
    AutocompleteItem,
    Input,
    Chip,
    Card,
    CardBody,
    useDisclosure // <--- IMPORTANTE: Importamos esto
} from "@nextui-org/react";
import {
    FaQuestion,
    FaUserPlus,
    FaShippingFast,
    FaTag,
    FaProjectDiagram,
    FaUserTie,
    FaIndustry
} from "react-icons/fa";
import { IoIosCreate } from "react-icons/io";
import Swal from "sweetalert2";
// Asegúrate de que la ruta sea correcta a tu componente refactorizado
import ClienteComponent from "../../clientes/components/registroCliente/registrarCliente";
import { PlusCircle } from "lucide-react";

const initialFormState = {
    idCliente: "",
    idUser: "",
    idAgente: "",
    idTipoproyecto: "",
    id_envio: "",
    nombreProyecto: "",
    lineaCotizada: ""
};

const lineas = [
    { key: "Presianas Premium", value: "Presianas Premium", color: "primary" },
    { key: "Persianas Automaticas", value: "Persianas Automaticas", color: "secondary" },
    { key: "Motores", value: "Motores", color: "success" },
    { key: "Reparacion", value: "Reparacion", color: "warning" },
    { key: "Persianas Anticiclonicas", value: "Persianas Anticiclonicas", color: "danger" },
    { key: "Persianas Europeas", value: "Persianas Europeas", color: "primary" },
    { key: "Toldo Vertical", value: "Toldo Vertical", color: "secondary" },
    { key: "BR Presianas", value: "BR Presianas", color: "success" },
    { key: "BR Insumos Persianas", value: "BR Insumos Persianas", color: "warning" },
    { key: "BR Otros", value: "BR Otros", color: "danger" },
    { key: "Cortinas Premium", value: "Cortinas Premium", color: "primary" }
];

export default function CotizacionForm({ isOpen, onClose, user }) {
    const router = useRouter();
    const [formData, setFormData] = useState(initialFormState);
    const [catalogs, setCatalogs] = useState({ clientes: [], usuarios: [], tiposProyecto: [], envios: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [isCatalogsLoading, setIsCatalogsLoading] = useState(true);

    // --- NUEVO: Control para el Modal de Crear Cliente ---
    // Esto permite abrir el modal "encima" de este modal
    const {
        isOpen: isClientModalOpen,
        onOpen: onClientModalOpen,
        onOpenChange: onClientModalOpenChange
    } = useDisclosure();

    useEffect(() => {
        if (isOpen) {
            fetchCatalogs();
        }
    }, [isOpen]);

    const fetchCatalogs = async () => {
        // No ponemos loading true aquí para evitar parpadeos si solo refrescamos la lista
        // solo lo usamos la primera vez o si necesitamos bloquear UI
        if (catalogs.clientes.length === 0) setIsCatalogsLoading(true);

        try {
            const res = await fetch('/api/initial-data?user=' + user);
            const data = await res.json();
            if (data.ok) setCatalogs(data.data);
        } catch (error) {
            console.error("Error al cargar catálogos", error);
        } finally {
            setIsCatalogsLoading(false);
        }
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        Swal.fire({
            title: 'Crear Nueva Cotización',
            text: "¿Confirmas que los datos ingresados son correctos?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, crear ahora',
            cancelButtonText: 'Revisar datos',
            background: '#1f2937',
            color: '#f9fafb',
            customClass: {
                confirmButton: 'rounded-lg',
                cancelButton: 'rounded-lg'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                setIsLoading(true);
                try {
                    const res = await fetch('/api/listado_ov', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            "Authorization": `Bearer ${user}`
                        },
                        body: JSON.stringify(formData),
                    });

                    const data = await res.json();
                    if (!data.ok) {
                        throw new Error(data.error || 'Ocurrió un error en el servidor.');
                    }

                    await Swal.fire({
                        title: '✅ ¡Cotización Creada!',
                        text: 'Redirigiendo a la configuración de productos...',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        background: '#1f2937',
                        color: '#f9fafb'
                    });

                    router.push(`./crear-cotizacion/${data.id}`);

                } catch (error) {
                    console.error("Error al crear la cotización:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.message || 'No se pudo crear la cotización.',
                        background: '#1f2937',
                        color: '#f9fafb',
                        confirmButtonColor: '#ef4444'
                    });
                } finally {
                    setIsLoading(false);
                }
            }
        });
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onOpenChange={onClose}
                size="5xl"
                placement="center"
                isDismissable={false}
                className="bg-gradient-to-br from-gray-900 to-gray-950 "
                backdrop="blur"
            >
                <ModalContent>
                    {(onCloseCallback) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 border-b border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <IoIosCreate className="text-xl text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Nueva Cotización</h2>
                                        <p className="text-sm text-gray-400">Complete todos los campos requeridos</p>
                                    </div>
                                </div>
                            </ModalHeader>

                            <ModalBody className="py-6 overflow-auto sm:max-h-[380px] lg:max-h-[720px]">
                                {isCatalogsLoading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className="text-center">
                                            <Spinner size="lg" color="primary" className="mb-4" />
                                            <p className="text-gray-400">Cargando datos del sistema...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Sección 1: Información Principal */}
                                        <Card className="bg-gray-800/50 border border-gray-700 text-white">
                                            <CardBody className="p-5">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Cliente */}
                                                    <div className="space-y-2">
                                                        <label className="flex items-center gap-2 text-sm font-medium ">
                                                            <FaUserTie className="text-blue-400" />
                                                            Cliente *
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <Autocomplete
                                                                name="idCliente"
                                                                placeholder="Seleccionar cliente"
                                                                selectedKey={formData.idCliente}
                                                                // Cambiamos a 'items' para asegurar reactividad al crear uno nuevo
                                                                items={catalogs.clientes}
                                                                onSelectionChange={(e) => {
                                                                    setFormData(prev => ({ ...prev, ["idCliente"]: e }));
                                                                }}
                                                                className="flex-grow"
                                                                variant="bordered"
                                                                classNames={{
                                                                    base: "bg-gray-900/50",
                                                                    listbox: "bg-gray-900",
                                                                    popoverContent: "bg-gray-900"
                                                                }}
                                                                isRequired
                                                            >
                                                                {(cliente) => (
                                                                    <AutocompleteItem
                                                                        key={cliente.id}
                                                                        value={cliente.nombre}
                                                                        className="text-gray-300 hover:bg-gray-800"
                                                                    >
                                                                        {cliente.nombre}
                                                                    </AutocompleteItem>
                                                                )}
                                                            </Autocomplete>

                                                            {/* BOTÓN PERSONALIZADO PARA ABRIR MODAL
                                                                Aquí usamos el estilo que tenías, pero controlamos la apertura manualmente.
                                                            */}
                                                            <Button
                                                                onPress={onClientModalOpen}
                                                                variant="bordered"
                                                                isIconOnly
                                                                className="bg-gray-900/50 border-gray-700 text-white"
                                                                title="Registrar nuevo cliente"
                                                            >
                                                                <FaUserPlus size={18} />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Línea Cotizada */}
                                                    <div className="space-y-2">
                                                        <label className="flex items-center gap-2 text-sm font-medium text-white">
                                                            <FaTag className="text-green-400" />
                                                            Línea Cotizada *
                                                        </label>
                                                        <Select
                                                            name="lineaCotizada"
                                                            placeholder="Seleccionar línea"
                                                            items={lineas}
                                                            onChange={handleSelectChange}
                                                            color="default"
                                                            isRequired
                                                        >
                                                            {(linea) => (
                                                                <SelectItem
                                                                    key={linea.key}
                                                                    textValue={linea.key}
                                                                    className="text-gray-300"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Chip
                                                                            size="sm"
                                                                            color={linea.color}
                                                                            variant="flat"
                                                                        >
                                                                            {linea.key}
                                                                        </Chip>
                                                                    </div>
                                                                </SelectItem>
                                                            )}
                                                        </Select>
                                                    </div>

                                                    {/* Tipo de Proyecto */}
                                                    <div className="space-y-2">
                                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                                            <FaProjectDiagram className="text-purple-400" />
                                                            Tipo de Proyecto *
                                                        </label>
                                                        <Select
                                                            name="idTipoproyecto"
                                                            placeholder="Seleccionar tipo"
                                                            items={catalogs.tiposProyecto}
                                                            onChange={handleSelectChange}
                                                            color="default"
                                                            isRequired
                                                        >
                                                            {(tipo) => (
                                                                <SelectItem key={tipo.id} className="text-gray-300">
                                                                    {tipo.nombre}
                                                                </SelectItem>
                                                            )}
                                                        </Select>
                                                    </div>

                                                    {/* Nombre del Proyecto */}
                                                    <div className="space-y-2">
                                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                                            <FaIndustry className="text-yellow-400" />
                                                            Nombre del Proyecto
                                                            <span className="text-xs text-gray-500">(opcional)</span>
                                                        </label>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="Ej: Proyecto Edificio Central"
                                                                name="nombreProyecto"
                                                                value={formData.nombreProyecto}
                                                                onChange={(e) => {
                                                                    setFormData(prev => ({ ...prev, ["nombreProyecto"]: e.target.value }));
                                                                }}
                                                                variant="bordered"
                                                                className="bg-gray-900/50"
                                                                endContent={
                                                                    <div className="flex items-center">
                                                                        <div
                                                                            className="text-xs text-gray-500 cursor-help px-2"
                                                                            title="Si se deja vacío, se generará un nombre automático"
                                                                        >
                                                                            Auto-generado
                                                                        </div>
                                                                    </div>
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>

                                        {/* Sección 2: Responsables */}
                                        <Card className="bg-gray-800/50 border border-gray-700">
                                            <CardBody className="p-5">
                                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                    <FaUserTie className="text-blue-400" />
                                                    Responsables
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Vendedor */}
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">
                                                            Vendedor
                                                        </label>
                                                        <Select
                                                            name="idUser"
                                                            placeholder="Seleccionar vendedor"
                                                            items={catalogs.usuarios}
                                                            onChange={handleSelectChange}
                                                            color="default"
                                                        >
                                                            {(usuario) => (
                                                                <SelectItem key={usuario.id} className="text-gray-300">
                                                                    {usuario.fullname}
                                                                </SelectItem>
                                                            )}
                                                        </Select>
                                                    </div>

                                                    {/* Agente */}
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-300">
                                                            Agente
                                                        </label>
                                                        <Select
                                                            name="idAgente"
                                                            placeholder="Seleccionar agente"
                                                            items={catalogs.usuarios}
                                                            onChange={handleSelectChange}
                                                            color="default"
                                                        >
                                                            {(usuario) => (
                                                                <SelectItem key={usuario.id} className="text-gray-300">
                                                                    {usuario.fullname}
                                                                </SelectItem>
                                                            )}
                                                        </Select>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>

                                        {/* Sección 3: Envío */}
                                        <Card className="bg-gray-800/50 border border-gray-700">
                                            <CardBody className="p-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                        <FaShippingFast className="text-green-400" />
                                                        Método de Envío
                                                    </h3>
                                                    <Chip size="sm" variant="flat" color="default">
                                                        Opcional
                                                    </Chip>
                                                </div>
                                                <Select
                                                    name="id_envio"
                                                    placeholder="Seleccionar método de envío"
                                                    items={catalogs.envios}
                                                    onChange={handleSelectChange}
                                                    color="default"
                                                >
                                                    {(envio) => (
                                                        <SelectItem key={envio.id} className="text-gray-300">
                                                            {envio.descripcion}
                                                        </SelectItem>
                                                    )}
                                                </Select>
                                            </CardBody>
                                        </Card>
                                    </div>
                                )}
                            </ModalBody>

                            <ModalFooter className="border-t border-gray-800 pt-4">
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onCloseCallback}
                                    className="font-medium"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    isLoading={isLoading}
                                    onPress={handleSubmit}
                                    className="font-medium bg-gradient-to-r from-blue-600 to-blue-700"
                                    startContent={!isLoading && <IoIosCreate />}
                                >
                                    {isLoading ? "Creando..." : "Crear Cotización"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            <ClienteComponent
                isOpenProp={isClientModalOpen}
                onOpenChangeProp={onClientModalOpenChange}
                refreshTable={fetchCatalogs}
                type="new"
            />
        </>
    );
}