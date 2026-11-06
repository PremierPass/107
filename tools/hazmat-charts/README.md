# Hazmat chart corrections

Scripts that fix specific errors in the original ChatGPT chart posters while keeping the artwork. Run them from the repository root:

```
pip install pillow opencv-python-headless
python3 tools/hazmat-charts/fix_nonbulk.py
python3 tools/hazmat-charts/fix_cargo.py
python3 tools/hazmat-charts/fix_ton.py
python3 tools/hazmat-charts/fix_intermodal.py
python3 tools/hazmat-charts/previews.py   # .webp copies and docs/chart-previews
```

Each script reads `images/<name>.png` (the untouched original) and writes `images/<name>_corrected.png`. The `.webp` copies used on the pages are resized to the original `.webp` size. The text uses TeX Gyre Heros Cn (`/usr/share/texmf/fonts/opentype/public/tex-gyre/`).

See `docs/hazmat-chart-inventory.md` for every error found, what was changed, and the charts that still need repair.
