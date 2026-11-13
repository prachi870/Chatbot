import { useEffect, useRef } from 'react';

const STAR_COUNT  = 200;
const NEBULA_COUNT = 4;

export default function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let raf;

    // ── Resize ──────────────────────────────────────────────
    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Stars ───────────────────────────────────────────────
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.4 + 0.2,
      speed: Math.random() * 0.18 + 0.04,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      hue:   Math.random() > 0.85 ? 200 + Math.random() * 60 : 220,
    }));

    // ── Shooting stars ───────────────────────────────────────
    const shooters = [];
    function spawnShooter() {
      shooters.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        len: Math.random() * 120 + 60,
        speed: Math.random() * 8 + 6,
        angle: Math.PI / 5 + Math.random() * 0.3,
        life: 1,
        decay: Math.random() * 0.02 + 0.015,
      });
    }
    setInterval(spawnShooter, 3000);

    // ── Nebula blobs ─────────────────────────────────────────
    const nebulae = Array.from({ length: NEBULA_COUNT }, (_, i) => ({
      x:  (i % 2 === 0 ? 0.2 : 0.75) * canvas.width + (Math.random() - 0.5) * 200,
      y:  (i < 2 ? 0.25 : 0.7) * canvas.height + (Math.random() - 0.5) * 100,
      r:  Math.random() * 220 + 180,
      hue: [260, 200, 280, 180][i],
      phase: Math.random() * Math.PI * 2,
    }));

    // ── Draw ─────────────────────────────────────────────────
    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      const bg = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.4, 0,
        canvas.width * 0.5, canvas.height * 0.4, canvas.width * 0.8
      );
      bg.addColorStop(0, '#06080f');
      bg.addColorStop(1, '#02030a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nebulae
      nebulae.forEach((nb) => {
        const pulse = 0.08 + 0.04 * Math.sin(t * 0.0005 + nb.phase);
        const grd   = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r);
        grd.addColorStop(0, `hsla(${nb.hue},80%,55%,${pulse})`);
        grd.addColorStop(0.5, `hsla(${nb.hue},60%,35%,${pulse * 0.4})`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(nb.x, nb.y, nb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Stars
      stars.forEach((s) => {
        s.twinkle += s.twinkleSpeed;
        s.y -= s.speed;
        if (s.y < -2) { s.y = canvas.height + 2; s.x = Math.random() * canvas.width; }

        const alpha = 0.5 + 0.5 * Math.sin(s.twinkle);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},80%,90%,${alpha})`;
        ctx.fill();

        // Glow for bigger stars
        if (s.r > 1.0) {
          const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
          glow.addColorStop(0, `hsla(${s.hue},80%,90%,${alpha * 0.4})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Shooting stars
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.x += Math.cos(sh.angle) * sh.speed;
        sh.y += Math.sin(sh.angle) * sh.speed;
        sh.life -= sh.decay;
        if (sh.life <= 0) { shooters.splice(i, 1); continue; }

        const tx  = sh.x - Math.cos(sh.angle) * sh.len;
        const ty  = sh.y - Math.sin(sh.angle) * sh.len;
        const grd = ctx.createLinearGradient(tx, ty, sh.x, sh.y);
        grd.addColorStop(0, 'transparent');
        grd.addColorStop(1, `rgba(200,210,255,${sh.life * 0.9})`);
        ctx.strokeStyle = grd;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(sh.x, sh.y);
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
