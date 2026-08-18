import { redirect } from "next/navigation";
import { validateCookie } from "@/libs/usercontroller/usercontroller";
import VentaDetailComponent from "./ventaClientComponent";

export default async function VentaDetailPage({ params }) {
    const { id } = await params;
    const userid = await validateCookie();
    if (!userid.value) {
        return redirect("/login");
    }

    return (
        <div>
            <VentaDetailComponent user={userid.value} id={id} />
        </div>
    );
}
