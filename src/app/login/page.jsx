"use client";

import FormLogin from "@/component/auth/login/form";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { FaLock, FaShieldAlt, FaRocket, FaSun, FaBolt } from "react-icons/fa";

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-blue-500 to-blue-500 animate-gradient-x flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos flotantes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 -right-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-500"></div>
      </div>

      {/* Tarjeta principal */}
      <div className={`relative z-10 w-full max-w-6xl transition-all duration-500 ${isMounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[600px]">

            {/* Panel izquierdo - Imagen y branding */}
            <div className="lg:w-2/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-white-600/30"></div>

              {/* Imagen de fondo con efecto */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-gradient-to-tr from-white/10 to-transparent"></div>
              </div>

              <div className="relative z-10 h-full p-8 lg:p-12 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-700 to-white  shadow-blue-200 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FaSun className="text-white text-xl" />
                    </div>
                    <span className="text-2xl font-bold text-white">SmartBlind</span>
                  </div>

                  <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
                    Control Inteligente
                    <span className="block text-3xl font-semibold text-purple-200 mt-2">
                      En tus manos
                    </span>
                  </h1>

                  <p className="text-white/80 mb-8 text-lg">
                    Sistema de gestión automatizada para un estilo de vida más inteligente y eficiente.
                  </p>
                </div>

                {/* Características */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all duration-300 group-hover:translate-x-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                      <FaLock className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Seguridad Total</h3>
                      <p className="text-sm text-white/70">Acceso encriptado de extremo a extremo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all duration-300 group-hover:translate-x-1 delay-100">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <FaBolt className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Control Instantáneo</h3>
                      <p className="text-sm text-white/70">Respuesta en tiempo real</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all duration-300 group-hover:translate-x-1 delay-200">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <FaRocket className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Rendimiento Óptimo</h3>
                      <p className="text-sm text-white/70">Tecnología de vanguardia</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel derecho - Formulario */}
            <div className="lg:w-3/5 bg-gradient-to-br from-white via-white to-gray-50/90 p-8 lg:p-12 flex flex-col justify-center">
              <div className={`max-w-md mx-auto w-full transition-all duration-700 delay-300 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Encabezado del formulario */}
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-700 to-white shadow-lg shadow-blue-200 mb-6">
                    <FaShieldAlt className="text-white text-2xl" />
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-3">
                    Bienvenido de vuelta
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Ingresa tus credenciales para acceder al panel
                  </p>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-2xl p-8 shadow-xl shadow-purple-100/50 border border-gray-100">
                  <FormLogin />

                  {/* Información adicional */}
                  <div className="mt-8 pt-8 border-t border-gray-100">


                    {/* Indicador de seguridad */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Conexión segura • SSL encriptado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Efecto de partículas decorativas */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/10 to-transparent"></div>
    </div>
  );
}