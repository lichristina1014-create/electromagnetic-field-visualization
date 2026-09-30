#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""两个同号点电荷的场线剖面图 → /tmp/fig_lines.svg"""
import numpy as np

C = [np.array([0.0, 0.0]), np.array([0.4802, 0.0])]
Q = 2.0


def Efield(p):
    out = np.zeros(2)
    for c in C:
        r = p - c
        d = float(np.hypot(r[0], r[1]))
        if d < 1e-9:
            continue
        out += Q * r / d ** 3
    return out


def unit(p):
    e = Efield(p)
    n = float(np.hypot(e[0], e[1]))
    return e / n if n > 1e-12 else np.zeros(2)


def trace(p0, h=0.005, nstep=1200):
    p = np.array(p0, float)
    pts = [p.copy()]
    for _ in range(nstep):
        k1 = unit(p); k2 = unit(p + h / 2 * k1)
        k3 = unit(p + h / 2 * k2); k4 = unit(p + h * k3)
        p = p + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        pts.append(p.copy())
        if np.hypot(*Efield(p)) < 4e-3:
            break
        if abs(p[0]) > 0.90 or abs(p[1]) > 0.60:
            break
    return np.array(pts)


W, H = 680, 400
PX0, PX1, PY0, PY1 = 40.0, 640.0, 20.0, 380.0
PW, PH = PX1 - PX0, PY1 - PY0
X0, X1, Y0, Y1 = -0.44, 0.60, -0.318, 0.318
S = min(PW / (X1 - X0), PH / (Y1 - Y0))
CX, CY = (PX0 + PX1) / 2, (PY0 + PY1) / 2
MX = (X0 + X1) / 2


def px(p):
    return (CX + (p[0] - MX) * S, CY - p[1] * S)


def d_of(pts, eps_px=24.0):
    kept, eps = [pts[0]], eps_px / S
    for p in pts[1:]:
        if np.hypot(*(p - kept[-1])) >= eps:
            kept.append(p)
    if not np.allclose(kept[-1], pts[-1]):
        kept.append(pts[-1])
    return ''.join(('M' if i == 0 else 'L') + '%d %d' % px(p) for i, p in enumerate(kept))


paths = []
for c in C:
    for a in np.linspace(0, 2 * np.pi, 13, endpoint=False):
        s = c + 0.011 * np.array([np.cos(a), np.sin(a)])
        pts = trace(s)
        if len(pts) > 3:
            paths.append(d_of(pts))

p_c1, p_c2 = px(C[0]), px(C[1])
p_null = px(np.array([0.4802 / 2, 0.0]))
p_P = px(np.array([0.310, 0.0]))
r_px = 0.310 * S

out = []
A = out.append
A(f'<svg viewBox="0 0 {W} {H}" width="100%" role="img" '
  f'xmlns="http://www.w3.org/2000/svg" '
  f'font-family="PingFang SC,-apple-system,Helvetica,Arial,sans-serif">')
A('<title>两个同号点电荷的场线剖面</title>')
A('<desc>球心 q1 与球外 q3 同为 +2.00 微库仑。场线从两个电荷各自向外发散，'
  '在两者之间被挤开、绕过一个零场点，正是教科书上的同号相斥图形。'
  '零场点在 D/2 = 0.240 米处，落在半径 0.310 米的球面之内。</desc>')
A(f'<line x1="{p_c1[0]:.0f}" y1="{p_c1[1]:.0f}" x2="640" y2="{p_c1[1]:.0f}" '
  f'stroke="#C7D3DA" stroke-width="0.5" stroke-dasharray="5 5"/>')
A(f'<circle cx="{p_c1[0]:.0f}" cy="{p_c1[1]:.0f}" r="{r_px:.0f}" '
  f'fill="#0F9ED5" fill-opacity="0.07" stroke="#156082" stroke-width="0.5" stroke-dasharray="7 5"/>')
for d in paths:
    A(f'<path d="{d}" fill="none" stroke="#E97132" stroke-width="1.1" stroke-opacity="0.9"/>')
for p in (p_c1, p_c2):
    A(f'<circle cx="{p[0]:.0f}" cy="{p[1]:.0f}" r="5.5" fill="#D04A3A"/>')
A(f'<text x="{p_c1[0]-11:.0f}" y="{p_c1[1]-9:.0f}" font-size="13" fill="#8C2F22" stroke="#FFFFFF" stroke-width="3.2" paint-order="stroke" '
  f'text-anchor="end">q₁（球心）</text>')
A(f'<text x="{p_c2[0]:.0f}" y="{p_c2[1]-14:.0f}" font-size="13" fill="#8C2F22" stroke="#FFFFFF" stroke-width="3.2" paint-order="stroke" '
  f'text-anchor="middle">q₃</text>')
A(f'<circle cx="{p_null[0]:.0f}" cy="{p_null[1]:.0f}" r="6" fill="#FFFFFF" '
  f'stroke="#156082" stroke-width="1.6"/>')
A(f'<line x1="{p_null[0]-10:.0f}" y1="{p_null[1]:.0f}" x2="{p_null[0]+10:.0f}" y2="{p_null[1]:.0f}" '
  f'stroke="#156082" stroke-width="1.6"/>')
A(f'<line x1="{p_null[0]:.0f}" y1="{p_null[1]-10:.0f}" x2="{p_null[0]:.0f}" y2="{p_null[1]+10:.0f}" '
  f'stroke="#156082" stroke-width="1.6"/>')
A(f'<text x="{p_null[0]:.0f}" y="{p_null[1]+38:.0f}" font-size="12" fill="#156082" stroke="#FFFFFF" stroke-width="3.2" paint-order="stroke" '
  f'text-anchor="middle">零场点 E = 0　D/2 = 0.240 m</text>')
dy = 14
A(f'<circle cx="{p_P[0]:.0f}" cy="{p_P[1]:.0f}" r="4.5" fill="#D04A3A"/>')
A(f'<line x1="{p_P[0]:.0f}" y1="{p_P[1]+dy:.0f}" x2="{p_P[0]-24:.0f}" y2="{p_P[1]+dy:.0f}" '
  f'stroke="#D04A3A" stroke-width="2.4"/>')
A(f'<path d="M {p_P[0]-34:.0f} {p_P[1]+dy:.0f} L {p_P[0]-23:.0f} {p_P[1]+dy-5:.0f} '
  f'L {p_P[0]-23:.0f} {p_P[1]+dy+5:.0f} Z" fill="#D04A3A"/>')
A(f'<text x="{p_P[0]:.0f}" y="{p_P[1]-10:.0f}" font-size="12.5" fill="#8C2F22" stroke="#FFFFFF" stroke-width="3.2" paint-order="stroke" '
  f'text-anchor="middle">P</text>')
A(f'<text x="{p_c1[0]:.0f}" y="{p_c1[1]+140:.0f}" font-size="12" fill="#156082" '
  f'stroke="#FFFFFF" stroke-width="3.2" paint-order="stroke">'
  f'球面（剖面）R = 0.310 m</text>')
A('</svg>')

svg = '\n'.join(out)
open('/tmp/fig_lines.svg', 'w').write(svg)
print('bytes =', len(svg), ' lines =', len(paths))
