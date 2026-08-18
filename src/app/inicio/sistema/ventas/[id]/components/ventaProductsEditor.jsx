"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Card,
    CardBody,
    CardFooter,
    Button,
    Input,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Autocomplete,
    AutocompleteItem,
    Textarea,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Tooltip,
} from "@nextui-org/react";
import Swal from "sweetalert2";

const DeleteIcon = (props) => (
    <svg aria-hidden="true" fill="none" focusable="false" height="1em" role="presentation" viewBox="0 0 20 20" width="1em" {...props}>
        <path d="M10 11V12M10 8V9M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
);
const EditIcon = (props) => (
    <svg {...props} aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const formatCurrency = (value) => Number(value || 0).toFixed(2);

const formatDate = (d) => (d ? new Date(d).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "");

function getPrecioInstalacion(cantidadTelas, preciosInstalacion) {
    if (cantidadTelas === 0) return 0;
    for (const p of preciosInstalacion || []) {
        if (cantidadTelas >= p.minimo && cantidadTelas <= p.maximo) return p.precio;
    }
    return 0;
}

function getPorcentajeAumento(totalTelas, aumentos) {
    if (!aumentos) return 0;
    for (const i of aumentos) {
        if (totalTelas >= i.piezas_minimas && totalTelas <= i.piezas_maximas) return i.descuento || 0;
    }
    return 0;
}

function computePriceFields(item, { proteccion, descuento, comisionAgente, comisionVendedor, costoInstalacionUnificado, porcentajeAumento, adicionaltuboAncho = 280 }) {
    const cantidad = parseInt(item.cantidad, 10) || 0;
    const alto = parseFloat(item.alto) || 0;
    const ancho = parseFloat(item.ancho) || 0;
    const tipo = item.producto_tipo;

    let costomsquare = parseFloat(item.actual_costo) || 0;
    if (ancho > 2.5) {
        const metros = alto * ancho;
        const extra = metros > 0 ? adicionaltuboAncho / metros : 0;
        costomsquare = costomsquare + extra;
    }

    let costoBase;
    if (tipo === 'Telas') {
        const area = alto < 1 ? 1 : (alto * ancho < 1 ? 1 : alto * ancho);
        costoBase = area * costomsquare * cantidad;
    } else {
        costoBase = costomsquare * cantidad;
    }

    const proteccionMonto = tipo === 'Telas' ? costoBase * ((parseFloat(proteccion) / 100) || 0) : 0;
    const instalacionMonto = tipo === 'Telas' ? costoInstalacionUnificado * cantidad : 0;
    const costoTotal = costoBase + proteccionMonto + instalacionMonto;

    let margenAplicar = parseFloat(item.pormargen ?? item.margen) || 0;
    if (tipo === 'Telas') {
        margenAplicar += parseFloat(porcentajeAumento) || 0;
    }
    margenAplicar = Math.min(margenAplicar, 99.9);
    const descPct = Math.min(parseFloat(descuento) || 0, 99.9);
    const comAgPct = Math.min(parseFloat(comisionAgente) || 0, 99.9);
    const comVePct = Math.min(parseFloat(comisionVendedor) || 0, 99.9);

    const precioConMargen = costoTotal / Math.max(1 - margenAplicar / 100, 0.001) - costoTotal;
    const costomargen = precioConMargen + costoTotal;
    const comdescuento = costomargen / Math.max(1 - descPct / 100, 0.001) - costomargen;
    const costomargendescuento = costomargen + comdescuento;
    const comisinAgente = costomargendescuento / Math.max(1 - comAgPct / 100, 0.001) - costomargendescuento;
    const costomargenvendedor = costomargen + comdescuento + comisinAgente;
    const comisionvendedor = costomargenvendedor / Math.max(1 - comVePct / 100, 0.001) - costomargenvendedor;

    const subtotal = costoBase + proteccionMonto + instalacionMonto + precioConMargen + comdescuento + comisinAgente + comisionvendedor;
    const precioPieza = cantidad > 0 ? subtotal / cantidad : 0;

    return {
        costo_pieza: parseFloat(item.actual_costo) || 0,
        proteccion: proteccionMonto,
        instalacion: instalacionMonto,
        margen: precioConMargen,
        pormargen: parseFloat(item.pormargen ?? item.margen) || 0,
        preciounico: precioPieza,
        preciototal: subtotal,
        comision_agente: comisinAgente,
        comision_vendedor: comisionvendedor,
        descuento: comdescuento,
    };
}

const emptyForm = {
    id: null,
    idproducto: "",
    cantidad: 1,
    alto: "",
    ancho: "",
    ubicacion: "",
    description: "",
    medidas: "",
    ajusteMargen: "0",
};

export default function VentaProductsEditor({ quoteId, initialProducts, cambios, productCatalog, descuento, onUpdate, comisionVendedor, comisionAgente, proteccion, isAdmin, preciosInstalacion, aumentos, user }) {
    const [products, setProducts] = useState(() => initialProducts.map((p) => ({ ...p })));
    const [deletedIds, setDeletedIds] = useState([]);
    const [saving, setSaving] = useState(false);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [editingIndex, setEditingIndex] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [toleracion, setTolerancia] = useState(0.15);
    const [adicionaltuboAncho, setAdicionaltuboAncho] = useState(280);

    // Sincroniza el estado local cuando los productos cambian desde el servidor (tras guardar)
    useEffect(() => {
        setProducts(initialProducts.map((p) => ({ ...p })));
        setDeletedIds([]);
    }, [initialProducts]);

    // Precio de instalación global y % de aumento se recalculan según la lista actual
    const telasCount = useMemo(() => products.filter((p) => p.producto_tipo === 'Telas').length, [products]);

    // Vista para mostrar: productos guardados muestran su precio almacenado; los nuevos se calculan en vivo
    const displayProducts = useMemo(() => {
        const costoInstalacionUnificado = getPrecioInstalacion(telasCount, preciosInstalacion);
        const porcentajeAumento = getPorcentajeAumento(telasCount, aumentos);
        return products.map((p) => {
            const isNew = !p.id || String(p.id).startsWith("local-");
            if (!isNew) return p;
            const calc = computePriceFields(p, { proteccion, descuento, comisionAgente, comisionVendedor, costoInstalacionUnificado, porcentajeAumento, adicionaltuboAncho });
            return { ...p, ...calc };
        });
    }, [products, telasCount, preciosInstalacion, aumentos, proteccion, descuento, comisionAgente, comisionVendedor, adicionaltuboAncho]);

    const selectedProductInfo = useMemo(
        () => productCatalog.find((p) => String(p.id) === String(form.idproducto)) || null,
        [form.idproducto, productCatalog]
    );

    const openAddModal = () => {
        setEditingIndex(null);
        setForm(emptyForm);
        setTolerancia(0.15);
        setAdicionaltuboAncho(280);
        onOpen();
    };

    const openEditModal = (index) => {
        const p = products[index];
        setEditingIndex(index);
        setForm({
            id: p.id ?? null,
            idproducto: p.idproducto,
            cantidad: p.cantidad,
            alto: p.alto,
            ancho: p.ancho,
            ubicacion: p.ubicacion,
            description: p.description,
            medidas: p.medidas,
            ajusteMargen: "0",
        });
        setTolerancia(0.15);
        setAdicionaltuboAncho(280);
        onOpen();
    };

    const handleSelectProduct = (key) => {
        setForm((prev) => ({ ...prev, idproducto: key }));
    };

    const handleFieldChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveModal = () => {
        if (!form.idproducto) {
            Swal.fire("Aviso", "Selecciona un producto.", "warning");
            return;
        }
        const base = selectedProductInfo || {};
        const isNew = editingIndex == null;

        const normalized = {
            id: form.id,
            idproducto: form.idproducto,
            cantidad: parseInt(form.cantidad, 10) || 1,
            alto: form.alto,
            ancho: form.ancho,
            ubicacion: form.ubicacion,
            description: form.description,
            medidas: form.medidas,
            sku: base.sku,
            producto_tipo: base.tipo,
            producto_nombre: base.nombre,
            actual_costo: base.costo,
        };

        if (isNew) {
            normalized.id = `local-${Date.now()}`;
            const baseMargen = parseFloat(base.margen) || 0;
            const ajuste = parseFloat(form.ajusteMargen) || 0;
            normalized.pormargen = baseMargen + ajuste;
        }

        // Misma lógica de creación de cotización: para telas se regeneran medidas
        // y descripción automáticamente (tanto al agregar como al editar).
        if (base.tipo === 'Telas') {
            const tol = parseFloat(toleracion) || 0;
            const anchoFinal = (parseFloat(form.ancho || 0) + tol).toFixed(2);
            const altoFinal = (parseFloat(form.alto || 0) + tol).toFixed(2);
            normalized.medidas = `${anchoFinal}x${altoFinal}m`;
            normalized.description = `Persianas Manuales de ${form.ubicacion || ''}, ${normalized.cantidad} pza ${anchoFinal}x${altoFinal}m, ${base.type || ''} ${base.modeloSB || ''}`.trim();
        } else if (isNew) {
            normalized.medidas = base.tamano || "";
            normalized.description = base.descripcion || "";
        }

        setProducts((prev) => {
            if (!isNew) {
                const next = [...prev];
                next[editingIndex] = { ...next[editingIndex], ...normalized };
                return next;
            }
            return [...prev, normalized];
        });

        onOpenChange(false);
        setEditingIndex(null);
        setForm(emptyForm);
    };

    const handleDelete = (index) => {
        const p = products[index];
        if (p.id && !String(p.id).startsWith("local-")) {
            setDeletedIds((prev) => [...prev, p.id]);
        }
        setProducts((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (products.length === 0) {
            Swal.fire("Aviso", "No hay productos para guardar.", "warning");
            return;
        }
        setSaving(true);
        try {
            const costoInstalacionUnificado = getPrecioInstalacion(telasCount, preciosInstalacion);
            const porcentajeAumento = getPorcentajeAumento(telasCount, aumentos);

            const productsToSave = products.map((p) => {
                const isNew = !p.id || String(p.id).startsWith("local-");
                if (isNew) {
                    const calc = computePriceFields(p, { proteccion, descuento, comisionAgente, comisionVendedor, costoInstalacionUnificado, porcentajeAumento, adicionaltuboAncho });
                    return {
                        id: null,
                        idproducto: p.idproducto,
                        cantidad: p.cantidad,
                        alto: p.alto,
                        ancho: p.ancho,
                        ubicacion: p.ubicacion,
                        description: p.description,
                        medidas: p.medidas,
                        ...calc,
                    };
                }
                return {
                    id: p.id,
                    idproducto: p.idproducto,
                    cantidad: p.cantidad,
                    alto: p.alto,
                    ancho: p.ancho,
                    ubicacion: p.ubicacion,
                    description: p.description,
                    medidas: p.medidas,
                };
            });

            const res = await fetch(`/api/ventas/${quoteId}/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products: productsToSave, deletedIds, user }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || data.error || "Error al guardar los productos");
            }

            await Swal.fire({
                title: "Productos actualizados",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });
            setDeletedIds([]);
            onUpdate();
        } catch (error) {
            console.error("Error al guardar productos de la venta:", error);
            Swal.fire("Error", error.message || "No se pudo guardar los productos.", "error");
        } finally {
            setSaving(false);
        }
    };

    const columns = useMemo(() => {
        const cols = [
            { key: "sku", label: "SKU" },
            { key: "medidas", label: "MEDIDAS" },
            { key: "description", label: "DESCRIPCIÓN" },
            { key: "cantidad", label: "CANT." },
            { key: "preciounico", label: "P. UNITARIO" },
            { key: "preciototal", label: "TOTAL" },
        ];
        if (isAdmin) {
            cols.push(
                { key: "proteccion", label: "PROT." },
                { key: "instalacion", label: "INST." },
                { key: "pormargen", label: "MARGEN" },
                { key: "comisiones", label: "COM." },
            );
        }
        cols.push({ key: "acciones", label: "ACCIONES" });
        return cols;
    }, [isAdmin]);

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case "sku":
                return <span className="font-semibold text-gray-700">{item.sku}</span>;
            case "medidas":
                return item.medidas || "-";
            case "description":
                return <div className="max-w-[200px] truncate" title={item.description}>{item.description || "-"}</div>;
            case "cantidad":
                return item.cantidad;
            case "preciounico":
                return <span className="font-bold">${formatCurrency(item.preciounico)}</span>;
            case "preciototal":
                return <span className="font-black text-gray-800">${formatCurrency(item.preciototal)}</span>;
            case "proteccion":
                return <span className="text-blue-600 text-[10px]">${formatCurrency(item.proteccion)}</span>;
            case "instalacion":
                return <span className="text-blue-600 text-[10px]">${formatCurrency(item.instalacion)}</span>;
            case "pormargen":
                return <span className="text-purple-600 text-[10px] font-bold">{item.pormargen != null ? `${item.pormargen}%` : ""}</span>;
            case "comisiones":
                return <span className="text-red-500 text-[10px]">${formatCurrency(Number(item.comision_agente || 0) + Number(item.comision_vendedor || 0))}</span>;
            case "acciones":
                return (
                    <div className="flex gap-1">
                        <Tooltip content="Editar producto" placement="top">
                            <Button isIconOnly size="sm" variant="light" color="primary" onPress={() => openEditModal(products.findIndex((x) => x.id === item.id))}>
                                <EditIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                        <Tooltip content="Eliminar producto" placement="top">
                            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDelete(products.findIndex((x) => x.id === item.id))}>
                                <DeleteIcon className="w-4 h-4" />
                            </Button>
                        </Tooltip>
                    </div>
                );
            default:
                return null;
        }
    };

    // Vista previa dinámica: campos originales vs modificados (solo telas, al editar).
    const buildTelasPreview = () => {
        if (editingIndex == null) return [];
        const original = products[editingIndex];
        if (!original || original.producto_tipo !== 'Telas') return [];
        const tol = parseFloat(toleracion) || 0;
        const cantidad = parseInt(form.cantidad, 10) || 1;
        const anchoFinal = (parseFloat(form.ancho || 0) + tol).toFixed(2);
        const altoFinal = (parseFloat(form.alto || 0) + tol).toFixed(2);
        const nuevos = {
            cantidad: String(cantidad),
            alto: String(form.alto ?? ""),
            ancho: String(form.ancho ?? ""),
            ubicacion: String(form.ubicacion ?? ""),
            medidas: `${anchoFinal}x${altoFinal}m`,
            descripcion: `Persianas Manuales de ${form.ubicacion || ''}, ${cantidad} pza ${anchoFinal}x${altoFinal}m, ${selectedProductInfo?.type || ''} ${selectedProductInfo?.modeloSB || ''}`.trim(),
        };
        const campos = [
            ["Cantidad", "cantidad"],
            ["Alto", "alto"],
            ["Ancho", "ancho"],
            ["Ubicación", "ubicacion"],
            ["Medidas", "medidas"],
            ["Descripción", "descripcion"],
        ];
        return campos
            .map(([label, key]) => {
                const originalVal = original[key] ?? "";
                const nuevoVal = nuevos[key] ?? "";
                if (String(originalVal) === String(nuevoVal)) return null;
                return { label, original: String(originalVal), nuevo: String(nuevoVal) };
            })
            .filter(Boolean);
    };

    return (
        <>
            <Card className="shadow-md border border-gray-200">
                <CardBody className="p-0">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div>
                            <h3 className="font-bold text-lg">Productos de la Venta</h3>
                            <p className="text-xs text-default-400">Puedes modificar el producto, cantidad, medidas, descripción y ubicación. Los precios permanecen bloqueados.</p>
                        </div>
                        <Button color="primary" size="sm" onPress={openAddModal}>
                            Agregar Producto
                        </Button>
                    </div>
                    <Table
                        removeWrapper
                        isCompact
                        aria-label="Tabla de productos de la venta"
                        classNames={{
                            th: "bg-gray-100 text-gray-600 text-[10px] font-bold uppercase h-8 px-3",
                            td: "text-[11px] py-2 px-3 h-10 border-b border-gray-100",
                        }}
                    >
                        <TableHeader columns={columns}>
                            {(column) => (
                                <TableColumn key={column.key}>{column.label}</TableColumn>
                            )}
                        </TableHeader>
                        <TableBody items={displayProducts} emptyContent="Sin productos">
                            {(item) => (
                                <TableRow key={item.id}>
                                    {(columnKey) => (
                                        <TableCell>{renderCell(item, columnKey)}</TableCell>
                                    )}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardBody>
                <CardFooter className="flex justify-end py-3 px-6 bg-gray-50 rounded-b-xl">
                    <Button
                        size="md"
                        color="success"
                        className="font-bold text-white shadow-md px-6"
                        onPress={handleSave}
                        isLoading={saving}
                    >
                        Guardar Cambios
                    </Button>
                </CardFooter>
            </Card>

            {(cambios && cambios.length > 0) && (
                <Card className="shadow-md border border-gray-200">
                    <CardBody className="p-0">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <h3 className="font-bold text-lg">Historial de Cambios (Compras)</h3>
                            <p className="text-xs text-default-400">Campos originales vs modificados</p>
                        </div>
                        <Table
                            removeWrapper
                            isCompact
                            aria-label="Historial de cambios de productos"
                            classNames={{
                                th: "bg-gray-100 text-gray-600 text-[10px] font-bold uppercase h-8 px-3",
                                td: "text-[11px] py-2 px-3 h-10 border-b border-gray-100",
                            }}
                        >
                            <TableHeader>
                                <TableColumn>FECHA</TableColumn>
                                <TableColumn>SKU</TableColumn>
                                <TableColumn>CAMPO</TableColumn>
                                <TableColumn>ORIGINAL</TableColumn>
                                <TableColumn>MODIFICADO</TableColumn>
                                <TableColumn>USUARIO</TableColumn>
                            </TableHeader>
                            <TableBody items={cambios} emptyContent="Sin cambios registrados">
                                {(c) => (
                                    <TableRow key={c.id}>
                                        <TableCell>{formatDate(c.fecha)}</TableCell>
                                        <TableCell className="font-semibold text-gray-700">{c.sku || "-"}</TableCell>
                                        <TableCell>{c.campo}</TableCell>
                                        <TableCell className="text-default-500">{c.valor_original || "-"}</TableCell>
                                        <TableCell className="font-bold text-orange-600">{c.valor_nuevo || "-"}</TableCell>
                                        <TableCell>{c.usuario || "-"}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>
            )}

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>{editingIndex != null ? "Editar Producto" : "Agregar Producto"}</ModalHeader>
                            <ModalBody>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Autocomplete
                                            label="Producto"
                                            labelPlacement="outside"
                                            placeholder="Buscar producto..."
                                            defaultItems={productCatalog}
                                            selectedKey={String(form.idproducto || "")}
                                            isRequired
                                            onSelectionChange={handleSelectProduct}
                                        >
                                            {(prod) => (
                                                <AutocompleteItem key={String(prod.id)} textValue={prod.tipo === 'Telas' ? `${prod.sku} ${prod.type} ${prod.modeloSB} ${prod.colorSB}` : prod.nombre}>
                                                    <span className="text-tiny text-default-500">
                                                        {prod.tipo === 'Telas' ? `${prod.sku} ${prod.type} ${prod.modeloSB} ${prod.colorSB}` : prod.nombre}
                                                    </span>
                                                </AutocompleteItem>
                                            )}
                                        </Autocomplete>
                                    </div>
                                    <Input
                                        label="Cantidad"
                                        labelPlacement="outside"
                                        type="number"
                                        min="1"
                                        value={String(form.cantidad ?? "")}
                                        onValueChange={(v) => handleFieldChange("cantidad", v)}
                                        isRequired
                                    />
                                    {selectedProductInfo?.tipo === 'Telas' && (
                                        <>
                                            <Input
                                                label="Tolerancia"
                                                labelPlacement="outside"
                                                type="number"
                                                step="0.01"
                                                value={String(toleracion)}
                                                onValueChange={(v) => setTolerancia(v)}
                                            />
                                            {editingIndex == null && isAdmin && (
                                                <Input
                                                    label="Incremento por Ancho"
                                                    labelPlacement="outside"
                                                    type="number"
                                                    value={String(adicionaltuboAncho)}
                                                    onValueChange={(v) => setAdicionaltuboAncho(v)}
                                                />
                                            )}
                                            <Input
                                                label="Ancho (m)"
                                                labelPlacement="outside"
                                                type="number"
                                                step="0.01"
                                                value={String(form.ancho ?? "")}
                                                onValueChange={(v) => handleFieldChange("ancho", v)}
                                            />
                                            <Input
                                                label="Alto (m)"
                                                labelPlacement="outside"
                                                type="number"
                                                step="0.01"
                                                value={String(form.alto ?? "")}
                                                onValueChange={(v) => handleFieldChange("alto", v)}
                                            />
                                            <Input
                                                label="Ubicación"
                                                labelPlacement="outside"
                                                value={form.ubicacion || ""}
                                                onValueChange={(v) => handleFieldChange("ubicacion", v)}
                                            />
                                        </>
                                    )}
                                    {editingIndex == null && isAdmin && (
                                        <Input
                                            label="Margen Base (%)"
                                            labelPlacement="outside"
                                            value={String(selectedProductInfo?.margen ?? "")}
                                            isReadOnly
                                            className="opacity-70"
                                        />
                                    )}
                                    {editingIndex == null && (
                                        <Input
                                            label="Ajuste Margen (+/- %)"
                                            labelPlacement="outside"
                                            type="number"
                                            step="0.01"
                                            placeholder="0"
                                            description="Ej: 5 para sumar, -5 para restar"
                                            value={String(form.ajusteMargen ?? "")}
                                            onValueChange={(v) => handleFieldChange("ajusteMargen", v)}
                                        />
                                    )}
                                    {editingIndex != null && selectedProductInfo?.tipo !== 'Telas' && (
                                        <Input
                                            label="Medidas"
                                            labelPlacement="outside"
                                            value={form.medidas || ""}
                                            onValueChange={(v) => handleFieldChange("medidas", v)}
                                        />
                                    )}
                                    {editingIndex != null && selectedProductInfo?.tipo !== 'Telas' && (
                                        <div className="md:col-span-2">
                                            <Textarea
                                                label="Descripción"
                                                labelPlacement="outside"
                                                minRows={2}
                                                value={form.description || ""}
                                                onValueChange={(v) => handleFieldChange("description", v)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {editingIndex != null && selectedProductInfo?.tipo === 'Telas' && (() => {
                                    const preview = buildTelasPreview();
                                    if (preview.length === 0) return null;
                                    return (
                                        <div className="mt-4">
                                            <p className="text-xs font-bold uppercase text-default-500 mb-2">Cambios detectados (original vs modificado)</p>
                                            <div className="rounded-lg border border-default-200 overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-default-100 text-default-500">
                                                        <tr>
                                                            <th className="text-left px-3 py-2 font-medium">Campo</th>
                                                            <th className="text-left px-3 py-2 font-medium">Original</th>
                                                            <th className="text-left px-3 py-2 font-medium">Modificado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {preview.map((r) => (
                                                            <tr key={r.label} className="border-t border-default-100">
                                                                <td className="px-3 py-2 font-medium">{r.label}</td>
                                                                <td className="px-3 py-2 text-default-500">{r.original || "-"}</td>
                                                                <td className="px-3 py-2 font-bold text-orange-600">{r.nuevo || "-"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>Cancelar</Button>
                                <Button color="primary" onPress={handleSaveModal}>Guardar</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
