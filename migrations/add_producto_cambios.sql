-- Migración: Tabla de historial de cambios de productos (original vs modificado)
-- Ejecutar en la base de datos u835880732_smartblinds

CREATE TABLE IF NOT EXISTS producto_cambios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idCotizacion INT NOT NULL,
    idProductoOv INT NOT NULL,
    sku VARCHAR(255) NULL,
    campo VARCHAR(100) NOT NULL,
    valor_original VARCHAR(500) NULL,
    valor_nuevo VARCHAR(500) NULL,
    usuario VARCHAR(255) NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cotizacion (idCotizacion),
    INDEX idx_producto_ov (idProductoOv)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
