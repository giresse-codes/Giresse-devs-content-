# Word-level alignment without Whisper: syllable onsets from the vocal band + DP assignment of words to onsets.
# usage: python3 align.py <audio.wav> <words.json(out)>
import sys, json, wave, numpy as np
w = wave.open(sys.argv[1]); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, w.getnchannels()).mean(1) / 32768
hop = 256; fps = sr / hop
fr = np.lib.stride_tricks.sliding_window_view(x, 2048)[::hop] * np.hanning(2048)
sp = np.abs(np.fft.rfft(fr, axis=1)); f = np.fft.rfftfreq(2048, 1 / sr)
band = np.log1p(sp[:, (f > 250) & (f < 3500)])
flux = np.maximum(np.diff(band, axis=0), 0).sum(1); flux = np.concatenate([[0], flux])
flux = np.convolve(flux, np.hanning(5) / np.hanning(5).sum(), 'same'); flux /= flux.max()
peaks = [i for i in range(2, len(flux) - 2) if flux[i] == flux[i - 2:i + 3].max() and flux[i] > .14]
on_t = np.array(peaks) / fps; on_s = flux[peaks]

def syl(word):
    v = 'aeiouyéèëêàâäôöûüïîáíóúñ'; w = word.lower().strip("(),.?'"); n, prev = 0, False
    for c in w:
        isv = c in v
        if isv and not prev: n += 1
        prev = isv
    return max(1, n)

def assign(words, a, b):
    # candidate onsets in [a, b); expected position from cumulative syllables
    idx = [i for i, t in enumerate(on_t) if a <= t < b]
    syls = [syl(wd) for wd in words]; tot = sum(syls) + 1
    exp = [a + (b - a) * .92 * sum(syls[:k]) / tot for k in range(len(words))]
    if len(idx) < len(words):  # not enough onsets: fall back to expected positions
        return exp
    INF = 1e9; n, m = len(words), len(idx)
    D = np.full((n + 1, m + 1), INF); D[0, :] = 0; B = np.zeros((n + 1, m + 1), int)
    for k in range(1, n + 1):
        for j in range(k, m + 1):
            t, s = on_t[idx[j - 1]], on_s[idx[j - 1]]
            c = abs(t - exp[k - 1]) * 6 - .8 * s
            qs = [q for q in range(k - 1, j) if k == 1 or on_t[idx[q - 1]] <= t - .1]
            if not qs: continue
            best = min(qs, key=lambda q: D[k - 1, q])
            D[k, j] = D[k - 1, best] + c; B[k, j] = best
    if not np.isfinite(D[n, n:]).any() or D[n, n:].min() >= INF: return exp
    j = int(np.argmin(D[n, n:])) + n; out = []
    for k in range(n, 0, -1): out.append(on_t[idx[j - 1]]); j = B[k, j]
    return out[::-1]

SEG = json.load(open('segments.json'))   # [{a, b, text, ad?}]
res = []
for s in SEG:
    wl = s['text'].split(' ')
    ts = assign(wl, s['a'], s['b'])
    res += [{'w': wd, 't': round(float(t), 3), 'seg': i, 'ad': s.get('ad', 0)} for i, (wd, t) in [(SEG.index(s), z) for z in zip(wl, ts)]]
json.dump(res, open(sys.argv[2], 'w'), ensure_ascii=False, indent=0)
print(len(on_t), 'onsets;', len(res), 'words')
