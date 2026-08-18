import { redirect } from "next/navigation";
import { validateCookie } from "@/libs/usercontroller/usercontroller";
import VentasTable from "./components/ventasTable";

export default async function VentasPage() {
    const id = await validateCookie();
    const user = id.value;
    if (!user) {
        return redirect("/login");
    }

    const res = await fetch(process.env.FRONTEND_URL + "/api/ventas");
    const data = await res.json();
    const result = data.data ? data.data : [];

    return (
        <div>
            <VentasTable initialData={result} />
        </div>
    );
}
