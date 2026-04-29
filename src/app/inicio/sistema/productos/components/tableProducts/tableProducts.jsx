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
    Tooltip,
    Select,
    SelectItem,
    Divider
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
    { key: "actions", label: "ACCIONES" },
];

// --- CONFIGURACIÓN DE CAMPOS FILTRABLES ---
// Define todos los campos de la BD con su tipo de filtro y label
const filterableFields = [
    // Texto (búsqueda parcial)
    { key: "nombre", label: "Nombre", type: "text" },
    { key: "sku", label: "SKU", type: "text" },
    { key: "descripcion", label: "Descripción", type: "text" },
    { key: "tamano", label: "Tamaño", type: "text" },
    { key: "medidas", label: "Medidas", type: "text" },
    { key: "modeloSB", label: "Modelo SB", type: "text" },
    { key: "colorSB", label: "Color SB", type: "text" },
    { key: "modeloProveedor", label: "Modelo Proveedor", type: "text" },
    { key: "colorProveedor", label: "Color Proveedor", type: "text" },
    // Select (coincidencia exacta)
    { key: "tipo", label: "Tipo", type: "select" },
    { key: "is_automatizacion", label: "Automatización", type: "select" },
    { key: "is_persiana", label: "Persiana", type: "select" },
    // Rango numérico
    { key: "costo", label: "Costo", type: "range" },
    { key: "precio", label: "Precio", type: "range" },
    { key: "margen", label: "Margen", type: "range" },
    { key: "stockinicial", label: "Stock", type: "range" },
];

