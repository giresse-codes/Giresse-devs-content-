# Synthesized SFX bed for the website-fight edit, driven by the event list exported from fight.js.
# usage: python3 sfx.py events.json out.wav
import sys, json, wave, numpy as np
SR = 44100; DUR = 34.0
out = np.zeros((int(SR * DUR), 2)); rng = np.random.default_rng(5)

def add(sig, t0, g=1.0, pan=0.0):
    i = int(t0 * SR)
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), len(out) - i)
    if n <= 0: return
    out[i:i + n, 0] += sig[:n] * g * (1 - max(pan, 0)); out[i:i + n, 1] += sig[:n] * g * (1 + min(pan, 0))

def tt(d): return np.arange(int(d * SR)) / SR
def lp(x, a):  # one-pole lowpass, a in (0,1]
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def hp(x): return np.diff(x, prepend=0.0)

def thump(d=.22, f0=160, f1=45, dec=18):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * dec)
def crack(d=.05):
    t = tt(d); return hp(rng.standard_normal(len(t))) * np.exp(-t * 90)
def whoosh(d=.22):
    t = np.linspace(0, 1, int(d * SR)); return lp(rng.standard_normal(len(t)), .08) * t ** 2 * 3
def punch(big=False):
    s = np.tanh(2.2 * (thump(.3 if big else .2, 180, 40 if big else 55, 10 if big else 18) + .8 * np.pad(crack(), (0, int(.3 * SR)))[:int((.3 if big else .2) * SR)]))
    return s
def boom(d=1.6, f0=90, f1=28):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 6)
    return np.tanh(1.8 * (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2) + .4 * lp(rng.standard_normal(len(t)), .05) * np.exp(-t * 4)))
def shatter(d=.7):
    s = np.zeros(int(d * SR))
    for _ in range(90):
        i = int(rng.uniform(0, .55) ** 1.6 * SR); L = int(rng.uniform(.004, .02) * SR)
        if i + L < len(s): s[i:i + L] += hp(rng.standard_normal(L)) * np.exp(-np.arange(L) / (L / 3)) * rng.uniform(.2, 1)
    for f in (2900, 4100, 5300):  # glassy ring
        t = tt(d); s += .05 * np.sin(2 * np.pi * f * t) * np.exp(-t * 7)
    return s
def ding():
    t = tt(1.0); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in ((880, 4), (1320, 6), (2640, 9))) / 3
def whistle(d):
    t = tt(d); f = 1900 * np.exp(-t / d * 1.9) + 250 + 30 * np.sin(2 * np.pi * 7 * t)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / d) ** 1.5
    roar = lp(rng.standard_normal(len(t)), .12) * (t / d) ** 2.5 * 2.5
    return .35 * tone + roar

ev = json.load(open(sys.argv[1]))
for e in ev:
    t = e['t']
    if e['type'] == 'meteor':
        add(whistle(t - 1.3), 1.3, .5)
        add(boom(2.2, 110, 26), t, 1.0); add(shatter(.9), t, .5); add(crack(.08), t, .8)
    elif e['type'] == 'hit':
        add(whoosh(), t - .2, .45, -.4); add(whoosh(), t - .19, .45, .4)
        add(punch(), t, .8, -.25); add(punch(), t + .03, .8, .25)
    elif e['type'] == 'jab':
        pan = .35 if int(t * 100) % 2 else -.35
        add(whoosh(.08), t - .08, .3, pan); add(punch(), t, .6, pan)
    elif e['type'] == 'ko':
        add(whoosh(.3), t - .28, .6)
        add(punch(True), t, 1.0); add(boom(1.4), t, .7); add(shatter(), t + .03, .65)
    elif e['type'] == 'round':
        add(ding(), t + .05, .22); add(whoosh(.3), t - .1, .3)
    elif e['type'] == 'end':
        add(boom(2.5, 70, 25), t, .8)
        tp = tt(2.5); pad = sum(np.sin(2 * np.pi * f * tp) for f in (196, 293.7, 392, 587.3)) / 8 * np.clip(tp / .3, 0, 1) * np.clip((2.5 - tp) / 1.2, 0, 1)
        add(pad, t, .5)
out = np.clip(out, -1, 1)
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
