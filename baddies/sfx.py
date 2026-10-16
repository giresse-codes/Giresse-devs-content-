# Soft UI sound design for the Baddies edit (driven by the event list from baddies.js).
import sys, json, wave, numpy as np
SR = 44100; DUR = 18.2
out = np.zeros((int(SR * DUR), 2)); rng = np.random.default_rng(3)
def add(sig, t0, g=1.0, pan=0.0):
    i = int(t0 * SR); n = min(len(sig), len(out) - i)
    if i < 0 or n <= 0: return
    out[i:i + n, 0] += sig[:n] * g * (1 - max(pan, 0)); out[i:i + n, 1] += sig[:n] * g * (1 + min(pan, 0))
def tt(d): return np.arange(int(d * SR)) / SR
def lp(x, a):
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def swoosh(d=.35):
    t = np.linspace(0, 1, int(d * SR)); return lp(rng.standard_normal(len(t)), .05) * np.sin(np.pi * t) ** 2 * 2.2
def thud(f0=110, f1=55, d=.25):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 25); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16)
def tick(f=2200, d=.03):
    t = tt(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 180)
def key():
    t = tt(.04); return lp(rng.standard_normal(len(t)), .25) * np.exp(-t * 120)
def pop():
    t = tt(.18); f = 500 + 700 * (1 - np.exp(-t * 40)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
for e in json.load(open(sys.argv[1])):
    t, k = e['t'], e['type']
    if k == 'key': add(key(), t, .25, (rng.random() - .5) * .6)
    elif k == 'enter': add(thud(160, 90, .12), t, .4); add(tick(1500), t, .15)
    elif k == 'swoosh': add(swoosh(), t - .2, .35)
    elif k == 'stamp': add(thud(), t, .8); add(lp(rng.standard_normal(int(.05 * SR)), .3) * np.exp(-tt(.05) * 60), t, .35)
    elif k == 'plane': add(swoosh(.8), t, .25, .3)
    elif k == 'click': add(tick(1800), t, .3); add(pop(), t + .03, .2)
    elif k == 'twist': add(thud(90, 40, .9), t, .7); add(swoosh(.5), t - .4, .4)
    elif k == 'pop': add(pop(), t, .35)
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
