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
    useDisclosure
} from "@nextui-org/react";
import {
    FaUserPlus,
    FaShippingFast,
    FaTag,
    FaProjectDiagram,
    FaUserTie,
    FaIndustry
} from "react-icons/fa";
import { IoIosCreate } from "react-icons/io";
import Swal from "sweetalert2";
import ClienteComponent from "../../clientes/components/registroCliente/registrarCliente";

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
            confirmButtonColor: '#2563EB', // Azul estándar
            cancelButtonColor: '#6B7280',  // Gris
            confirmButtonText: 'Sí, crear ahora',
            cancelButtonText: 'Revisar datos',
            // Quitamos el background oscuro para el SweetAlert también
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
                    });

                    router.push(`./crear-cotizacion/${data.id}`);

                } catch (error) {
                    console.error("Error al crear la cotización:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.message || 'No se pudo crear la cotización.',
                        confirmButtonColor: '#EF4444'
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
                size="4xl" // Tamaño adecuado para desktop
                placement="top-center" // Mejor para móviles
                isDismissable={false}
                scrollBehavior="inside"
                backdrop="blur"
                // IMPORTANTE: Quitamos bg-gradient oscuro y ponemos blanco
                className="bg-white text-gray-900"
            >
                <ModalContent>
                    {(onCloseCallback) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <IoIosCreate className="text-xl text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Nueva Cotización</h2>
                                        <p className="text-sm text-gray-500">Complete todos los campos requeridos</p>
                                    </div>
                                </div>
                            </ModalHeader>

                            <ModalBody className="py-6 px-4 md:px-6">
                                {isCatalogsLoading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className="text-center">
                                            <Spinner size="lg" color="primary" className="mb-4" />
                                            <p className="text-gray-500">Cargando datos del sistema...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {/* Sección 1: Información Principal */}
                                        <Card className="bg-white border border-gray-200 shadow-sm">
                                            <CardBody className="p-4 md:p-5">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    {/* Cliente */}
                                                    <div className="space-y-2">
                                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                            <FaUserTie className="text-blue-500" />
                                                            Cliente <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <Autocomplete
                                                                name="idCliente"
                                                                placeholder="Buscar cliente..."
                                                                selectedKey={formData.idCliente}
                                                                items={catalogs.clientes}
                                                                onSelectionChange={(e) => setFormData(prev => ({ ...prev, ["idCliente"]: e }))}
                                                                className="flex-grow"
                                                                variant="bordered"
                                                                inputProps={{
                                                                    classNames: {
                                                                        input: "text-gray-800", // Texto oscuro
                                                                        label: "text-gray-600"
                                                                    }
                                                                }}
                                                                listboxProps={{
                                                                    itemClasses: {
                                                                        base: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                                                                    }
                                                                }}
                                                                isRequired
                                                            >
                                                                {(cliente) => (
                                                                    <AutocompleteItem key={cliente.id} textValue={cliente.nombre}>
                                                                        {cliente.nombre}
                                                                    </AutocompleteItem>
                                                                )}
                                                            </Autocomplete>

                                                            {/* Botón Nuevo Cliente - Color claro */}
                                                            <Button
                                                                onPress={onClientModalOpen}
                                                                variant="faded"
                                                                isIconOnly
                                                                className="border-gray-300 text-blue-600 bg-blue-50 hover:bg-blue-100"
                                                                title="Registrar nuevo cliente"
                                                            >
                                                                <FaUserPlus size={18} />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Línea Cotizada */}
                                                    <div className="space-y-2">
                                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                            <FaTag className="text-green-600" />
                                                            Línea Cotizada <span className="text-red-500">*</span>
                                                        </label>
                                                        <Select
                                                            name="lineaCotizada"
                                                            placeholder="Seleccionar línea"
                                                            items={lineas}
                                                            onChange={handleSelectChange}
                                                            variant="bordered"
                                                            isRequired
                                                            classNames={{ value: "text-gray-800" }}
                                                        >
                                                            {(linea) => (
                                                                <SelectItem key={linea.key} textValue={linea.key} className="text-gray-700">
                                                                    <div className="flex items-center gap-2">
                                                                        <Chip size="sm" color={linea.color} variant="flat">{linea.key}</Chip>
                                                                    </div>
                                                                </SelectItem>
                                                            )}
                                                        </Select>
                                                    </div>

                                                    {/* Tipo de Proyecto */}
                                                    <div className="space-y-2">
                                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                            <FaProjectDiagram className="text-purple-600" />
                                                            Tipo de Proyecto <span className="text-red-500">*</span>
                                                        </label>
                                                        <Select
                                                            name="idTipoproyecto"
                                                            placeholder="Seleccionar tipo"
                                                            items={catalogs.tiposProyecto}
                                                            onChange={handleSelectChange}
                                                            variant="bordered"
                                                            isRequired
                                                            classNames={{ value: "text-gray-800" }}
                                                        >
                                                            {(tipo) => (
                                                                <SelectItem key={tipo.id} className="text-gray-700">
                                                                    {tipo.nombre}
                                                                </SelectItem>
                                                            )}
                                                        </Select>
                                                    </div>

                                                    {/* Nombre del Proyecto */}
                                                    <div className="space-y-2">
                                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                            <FaIndustry className="text-yellow-600" />
                                                            Nombre del Proyecto
                                                            <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                                                        </label>
                                                        <Input
                                                            placeholder="Ej: Proyecto Edificio Central"
                                                            name="nombreProyecto"
                                                            value={formData.nombreProyecto}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, ["nombreProyecto"]: e.target.value }))}
                                                            variant="bordered"
                                                            classNames={{
                                                                input: "text-gray-800",
                                                            }}
                                                            endContent={
                                                                <div className="text-xs text-gray-400 px-2 cursor-help" title="Si se deja vacío, se generará un nombre automático">
                                                                    Auto-generado
                                                                </div>
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>

                                        {/* Sección 2: Responsables */}
                                        <Card className="bg-white border border-gray-200 shadow-sm">
                                            <CardBody className="p-4 md:p-5">
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <FaUserTie className="text-blue-500" />
                                                    Responsables
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-semibold text-gray-700">Vendedor</label>
                                                        <Select
                                                            name="idUser"
                                                            placeholder="Seleccionar vendedor"
                                                            items={catalogs.usuarios}
                                                            onChange={handleSelectChange}
                                                            variant="bordered"
                                                            classNames={{ value: "text-gray-800" }}
                                                        >
                                                            {(usuario) => (
                                                                <SelectItem key={usuario.id} className="text-gray-700">
                                                                    {usuario.fullname}
                                                                </SelectItem>
                                                            )}
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-semibold text-gray-700">Agente</label>
                                                        <Select
                                                            name="idAgente"
                                                            placeholder="Seleccionar agente"
                                                            items={catalogs.usuarios}
                                                            onChange={handleSelectChange}
                                                            variant="bordered"
                                                            classNames={{ value: "text-gray-800" }}
                                                        >
                                                            {(usuario) => (
                                                                <SelectItem key={usuario.id} className="text-gray-700">
                                                                    {usuario.fullname}
                                                                </SelectItem>
                                                            )}
                                                        </Select>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>

                                        {/* Sección 3: Envío */}
                                        <Card className="bg-white border border-gray-200 shadow-sm">
                                            <CardBody className="p-4 md:p-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                        <FaShippingFast className="text-green-600" />
                                                        Método de Envío
                                                    </h3>
                                                    <Chip size="sm" variant="flat" color="default" className="text-gray-500">Opcional</Chip>
                                                </div>
                                                <Select
                                                    name="id_envio"
                                                    placeholder="Seleccionar método de envío"
                                                    items={catalogs.envios}
                                                    onChange={handleSelectChange}
                                                    variant="bordered"
                                                    classNames={{ value: "text-gray-800" }}
                                                >
                                                    {(envio) => (
                                                        <SelectItem key={envio.id} className="text-gray-700">
                                                            {envio.descripcion}
                                                        </SelectItem>
                                                    )}
                                                </Select>
                                            </CardBody>
                                        </Card>
                                    </div>
                                )}
                            </ModalBody>

                            <ModalFooter className="border-t border-gray-200 pt-4 pb-6 px-6">
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
                                    className="font-medium shadow-md"
                                    startContent={!isLoading && <IoIosCreate />}
                                >
                                    {isLoading ? "Creando..." : "Crear Cotización"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Modal de Cliente se mantiene, solo asegúrate de que internamente también use colores claros si lo requiere el usuario */}
            <ClienteComponent
                isOpenProp={isClientModalOpen}
                onOpenChangeProp={onClientModalOpenChange}
                refreshTable={fetchCatalogs}
                type="new"
            />
        </>
    );
}