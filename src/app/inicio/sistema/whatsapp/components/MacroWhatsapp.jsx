"use client";
import { useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Swal from 'sweetalert2';
import { FaClock, FaImage, FaFont, FaGripVertical, FaTrash, FaPen, FaPlus, FaArrowLeft, FaRobot, FaPlay } from "react-icons/fa";

// --- ICONOS ---
const Icons = {
    text: <FaFont className="text-gray-500" />,
    image: <FaImage className="text-purple-500" />,
    clock: <FaClock className="text-yellow-600" />
};

export default function MacroWhatsapp({ urlinterna }) {
    const [view, setView] = useState("list"); // 'list' | 'editor'
    const [selectedSequence, setSelectedSequence] = useState(null);
    const [sequences, setSequences] = useState([]);

    // Cargar lista de Macros (Padres)
    const loadSequences = async () => {
        const res = await fetch("/api/admin/macros");
        if (res.ok) setSequences(await res.json());
    };

    useEffect(() => { loadSequences(); }, []);

    const handleCreateSequence = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Nueva Macro',
            html:
                '<input id="swal-input1" class="swal2-input" placeholder="Nombre (Ej: Bienvenida)">' +
                '<input id="swal-input2" class="swal2-input" placeholder="Descripción corta">',
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                return [
                    document.getElementById('swal-input1').value,
                    document.getElementById('swal-input2').value
                ]
            }
        });

        if (formValues && formValues[0]) {
            await fetch("/api/admin/macros", {
                method: "POST",
                body: JSON.stringify({ action: 'create_sequence', name: formValues[0], description: formValues[1] })
            });
            loadSequences();
        }
    };

    const deleteSequence = async (id) => {
        const res = await Swal.fire({ title: '¿Eliminar Macro?', text: "Se borrarán todos los pasos dentro.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
        if (res.isConfirmed) {
            await fetch(`/api/admin/macros?id=${id}&type=sequence`, { method: "DELETE" });
            loadSequences();
        }
    }

    // --- VISTA 1: LISTADO DE MACROS ---
    if (view === "list") {
        return (
            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FaRobot /> Mis Secuencias</h2>
                        <p className="text-sm text-gray-500">Selecciona una macro para editar sus pasos</p>
                    </div>
                    <button onClick={handleCreateSequence} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-blue-700 flex gap-2 items-center">
                        <FaPlus /> Nueva Macro
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sequences.map(seq => (
                        <div key={seq.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all group cursor-pointer relative"
                            onClick={() => { setSelectedSequence(seq); setView("editor"); }}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                    <FaRobot size={24} />
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); deleteSequence(seq.id); }} className="text-gray-300 hover:text-red-500 p-2"><FaTrash /></button>
                            </div>
                            <h3 className="font-bold text-lg text-gray-800">{seq.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{seq.description || "Sin descripción"}</p>
                            <div className="mt-4 flex items-center text-blue-600 text-sm font-bold group-hover:underline">
                                Editar Pasos <FaPlay className="ml-2 text-xs" />
                            </div>
                        </div>
                    ))}
                    {sequences.length === 0 && (
                        <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-400">No tienes macros creadas.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- VISTA 2: EDITOR DE PASOS (LO QUE YA TENÍAS PERO CONTEXTUALIZADO) ---
    return (
        <StepsEditor
            urlinterna={urlinterna}
            sequence={selectedSequence}
            onBack={() => { setView("list"); setSelectedSequence(null); }}
        />
    );
}


// ====================================================================================
// SUB-COMPONENTE: EDITOR DE PASOS (Lógica de Drag & Drop aislada)
// ====================================================================================
function StepsEditor({ sequence, onBack, urlinterna }) {
    const [items, setItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Cargar pasos de LA SECUENCIA SELECCIONADA
    const loadSteps = async () => {
        if (!sequence) return;
        const res = await fetch(`/api/admin/macros?sequence_id=${sequence.id}`);
        if (res.ok) setItems(await res.json());
    };

    useEffect(() => { loadSteps(); }, [sequence]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
            // Opcional: Aquí llamarías a una API para guardar el nuevo 'sort_order'
        }
    };

    const handleDragStart = (e) => setActiveId(e.active.id);

    // --- CRUD PASOS ---
    const handleSaveItem = async (formData) => {
        const payload = { ...formData, action: 'save_step', sequence_id: sequence.id };
        const res = await fetch("/api/admin/macros", {
            method: "POST", body: JSON.stringify(payload)
        });
        if (res.ok) {
            setIsModalOpen(false);
            loadSteps();
            Swal.fire({ icon: 'success', title: 'Guardado', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        }
    };

    const handleDelete = async (id) => {
        const res = await Swal.fire({ title: '¿Borrar paso?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
        if (res.isConfirmed) {
            await fetch(`/api/admin/macros?id=${id}&type=step`, { method: "DELETE" });
            loadSteps();
        }
    };

    const activeItem = items.find((i) => i.id === activeId);

    return (
        <div className="p-4">
            {/* Header del Editor */}
            <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <FaArrowLeft className="text-gray-600" />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800">{sequence.name}</h2>
                    <p className="text-sm text-gray-500">{items.length} pasos configurados</p>
                </div>
                <button
                    onClick={() => { setEditingItem({ type: 'text', content: '', media_url: [], delay_seconds: 2, active: true }); setIsModalOpen(true); }}
                    className="bg-black text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-gray-800 flex items-center gap-2"
                >
                    <FaPlus /> Agregar Paso
                </button>
            </div>

            {/* Area de Drag & Drop */}
            <div className="max-w-3xl mx-auto">
                {items.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                        <p className="text-gray-400">Esta macro está vacía.</p>
                        <button onClick={() => { setEditingItem({ type: 'text', content: '', media_url: [], delay_seconds: 2, active: true }); setIsModalOpen(true); }} className="text-blue-600 font-bold hover:underline mt-2">Crear primer paso</button>
                    </div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4 relative pl-6">
                                <div className="absolute left-[2.2rem] top-4 bottom-4 w-0.5 bg-gray-200 -z-10 border-l-2 border-dashed border-gray-300"></div>
                                {items.map((item, index) => (
                                    <SortableItem key={item.id} item={item} index={index} onEdit={(i) => { setEditingItem(i); setIsModalOpen(true); }} onDelete={handleDelete} />
                                ))}
                            </div>
                        </SortableContext>
                        <DragOverlay>
                            {activeId ? <ItemCard item={activeItem} isOverlay /> : null}
                        </DragOverlay>
                    </DndContext>
                )}
            </div>

            {isModalOpen && <Modal item={editingItem} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} urlinterna={urlinterna} />}
        </div>
    );
}

// --- Componentes Reutilizables (Items y Modal) ---
// (Son casi iguales a tu versión anterior, solo ajustados visualmente)

function SortableItem({ item, index, onEdit, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, zIndex: isDragging ? 50 : "auto" };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="outline-none">
            <ItemCard item={item} index={index} onEdit={onEdit} onDelete={onDelete} />
        </div>
    );
}

function ItemCard({ item, index, onEdit, onDelete, isOverlay }) {
    if (!item) return null;
    const isImage = item.type === 'image';

    return (
        <div className={`relative bg-white p-4 rounded-xl border flex justify-between items-center group transition-all ${isOverlay ? "shadow-2xl border-blue-500 scale-105" : "shadow-sm border-gray-200 hover:shadow-md"}`}>
            <div className="absolute left-2 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab"><FaGripVertical /></div>
            <div className="flex items-center gap-4 w-full pl-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${isImage ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                    {typeof index === 'number' ? index + 1 : '#'}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${isImage ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{isImage ? 'IMG' : 'TXT'}</span>
                        <span className="font-bold text-gray-700 text-sm truncate">{item.type === 'text' ? (item.content || 'Sin texto') : 'Galería de Imágenes'}</span>
                    </div>
                    {isImage && <p className="text-xs text-gray-400">{item.media_url?.length || 0} archivos adjuntos</p>}
                </div>
                <div className="flex items-center gap-2 bg-yellow-50 px-2 py-1 rounded border border-yellow-200 text-xs font-bold text-yellow-700">
                    <FaClock /> {item.delay_seconds}s
                </div>
            </div>
            {!isOverlay && (
                <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onEdit(item)} className="p-2 bg-gray-100 rounded-full hover:bg-blue-500 hover:text-white"><FaPen size={10} /></button>
                    <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onDelete(item.id)} className="p-2 bg-gray-100 rounded-full hover:bg-red-500 hover:text-white"><FaTrash size={10} /></button>
                </div>
            )}
        </div>
    );
}
// ... dentro del componente Modal ...

function Modal({ item, onClose, onSave, urlinterna }) {
    const [formData, setFormData] = useState({ ...item, media_url: item.media_url || [] });
    const [uploading, setUploading] = useState(false); // Estado para feedback de carga

    // FUNCIÓN PARA SUBIR EL ARCHIVO A TU NUEVA API
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('foto', file); // 'foto' debe coincidir con upload.single('foto') en tu API

        try {
            const res = await fetch(`${urlinterna}/api/subir`, {
                method: "POST",
                body: data,
            });

            const result = await res.json();

            if (res.ok) {
                // Agregamos la URL que nos devolvió tu API al arreglo de media_url
                setFormData(p => ({
                    ...p,
                    media_url: [...p.media_url, result.url]
                }));

                Swal.fire({
                    icon: 'success',
                    title: 'Imagen subida',
                    toast: true,
                    position: 'top-end',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                throw new Error(result.error || "Error al subir");
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo subir la imagen al servidor', 'error');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (idx) => {
        const copy = [...formData.media_url];
        copy.splice(idx, 1);
        setFormData(p => ({ ...p, media_url: copy }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h2 className="font-bold text-lg">Configurar Paso</h2>
                    <button onClick={onClose} className="hover:text-red-500">✕</button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Selector de Tipo */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['text', 'image'].map(t => (
                            <button
                                key={t}
                                onClick={() => setFormData({ ...formData, type: t })}
                                className={`flex-1 py-2 rounded-md text-sm font-bold capitalize transition-all ${formData.type === t ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            >
                                {t === 'text' ? 'Texto' : 'Imagen'}
                            </button>
                        ))}
                    </div>

                    {/* CONTENIDO SEGÚN TIPO */}
                    {formData.type === 'text' ? (
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Mensaje de WhatsApp</label>
                            <textarea
                                name="content"
                                rows={4}
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="w-full border rounded-lg p-2 mt-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Escribe aquí tu mensaje..."
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-400 uppercase">Imágenes de la Macro</label>

                            {/* Botón de Carga Real */}
                            <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <FaImage className={uploading ? "animate-bounce text-blue-500" : "text-gray-400"} size={24} />
                                    <span className="text-sm font-medium text-gray-600">
                                        {uploading ? "Subiendo archivo..." : "Haga clic o arrastre imagen para subir"}
                                    </span>
                                </div>
                            </div>

                            {/* Previsualización de imágenes subidas */}
                            <div className="grid grid-cols-3 gap-2 mt-4">
                                {formData.media_url.map((url, i) => (
                                    <div key={i} className="relative aspect-square border rounded-lg overflow-hidden group">
                                        <img src={url} alt="subida" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <FaTrash size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Configuración de Timer */}
                    <div className="pt-2">
                        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <FaClock className="text-yellow-500" /> Tiempo de espera tras este paso
                        </label>
                        <div className="flex items-center gap-3 mt-1">
                            <input
                                type="number"
                                name="delay_seconds"
                                value={formData.delay_seconds}
                                onChange={(e) => setFormData({ ...formData, delay_seconds: e.target.value })}
                                className="w-20 border rounded-lg p-2 font-bold text-center"
                                min="0"
                            />
                            <span className="text-sm text-gray-500 font-medium">segundos</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 font-bold text-sm">Cerrar</button>
                    <button
                        onClick={() => onSave(formData)}
                        disabled={uploading}
                        className={`px-6 py-2 rounded-lg font-bold text-sm text-white ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
                    >
                        Guardar Paso
                    </button>
                </div>
            </div>
        </div>
    );
}