import ViewPageComponent from "@/component/admin/paginas/views";
import { getData } from "./scripts";
import DragPages from "@/component/admin/paginas/drag";
import ModalEditview from "@/component/admin/paginas/modal";

export default async function PerfilComponent() {
  const pages = await getData();
  const apps = [
    { name: "Sistema" },
    { name: "Administracion" },

  ];

  return (
    <div>
      <ModalEditview apps={apps} />
      <DragPages pages={pages} apps={apps} />
    </div>
  );
}
