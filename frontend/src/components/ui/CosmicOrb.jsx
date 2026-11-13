import { useEffect, useRef } from 'react';

export default function CosmicOrb({ size = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const s      = size * window.devicePixelRatio;
    canvas.width  = s;
    canvas.height = s;
    canvas.style.width  = `${size}px`;
    canvas.style.height = `${size}px`;

    let t = 0;
    let raf;

    function draw() {
      ctx.clearRect(0, 0, s, s);
      const cx = s / 2, cy = s / 2, r = s * 0.42;

      // Outer glow ring
      const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.4);
      outerGlow.addColorStop(0, 'rgba(139,92,246,0.15)');
      outerGlow.addColorStop(0.5, 'rgba(99,102,241,0.08)');
      outerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = outerGlow;
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2); ctx.fill();

      // Core sphere gradient — shifts hue over time
      const hue1 = 250 + 20 * Math.sin(t * 0.008);
      const hue2 = 200 + 30 * Math.sin(t * 0.006 + 1);
      const grd  = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
      grd.addColorStop(0,   `hsl(${hue1 + 40},100%,85%)`);
      grd.addColorStop(0.3, `hsl(${hue1},90%,65%)`);
      grd.addColorStop(0.7, `hsl(${hue2},80%,40%)`);
      grd.addColorStop(1,   `hsl(${hue2 - 30},70%,15%)`);
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

      // Iridescent surface swirl
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      for (let i = 0; i < 3; i++) {
        const angle = t * 0.004 + (i * Math.PI * 2) / 3;
        const bx    = cx + Math.cos(angle) * r * 0.35;
        const by    = cy + Math.sin(angle) * r * 0.35;
        const blob  = ctx.createRadialGradient(bx, by, 0, bx, by, r * 0.7);
        blob.addColorStop(0, `hsla(${180 + i * 60 + t * 0.3},100%,80%,0.35)`);
        blob.addColorStop(1, 'transparent');
        ctx.fillStyle = blob;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      ctx.restore();

      // Specular highlight
      const spec = ctx.createRadialGradient(
        cx - r * 0.28, cy - r * 0.28, 0,
        cx - r * 0.28, cy - r * 0.28, r * 0.55
      );
      spec.addColorStop(0, 'rgba(255,255,255,0.55)');
      spec.addColorStop(0.4, 'rgba(255,255,255,0.12)');
      spec.addColorStop(1, 'transparent');
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = spec; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.restore();

      // Orbit ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.005);
      ctx.scale(1, 0.28);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139,92,246,0.4)';
      ctx.lineWidth   = s * 0.018;
      ctx.stroke();
      ctx.restore();

      // Second orbit ring — opposite tilt
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-t * 0.003 + Math.PI / 4);
      ctx.scale(0.28, 1);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.22, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99,102,241,0.25)';
      ctx.lineWidth   = s * 0.012;
      ctx.stroke();
      ctx.restore();

      t++;
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ display: 'block', filter: 'drop-shadow(0 0 24px rgba(139,92,246,0.7))' }}
    />
  );
}
