"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Button,
    Chip,
    Pagination,
    Spinner,
    Tooltip
} from "@nextui-org/react";
import RegisterProduct from "../register/registerProduct";
import Swal from "sweetalert2";

// --- ARCHIVOS DE ÍCONOS ---
const EditIcon = (props) => (
    <svg aria-hidden="true" fill="none" focusable="false" height="1em" role="presentation" viewBox="0 0 20 20" width="1em" {...props}>
        <path d="M11.05 3.00002L4.20835 10.2417C3.95002 10.5167 3.70002 11.0584 3.65002 11.4334L3.34169 14.1334C3.23335 15.1084 3.93335 15.775 4.90002 15.6084L7.58335 15.15C7.95835 15.0834 8.48335 14.8084 8.74168 14.525L15.5834 7.28335C16.7667 6.03335 17.3 4.60835 15.4583 2.86668C13.625 1.14168 12.2334 1.75002 11.05 3.00002Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5"></path>
        <path d="M9.90833 4.20831C10.2667 6.50831 12.1333 8.26665 14.45 8.50831" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5"></path>
    </svg>
);
const DeleteIcon = (props) => (
    <svg aria-hidden="true" fill="none" focusable="false" height="1em" role="presentation" viewBox="0 0 20 20" width="1em" {...props}>
        <path d="M17.5 4.98332C14.725 4.72499 11.9333 4.59166 9.15 4.59166C7.5 4.59166 5.85 4.67499 4.2 4.82499L2.5 4.98332" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
        <path d="M7.08331 4.14169L7.26665 3.05002C7.39998 2.25835 7.49998 1.66669 8.90831 1.66669H11.0916C12.5 1.66669 12.6083 2.29169 12.7333 3.05835L12.9166 4.14169" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
        <path d="M15.7084 7.61664L15.1667 16.0083C15.075 17.3166 15 18.3333 12.675 18.3333H7.32502C5.00002 18.3333 4.92502 17.3166 4.83335 16.0083L4.29169 7.61664" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
        <path d="M8.60834 13.75H11.3833" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
        <path d="M7.91669 10.4167H12.0834" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
    </svg>
);

const columns = [
    { key: "sku", label: "SKU" },
    { key: "nombre", label: "NOMBRE" },
    { key: "tipo", label: "TIPO" },
    { key: "costo", label: "COSTO" },
    { key: "margen", label: "MARGEN" },
    { key: "precio", label: "PRECIO" },
    { key: "stockinicial", label: "STOCK" },
    { key: "actions", label: "ACCIONES" }, // <--- Mantengo tu columna original
];

