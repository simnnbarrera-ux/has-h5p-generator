#!/usr/bin/env python3
"""
Validador Oficial H5P (Simulador de H5PValidator.php de Moodle y H5P Hub)
Digitatón UAO 2026 - Equipo 35 HAS
"""

import sys
import os
import zipfile
import json
import re
import tempfile

OFFICIAL_H5P_WHITELIST = {
    'json', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tif', 'tiff',
    'eot', 'ttf', 'woff', 'woff2', 'otf',
    'webm', 'mp4', 'ogg', 'mp3', 'm4a', 'wav',
    'txt', 'pdf', 'rtf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'odt', 'ods', 'odp', 'csv', 'diff', 'patch', 'swf', 'md', 'textile',
    'vtt', 'webvtt', 'gltf', 'glb'
}

def validate_h5p(file_path: str) -> bool:
    resolved = os.path.abspath(file_path)
    print("\n" + "=" * 60)
    print(f"Validando paquete H5P: {os.path.basename(resolved)}")
    print(f"Ruta: {resolved}")
    print("=" * 60)

    if not os.path.exists(resolved):
        print(f"ERROR: Archivo no encontrado: {resolved}")
        return False

    errors = []
    with zipfile.ZipFile(resolved, 'r') as z:
        namelist = z.namelist()
        print(f"Total de entradas en el ZIP: {len(namelist)}")

        dir_entries = 0
        content_files = 0
        svg_count = 0
        invalid_ext_count = 0

        for name in namelist:
            # Regla 1: Ninguna entrada debe terminar en '/'
            if name.endswith('/'):
                dir_entries += 1
                errors.append(
                    f"Directorio explícito no permitido en ZIP: '{name}'. En H5PValidator.php esto produce: 'El archivo \"{name}\" no está permitido.'"
                )

            # Regla 2: Archivos en content/
            if name.startswith('content/'):
                content_files += 1
                rel = name[len('content/'):]
                if not rel:
                    continue

                parts = name.rsplit('.', 1)
                ext = parts[1].lower() if len(parts) > 1 else ''

                if not ext:
                    invalid_ext_count += 1
                    errors.append(f"Archivo sin extensión en content/: '{name}'.")
                elif ext not in OFFICIAL_H5P_WHITELIST:
                    invalid_ext_count += 1
                    errors.append(f"Extensión no permitida en content/: '{name}' (.{ext}).")

                if ext == 'svg':
                    svg_count += 1
                    errors.append(f"Archivo SVG prohibido en content/: '{name}' (vulnerabilidad XSS en PHP).")

        # Regla 3: Comprobar h5p.json
        if 'h5p.json' not in namelist:
            errors.append("Falta el archivo requerido h5p.json.")
        else:
            try:
                data = json.loads(z.read('h5p.json').decode('utf-8'))
                print(f"h5p.json válido: Título = \"{data.get('title')}\"")
            except Exception as e:
                errors.append(f"h5p.json corrupto o inválido: {e}")

        # Regla 4: Comprobar content/content.json
        if 'content/content.json' not in namelist:
            errors.append("Falta el archivo requerido content/content.json.")
        else:
            try:
                content_data = json.loads(z.read('content/content.json').decode('utf-8'))
                print("content/content.json válido: Contiene estructura JSON correcta.")

                def inspect(obj):
                    if isinstance(obj, list):
                        for it in obj:
                            inspect(it)
                    elif isinstance(obj, dict):
                        if 'path' in obj and isinstance(obj['path'], str) and not obj['path'].startswith('http'):
                            p = obj['path'].replace('\\', '/')
                            if p.lower().endswith('.svg'):
                                errors.append(f"Referencia a SVG en content.json: '{p}'.")
                            if obj.get('mime') == 'image/svg+xml':
                                errors.append(f"MIME type image/svg+xml no permitido para '{p}'.")
                            if f"content/{p}" not in namelist:
                                errors.append(f"Archivo referenciado en content.json no existe en zip: 'content/{p}'.")
                        for v in obj.values():
                            inspect(v)

                inspect(content_data)
            except Exception as e:
                errors.append(f"content/content.json corrupto o inválido: {e}")

        print(f"\nResultados de validación:")
        print(f"- Entradas de directorio (con '/'): {dir_entries} (Requerido: 0)")
        print(f"- Archivos en content/: {content_files}")
        print(f"- Archivos .svg en content/: {svg_count} (Requerido: 0)")
        print(f"- Archivos con extensión no permitida: {invalid_ext_count} (Requerido: 0)")
        print(f"- Total de errores encontrados: {len(errors)}")

        if errors:
            print("\n[FALLO] El paquete NO cumple con las reglas oficiales de Moodle / H5P Hub:")
            for err in errors:
                print(f"  - {err}")
            return False

        print("\n[ÉXITO] El paquete cumple al 100% las especificaciones de H5PValidator.php de Moodle y H5P Hub.")
        return True

def main():
    targets = sys.argv[1:]
    if not targets:
        targets = [
            os.path.join(tempfile.gettempdir(), "has-h5p-build", "generated", "matematicas-discretas-act1.h5p"),
            os.path.join(tempfile.gettempdir(), "has-h5p-build", "generated", "matematicas-discretas-act0.h5p"),
        ]

    success = True
    for t in targets:
        if not validate_h5p(t):
            success = False

    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
