-- Migración: Agregar página de Ventas a la navegación
-- Ejecutar en la base de datos u835880732_smartblinds

-- 1. Insertar la página "Ventas" en la tabla views
-- Asumiendo que el id máximo actual + 1 es seguro, ajusta el id según sea necesario
INSERT INTO views (apps, page, url, icon, position)
VALUES ('Operaciones', 'Ventas', 'sistema/ventas', 'ShoppingCart', 6);

-- 2. Asignar la página a todos los perfiles existentes
-- Obtén el id de la página recién insertada
SET @page_id = LAST_INSERT_ID();

-- Inserta en perfil_view para cada perfil existente (ajusta los ids de perfil según tu BD)
INSERT INTO perfil_view (idPerfil, idPage)
SELECT id, @page_id FROM user_profile;
