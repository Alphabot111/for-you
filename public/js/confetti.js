// public/js/confetti.js
// A tiny, dependency-free canvas confetti burst, used after "Yes ❤️".

(function () {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COLORS = ['#ff6fb5', '#9b5de5', '#ffd166', '#ffa9d1', '#c792ea'];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  let particles = [];
  let animationId = null;

  function createParticle() {
    return {
      x: canvas.width / 2 + (Math.random() - 0.5) * 120,
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 10 - 6,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      gravity: 0.28 + Math.random() * 0.12,
      life: 0,
      maxLife: 100 + Math.random() * 60,
    };
  }

  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach((p) => {
      if (p.life >= p.maxLife) return;
      alive = true;

      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life += 1;

      const opacity = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(opacity, 0);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });

    particles = particles.filter((p) => p.life < p.maxLife);

    if (alive) {
      animationId = requestAnimationFrame(step);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationId = null;
    }
  }

  window.fireConfetti = function fireConfetti(count = 140) {
    for (let i = 0; i < count; i++) particles.push(createParticle());
    if (!animationId) animationId = requestAnimationFrame(step);
  };
})();
