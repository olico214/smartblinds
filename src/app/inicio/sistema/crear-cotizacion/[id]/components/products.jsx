"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Card,
    CardHeader,
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
    Switch,
    AutocompleteItem,
    Autocomplete,
    Textarea
} from "@nextui-org/react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

// --- Iconos ---
const DeleteIcon = (props) => (
    <svg aria-hidden="true" fill="none" focusable="false" height="1em" role="presentation" viewBox="0 0 20 20" width="1em" {...props}>
        <path d="M10 11V12M10 8V9M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
);
const SaveIcon = (props) => (
    <svg {...props} aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export default function CotizacionProducts({ preciosInstalacion, quoteId, quoteStatus, initialProducts, productCatalog, onUpdate, descuento, comisionVendedor, comisionAgente, proteccion, isAdmin, aumentos }) {
    const route = useRouter();
    const [products, setProducts] = useState([]);
    const [toleracion, setTolerancia] = useState(0.15)

    const [precioFinalManual, setPrecioFinalManual] = useState("");
    const [precioFinalError, setPrecioFinalError] = useState("");
    const [incluyeIVA, setIncluyeIVA] = useState(false);

    const [newProductForm, setNewProductForm] = useState({
        idProducto: "",
        cantidad: 1,
        alto: "",
        ancho: "",
        margen: "",
        usarMargen: true,
        ubicacion: ""
    });

    const getPrecioInstalacion = (cantidadTelas) => {
        if (cantidadTelas === 0) return 0;
        for (const p of preciosInstalacion) {
            if (cantidadTelas >= p.minimo && cantidadTelas <= p.maximo) return p.precio;
        }
        return 0;
    };

    // --- Lógica de Cálculos ---
    const recalculateAllProducts = (productList) => {
        const cantidadTelas = productList.filter(p => p.producto_tipo === 'Telas').length;
        const totProdTelas = productList.filter(p => p.producto_tipo === 'Telas');
        const totalPiezasGlobal = totProdTelas.length;
        const costoInstalacionUnificado = getPrecioInstalacion(cantidadTelas);

        const getPorcentajeAumento = (totalItems) => {
            if (!aumentos) return 0;
            for (const i of aumentos) {
                if (totalItems >= i.piezas_minimas && totalItems <= i.piezas_maximas) return i.descuento || 0;
            }
            return 0;
        };
        const porcentajeAumento = getPorcentajeAumento(totalPiezasGlobal);

        return productList.map(item => {
            let costoBaseProducto = (item.producto_tipo === 'Telas')
                ? ((parseFloat(item.alto) < 1 ? 1 : (parseFloat(item.alto) * parseFloat(item.ancho) < 1 ? 1 : parseFloat(item.alto) * parseFloat(item.ancho))) * (item.actual_costo || 0)) * item.cantidad
                : (item.actual_costo || 0) * item.cantidad;

            let proteccionMonto = (item.producto_tipo === 'Telas') ? costoBaseProducto * ((parseFloat(proteccion) / 100) || 0) : 0;
            const instalacionMonto = (item.producto_tipo === 'Telas') ? costoInstalacionUnificado * item.cantidad : 0;
            const costoTotal = costoBaseProducto + proteccionMonto + instalacionMonto;

            // Uso del margen configurado manualmente en el formulario o del producto
            let margenAplicar = parseFloat(item.margen) || 0;
            if (item.producto_tipo === 'Telas') {
                margenAplicar = margenAplicar + parseFloat(porcentajeAumento);
            }
            const precioConMargen = (costoTotal / (1 - (margenAplicar / 100)) - costoTotal);
            const costomargen = precioConMargen + costoTotal
            const comdescuento = (costomargen / (1 - (parseFloat(descuento) / 100 || 0)) - costomargen);
            const costomargendescuento = costomargen + comdescuento
            const comisinAgente = (costomargendescuento / (1 - (parseFloat(comisionAgente) / 100 || 0)) - costomargendescuento);
            const costomargenvendedor = costomargen + comdescuento + comisinAgente;
            const comisionvendedor = (costomargenvendedor / (1 - (parseFloat(comisionVendedor) / 100 || 0)) - costomargenvendedor);


            const subtotalLinea = parseFloat(costoBaseProducto) + parseFloat(proteccionMonto) + parseFloat(instalacionMonto) + parseFloat(precioConMargen) + parseFloat(comdescuento) + parseFloat(comisinAgente) + parseFloat(comisionvendedor);


            let finalSubtotal = subtotalLinea;


            return {
                ...item,
                calculated: {
                    costoBase: costoBaseProducto,
                    proteccion: proteccionMonto,
                    instalacion: instalacionMonto,
                    margen: precioConMargen,
                    descuento: comdescuento,
                    comisionAgente: comisinAgente,
                    comisionVendedor: comisionvendedor,
                    precioPieza: finalSubtotal / item.cantidad,
                    subtotal: finalSubtotal
                }
            };
        });
    };

    useEffect(() => {
        setProducts(recalculateAllProducts(initialProducts));
    }, [initialProducts, proteccion, descuento, comisionVendedor, comisionAgente, aumentos]);

    const selectedProductInfo = useMemo(() => productCatalog.find(p => p.id == newProductForm.idProducto), [newProductForm.idProducto, productCatalog]);

    const totals = useMemo(() => {
        const subtotalListPrice = products.reduce((acc, item) => acc + (item.calculated?.subtotal || 0), 0);
        const totalDescuentos = products.reduce((acc, item) => acc + (item.calculated?.descuento || 0), 0);

        const totalProteccion = products.reduce((acc, item) => acc + (item.calculated?.proteccion || 0), 0);
        const totalInstalacion = products.reduce((acc, item) => acc + (item.calculated?.instalacion || 0), 0);
        const totalBase = products.reduce((acc, item) => acc + (item.calculated?.costoBase || 0), 0);
        const totalMargen = products.reduce((acc, item) => acc + (item.calculated?.margen || 0), 0);

        const subtotalNeto = subtotalListPrice - totalDescuentos;

        const precioFinalNum = parseFloat(precioFinalManual) || 0;
        const minPrecioPermitido = subtotalNeto * 0.90;
        const esPrecioManualValido = precioFinalNum > 0 && (!isAdmin && precioFinalNum >= minPrecioPermitido || isAdmin);

        const baseParaCalculo = esPrecioManualValido ? precioFinalNum : subtotalNeto;
        const montoIVA = baseParaCalculo * 0.16;
        const totalFinal = incluyeIVA ? baseParaCalculo + montoIVA : baseParaCalculo;

        return {
            subtotalListPrice,
            totalDescuentos,
            subtotalNeto,
            totalProteccion,
            totalInstalacion,
            totalBase,
            totalMargen,
            minPrecioPermitido,
            baseParaCalculo,
            montoIVA,
            totalFinal
        };
    }, [products, precioFinalManual, isAdmin, incluyeIVA]);

    // --- Handlers ---
    const handleAddProduct = (e) => {
        e.preventDefault();
        if (!selectedProductInfo) return;

        // Ubicación solo si es Telas
        const ubicacionFinal = selectedProductInfo.tipo === 'Telas' ? newProductForm.ubicacion : "";

        const newProductData = {
            id: `local-${Date.now()}`,
            idProducto: newProductForm.idProducto,
            cantidad: parseInt(newProductForm.cantidad, 10),
            alto: parseFloat(newProductForm.alto) || null,
            ancho: parseFloat(newProductForm.ancho) || null,
            actual_costo: parseFloat(selectedProductInfo.costo) || 0,
            margen: newProductForm.margen,
            ubicacion: ubicacionFinal,
            producto_nombre: selectedProductInfo.nombre,
            producto_tipo: selectedProductInfo.tipo,
            description: selectedProductInfo.tipo === "Telas"
                ? `Persianas Manuales de ${ubicacionFinal}, ${newProductForm.cantidad} pza ${(parseFloat(newProductForm.ancho) + parseFloat(toleracion)).toFixed(2)}x${(parseFloat(newProductForm.alto) + parseFloat(toleracion)).toFixed(2)}m, ${selectedProductInfo.type} ${selectedProductInfo.modeloSB}`
                : selectedProductInfo.descripcion,
            newMedidas: selectedProductInfo.tipo === "Telas"
                ? `${(parseFloat(newProductForm.ancho) + parseFloat(toleracion)).toFixed(2)}x${(parseFloat(newProductForm.alto) + parseFloat(toleracion)).toFixed(2)}m`
                : selectedProductInfo.tamano,
            sku: selectedProductInfo.sku
        };
        const updatedList = recalculateAllProducts([...products, newProductData]);
        setProducts(updatedList);
        setNewProductForm({
            idProducto: "",
            cantidad: 1,
            alto: "",
            ancho: "",
            margen: "",
            usarMargen: true,
            ubicacion: ""
        });
    };

    const handleDeleteProduct = (productId) => {
        const filteredList = products.filter(p => p.id !== productId);
        setProducts(recalculateAllProducts(filteredList));
    };


    const handleSaveProducts = async () => {

        const result = await Swal.fire({
            title: '¿Guardar y Finalizar?',
            html: "Estás a punto de guardar los productos. <br>Una vez guardada, la lista quedará en modo de <b>solo lectura</b>.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        });



        if (result.isConfirmed) {

            const productsToSave = products.map(item => ({
                idCotizacion: quoteId,
                idproducto: item.idProducto,
                cantidad: item.cantidad,
                costo_pieza: item.actual_costo,
                proteccion: item.calculated.proteccion,
                instalacion: item.calculated.instalacion,
                margen: item.calculated.margen,
                pormargen: item.margen,
                preciounico: item.calculated.precioPieza,
                preciototal: item.calculated.subtotal,
                alto: item.alto,
                ancho: item.ancho,
                ubicacion: item.ubicacion,
                comision_agente: item.calculated.comisionAgente,
                comision_vendedor: item.calculated.comisionVendedor,
                descuento: item.calculated.descuento,
                newDescription: item.description,
                newMedidas: item.newMedidas
            }));

            const precioNormal = totals.subtotalListPrice;
            const precioReal = precioFinalManual ? parseFloat(precioFinalManual) : totals.totalFinal;
            const iva = incluyeIVA ? totals.montoIVA : 0;

            try {

                const response = await fetch(`/api/cotizacion/${quoteId}/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },

                    body: JSON.stringify({ products: productsToSave, precioNormal, precioReal, iva, descuento, toleracion }),

                });

                if (!response.ok) throw new Error('Error al guardar los productos');



                Swal.fire({

                    title: '¡Cotización Creada!',

                    text: "¿Qué te gustaría hacer ahora?",

                    icon: 'success',

                    showDenyButton: true,

                    confirmButtonText: 'Ver Detalles',

                    denyButtonText: 'Crear Nueva Cotización',

                }).then((result) => {

                    if (result.isConfirmed) route.push(`/inicio/sistema/${quoteId}`);

                    else if (result.isDenied) route.push('/inicio/sistema/crear-cotizacion');

                });

            } catch (error) {

                console.error("Error en handleSaveProducts:", error);

                Swal.fire('Error', 'Hubo un problema al guardar los productos.', 'error');

            }

        }

    };

    const canAddProducts = quoteStatus !== 'Finalizado' && quoteStatus !== 'Cancelado';

    return (
        <div className="space-y-4 font-sans">
            {/* Formulario Añadir Producto */}
            {canAddProducts && (
                <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="pb-0 pt-3 px-4">
                        <h3 className="font-bold text-lg">Añadir Producto</h3>
                    </CardHeader>
                    <CardBody className="py-4 px-4 overflow-visible">
                        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-12 gap-4 align-bottom">

                            {/* Fila 1: Producto, Cantidad, Tolerancia */}
                            <div className="md:col-span-6">
                                <Autocomplete
                                    label="Producto"
                                    labelPlacement="outside"
                                    placeholder="Buscar producto..."
                                    defaultItems={productCatalog}
                                    selectedKey={newProductForm.idProducto}
                                    isRequired
                                    onSelectionChange={(e) => {
                                        const selected = productCatalog.find(p => p.id == e);
                                        setNewProductForm(p => ({
                                            ...p,
                                            idProducto: e,
                                            alto: '',
                                            ancho: '',
                                            margen: selected?.margen || '25.00',
                                            ubicacion: ''
                                        }));
                                    }}
                                >
                                    {(prod) => (
                                        <AutocompleteItem
                                            key={prod.id}
                                            textValue={prod.tipo === 'Telas' ? `${prod.sku} ${prod.type} ${prod.modeloSB} ${prod.colorSB}` : prod.nombre}
                                        >
                                            <span className="text-tiny text-default-500">
                                                {prod.tipo === 'Telas' ? `${prod.sku} ${prod.type} ${prod.modeloSB} ${prod.colorSB}` : prod.nombre}
                                            </span>
                                        </AutocompleteItem>
                                    )}
                                </Autocomplete>
                            </div>

                            <div className="md:col-span-3">
                                <Input
                                    label="Cantidad"
                                    labelPlacement="outside"
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    value={newProductForm.cantidad}
                                    onValueChange={(v) => setNewProductForm(p => ({ ...p, cantidad: v }))}
                                    isRequired
                                />
                            </div>

                            <div className="md:col-span-3">
                                {selectedProductInfo?.tipo === 'Telas' && (
                                    <Input
                                        label="Tolerancia"
                                        labelPlacement="outside"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.15"
                                        value={toleracion}
                                        onChange={(e) => setTolerancia(e.target.value)}
                                        isRequired
                                    />
                                )}
                            </div>

                            {/* Fila 2: Ancho y Alto, Ubicación (Todo Solo para Telas) */}
                            {selectedProductInfo?.tipo === 'Telas' && (
                                <>
                                    <div className="md:col-span-6">
                                        <Input
                                            label="Ancho (m)"
                                            labelPlacement="outside"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={newProductForm.ancho}
                                            onValueChange={(v) => setNewProductForm(p => ({ ...p, ancho: v }))}
                                            isRequired
                                        />
                                    </div>
                                    <div className="md:col-span-6">
                                        <Input
                                            label="Alto (m)"
                                            labelPlacement="outside"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={newProductForm.alto}
                                            onValueChange={(v) => setNewProductForm(p => ({ ...p, alto: v }))}
                                            isRequired
                                        />
                                    </div>

                                    {/* Ubicación exclusiva para Telas */}
                                    <div className="md:col-span-12">
                                        <Textarea
                                            label="Ubicación"
                                            labelPlacement="outside"
                                            placeholder="Sala, Comedor, Recámara Principal..."
                                            minRows={2}
                                            value={newProductForm.ubicacion}
                                            onValueChange={(v) => setNewProductForm(p => ({ ...p, ubicacion: v }))}
                                            isRequired
                                        />
                                    </div>
                                </>
                            )}

                            {/* Fila 3: Margen y Botón */}
                            <div className="md:col-span-4">
                                <Input
                                    label="Margen (%)"
                                    labelPlacement="outside"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={newProductForm.margen}
                                    onValueChange={(v) => setNewProductForm(p => ({ ...p, margen: v }))}
                                    isRequired
                                />
                            </div>

                            <div className="md:col-span-12 flex justify-start mt-2">
                                <Button type="submit" color="primary" className="px-8 font-semibold">
                                    Añadir Producto
                                </Button>
                            </div>

                        </form>
                    </CardBody>
                </Card>
            )}

            {/* Tabla con Totales */}
            <Card className="shadow-md border border-gray-200">
                <CardBody className="p-0">
                    <Table
                        removeWrapper
                        isCompact
                        aria-label="Tabla cotización"
                        classNames={{
                            th: "bg-gray-100 text-gray-600 text-[10px] font-bold uppercase h-8 px-3",
                            td: "text-[11px] py-2 px-3 h-10 border-b border-gray-100",
                        }}
                        bottomContent={
                            <div className="flex flex-col md:flex-row justify-end gap-8 p-6 bg-gray-50 border-t border-gray-200">
                                {/* Desglose */}
                                <div className="text-xs text-gray-500 space-y-1.5 text-right min-w-[200px]">
                                    <p className="font-bold text-gray-400 uppercase text-[10px] mb-2 border-b pb-1">Desglose de Costos</p>
                                    <div className="flex justify-between"><span>Costo Base:</span> <span className="font-medium">${totals.totalBase.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-blue-600"><span>+ Protección:</span> <span className="font-medium">${totals.totalProteccion.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-blue-600"><span>+ Instalación:</span> <span className="font-medium">${totals.totalInstalacion.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-purple-600"><span>+ Margen:</span> <span className="font-medium">${totals.totalMargen.toFixed(2)}</span></div>
                                </div>

                                {/* Totales Finales */}
                                <div className="w-full max-w-[280px] space-y-3 border-l pl-8 border-gray-300">
                                    <div className="flex justify-between items-center text-sm text-gray-600">
                                        <span className="font-semibold">Subtotal Lista</span>
                                        <span className="font-bold text-gray-800">${totals.subtotalListPrice.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm text-red-500">
                                        <span>- Descuentos</span>
                                        <span className="font-bold">-${totals.totalDescuentos.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm border-t border-dashed border-gray-300 pt-2">
                                        <span className="font-bold text-gray-700">Subtotal Neto</span>
                                        <span className="font-bold text-gray-900">${totals.subtotalNeto.toFixed(2)}</span>
                                    </div>

                                    <div className="bg-white p-2 rounded border border-gray-200 mt-2">
                                        <Input
                                            label="Precio Ajustado"
                                            labelPlacement="outside-left"
                                            type="number"
                                            placeholder="0.00"
                                            size="sm"
                                            variant="flat"
                                            value={precioFinalManual}
                                            onValueChange={setPrecioFinalManual}
                                            isInvalid={!!precioFinalError}
                                            errorMessage={precioFinalError}
                                            startContent={<span className="text-gray-400 text-xs">$</span>}
                                            classNames={{ input: "text-right font-bold", label: "text-xs mt-1" }}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-600">IVA (16%)</span>
                                        <Switch size="sm" isSelected={incluyeIVA} onValueChange={setIncluyeIVA} />
                                    </div>

                                    {incluyeIVA && (
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Monto IVA</span>
                                            <span>+${totals.montoIVA.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between w-full font-black text-2xl text-success-700 pt-3 border-t-2 border-gray-200">
                                        <span>Total</span>
                                        <span>${totals.totalFinal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        }
                    >
                        <TableHeader>
                            <TableColumn>PRODUCTO</TableColumn>
                            <TableColumn>MEDIDAS</TableColumn>
                            <TableColumn>DESCRIPCIÓN</TableColumn>
                            <TableColumn>CANT.</TableColumn>
                            <TableColumn>BASE</TableColumn>
                            <TableColumn>PROT.</TableColumn>
                            <TableColumn>INST.</TableColumn>
                            <TableColumn>MARGEN</TableColumn>
                            <TableColumn>DESC.</TableColumn>
                            <TableColumn>COM. AGENTE</TableColumn>
                            <TableColumn>COM. VENDEDOR</TableColumn>
                            <TableColumn>P. UNIT</TableColumn>
                            <TableColumn>SUBTOTAL</TableColumn>
                            <TableColumn>ACCIONES</TableColumn>
                        </TableHeader>
                        <TableBody items={products} emptyContent="Sin productos">
                            {(item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-semibold text-gray-700">{item.sku}</TableCell>
                                    <TableCell>{item.newMedidas}</TableCell>
                                    <TableCell><div className="max-w-[150px] truncate" title={item.description}>{item.description}</div></TableCell>
                                    <TableCell>{item.cantidad}</TableCell>
                                    <TableCell>${(item.calculated?.costoBase || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-blue-600 text-[10px]">+${(item.calculated?.proteccion || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-blue-600 text-[10px]">+${(item.calculated?.instalacion || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-purple-600 text-[10px]">+${(item.calculated?.margen || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-red-500 text-[10px]">+${(item.calculated?.descuento || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-red-500 text-[10px]">+${(item.calculated?.comisionAgente || 0).toFixed(2)}</TableCell>
                                    <TableCell className="text-red-500 text-[10px]">+${(item.calculated?.comisionVendedor || 0).toFixed(2)}</TableCell>
                                    <TableCell className="font-bold bg-gray-50">${(item.calculated?.precioPieza || 0).toFixed(2)}</TableCell>
                                    <TableCell className="font-black text-gray-800">${(item.calculated?.subtotal || 0).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDeleteProduct(item.id)} isDisabled={!canAddProducts}>
                                            <DeleteIcon className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
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
                        onPress={handleSaveProducts}
                        isDisabled={!canAddProducts || products.length === 0}
                        startContent={<SaveIcon className="w-5 h-5" />}
                    >
                        Guardar Cotización
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}