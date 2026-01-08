"use client";
import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button, Tooltip } from "@nextui-org/react";
import { deleteCookie } from "@/libs/auth/cookie";
import { toast } from "sonner";
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import BreadCrumbComponent from "../breadcrumb/breadcrumb";
import { icons } from "@/libs/icons/icons";
import { handleCloseSesionServer } from "../../libs/closesesion/scripts";

const Sidebar = ({ children, apps }) => {
  const pathname = usePathname();

  // Estado para Móvil (Abrir/Cerrar Drawer)
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Estado para PC (Expandir/Contraer)
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarRef = useRef(null);

  // Cerrar sidebar al hacer clic fuera (Solo móvil)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        window.innerWidth < 1024 && // Solo aplica en móvil
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setSidebarOpen(false);
      }
    };
    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  const handleLogout = () => {
    deleteCookie();
    toast.info("Sesión cerrada");
    handleCloseSesionServer();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* --- Overlay para Móvil --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- Sidebar --- */}
      <aside
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 
          transform transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
          flex flex-col h-full
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0 lg:static
          ${isCollapsed ? "lg:w-20" : "lg:w-72"} 
          w-72
        `}
      >
        {/* --- Header del Sidebar --- */}
        <div className={`
            flex items-center h-16 px-4 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md shrink-0 transition-all duration-300
            ${isCollapsed ? "justify-center" : "justify-between"}
        `}>

          {/* Logo y Título (Se oculta el texto si está colapsado) */}
          <div className="flex items-center gap-2 text-white overflow-hidden">
            <div className="bg-primary-500 p-1.5 rounded-lg shrink-0 transition-transform hover:scale-105">
              <LayoutDashboard size={20} className="text-white" />
            </div>

            <h1 className={`
                text-lg font-bold tracking-tight whitespace-nowrap transition-all duration-300 origin-left
                ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"}
            `}>
              Smart Blinds
            </h1>
          </div>

          {/* Botón Cerrar (Móvil) */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </Button>

          {/* Botón Colapsar (PC) */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex text-slate-400 hover:text-white transition-transform ${isCollapsed ? "rotate-180" : ""}`}
          >
            <ChevronLeft size={20} />
          </Button>
        </div>

        {/* --- Navegación --- */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {apps.map((app) => (
            <div key={app.name} className="group">
              {/* Título de Categoría (Apps) */}
              <div className={`
                  px-3 mb-2 flex items-center text-xs font-semibold text-slate-500 uppercase tracking-wider transition-all duration-300
                  ${isCollapsed ? "justify-center" : "justify-between"}
              `}>
                {isCollapsed ? (
                  // Si está colapsado, mostramos un separador o icono pequeño
                  <div className="h-0.5 w-4 bg-slate-700 rounded-full my-2" />
                ) : (
                  <span className="flex items-center gap-2 truncate animate-in fade-in duration-300">
                    {React.createElement(
                      icons.find((i) => i.name === app.icon)?.component || ChevronDown,
                      { size: 14 }
                    )}
                    {app.name}
                  </span>
                )}
              </div>

              {/* Lista de Módulos */}
              <ul className="space-y-1">
                {app.modules.map((mod) => {
                  const Icon = icons.find((i) => i.name === mod.icon)?.component;
                  const isActive = pathname === `/inicio/${mod.ruta}`;

                  // El Link base
                  const LinkContent = (
                    <Link
                      prefetch={false}
                      href={`/inicio/${mod.ruta}`}
                      onClick={() => isSidebarOpen && setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                        ${isActive
                          ? "bg-primary-600 text-white shadow-md shadow-primary-900/20"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                        }
                        ${isCollapsed ? "justify-center" : ""}
                      `}
                    >
                      {Icon && (
                        <Icon
                          size={20}
                          className={`shrink-0 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}
                        />
                      )}

                      {!isCollapsed && (
                        <span className="truncate animate-in fade-in slide-in-from-left-2 duration-200">
                          {mod.nombre}
                        </span>
                      )}

                      {/* Indicador activo cuando está colapsado */}
                      {isActive && isCollapsed && (
                        <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />
                      )}

                      {/* Indicador activo cuando está expandido */}
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      )}
                    </Link>
                  );

                  // Si está colapsado, envolvemos en Tooltip
                  return (
                    <li key={mod.ruta}>
                      {isCollapsed ? (
                        <Tooltip
                          content={mod.nombre}
                          placement="right"
                          color="foreground"
                          classNames={{
                            content: "bg-slate-800 text-slate-200 font-medium"
                          }}
                        >
                          {/* Tooltip necesita un wrapper a veces si el hijo es componente custom, pero Link nativo suele ir bien */}
                          <div>{LinkContent}</div>
                        </Tooltip>
                      ) : (
                        LinkContent
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* --- Footer (Usuario) --- */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
          <div className={`
              flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 transition-all duration-300
              ${isCollapsed ? "justify-center flex-col" : "justify-between"}
          `}>
            {/* Avatar / Info Usuario */}
            <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? "justify-center" : ""}`}>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center text-xs text-white font-bold shrink-0 cursor-default shadow-sm">
                SB
              </div>

              {!isCollapsed && (
                <div className="flex flex-col min-w-0 animate-in fade-in duration-300">
                  <span className="text-xs font-semibold text-white truncate">Usuario</span>
                  <span className="text-[10px] text-slate-400 truncate">Online</span>
                </div>
              )}
            </div>

            {/* Botón Logout */}
            <Tooltip content="Cerrar Sesión" placement={isCollapsed ? "right" : "top"} color="danger">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={handleLogout}
                className={`
                    text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors
                    ${isCollapsed ? "mt-2" : ""}
                `}
              >
                <LogOut size={18} />
              </Button>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* --- Contenido Principal --- */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden bg-slate-50 transition-all duration-300">
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              onPress={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 bg-slate-100"
            >
              <Menu size={20} />
            </Button>

            <div className="flex-1 min-w-0">
              <div className="hidden sm:block">
                <BreadCrumbComponent />
              </div>
              <div className="sm:hidden text-sm font-semibold text-slate-700 truncate">
                Smart Blinds System
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Sidebar;