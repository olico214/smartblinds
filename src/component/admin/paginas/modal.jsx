"use client";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { useState } from "react";
import { toast } from "sonner";
import { icons } from "@/libs/icons/icons";

export default function ModalEditview({ page, apps }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [nombre, setNombre] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState(""); // Nombre del icono seleccionado

  const [app, setApp] = useState("");
  const [id, setId] = useState(0);

  const handleOpen = () => {
    if (page) {
      setId(page.id);
      setApp(page.apps);
      setNombre(page.page);
      setUrl(page.url);
      setIcon(page.icon);
    } else {
      setId(0);
      setNombre("");
      setUrl("");
      setIcon("");
      setApp("");
    }
    onOpen();
  };

  const handleSave = async (onClose) => {
    const data = {
      nombre: nombre,
      url: url,
      app: app,
      id: id,
      icon: icon,
    };

    if (!nombre || !url || !app || !icon) {
      toast.error("Debe llenar todos los campos", {
        duration: 2000,
      });
      return;
    }

    let link;
    if (id == 0) {
      link = "/api/admin/paginas";
    } else {
      link = "/api/admin/paginas/" + id;
    }
    const response = await fetch(link, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.ok) {
      toast.success(id === 0 ? "Página creada con éxito" : "Página actualizada con éxito", {
        duration: 2000,
      });
      onClose();
      // Recargar la página para reflejar los cambios
      window.location.reload();
    } else {
      toast.error("Error al guardar la página", {
        duration: 2000,
      });
    }
  };

  return (
    <>
      <Button onPress={handleOpen} size="sm" color="primary" variant="ghost">
        {page?.id ? "Editar" : "Nuevo Registro"}
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="5xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {id === 0 ? "Nueva Página" : "Editar Página"}
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-4 gap-4 ">
                  <div>
                    <Select
                      label="Aplicaciones"
                      selectedKeys={[app]}
                      variant="bordered"
                      onChange={(e) => {
                        setApp(e.target.value);
                      }}
                    >
                      {apps.map((app) => (
                        <SelectItem key={app.name}>{app.name}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Input
                      label="Nombre"
                      name="nombre"
                      variant="bordered"
                      value={nombre}
                      onChange={(e) => {
                        setNombre(e.target.value);
                      }}
                    />
                  </div>

                  <div>
                    <Input
                      label="URL"
                      name="url"
                      variant="bordered"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                      }}
                    />
                  </div>

                  <div>
                    <Select
                      label="Icono"
                      selectedKeys={[icon]}
                      variant="bordered"
                      onChange={(e) => {
                        setIcon(String(e.target.value));
                      }}
                    >
                      {icons.map(({ name, component: IconComponent }) => (
                        <SelectItem key={name} textValue={name}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="text-lg" />
                            {name}
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
                <Button color="primary" onPress={() => handleSave(onClose)}>
                  Guardar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
