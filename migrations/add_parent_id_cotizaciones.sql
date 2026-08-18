-- Migración: Agregar columna parent_id a listado_ov para cotizaciones anidadas
-- Ejecutar en la base de datos u835880732_smartblinds

ALTER TABLE listado_ov 
  ADD COLUMN parent_id INT NULL AFTER id,
  ADD INDEX idx_parent_id (parent_id);
