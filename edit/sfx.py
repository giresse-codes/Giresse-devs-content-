# Synthesizes the SFX bed (riser, impacts, whooshes) aligned to the edit's cuts. Output: stereo 44.1k wav.
import sys, wave, numpy as np
SR = 44100; DUR = 26.5
out = np.zeros((int(SR * DUR), 2))
rng = np.random.default_rng(3)

def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR); n = min(len(sig), len(out) - i)
    out[i:i + n, 0] += sig[:n] * gain * (1 - max(pan, 0))
    out[i:i + n, 1] += sig[:n] * gain * (1 + min(pan, 0))

def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a[i] * (v - acc) if hasattr(a, '__len__') else a * (v - acc); y[i] = acc
    return y

def whoosh(d, up=True):
    n = int(d * SR); t = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    cut = (0.02 + 0.5 * t ** 2) if up else (0.5 * (1 - t) ** 2 + 0.02)
    env = np.sin(np.pi * t) ** 2 if not up else t ** 2.5 * (1 - np.clip((t - .97) / .03, 0, 1))
    return lowpass(noise, cut) * env

def boom(d=1.6, f0=95, f1=34):
    n = int(d * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 2.6)
    click = rng.standard_normal(n) * np.exp(-t * 60) * .5
    return np.tanh((body + click) * 1.8) * .9

# intro riser into the drop at 3.0, impact on the drop
add(whoosh(1.5, up=True), 1.5, .55)
add(boom(), 3.0, .75)
# transitions
for t, g, p in [(6.5, .35, -.3), (10.25, .35, .3), (12.0, .22, -.2), (13.5, .3, .2), (14.5, .35, -.3), (18.25, .35, .3), (19.15, .22, -.2), (20.0, .3, .2), (21.0, .25, 0)]:
    add(whoosh(.45, up=False), t - .2, g, p)
# outro: swell + impact on the logo
add(whoosh(1.0, up=True), 21.0, .45)
add(boom(2.4, 80, 30), 22.0, .8)

# outro pad: soft detuned chord sustaining under the logo until the end
n = int(4.0 * SR); t = np.arange(n) / SR
pad = sum(np.sin(2 * np.pi * f * t) + np.sin(2 * np.pi * f * 1.003 * t) for f in (110, 164.8, 220, 329.6, 440)) / 10
pad *= np.clip(t / .4, 0, 1) * np.clip((4.0 - t) / 1.6, 0, 1)
add(pad, 22.0, .22)

out = np.clip(out, -1, 1)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
