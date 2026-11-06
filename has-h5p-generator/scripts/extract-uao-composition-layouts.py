#!/usr/bin/env python3
"""Extract only safe H5P.Shape layout elements from the ten UAO composition packages."""
from __future__ import annotations

import io
import json
import sys
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

EXPECTED = [f"composicion-{index:02d}" for index in range(1, 11)]
ELEMENT_FIELDS = (
    "x",
    "y",
    "width",
    "height",
    "backgroundOpacity",
    "buttonSize",
    "displayAsButton",
    "goToSlideType",
    "invisible",
)


def extract_package(archive: ZipFile, template_id: str) -> dict:
    basename = template_id + ".h5p"
    matches = [name for name in archive.namelist() if PurePosixPath(name).name.lower() == basename]
    if len(matches) != 1:
        raise ValueError(f"Expected one nested package for {template_id}; found {len(matches)}")

    with ZipFile(io.BytesIO(archive.read(matches[0]))) as package:
        content = json.loads(package.read("content/content.json"))

    slides = content.get("presentation", {}).get("slides", [])
    if len(slides) != 9:
        raise ValueError(f"{template_id} must contain exactly 9 composition slides")

    output_slides = []
    for slide in slides:
        shapes = []
        for element in slide.get("elements", []):
            action = element.get("action") or {}
            library = action.get("library", "")
            if not library.startswith("H5P.Shape"):
                continue

            source_params = action.get("params") or {}
            shape = source_params.get("shape")
            if not isinstance(shape, dict):
                continue

            item = {key: element[key] for key in ELEMENT_FIELDS if key in element}
            item["action"] = {
                "library": library,
                "metadata": {"contentType": "Shape", "license": "U"},
                "params": {
                    "type": source_params.get("type", "rect"),
                    "shape": shape,
                    **({"line": source_params["line"]} if isinstance(source_params.get("line"), dict) else {}),
                },
            }
            # subContentId is deliberately omitted; the H5P build pass creates fresh IDs.
            shapes.append(item)

        output_slides.append(shapes)

    return {"slides": output_slides}


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: extract-uao-composition-layouts.py <plantillas-uao-html-h5p.zip> <output.json>")

    archive_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    layouts = {}
    with ZipFile(archive_path) as archive:
        for template_id in EXPECTED:
            layouts[template_id] = extract_package(archive, template_id)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(layouts, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    element_count = sum(len(slide) for layout in layouts.values() for slide in layout["slides"])
    print(f"templates={len(layouts)} slides={sum(len(x['slides']) for x in layouts.values())} shape_elements={element_count} output_bytes={output_path.stat().st_size}")


if __name__ == "__main__":
    main()
