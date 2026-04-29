import { validateCookie } from "@/libs/usercontroller/usercontroller";
import TableProducts from "./components/tableProducts/tableProducts";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";

export default async function ProductosPage() {
    const id = await validateCookie();
    const user = id.value;
    if (!user) {
        return redirect("/login");
    }
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Package size={24} className="text-blue-600" />
                    Productos
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                    Catálogo de productos y gestión de inventario
                </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
                <TableProducts />
            </div>
        </div>
    )
}
