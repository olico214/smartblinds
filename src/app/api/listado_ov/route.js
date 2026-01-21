import { NextResponse } from "next/server";
import pool from "@/libs/mysql-safe";

// OBTENER la lista de cotizaciones con nombres de cliente y usuario
export async function GET() {
    try {
        const query = `
            SELECT 
                ov.id,
                ov.estatus,
                ov.createdDate,
                c.nombre AS cliente_nombre,
                u.fullname AS usuario_nombre,
                uAgent.fullname AS nombre_agente
            FROM 
                listado_ov AS ov
            LEFT JOIN 
                clientes AS c ON ov.idCliente = c.id
            LEFT JOIN 
                users_data AS u ON ov.idUser = u.id
            LEFT JOIN 
                users_data AS uAgent ON ov.idAgente = uAgent.id
                where ov.estatus='Nuevo'
            ORDER BY 
                ov.id DESC;
        `;
        const [result] = await pool.query(query);
        return NextResponse.json({ ok: true, data: result });
    } catch (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const authorization = req.headers.get("Authorization");
        const user = authorization.split(" ")[1];
        const { idCliente, idUser, idTipoproyecto, id_envio, idAgente, nombreProyecto, lineaCotizada } = await req.json();

        if (!idCliente || !idTipoproyecto || !lineaCotizada) { // idUser también debería ser requerido
            return NextResponse.json({ ok: false, error: "Cliente, linea Cotizada y tipo de proyecto son requeridos." }, { status: 400 });
        }

        // Usamos una variable que contendrá el nombre final, ya sea el proporcionado o el generado.
        let finalNombreProyecto = nombreProyecto;

        // Si no se proporcionó un nombre, lo generamos.
        if (!finalNombreProyecto || finalNombreProyecto.trim() === '') {

            // --- MEJORA: Ejecutar consultas en paralelo para mayor eficiencia ---
            const [
                [canalYCliente], // Desestructuramos para obtener el primer elemento del array de resultados
                [tipoProyectoInfo],
                [countResult]
            ] = await Promise.all([
                pool.query(`
                    SELECT t1.nombre as canal, t0.tipo as tipocliente FROM clientes t0
                    LEFT JOIN canal_venta t1 ON t0.selected_canal_venta = t1.id
                    WHERE t0.id = ?
                `, [idCliente]),
                pool.query(`SELECT nombre FROM tipo_proyecto WHERE id = ?`, [idTipoproyecto]),
                pool.query(`SELECT count(*) as total FROM listado_ov`) // CORREGIDO: Sin valores extra
            ]);

            if (!canalYCliente || !tipoProyectoInfo) {
                return NextResponse.json({ ok: false, error: "No se encontraron datos para generar el nombre (cliente o tipo de proyecto inválido)." }, { status: 404 });
            }
            // CORREGIDO: Lógica para generar la fecha con padding de ceros
            const hoy = new Date();
            const mes = String(hoy.getMonth() + 1).padStart(2, '0'); // getMonth() es base 0 (Ene=0)
            const dia = String(hoy.getDate()).padStart(2, '0');      // getDate() para el día del mes

            // CORREGIDO: Lógica de formato según tu comentario
            const tipo = (tipoProyectoInfo[0].nombre.replace(" ", "") || '').substring(0, 3).toUpperCase();
            const canal = (canalYCliente[0].canal || '').substring(0, 2).toUpperCase();
            const cliente = (canalYCliente[0].tipocliente || '').substring(0, 2).toUpperCase();
            const folio = countResult[0].total + 1;
            finalNombreProyecto = `${tipo}${canal}${cliente}${mes}${dia}-${folio}`;
        }

        const query = `
            INSERT INTO listado_ov (idCliente, idUser, idAgente, idTipoproyecto, id_envio, estatus, createdDate, nombreProyecto, linea_cotizada,createdBy)
            VALUES (?, ?, ?, ?, ?, 'Nuevo', NOW(), ?, ?,?)
        `;

        // CORREGIDO: Usar la variable 'finalNombreProyecto' que contiene el nombre correcto.
        const values = [idCliente, idUser, idAgente, idTipoproyecto, id_envio || null, finalNombreProyecto, lineaCotizada, user];

        const [result] = await pool.query(query, values);

        return NextResponse.json({ ok: true, id: result.insertId, message: "Cotización creada" });

    } catch (error) {
        console.error("Error al crear cotización:", error); // Es buena práctica loguear el error en el servidor
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}