export default function TableProducts() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- ESTADO PARA FILTROS DINÁMICOS ---
    // Cada filtro es un objeto: { field: 'nombre', value: 'texto' } o { field: 'costo', min: '10', max: '50' }
    const [filters, setFilters] = useState([]);

    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // --- NUEVOS ESTADOS PARA SELECCIÓN MÚLTIPLE ---
    const [selectedKeys, setSelectedKeys] = useState(new Set([]));
    const [nuevoMargen, setNuevoMargen] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    // --- FETCH ---
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

    // --- FILTRADO DINÁMICO EN EL CLIENTE ---
    const filteredItems = useMemo(() => {
        let filteredProducts = [...products];

        for (const filter of filters) {
            const fieldConfig = filterableFields.find(f => f.key === filter.field);
            if (!fieldConfig) continue;

            if (fieldConfig.type === "text") {
                // Búsqueda parcial case-insensitive
                const searchValue = (filter.value || "").toLowerCase();
                if (searchValue) {
                    filteredProducts = filteredProducts.filter(product => {
                        const fieldValue = (product[filter.field] || "").toString().toLowerCase();
                        return fieldValue.includes(searchValue);
                    });
                }
            } else if (fieldConfig.type === "select") {
                const selectedValue = filter.value;
                if (selectedValue && selectedValue !== "all") {
                    filteredProducts = filteredProducts.filter(product => {
                        return String(product[filter.field]) === selectedValue;
                    });
                }
            } else if (fieldConfig.type === "range") {
                const min = filter.min ? parseFloat(filter.min) : null;
                const max = filter.max ? parseFloat(filter.max) : null;

                filteredProducts = filteredProducts.filter(product => {
                    const val = parseFloat(product[filter.field]);
                    if (isNaN(val)) return false;
                    if (min !== null && val < min) return false;
                    if (max !== null && val > max) return false;
                    return true;
                });
            }
        }

        return filteredProducts;
    }, [products, filters]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredItems.slice(start, end);
    }, [page, filteredItems]);

    // --- FUNCIONES PARA MANEJAR FILTROS ---
    const addFilter = useCallback((fieldKey) => {
        // Evitar duplicados
        if (filters.some(f => f.field === fieldKey)) return;
        setFilters(prev => [...prev, { field: fieldKey, value: "", min: "", max: "" }]);
        setPage(1);
        setSelectedKeys(new Set([]));
    }, [filters]);

    const updateFilter = useCallback((fieldKey, updates) => {
        setFilters(prev => prev.map(f =>
            f.field === fieldKey ? { ...f, ...updates } : f
        ));
        setPage(1);
        setSelectedKeys(new Set([]));
    }, []);

    const removeFilter = useCallback((fieldKey) => {
        setFilters(prev => prev.filter(f => f.field !== fieldKey));
        setPage(1);
        setSelectedKeys(new Set([]));
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilters([]);
        setPage(1);
        setSelectedKeys(new Set([]));
    }, []);

    // --- LÓGICA DE ACTUALIZACIÓN MASIVA ---
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
            const res = await fetch(`/api/productos/bulk`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: payload })
            });

            const json = await res.json();

            if (json.ok) {
                Swal.fire("¡Éxito!", json.message, "success");
                setSelectedKeys(new Set([]));
                setNuevoMargen("");
                fetchProducts();
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

    // --- RENDER DE CELDAS ---
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
                    </div>
                );
            default:
                return cellValue;
        }
    }, [fetchProducts]);

    // --- OBTENER VALORES ÚNICOS PARA CAMPOS SELECT ---
    const getUniqueValues = useCallback((fieldKey) => {
        const values = [...new Set(products.map(p => {
            const val = p[fieldKey];
            return val !== null && val !== undefined ? String(val) : null;
        }).filter(Boolean))];
        return values.sort();
    }, [products]);

    // --- RENDER DE UN FILTRO INDIVIDUAL ---
    const renderFilter = (filter) => {
        const fieldConfig = filterableFields.find(f => f.key === filter.field);
        if (!fieldConfig) return null;

        return (
            <div key={filter.field} className="flex items-center gap-2 p-2 bg-content2 rounded-lg">
                <span className="text-xs font-semibold text-default-500 whitespace-nowrap min-w-fit">
                    {fieldConfig.label}:
                </span>

                {fieldConfig.type === "text" && (
                    <Input
                        size="sm"
                        placeholder={`Buscar ${fieldConfig.label.toLowerCase()}...`}
                        value={filter.value || ""}
                        onValueChange={(val) => updateFilter(filter.field, { value: val })}
                        isClearable
                        onClear={() => removeFilter(filter.field)}
                        className="min-w-[180px]"
                    />
                )}

                {fieldConfig.type === "select" && (
                    <div className="flex items-center gap-1">
                        <Select
                            size="sm"
                            placeholder="Seleccionar..."
                            selectedKeys={filter.value ? [filter.value] : []}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "all" || !val) {
                                    removeFilter(filter.field);
                                } else {
                                    updateFilter(filter.field, { value: val });
                                }
                            }}
                            className="min-w-[160px]"
                        >
                            <SelectItem key="all" value="all">Todos</SelectItem>
                            {getUniqueValues(filter.field).map(val => (
                                <SelectItem key={val} value={val}>{val}</SelectItem>
                            ))}
                        </Select>
                    </div>
                )}

                {fieldConfig.type === "range" && (
                    <div className="flex items-center gap-1">
                        <Input
                            size="sm"
                            type="number"
                            placeholder="Mín"
                            value={filter.min || ""}
                            onValueChange={(val) => updateFilter(filter.field, { min: val })}
                            className="w-24"
                        />
                        <span className="text-default-400">-</span>
                        <Input
                            size="sm"
                            type="number"
                            placeholder="Máx"
                            value={filter.max || ""}
                            onValueChange={(val) => updateFilter(filter.field, { max: val })}
                            className="w-24"
                        />
                    </div>
                )}

                <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => removeFilter(filter.field)}
                >
                    ✕
                </Button>
            </div>
        );
    };

    // --- FILTROS DISPONIBLES (los que aún no están agregados) ---
    const availableFields = filterableFields.filter(
        f => !filters.some(ff => ff.field === f.key)
    );

    const topContent = useMemo(() => {
        const countSelected = selectedKeys === "all" ? filteredItems.length : selectedKeys.size;

        return (
            <div className="flex flex-col gap-4">
                {/* --- PANEL DE EDICIÓN MASIVA --- */}
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

                {/* --- BARRA DE ACCIONES PRINCIPAL --- */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 items-stretch sm:items-end">
                    {/* --- SELECTOR PARA AGREGAR FILTROS DINÁMICOS --- */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select
                            size="sm"
                            placeholder="+ Agregar filtro..."
                            selectedKeys={[]}
                            onChange={(e) => {
                                if (e.target.value) addFilter(e.target.value);
                            }}
                            className="min-w-[200px]"
                        >
                            {availableFields.map(f => (
                                <SelectItem key={f.key} value={f.key}>
                                    {f.label}
                                </SelectItem>
                            ))}
                        </Select>

                        {filters.length > 0 && (
                            <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                onPress={clearAllFilters}
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>

                    <RegisterProduct fetchProducts={fetchProducts}>
                        <Button color="primary" className="font-semibold">Nuevo Producto</Button>
                    </RegisterProduct>
                </div>

                {/* --- FILTROS ACTIVOS --- */}
                {filters.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {filters.map(renderFilter)}
                    </div>
                )}

                {/* --- CONTADOR DE PRODUCTOS --- */}
                <span className="text-default-400 text-small">
                    Total {products.length} productos • Mostrando {filteredItems.length} con los filtros aplicados
                </span>
            </div>
        );
    }, [
        filters,
        products,
        selectedKeys,
        filteredItems.length,
        nuevoMargen,
        isUpdating,
        availableFields,
        addFilter,
        clearAllFilters,
        renderFilter
    ]);

    return (
        <Table
            aria-label="Tabla de productos con filtros dinámicos en todos los campos"
            selectionMode="multiple"
            selectedKeys={selectedKeys}
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
                    <TableRow key={item.id.toString()}>
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
