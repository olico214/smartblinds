"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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

const SIDEBAR_WIDTH = 288; // w-72 en px
const SWIPE_THRESHOLD = 80; // px mínimos para considerar swipe
const MOBILE_BREAKPOINT = 1024;

const Sidebar = ({ children, apps }) => {
  const pathname = usePathname();

  // Estado para Móvil (Abrir/Cerrar Drawer)
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Estado para PC (Expandir/Contraer)
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarRef = useRef(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Prevenir scroll del body cuando el sidebar está abierto en móvil
  useEffect(() => {
    if (isSidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isSidebarOpen, isMobile]);

  // Cerrar sidebar al hacer clic fuera (Solo móvil)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobile &&
        isSidebarOpen &&
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
  }, [isSidebarOpen, isMobile]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  // --- Touch / Swipe handlers ---
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = true;
    setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;

    // Solo permitir swipe hacia la izquierda para cerrar
    if (diff < 0) {
      const offset = Math.max(diff, -SIDEBAR_WIDTH);
      setDragOffset(offset);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const diff = touchCurrentX.current - touchStartX.current;

    if (diff < -SWIPE_THRESHOLD) {
      setSidebarOpen(false);
    }
    setDragOffset(0);
  }, []);

  // Swipe desde el borde izquierdo para abrir
  const edgeSwipeRef = useRef(null);
  const edgeStartX = useRef(0);

  const handleEdgeTouchStart = useCallback((e) => {
    if (e.touches[0].clientX < 30) {
      // Solo si toca en el borde izquierdo
      edgeStartX.current = e.touches[0].clientX;
    } else {
      edgeStartX.current = 0;
    }
  }, []);

  const handleEdgeTouchEnd = useCallback((e) => {
    if (edgeStartX.current > 0 && edgeStartX.current < 30) {
      const endX = e.changedTouches[0].clientX;
      if (endX - edgeStartX.current > SWIPE_THRESHOLD) {
        setSidebarOpen(true);
      }
    }
    edgeStartX.current = 0;
  }, []);

  const handleLogout = () => {
    deleteCookie();
    toast.info("Sesión cerrada");
    handleCloseSesionServer();
  };

  // Calcular transform para drag
  const dragTransform =
    isMobile && isSidebarOpen && dragOffset < 0
      ? `translateX(${dragOffset}px)`
      : "";

  return (
    <div
      className="flex h-screen bg-slate-50 overflow-hidden font-sans"
      onTouchStart={handleEdgeTouchStart}
      onTouchEnd={handleEdgeTouchEnd}
    >
      {/* --- Overlay para Móvil --- */}
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300 animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
          style={{ animationDuration: "200ms" }}
        />
      )}

      {/* --- Sidebar --- */}
      <aside
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 
          transform transition-all duration-300 ease-out shadow-2xl lg:shadow-none
          flex flex-col h-full
          ${isMobile ? (isSidebarOpen ? "translate-x-0" : "-translate-x-full") : "lg:translate-x-0 lg:static"}
          ${!isMobile && (isCollapsed ? "lg:w-20" : "lg:w-72")}
          w-80
          ${isMobile && isSidebarOpen ? "shadow-2xl shadow-black/40" : ""}
        `}
        style={{
          transform: dragTransform || undefined,
          transition: isDragging.current ? "none" : undefined,
          willChange: "transform",
        }}
        // Accesibilidad
        role="navigation"
        aria-label="Sidebar de navegación"
        aria-hidden={isMobile && !isSidebarOpen}
      >
        {/* --- Header del Sidebar --- */}
        <div
          className={`
            flex items-center h-16 px-4 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md shrink-0 transition-all duration-300
            ${!isMobile && isCollapsed ? "justify-center" : "justify-between"}
          `}
        >
          {/* Logo y Título */}
          <div className="flex items-center gap-2 text-white overflow-hidden min-w-0">
            <div className="bg-primary-500 p-1.5 rounded-lg shrink-0 transition-transform hover:scale-105 active:scale-95">
              <LayoutDashboard size={20} className="text-white" />
            </div>

            <h1
              className={`
                text-lg font-bold tracking-tight whitespace-nowrap transition-all duration-300 origin-left
                ${!isMobile && isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"}
              `}
            >
              Smart Blinds
            </h1>
          </div>

          {/* Botón Cerrar (Móvil) */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white active:bg-slate-800 min-w-[44px] min-h-[44px]"
            aria-label="Cerrar menú"
          >
            <X size={22} />
          </Button>

          {/* Botón Colapsar (PC) */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex text-slate-400 hover:text-white transition-transform min-w-[44px] min-h-[44px] ${
              isCollapsed ? "rotate-180" : ""
            }`}
            aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <ChevronLeft size={20} />
          </Button>
        </div>

        {/* --- Navegación --- */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {apps.map((app) => (
            <div key={app.name} className="group">
              {/* Título de Categoría (Apps) */}
              <div
                className={`
                  px-3 mb-2 flex items-center text-xs font-semibold text-slate-500 uppercase tracking-wider transition-all duration-300
                  ${!isMobile && isCollapsed ? "justify-center" : "justify-between"}
                `}
              >
                {!isMobile && isCollapsed ? (
                  <div className="h-0.5 w-4 bg-slate-700 rounded-full my-2" />
                ) : (
                  <span className="flex items-center gap-2 truncate animate-in fade-in duration-300">
                    {React.createElement(
                      icons.find((i) => i.name === app.icon)?.component ||
                        ChevronDown,
                      { size: 14 }
                    )}
                    {app.name}
                  </span>
                )}
              </div>

              {/* Lista de Módulos */}
              <ul className="space-y-1">
                {app.modules.map((mod) => {
                  const Icon =
                    icons.find((i) => i.name === mod.icon)?.component;
                  const isActive = pathname === `/inicio/${mod.ruta}`;

                  const LinkContent = (
                    <Link
                      prefetch={false}
                      href={`/inicio/${mod.ruta}`}
                      onClick={() => isMobile && setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                        min-h-[48px]
                        ${
                          isActive
                            ? "bg-primary-600 text-white shadow-md shadow-primary-900/20"
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 active:bg-slate-800"
                        }
                        ${!isMobile && isCollapsed ? "justify-center" : ""}
                      `}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {Icon && (
                        <Icon
                          size={22}
                          className={`shrink-0 ${
                            isActive
                              ? "text-white"
                              : "text-slate-500 group-hover:text-slate-300"
                          }`}
                        />
                      )}

                      {(!isMobile || !isCollapsed) && (
                        <span className="truncate animate-in fade-in slide-in-from-left-2 duration-200">
                          {mod.nombre}
                        </span>
                      )}

                      {/* Indicador activo cuando está colapsado */}
                      {isActive && !isMobile && isCollapsed && (
                        <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />
                      )}

                      {/* Indicador activo cuando está expandido */}
                      {isActive && (!isMobile || !isCollapsed) && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                      )}
                    </Link>
                  );

                  return (
                    <li key={mod.ruta}>
                      {!isMobile && isCollapsed ? (
                        <Tooltip
                          content={mod.nombre}
                          placement="right"
                          color="foreground"
                          classNames={{
                            content:
                              "bg-slate-800 text-slate-200 font-medium",
                          }}
                        >
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

        {/* --- Footer / Usuario --- */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
          <div
            className={`
              flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 transition-all duration-300
              ${!isMobile && isCollapsed ? "justify-center flex-col" : "justify-between"}
            `}
          >
            {/* Avatar / Info Usuario */}
            <div
              className={`flex items-center gap-3 overflow-hidden ${
                !isMobile && isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center text-sm text-white font-bold shrink-0 cursor-default shadow-sm">
                SB
              </div>

              {(!isMobile || !isCollapsed) && (
                <div className="flex flex-col min-w-0 animate-in fade-in duration-300">
                  <span className="text-xs font-semibold text-white truncate">
                    Usuario
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    Online
                  </span>
                </div>
              )}
            </div>

            {/* Botón Logout */}
            <Tooltip
              content="Cerrar Sesión"
              placement={!isMobile && isCollapsed ? "right" : "top"}
              color="danger"
            >
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={handleLogout}
                className={`
                  text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors
                  min-w-[44px] min-h-[44px]
                  ${!isMobile && isCollapsed ? "mt-2" : ""}
                `}
                aria-label="Cerrar sesión"
              >
                <LogOut size={20} />
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
              className="lg:hidden text-slate-600 bg-slate-100 min-w-[44px] min-h-[44px] active:bg-slate-200"
              aria-label="Abrir menú de navegación"
            >
              <Menu size={22} />
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

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth overscroll-contain">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Sidebar;
