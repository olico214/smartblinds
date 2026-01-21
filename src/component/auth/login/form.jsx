"use client";

import React, { useState } from "react";
import { Form, Input, Button } from "@nextui-org/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FaEnvelope, FaLock, FaArrowRight, FaUser } from "react-icons/fa";
import { motion } from "framer-motion";

export default function FormLogin() {
  const [action, setAction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const route = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const respuesta = await response.json();

      if (respuesta.ok) {
        toast.success("¡Bienvenido! Accediendo al sistema...");
        setTimeout(() => {
          route.push("/inicio");
        }, 1500);
      } else {
        toast.error("Credenciales incorrectas. Inténtalo de nuevo.");
      }
    } catch (error) {
      toast.error("Error de conexión. Verifica tu internet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      className="space-y-6"
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Input
          isRequired
          errorMessage="Por favor ingresa un email válido"
          label="Correo Electrónico"
          className="w-full"
          labelPlacement="outside"
          name="email"
          variant="bordered"
          placeholder="tucorreo@ejemplo.com"
          type="email"
          startContent={
            <div className={`transition-all duration-300 ${emailFocus ? 'text-purple-600' : 'text-gray-400'}`}>
              <FaEnvelope />
            </div>
          }
          onFocus={() => setEmailFocus(true)}
          onBlur={() => setEmailFocus(false)}
          classNames={{
            input: "text-lg py-6",
            label: "text-gray-700 font-medium mb-2",
            inputWrapper: `transition-all duration-300 ${emailFocus
              ? 'border-purple-500 bg-purple-50 shadow-sm shadow-purple-100'
              : 'border-gray-200 hover:border-gray-300'}`,
          }}
          radius="lg"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Input
          isRequired
          errorMessage="Contraseña inválida"
          className="w-full"
          variant="bordered"
          label="Contraseña"
          labelPlacement="outside"
          name="contraseña"
          type="password"
          placeholder="••••••••"
          startContent={
            <div className={`transition-all duration-300 ${passwordFocus ? 'text-purple-600' : 'text-gray-400'}`}>
              <FaLock />
            </div>
          }
          onFocus={() => setPasswordFocus(true)}
          onBlur={() => setPasswordFocus(false)}
          classNames={{
            input: "text-lg py-6",
            label: "text-gray-700 font-medium mb-2",
            inputWrapper: `transition-all duration-300 ${passwordFocus
              ? 'border-purple-500 bg-purple-50 shadow-sm shadow-purple-100'
              : 'border-gray-200 hover:border-gray-300'}`,
          }}
          radius="lg"
        />
      </motion.div>

      {/* Opciones adicionales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-between items-center"
      >
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
          />
          <span className="ml-2 text-sm text-gray-600">Recordar sesión</span>
        </label>

        <a
          href="#"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </motion.div>

      {/* Botón de envío */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="pt-2"
      >
        <Button
          color="primary"
          type="submit"
          isLoading={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-white text-black font-semibold text-lg py-7 rounded-xl hover:shadow-lg hover:shadow-purple-200 transition-all duration-300 hover:scale-[1.02]"
          endContent={!isLoading && <FaArrowRight className="ml-2" />}
        >
          {isLoading ? "Verificando..." : "Iniciar Sesión"}
        </Button>
      </motion.div>


    </Form>
  );
}