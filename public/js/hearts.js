// public/js/hearts.js
// Continuously spawns small floating hearts that drift up the screen.

(function () {
  const layer = document.getElementById('hearts-layer');
  if (!layer) return;

  const HEART_CHARS = ['❤️', '💕', '💗', '💖'];

  function spawnHeart() {
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.textContent = HEART_CHARS[Math.floor(Math.random() * HEART_CHARS.length)];

    const size = 14 + Math.random() * 20;
    const left = Math.random() * 100;
    const duration = 7 + Math.random() * 8;
    const drift = (Math.random() - 0.5) * 160;

    heart.style.left = `${left}vw`;
    heart.style.fontSize = `${size}px`;
    heart.style.animationDuration = `${duration}s`;
    heart.style.setProperty('--drift', `${drift}px`);

    layer.appendChild(heart);

    setTimeout(() => heart.remove(), duration * 1000 + 500);
  }

  // Spawn a gentle, ongoing stream of hearts.
  setInterval(spawnHeart, 900);
  // A little starter burst so the page doesn't feel empty on load.
  for (let i = 0; i < 6; i++) {
    setTimeout(spawnHeart, i * 300);
  }
})();
