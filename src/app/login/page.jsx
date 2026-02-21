"use client";

import FormLogin from "@/component/auth/login/form";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { FaLock, FaLeaf, FaSun, FaMobileAlt } from "react-icons/fa";

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos simulando luz natural suave */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-amber-200/20 rounded-full filter blur-[100px] opacity-70"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-slate-200/50 rounded-full filter blur-[120px] opacity-50"></div>
      </div>

      {/* Tarjeta principal */}
      <div className={`relative z-10 w-full max-w-6xl transition-all duration-700 ease-out ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <div className="bg-white shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden flex flex-col lg:flex-row min-h-[600px] border border-gray-100">

          {/* Panel izquierdo - Imagen y branding (Estilo premium / Arquitectónico) */}
          <div className="lg:w-2/5 relative overflow-hidden group bg-slate-900">
            {/* Gradiente de fondo base */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950"></div>

            {/* Efecto sutil simulando luz entrando por persianas */}
            <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(180deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]"></div>

            <div className="relative z-10 h-full p-8 lg:p-12 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <FaSun className="text-amber-400 text-xl" />
                  </div>
                  <span className="text-2xl font-bold text-white tracking-wide">SmartBlinds</span>
                </div>

                <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
                  Iluminación
                  <span className="block text-3xl font-light text-amber-400 mt-2">
                    A tu medida
                  </span>
                </h1>

                <p className="text-slate-300 mb-8 text-lg font-light leading-relaxed">
                  Sistema de gestión automatizada para espacios más inteligentes, elegantes y eficientes.
                </p>
              </div>

              {/* Características adaptadas al producto */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <FaMobileAlt className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Control Remoto</h3>
                    <p className="text-sm text-slate-400">Gestiona desde cualquier lugar</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <FaLeaf className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Eficiencia Energética</h3>
                    <p className="text-sm text-slate-400">Optimiza la luz natural y el clima</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <FaLock className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Privacidad Total</h3>
                    <p className="text-sm text-slate-400">Sistemas seguros y encriptados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel derecho - Formulario */}
          <div className="lg:w-3/5 bg-white p-8 lg:p-12 flex flex-col justify-center relative">
            <div className={`max-w-md mx-auto w-full transition-all duration-700 delay-200 ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>

              {/* Encabezado del formulario */}
              <div className="text-center mb-10">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
                  Bienvenido
                </h2>
                <p className="text-slate-500 text-lg">
                  Ingresa tus credenciales para acceder al panel de control
                </p>
              </div>

              {/* Formulario */}
              <div className="bg-white">
                {/* Aquí inyectas tu componente de formulario */}
                <FormLogin />

                {/* Información adicional */}
                <div className="mt-10 pt-8 border-t border-slate-100">
                  {/* Indicador de seguridad minimalista */}
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span>Conexión segura • Encriptación SSL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}