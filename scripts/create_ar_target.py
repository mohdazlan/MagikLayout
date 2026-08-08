#!/usr/bin/env python3
"""Add deterministic LayoutLab branding to the generated AR target artwork."""

from pathlib import Path
import argparse

from PIL import Image, ImageDraw, ImageFont


FONT_REGULAR = "/System/Library/Fonts/Avenir Next.ttc"
FONT_BOLD = "/System/Library/Fonts/Avenir Next.ttc"


def centered_brand(draw: ImageDraw.ImageDraw, width: int) -> None:
    title_font = ImageFont.truetype(FONT_BOLD, 45, index=5)
    badge_font = ImageFont.truetype(FONT_REGULAR, 16, index=2)

    layout = "Layout"
    lab = "Lab"
    suffix = "  AR"
    layout_box = draw.textbbox((0, 0), layout, font=title_font)
    lab_box = draw.textbbox((0, 0), lab, font=title_font)
    suffix_box = draw.textbbox((0, 0), suffix, font=badge_font)
    total = layout_box[2] + lab_box[2] + suffix_box[2]
    x = (width - total) / 2
    y = 144

    draw.text((x, y), layout, font=title_font, fill="#102a43", stroke_width=1, stroke_fill="#102a43")
    x += layout_box[2]
    draw.text((x, y), lab, font=title_font, fill="#c94f12", stroke_width=1, stroke_fill="#c94f12")
    x += lab_box[2]
    draw.text((x, y + 20), suffix, font=badge_font, fill="#0f6f73")


def build(source: Path, output: Path) -> None:
    image = Image.open(source).convert("RGB")
    if image.size != (1448, 1086):
        image = image.resize((1448, 1086), Image.Resampling.LANCZOS)

    draw = ImageDraw.Draw(image)
    centered_brand(draw, image.width)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "PNG", optimize=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    build(args.source, args.output)
