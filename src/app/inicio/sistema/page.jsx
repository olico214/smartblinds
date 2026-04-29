import { redirect } from "next/navigation";
import { validateCookie } from "@/libs/usercontroller/usercontroller";
import DashboardSmartBlinds from "./components/dashboard";

export default async function SistemaPAge() {
    const id = await validateCookie();
    const user = id.value;
    if (!user) {
        return redirect("/login");
    }

    return (
        <div>
            <DashboardSmartBlinds />
        </div>
    );
}
