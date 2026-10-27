import { useState } from 'react';
import { useTranslation } from 'react-i18next';
function luminance(rgb: number[]) { return rgb.map(x => { const s = x / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; }).reduce((a, x, i) => a + x * [.2126, .7152, .0722][i], 0); }
function hslRgb(h: number, l: number) { const a = .65 * Math.min(l, 1 - l); return [0, 8, 4].map(n => { const k = (n + h / 30) % 12; return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255); }); }
export default function ContrastLab() {
  const { t } = useTranslation(); const [hue, setHue] = useState(26); const [light, setLight] = useState(64);
  const rgb = hslRgb(hue, light / 100); const bgL = luminance([40, 40, 40]); const fgL = luminance(rgb); const ratio = (Math.max(fgL, bgL) + .05) / (Math.min(fgL, bgL) + .05);
  return <section className="lab"><div className="lab-preview" style={{ color: `rgb(${rgb.join(',')})` }}><span className="mono">Aa / 01</span><p>{t('sample')}</p><code>rgb({rgb.join(', ')})</code></div><div className="lab-controls"><h2>{t('contrast')}</h2><p>{t('contrastIntro')}</p><label htmlFor="hue">{t('hue')} <output>{hue}°</output></label><input id="hue" type="range" min="0" max="360" value={hue} onChange={e => setHue(+e.target.value)}/><label htmlFor="light">{t('lightness')} <output>{light}%</output></label><input id="light" type="range" min="0" max="100" value={light} onChange={e => setLight(+e.target.value)}/><div className="ratio" aria-live="polite"><strong>{ratio.toFixed(2)}:1</strong><span>{t('ratio')}<br/>{t(ratio >= 4.5 ? 'accessible' : 'inaccessible')}</span></div><button className="text-button" onClick={() => { setHue(26); setLight(64); }}>{t('reset')} ↺</button></div></section>;
}
