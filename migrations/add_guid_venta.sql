-- Migración: Agregar columnas guid y numero_venta a listado_ov
-- Ejecutar en la base de datos u835880732_smartblinds

ALTER TABLE listado_ov 
  ADD COLUMN guid VARCHAR(36) NULL AFTER id,
  ADD COLUMN numero_venta VARCHAR(50) NULL AFTER guid,
  ADD INDEX idx_guid (guid),
  ADD INDEX idx_numero_venta (numero_venta);
