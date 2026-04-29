"use client";
import { useState, useCallback } from "react";
import {
  DndContext,
  closestCorners,
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
// Prefijo para IDs de contenedores droppable para evitar conflicto con SortableContext
const CONTAINER_PREFIX = "container-";

export default function DragPages({ pages, apps }) {
  // Ordenamos inicialmente por la columna 'position' que viene de la BD
  const [items, setItems] = useState(
    [...pages].sort((a, b) => a.position - b.position)
  );
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Pequeña distancia para evitar drag accidental al hacer clic en editar
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- FUNCIÓN PARA GUARDAR EN BD ---
  const saveOrder = useCallback(async (newItems) => {
    try {
      // Enviamos solo id y apps (el backend usa el contador por columna como position)
      const payload = newItems.map((item) => ({
        id: item.id,
        apps: item.apps,
      }));

      const response = await fetch("/api/admin/paginas/orden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Error al guardar el orden");
      }
      console.log("Orden guardado con éxito");
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar el orden en la base de datos.");
    }
  }, []);

  const findItem = (id) => items.find((item) => item.id === id);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeItem = findItem(active.id);
    if (!activeItem) return;

    const overItem = findItem(overId);
    // Verificamos si el over es un contenedor (usando el prefijo)
    const isOverContainer = typeof overId === "string" && overId.startsWith(CONTAINER_PREFIX);

    if (isOverContainer) {
      // Extraemos el nombre real de la columna
      const containerName = overId.replace(CONTAINER_PREFIX, "");
      if (activeItem.apps !== containerName) {
        setItems((prev) => {
          const activeIndex = prev.findIndex((i) => i.id === active.id);
          const newItems = [...prev];
          newItems[activeIndex] = { ...newItems[activeIndex], apps: containerName };
          return newItems;
        });
      }
      return;
    }

    // Si estamos sobre otro item y es de diferente columna
    if (overItem && activeItem.apps !== overItem.apps) {
      setItems((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === active.id);
        const overIndex = prev.findIndex((i) => i.id === overId);
        const newItems = [...prev];
        // Cambiamos la app del item activo a la del item sobre el que está
        newItems[activeIndex] = {
          ...newItems[activeIndex],
          apps: overItem.apps,
        };
        return arrayMove(newItems, activeIndex, overIndex);
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const activeItem = findItem(active.id);
    const overItem = findItem(over?.id);

    if (!activeItem) {
      setActiveId(null);
      return;
    }

    // Si soltamos sobre un contenedor (no sobre un item)
    if (over && typeof over.id === "string" && over.id.startsWith(CONTAINER_PREFIX)) {
      // Ya se manejó en handleDragOver, solo guardamos
      saveOrder(items);
      setActiveId(null);
      return;
    }

    // Si soltamos sobre otro item
    if (overItem) {
      const activeIndex = items.findIndex((i) => i.id === active.id);
      const overIndex = items.findIndex((i) => i.id === over.id);

      if (activeIndex !== overIndex) {
        const newItems = arrayMove(items, activeIndex, overIndex);
        setItems(newItems);
        saveOrder(newItems);
      } else {
        // Mismo índice pero pudo haber cambio de columna en handleDragOver
        saveOrder(items);
      }
    } else {
      // Soltó fuera de cualquier zona válida, guardamos igual por si hubo cambios
      saveOrder(items);
    }

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

function StatusTable({ id, title, users, apps }) {
  // Usamos un ID con prefijo para el droppable para evitar conflicto con SortableContext
  const { setNodeRef } = useDroppable({ id: CONTAINER_PREFIX + id });
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
