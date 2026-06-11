# -*- coding: utf-8 -*-
# Generates branded SVG cover images per project, patches them into the live
# Supabase content (id-matched, non-destructive) via the same /api/save the admin uses.
# Run with "--save" to actually write to the DB; without it only writes local SVG files.
import json, base64, urllib.request, html, sys
DO_SAVE = "--save" in sys.argv

BASE = "https://saitvizitka.vercel.app"
ACCENT = "#E89B3C"
ACCENT2 = "#F4B86A"
W, H = 1600, 1000

def esc(s): return html.escape(str(s), quote=True)

def motif(cat):
    a = ACCENT
    if cat == "telegram":  # chat bubbles + send arrow
        return f'''
        <g opacity="0.16" fill="{a}">
          <rect x="1040" y="300" width="360" height="150" rx="36"/>
          <rect x="1140" y="490" width="260" height="120" rx="30"/>
        </g>
        <g stroke="{a}" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round" opacity="0.5">
          <path d="M1180 700 l180 -70 l-70 180 l-34 -76 z"/>
        </g>'''
    if cat == "landing":  # stacked sections / browser
        return f'''
        <g opacity="0.14" fill="{a}">
          <rect x="1060" y="280" width="360" height="70" rx="14"/>
          <rect x="1060" y="372" width="260" height="40" rx="10"/>
          <rect x="1060" y="430" width="300" height="40" rx="10"/>
          <rect x="1060" y="520" width="160" height="56" rx="14"/>
        </g>'''
    if cat == "card":  # minimal centered card
        return f'''
        <g opacity="0.14">
          <rect x="1080" y="300" width="320" height="400" rx="28" fill="{a}"/>
          <circle cx="1240" cy="400" r="48" fill="#0E0E12"/>
          <rect x="1140" y="500" width="200" height="22" rx="11" fill="#0E0E12"/>
          <rect x="1170" y="546" width="140" height="18" rx="9" fill="#0E0E12"/>
        </g>'''
    if cat == "automation":  # connected nodes / flow
        return f'''
        <g opacity="0.5" stroke="{a}" stroke-width="4" fill="none">
          <path d="M1080 360 H1240 a40 40 0 0 1 40 40 V520"/>
          <path d="M1280 560 V640 a40 40 0 0 0 40 40 H1400"/>
        </g>
        <g opacity="0.85" fill="{a}">
          <circle cx="1080" cy="360" r="22"/><circle cx="1280" cy="540" r="22"/><circle cx="1400" cy="680" r="22"/>
        </g>'''
    if cat == "web":  # dashboard grid
        return f'''
        <g opacity="0.14" fill="{a}">
          <rect x="1060" y="290" width="170" height="170" rx="20"/>
          <rect x="1250" y="290" width="170" height="80" rx="16"/>
          <rect x="1250" y="390" width="170" height="70" rx="16"/>
          <rect x="1060" y="480" width="360" height="120" rx="20"/>
        </g>'''
    return ""

def svg(p):
    title = esc(p.get("title", ""))
    cat = p.get("cat", "")
    stack = esc(p.get("stack", ""))
    year = esc(p.get("year", ""))
    metric = p.get("metric", "")
    metric_e = esc(metric)
    catlabel = esc(cat.upper())
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="system-ui,Segoe UI,Arial,sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#121218"/><stop offset="1" stop-color="#0A0A0D"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.22" r="0.6">
      <stop offset="0" stop-color="{ACCENT}" stop-opacity="0.22"/><stop offset="1" stop-color="{ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="tg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="{ACCENT2}"/>
    </linearGradient>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.4" fill="#FFFFFF" opacity="0.05"/>
    </pattern>
  </defs>

  <rect width="{W}" height="{H}" fill="url(#bg)"/>
  <rect width="{W}" height="{H}" fill="url(#dots)"/>
  <rect width="{W}" height="{H}" fill="url(#glow)"/>
  {motif(cat)}

  <!-- top meta -->
  <g font-family="JetBrains Mono,Consolas,monospace">
    <circle cx="92" cy="96" r="7" fill="{ACCENT}"/>
    <text x="116" y="103" font-size="26" letter-spacing="3" fill="{ACCENT}">{catlabel}</text>
    <text x="{W-80}" y="103" font-size="26" letter-spacing="2" fill="#5C5C68" text-anchor="end">{year}</text>
  </g>

  <!-- title -->
  <text x="88" y="650" font-size="118" font-weight="700" letter-spacing="-3" fill="url(#tg)">{title}</text>

  <!-- stack -->
  <text x="92" y="730" font-family="JetBrains Mono,Consolas,monospace" font-size="30" fill="#9A9AA6">{stack}</text>

  <!-- metric chip -->
  {f'''<g>
    <rect x="88" y="790" width="{min(620, 60 + len(metric)*22)}" height="70" rx="20" fill="{ACCENT}" opacity="0.14"/>
    <rect x="88" y="790" width="{min(620, 60 + len(metric)*22)}" height="70" rx="20" fill="none" stroke="{ACCENT}" stroke-opacity="0.4"/>
    <text x="120" y="836" font-family="JetBrains Mono,Consolas,monospace" font-size="30" font-weight="600" fill="{ACCENT}">{metric_e}</text>
  </g>''' if metric else ""}

  <rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" rx="0" fill="none" stroke="#FFFFFF" stroke-opacity="0.06"/>
</svg>'''

def data_uri(s):
    b = base64.b64encode(s.encode("utf-8")).decode("ascii")
    return "data:image/svg+xml;base64," + b

# 1) load live content
req = urllib.request.Request(BASE + "/api/load", headers={"Accept": "application/json"})
data = json.loads(urllib.request.urlopen(req, timeout=30).read())["data"]
projects = data.get("projects", [])
print("loaded", len(projects), "projects")

# 2) generate + attach covers (also save individual files for reference)
import os
outdir = os.path.join(os.path.dirname(__file__), "..", "Images", "work")
os.makedirs(outdir, exist_ok=True)
for p in projects:
    s = svg(p)
    with open(os.path.join(outdir, f"{p['id']}.svg"), "w", encoding="utf-8") as f:
        f.write(s)
    p["image"] = data_uri(s)
    print("  cover:", p["id"], p.get("title"), f"({len(p['image'])//1024}KB datauri)")

# 3) save full content back (non-destructive: only added image fields)
if DO_SAVE:
    body = json.dumps({"data": data}).encode("utf-8")
    sreq = urllib.request.Request(BASE + "/api/save", data=body,
        headers={"Content-Type": "application/json"}, method="POST")
    resp = urllib.request.urlopen(sreq, timeout=30)
    print("save:", resp.status, resp.read().decode())
else:
    print("DRY RUN — local SVG files written to Images/work/. Re-run with --save to push to DB.")
