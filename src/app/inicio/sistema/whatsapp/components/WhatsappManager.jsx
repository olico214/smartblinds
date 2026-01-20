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
// import { toast } from "sonner"; // Opcional si usas sonner
import Swal from "sweetalert2";

// --- COMPONENTE PRINCIPAL ---
export default function WhatsappManager({ urlinterna }) {
    const [items, setItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        // Asumiendo que esta ruta es tu API local de Next.js para guardar los datos del item
        fetch("/api/admin/whatsapp")
            .then((res) => res.json())
            .then((data) => setItems(data));
    }, []);

    const saveOrder = async (newItems) => {
        await fetch("/api/admin/whatsapp/orden", {
            method: "POST",
            body: JSON.stringify(newItems),
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                saveOrder(newOrder);
                return newOrder;
            });
        }
    };

    const handleDragStart = (event) => setActiveId(event.active.id);

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingItem({ name: "", type: "template", content: "", media_url: "", visible: 1 });
        setIsModalOpen(true);
    };

    const handleSaveItem = async (formData) => {
        // Aquí guardas la metadata en tu base de datos principal (Next.js / Laravel / etc)
        const res = await fetch("/api/admin/whatsapp", {
            method: "POST",
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            const updatedList = await fetch("/api/admin/whatsapp").then(r => r.json());
            setItems(updatedList);
            setIsModalOpen(false);
            Swal.fire('Guardado', 'El elemento se actualizó correctamente', 'success');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/admin/whatsapp?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setItems((prev) => prev.filter(i => i.id !== id));
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'Borrado correctamente.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire('Error', 'No se pudo eliminar.', 'error');
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Problema con el servidor.', 'error');
            }
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Configuración WhatsApp</h1>
                <button
                    onClick={handleAddNew}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    + Agregar Nuevo
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
            >
                <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {items.map((item) => (
                            <SortableItem key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay>
                    {activeId ? (
                        <ItemCard item={items.find(i => i.id === activeId)} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {isModalOpen && (
                <Modal
                    item={editingItem}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveItem}
                    urlinterna={urlinterna}
                />
            )}
        </div>
    );
}

// --- TARJETA DE CADA ITEM (SORTABLE) ---
function SortableItem({ item, onEdit, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <ItemCard item={item} onEdit={onEdit} onDelete={onDelete} />
        </div>
    );
}

// --- DISEÑO VISUAL DE LA TARJETA ---
function ItemCard({ item, onEdit, onDelete, isOverlay }) {
    const typeColors = {
        template: "bg-purple-100 text-purple-800",
        url: "bg-green-100 text-green-800",
        media: "bg-orange-100 text-orange-800",
    };

    return (
        <div className={`bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between items-center ${isOverlay ? "shadow-2xl scale-105 cursor-grabbing" : "cursor-grab"}`}>
            <div className="flex items-center gap-4">
                <span className="text-gray-400 text-2xl">☰</span>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800">{item.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold ${typeColors[item.type]}`}>
                            {item.type}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate max-w-md">
                        {item.type === 'template' ? item.content : item.media_url}
                    </p>
                </div>
            </div>

            {!isOverlay && (
                <div className="flex gap-2">
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded bg-blue-50"
                    >
                        Editar
                    </button>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onDelete(item.id)}
                        className="text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded bg-red-50"
                    >
                        Borrar
                    </button>
                </div>
            )}
        </div>
    );
}

// --- MODAL DE EDICIÓN ACTUALIZADO ---
function Modal({ item, onClose, onSave, urlinterna }) {
    const [formData, setFormData] = useState({ ...item });
    const [uploading, setUploading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // FUNCIÓN NUEVA: Subir imagen al servidor en puerto 3001
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        // 'foto' debe coincidir con: upload.single('foto') en tu server.js
        data.append("foto", file);

        try {
            // NOTA: Asegúrate de que tu backend permita CORS para este origen
            const res = await fetch(`${urlinterna}:3001/api/subir`, {
                method: "POST",
                body: data
            });

            if (!res.ok) throw new Error("Error en subida");

            const json = await res.json();

            // Actualizamos el estado con la URL que devolvió el servidor 3001
            setFormData(prev => ({
                ...prev,
                media_url: json.url
            }));

            Swal.fire({
                icon: 'success',
                title: 'Imagen subida',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo subir la imagen al servidor 3001', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{item.id ? "Editar Mensaje" : "Nuevo Mensaje"}</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre Identificador</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Promo Enero"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full border rounded p-2 mt-1"
                        >
                            <option value="template">Template (Texto)</option>
                            {/* <option value="url">Link Externo</option> */}
                            {/* <option value="media">Imagen / Multimedia</option> */}
                        </select>
                    </div>

                    {/* CAMPOS DINÁMICOS */}

                    {formData.type === "template" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contenido</label>
                            <textarea
                                name="content"
                                rows={5}
                                value={formData.content || ""}
                                onChange={handleChange}
                                className="w-full border rounded p-2 mt-1 font-mono text-sm"
                                placeholder="Hola {{cliente}}..."
                            />
                        </div>
                    )}

                    {formData.type === "url" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">URL de destino</label>
                            <input
                                name="media_url"
                                value={formData.media_url || ""}
                                onChange={handleChange}
                                className="w-full border rounded p-2 mt-1"
                                placeholder="https://miweb.com"
                            />
                        </div>
                    )}

                    {/* SECCIÓN ESPECÍFICA PARA SUBIDA DE IMÁGENES */}
                    {formData.type === "media" && (
                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subir Imagen (Servidor :3001)
                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100 mb-3"
                            />

                            {uploading && <p className="text-blue-600 text-sm animate-pulse">Subiendo imagen...</p>}

                            <label className="block text-xs font-medium text-gray-500 mt-2">URL del Recurso</label>
                            <input
                                name="media_url"
                                value={formData.media_url || ""}
                                onChange={handleChange}
                                readOnly // Recomendado que sea readOnly si viene del uploader
                                className="w-full border rounded p-2 mt-1 bg-gray-100 text-gray-600 text-sm"
                                placeholder="La URL aparecerá aquí al subir imagen"
                            />

                            {/* Previsualización */}
                            {formData.media_url && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Vista previa:</p>
                                    <img
                                        src={formData.media_url}
                                        alt="Vista previa"
                                        className="h-32 object-contain rounded border bg-white"
                                        onError={(e) => e.target.style.display = 'none'} // Ocultar si la url no es válida
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="visible"
                            name="visible"
                            checked={formData.visible}
                            onChange={handleChange}
                            className="h-4 w-4"
                        />
                        <label htmlFor="visible" className="text-sm text-gray-700">Visible</label>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave(formData)}
                        disabled={uploading}
                        className={`px-4 py-2 text-white rounded ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {uploading ? 'Subiendo...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}