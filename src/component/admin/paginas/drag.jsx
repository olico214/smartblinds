"use client";
import { useState } from "react";
import {
  DndContext,
  closestCorners, // Usar closestCorners es mejor para listas verticales/mixtas
  DragOverlay,
  useDroppable,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ModalEditview from "./modal";

const STATUSES = ["Sistema", "Administracion"];

export default function DragPages({ pages, apps }) {
  // Ordenamos inicialmente por la columna 'position' que viene de la BD
  const [items, setItems] = useState(
    [...pages].sort((a, b) => a.position - b.position)
  );
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- FUNCIÓN PARA GUARDAR EN BD ---
  const saveOrder = async (newItems) => {
    try {
      // Enviamos el array completo o solo lo necesario (id, apps)
      // El backend usará el índice del array como 'position'
      const response = await fetch("/api/admin/paginas/orden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItems),
      });

      if (!response.ok) {
        throw new Error("Error al guardar el orden");
      }
      console.log("Orden guardado con éxito");
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar el orden en la base de datos.");
    }
  };

  const findItem = (id) => items.find((item) => item.id === id);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeItem = findItem(active.id);
    const overItem = findItem(overId);

    if (!activeItem) return;

    // 1. Mover entre columnas (Sistema <-> Administracion)
    if (overItem && activeItem.apps !== overItem.apps) {
      setItems((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === active.id);
        const overIndex = prev.findIndex((i) => i.id === overId);
        let newIndex;
        if (overIndex >= 0) {
          newIndex =
            overIndex +
            (active.rect.current.translated?.top >
              over.rect.top + over.rect.height
              ? 1
              : 0);
        } else {
          newIndex = prev.length + 1;
        }

        const newItems = [...prev];
        // Actualizamos la propiedad 'apps' del item arrastrado
        newItems[activeIndex] = {
          ...newItems[activeIndex],
          apps: overItem.apps,
        };

        return arrayMove(newItems, activeIndex, newIndex);
      });
    }

    // 2. Mover a una columna vacía
    const isOverContainer = STATUSES.includes(overId);
    if (isOverContainer && activeItem.apps !== overId) {
      setItems((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === active.id);
        const newItems = [...prev];
        newItems[activeIndex] = { ...newItems[activeIndex], apps: overId };
        return arrayMove(newItems, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const activeItem = findItem(active.id);
    const overItem = findItem(over?.id);

    if (!activeItem || !overItem) {
      setActiveId(null);
      return;
    }

    const activeIndex = items.findIndex((i) => i.id === active.id);
    const overIndex = items.findIndex((i) => i.id === over.id);

    let newItems = [...items];

    // Si cambió de posición
    if (activeIndex !== overIndex) {
      newItems = arrayMove(items, activeIndex, overIndex);
      setItems(newItems);
    }

    // IMPORTANTE: Guardar en la BD al soltar
    // Verificamos si hubo cambios reales antes de llamar a la API
    // O simplemente llamamos siempre para asegurar sincronización
    saveOrder(newItems);

    setActiveId(null);
  };

  const activeItem = findItem(activeId);

  return (
    <div className="flex space-x-4 p-4 items-start">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {STATUSES.map((status) => (
          <StatusTable
            key={status}
            id={status}
            title={status}
            users={items.filter((user) => user.apps === status)}
            apps={apps}
          />
        ))}

        <DragOverlay>
          {activeItem ? (
            <ItemCard user={activeItem} apps={apps} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ... (El resto de tus componentes StatusTable, SortableUser e ItemCard siguen igual que en la respuesta anterior)
// Solo asegúrate de copiar el código de ItemCard y StatusTable que te di antes
// para que el ID y el estilo funcionen bien.
function StatusTable({ id, title, users, apps }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className="bg-gray-100 p-4 rounded-md shadow-md flex-1 min-w-[300px]"
    >
      <h2 className="font-bold text-lg mb-4 text-gray-700">{title}</h2>
      <div className="flex flex-col gap-2">
        <SortableContext
          id={id}
          items={users.map((u) => u.id)}
          strategy={verticalListSortingStrategy}
        >
          {users.map((user) => (
            <SortableUser key={user.id} user={user} apps={apps} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableUser({ user, apps }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: user.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ItemCard user={user} apps={apps} />
    </div>
  );
}

function ItemCard({ user, apps, isOverlay }) {
  return (
    <div
      className={`
        bg-white p-4 rounded-lg shadow-sm border border-gray-200 
        text-black mb-2 cursor-grab relative
        ${isOverlay ? "shadow-xl scale-105 rotate-2 cursor-grabbing" : "hover:shadow-md"}
      `}
    >
      <div className="text-base font-semibold text-gray-800">{user.page || user.name}</div>
      <div className="text-xs text-gray-500 mb-2 truncate">{user.url}</div>
      <div onPointerDown={(e) => e.stopPropagation()}>
        <ModalEditview page={user} apps={apps} />
      </div>
    </div>
  );
}