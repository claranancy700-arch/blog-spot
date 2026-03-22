// starfield.js
// Draw drifting stars and occasional shooting stars on existing canvas.

export default function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) {
    console.warn('starfield canvas not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth * 1.08;
  let h = canvas.height = window.innerHeight * 0.64; // custom half

  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth * 1.08;
    h = canvas.height = window.innerHeight * 0.64;
  });

  class Star {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.size = Math.random() * 1.5 + 0.5;
      this.speed = Math.random() * 0.1 + 0.02; // slower
      this.opacity = Math.random() * 0.5 + 0.5;
      this.twinkleDir = Math.random() < 0.5 ? -1 : 1;
    }
    update() {
      this.y += this.speed;
      this.x += this.speed * 0.2;
      // twinkle
      this.opacity += this.twinkleDir * 0.005;
      if (this.opacity <= 0.3 || this.opacity >= 1) {
        this.twinkleDir *= -1;
      }
      if (this.y > h || this.x > w) this.reset();
    }
    draw() {
      // choose color based on theme class
      const lightTheme = document.documentElement.classList.contains('light-theme');
      ctx.fillStyle = lightTheme ?
        `rgba(255,240,220,${this.opacity * 0.8})` :
        `rgba(255,255,255,${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  class ShootingStar {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * (h / 2);
      this.len = Math.random() * 80 + 10;
      this.speed = Math.random() * 6 + 4;
      this.opacity = 1;
    }
    update() {
      this.x += this.speed;
      this.y += this.speed / 2;
      this.opacity -= 0.01;
      if (this.opacity <= 0) this.reset();
    }
    draw() {
      const lightTheme2 = document.documentElement.classList.contains('light-theme');
      ctx.strokeStyle = lightTheme2 ?
        `rgba(255,240,220,${this.opacity * 0.6})` :
        `rgba(255,255,255,${this.opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.len, this.y - this.len / 2);
      ctx.stroke();
    }
  }

  const stars = [];
  for (let i = 0; i < 150; i++) stars.push(new Star());
  const shootingStars = [];

  function animate() {
    ctx.clearRect(0, 0, w, h);
    stars.forEach(s => { s.update(); s.draw(); });
    if (Math.random() < 0.0002) shootingStars.push(new ShootingStar());
    shootingStars.forEach(ss => { ss.update(); ss.draw(); });
    if (shootingStars.length > 10) shootingStars.splice(0, 1);
    requestAnimationFrame(animate);
  }
  animate();
}