export default function TableProducts() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterValue, setFilterValue] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // --- NUEVOS ESTADOS PARA SELECCIÓN MÚLTIPLE ---
    const [selectedKeys, setSelectedKeys] = useState(new Set([]));
    const [nuevoMargen, setNuevoMargen] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/productos');
            const json = await res.json();
            if (json.ok) {
                setProducts(json.data);
            } else {
                console.error("Error al obtener los productos:", json.error);
            }
        } catch (error) {
            console.error("Fallo en la conexión con la API:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredItems = useMemo(() => {
        let filteredProducts = [...products];
        if (filterValue) {
            filteredProducts = filteredProducts.filter(product =>
                product.nombre.toLowerCase().includes(filterValue.toLowerCase())
            );
        }
        if (typeFilter !== "all") {
            filteredProducts = filteredProducts.filter(product => product.tipo === typeFilter);
        }
        return filteredProducts;
    }, [products, filterValue, typeFilter]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredItems.slice(start, end);
    }, [page, filteredItems]);

    const onSearchChange = useCallback((value) => {
        if (value) {
            setFilterValue(value);
            setPage(1);
        } else {
            setFilterValue("");
        }
    }, []);

    const onClear = useCallback(() => {
        setFilterValue("");
        setPage(1);
    }, []);
    // --- LÓGICA DE ACTUALIZACIÓN MASIVA OPTIMIZADA ---
    const handleUpdateMassiveMargin = async () => {
        const margenValue = parseFloat(nuevoMargen);
        if (isNaN(margenValue) || margenValue < 0 || margenValue >= 100) {
            Swal.fire("Error", "Por favor ingresa un margen válido (0 - 99)", "error");
            return;
        }

        let selectedProducts = [];
        if (selectedKeys === "all") {
            selectedProducts = filteredItems;
        } else {
            selectedProducts = products.filter(p => selectedKeys.has(p.id.toString()));
        }

        if (selectedProducts.length === 0) {
            Swal.fire("Aviso", "No has seleccionado ningún producto.", "info");
            return;
        }

        const confirm = await Swal.fire({
            title: '¿Actualizar Margen?',
            text: `Se actualizará el margen y recalculará el precio de ${selectedProducts.length} productos en lote.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, aplicar'
        });

        if (!confirm.isConfirmed) return;

        setIsUpdating(true);

        // Armamos el "payload" (arreglo) con los nuevos datos a enviar al backend
        const payload = selectedProducts.map(product => {
            const cost = parseFloat(product.costo) || 0;
            let calculatedPrice = 0;

            if (cost > 0) {
                calculatedPrice = cost / (1 - (margenValue / 100));
            }

            return {
                id: product.id,
                margen: margenValue,
                precio: calculatedPrice.toFixed(2)
            };
        });

        try {
            // Hacemos una SOLA petición a nuestra nueva API masiva
            const res = await fetch(`/api/productos/bulk`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: payload })
            });

            const json = await res.json();

            if (json.ok) {
                Swal.fire("¡Éxito!", json.message, "success");
                setSelectedKeys(new Set([])); // Limpiar selección
                setNuevoMargen(""); // Limpiar input
                fetchProducts(); // Recargar la tabla
            } else {
                throw new Error(json.message || "Error al actualizar en lote");
            }

        } catch (error) {
            console.error("Error en la actualización masiva:", error);
            Swal.fire("Error", "Hubo un problema actualizando los productos.", "error");
        } finally {
            setIsUpdating(false);
        }
    };
    // --- RENDER DE CELDAS (Original + Formato) ---
    const renderCell = useCallback((product, columnKey) => {
        const cellValue = product[columnKey];

        switch (columnKey) {
            case "tipo":
                return (
                    <Chip color={product.tipo === 'Telas' ? "warning" : "primary"} size="sm" variant="flat">
                        {cellValue}
                    </Chip>
                );
            case "costo":
            case "precio":
                return cellValue ? `$${Number(cellValue).toFixed(2)}` : "$0.00";
            case "margen":
                return cellValue ? `${cellValue}%` : "0%";

            // --- AQUÍ MANTENEMOS TU BOTÓN DE EDICIÓN ---
            case "actions":
                return (
                    <div className="relative flex items-center gap-2">
                        <Tooltip content="Editar producto">
                            <RegisterProduct fetchProducts={fetchProducts} productToEdit={product}>
                                <Button isIconOnly size="sm" variant="light">
                                    <EditIcon />
                                </Button>
                            </RegisterProduct>
                        </Tooltip>
                        {/* El DeleteIcon está listo para cuando agregues su lógica */}
                        {/* <Tooltip content="Eliminar producto" color="danger">
                            <Button isIconOnly size="sm" variant="light" color="danger">
                                <DeleteIcon />
                            </Button>
                        </Tooltip> */}
                    </div>
                );
            default:
                return cellValue;
        }
    }, [fetchProducts]);

    const topContent = useMemo(() => {
        const productTypes = ["all", ...new Set(products.map(p => p.tipo).filter(Boolean))];
        const countSelected = selectedKeys === "all" ? filteredItems.length : selectedKeys.size;

        return (
            <div className="flex flex-col gap-4">
                {/* --- NUEVO PANEL DE EDICIÓN MASIVA (Se oculta si no hay nada seleccionado) --- */}
                {countSelected > 0 && (
                    <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                        <div>
                            <span className="text-primary-700 font-bold text-sm">
                                {countSelected} productos seleccionados
                            </span>
                            <p className="text-xs text-primary-500">Aplica un nuevo margen a todos los productos marcados.</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Input
                                type="number"
                                placeholder="Margen %"
                                value={nuevoMargen}
                                onValueChange={setNuevoMargen}
                                size="sm"
                                className="w-28"
                                endContent={<span className="text-default-400 text-sm">%</span>}
                            />
                            <Button
                                color="primary"
                                isLoading={isUpdating}
                                onPress={handleUpdateMassiveMargin}
                                isDisabled={!nuevoMargen}
                            >
                                Aplicar a todos
                            </Button>
                        </div>
                    </div>
                )}

                {/* --- TU BARRA ORIGINAL (Búsqueda y Botón "Nuevo Producto") --- */}
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%]"
                        placeholder="Buscar por nombre..."
                        value={filterValue}
                        onClear={onClear}
                        onValueChange={onSearchChange}
                    />
                    <RegisterProduct fetchProducts={fetchProducts}>
                        <Button color="primary" className="font-semibold">Nuevo Producto</Button>
                    </RegisterProduct>
                </div>

                {/* --- TUS CHIPS DE FILTROS --- */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {productTypes.map(type => (
                            <Chip
                                key={type}
                                variant={typeFilter === type ? "solid" : "bordered"}
                                color="primary"
                                className="cursor-pointer"
                                onClick={() => {
                                    setTypeFilter(type);
                                    setPage(1);
                                    setSelectedKeys(new Set([])); // Limpia selección al cambiar de categoría
                                }}
                            >
                                {type === "all" ? "Todos" : type}
                            </Chip>
                        ))}
                    </div>
                </div>
                <span className="text-default-400 text-small">Total {products.length} productos</span>
            </div>
        );
    }, [filterValue, onSearchChange, products, typeFilter, onClear, fetchProducts, selectedKeys, filteredItems.length, nuevoMargen, isUpdating]);

    return (
        <Table
            aria-label="Tabla de productos con paginación, edición individual y actualización masiva"
            selectionMode="multiple"      // <--- Habilita los checkboxes
            selectedKeys={selectedKeys}   // <--- Controla qué filas están seleccionadas
            onSelectionChange={setSelectedKeys}
            topContent={topContent}
            topContentPlacement="outside"
            bottomContent={
                pages > 1 && (
                    <div className="flex w-full justify-center">
                        <Pagination
                            isCompact
                            showControls
                            showShadow
                            color="primary"
                            page={page}
                            total={pages}
                            onChange={(page) => setPage(page)}
                        />
                    </div>
                )
            }
            bottomContentPlacement="outside"
        >
            <TableHeader columns={columns}>
                {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody
                items={items}
                isLoading={isLoading}
                loadingContent={<Spinner label="Cargando productos..." />}
                emptyContent={"No se encontraron productos que coincidan con los filtros."}
            >
                {(item) => (
                    // Aseguramos de que el 'key' sea string, requisito de NextUI para selectedKeys
                    <TableRow key={item.id.toString()}>
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}