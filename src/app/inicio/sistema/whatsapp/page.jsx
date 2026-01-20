"use client";
import { Tabs, Tab, Card, CardBody } from "@nextui-org/react";
import { FaWhatsapp, FaRobot } from "react-icons/fa";
import WhatsappManager from "./components/WhatsappManager"; // Tu componente existente
import MacroWhatsapp from "./components/MacroWhatsapp";    // El nuevo componente

export default function WhatsappPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">

            {/* Encabezado General */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Centro de Mensajería</h1>
                <p className="text-gray-500">Gestiona tus plantillas y automatiza tus secuencias de envío.</p>
            </div>

            {/* Contenedor de Pestañas */}
            <div className="flex w-full flex-col">
                <Tabs
                    aria-label="Opciones de WhatsApp"
                    color="primary"
                    variant="underlined"
                    classNames={{
                        tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                        cursor: "w-full bg-blue-600",
                        tab: "max-w-fit px-0 h-12",
                        tabContent: "group-data-[selected=true]:text-blue-600 font-semibold text-base"
                    }}
                >
                    {/* TAB 1: PLANTILLAS (Lo que ya tenías) */}
                    <Tab
                        key="templates"
                        title={
                            <div className="flex items-center space-x-2">
                                <FaWhatsapp className="text-xl" />
                                <span>Plantillas y Medios</span>
                            </div>
                        }
                    >
                        <Card className="mt-4 shadow-sm border border-gray-100">
                            <CardBody>
                                <WhatsappManager />
                            </CardBody>
                        </Card>
                    </Tab>

                    {/* TAB 2: MACROS (Lo nuevo) */}
                    <Tab
                        key="macros"
                        title={
                            <div className="flex items-center space-x-2">
                                <FaRobot className="text-xl" />
                                <span>Macros y Secuencias</span>
                            </div>
                        }
                    >
                        <Card className="mt-4 shadow-sm border border-gray-100 bg-gray-50/50">
                            <CardBody>
                                <MacroWhatsapp />
                            </CardBody>
                        </Card>
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}