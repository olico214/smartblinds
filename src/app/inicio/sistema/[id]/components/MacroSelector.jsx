"use client";
import { Listbox, ListboxItem, Chip, ScrollShadow } from "@nextui-org/react";
import { FaRobot, FaClock, FaPlay } from "react-icons/fa";

export default function MacroSelector({ macros, onSelect, loading }) {
    return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h3 className="text-indigo-700 font-bold flex items-center gap-2 text-sm">
                    <FaRobot /> Secuencias de Seguimiento
                </h3>
                <p className="text-xs text-indigo-500 mt-1">
                    Se enviarán automáticamente los mensajes y archivos configurados.
                </p>
            </div>

            <ScrollShadow className="h-[300px] pr-2">
                {macros.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
                        No hay macros configuradas.
                    </div>
                ) : (
                    <Listbox
                        aria-label="Macros"
                        onAction={(key) => onSelect(key)}
                        isDisabled={loading}
                    >
                        {macros.map((macro) => (
                            <ListboxItem
                                key={macro.id}
                                textValue={macro.name}
                                className="mb-2 p-3 border rounded-xl hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-600 text-white rounded-lg">
                                        <FaPlay size={12} />
                                    </div>

                                    <div className="flex flex-col flex-1">
                                        <span className="font-semibold">{macro.name}</span>
                                        <span className="text-[10px] text-gray-500 italic">
                                            {macro.description || "Sin descripción"}
                                        </span>
                                    </div>

                                    <Chip size="sm" variant="flat" color="warning" startContent={<FaClock size={10} />}>
                                        Macro
                                    </Chip>
                                </div>
                            </ListboxItem>
                        ))}
                    </Listbox>
                )}
            </ScrollShadow>
        </div>
    );
}
