import os
import csv
from datetime import datetime

# Rutas: ajusta según tu estructura
base_dir = os.path.dirname(__file__)
input_path  = os.path.join(base_dir, 'Ojala.csv')    # archivo original
output_path = os.path.join(base_dir, 'Ojala_normalized.csv')  # archivo resultante

# FUNCIONES DE NORMALIZACIÓN
def normalize_whitespace(s):
    if s is None:
        return ''
    return s.strip()

def normalize_date(value):
    """Convierte varias formas comunes a YYYY-MM-DD.
       Si no se puede parsear, devuelve el valor original (o vacío)."""
    v = normalize_whitespace(value)
    if v == '':
        return ''  # se convertirá a "null" después
    # intentos de parseo comunes
    formats = ['%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d', '%Y/%m/%d', '%d.%m.%Y']
    for fmt in formats:
        try:
            dt = datetime.strptime(v, fmt)
            return dt.strftime('%Y-%m-%d')
        except Exception:
            pass
    # si no hizo match, intenta detectar día/mes invertidos (ej. 11/04/25)
    try:
        # último recurso: dateutil podría ayudar, pero aquí regresamos original
        return v
    except Exception:
        return v

def normalize_boolean(value):
    """Convierte representaciones comunes en true/false.
       Devuelve 'true'/'false' en minúsculas o '' si vacío."""
    if value is None:
        return ''
    v = normalize_whitespace(value).lower()
    if v in ('verdadero', 'true', 't', 'si', 'sí', '1', 'y', 'yes'):
        return 'true'
    if v in ('falso', 'false', 'f', 'no', '0', 'n'):
        return 'false'
    # si está vacío, dejar vacío para que se convierta a "null" después
    if v == '':
        return ''
    # por defecto devolver original trimmed
    return v

def normalize_version(value):
    v = normalize_whitespace(value)
    if v == '' or v is None:
        return 'V1'
    return v

# MAPEO: columna -> función de normalización
# Ajusta nombres exactamente como aparecen en la cabecera de tu CSV
NORMALIZERS = {
    'FECHA': normalize_date,
    # ejemplo: si las columnas YT, IG, TT, TH son booleanos (VERDADERO/FALSO)
    'YT': normalize_boolean,
    'IG': normalize_boolean,
    'TT': normalize_boolean,
    'TH': normalize_boolean,
    # Si X es booleano:
    'X': normalize_boolean,
    # Si VERSION está vacío, asignar V1:
    'VERSION': normalize_version,
    # otras columnas se limpian solo de espacios:
    # 'TITULO': normalize_whitespace,   # opcional
}

# LECTURA Y ESCRITURA
with open(input_path, encoding='utf-8', newline='') as fin, \
     open(output_path, 'w', encoding='utf-8', newline='') as fout:

    reader = csv.reader(fin)
    writer = csv.writer(fout, quoting=csv.QUOTE_MINIMAL)

    # Leer cabecera
    try:
        header = next(reader)
    except StopIteration:
        raise SystemExit("El CSV está vacío")

    # Normalizar cabecera (trim)
    header = [h.strip() for h in header]
    writer.writerow(header)

    # Crear índice de columnas por nombre (para aplicar normalización por nombre)
    col_index = {name: idx for idx, name in enumerate(header)}

    # Procesar filas
    for lineno, row in enumerate(reader, start=2):
        # si la fila tiene distinto número de columnas, la completamos con '' o la recortamos
        if len(row) < len(header):
            row = row + [''] * (len(header) - len(row))
        elif len(row) > len(header):
            # recortar excedente (también podrías unirlo en la última columna si corresponde)
            row = row[:len(header)]

        # aplicar normalizadores
        new_row = []
        for idx, cell in enumerate(row):
            col_name = header[idx]
            # limpiar espacios
            cell = normalize_whitespace(cell)
            # si existe normalizador para la columna, aplicar
            norm_fn = NORMALIZERS.get(col_name)
            if norm_fn:
                try:
                    cell = norm_fn(cell)
                except Exception:
                    # si falla normalizar, mantener valor original trim
                    pass
            
            # Agregar la celda procesada a la nueva fila
            new_row.append(cell)

        writer.writerow(new_row)

print("Normalización completada. Archivo guardado en:", output_path)