/* =========================================================
   С ДНЁМ РОЖДЕНИЯ, СНЕЖАНА — интерактив
   ========================================================= */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- появление секций ---------- */

  const revealItems = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((el) => el.classList.add("in"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    revealItems.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- конфетти ---------- */

  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  const COLORS = ["#c44f79", "#e58aa7", "#a996c9", "#b99650", "#f0c8b3", "#f6dde6", "#fdf4ef"];

  let width = 0;
  let height = 0;
  let particles = [];
  let frameId = null;
  let lastTime = 0;

  const resizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, { passive: true });

  const loop = (time) => {
    frameId = null;
    const delta = Math.min((time - lastTime) / 16.667 || 1, 3);
    lastTime = time;

    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];

      p.vx *= 0.993;
      p.vy = p.vy * 0.994 + 0.17 * delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.rotation += p.spin * delta;
      p.life -= 0.006 * delta;

      if (p.life <= 0 || p.y > height + 60 || p.x < -90 || p.x > width + 90) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size * 0.28, p.size, p.size * 0.56);
      }

      ctx.restore();
    }

    if (particles.length) {
      frameId = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  };

  const burst = (x, y, count = 100, power = 1) => {
    if (reduceMotion) return;

    if (particles.length > 420) {
      particles.splice(0, particles.length - 420);
    }

    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35;
      const speed = (4 + Math.random() * 9) * power;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed * (0.6 + Math.random() * 0.8),
        vy: Math.sin(angle) * speed * (0.75 + Math.random() * 0.7),
        size: 4 + Math.random() * 7,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.35,
        shape: Math.random() < 0.28 ? "circle" : "rect",
        life: 1
      });
    }

    if (!frameId) {
      lastTime = performance.now();
      frameId = requestAnimationFrame(loop);
    }
  };

  document.querySelectorAll("[data-confetti]").forEach((button) => {
    button.addEventListener("click", () => {
      const rect = button.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 110, 1.05);
    });
  });

  if (!reduceMotion) {
    window.setTimeout(() => {
      burst(width * 0.5, height * 0.58, 90, 0.95);
    }, 900);
  }

  /* ---------- торт и свечи ---------- */

  const candles = [...document.querySelectorAll(".candle")];
  const cake = document.querySelector(".cake");
  const cakeMessage = document.getElementById("cake-message");
  const cakeLive = document.getElementById("cake-live");
  const blowAllButton = document.getElementById("blow-all");
  const relightButton = document.getElementById("relight");

  let wasAllOut = false;
  let blowTimers = [];

  const clearBlowTimers = () => {
    blowTimers.forEach((timer) => window.clearTimeout(timer));
    blowTimers = [];
  };

  const refreshCake = () => {
    let outCount = 0;

    candles.forEach((candle, index) => {
      const isOut = candle.classList.contains("out");
      if (isOut) outCount += 1;
      candle.setAttribute("aria-label", `Свеча ${index + 1}: ${isOut ? "зажечь" : "задуть"}`);
    });

    const allOut = outCount === candles.length;

    cakeMessage.classList.toggle("is-visible", allOut);
    blowAllButton.disabled = allOut;

    if (allOut && !wasAllOut) {
      cakeLive.textContent = "Все свечи задуты. Желание загадано!";
      if (cake) {
        const rect = cake.getBoundingClientRect();
        burst(rect.left + rect.width / 2, rect.top + rect.height * 0.3, 130, 1.2);
      }
    }

    if (!allOut) {
      cakeLive.textContent = "";
    }

    wasAllOut = allOut;
  };

  candles.forEach((candle) => {
    candle.addEventListener("click", () => {
      candle.classList.toggle("out");
      refreshCake();
    });
  });

  blowAllButton.addEventListener("click", () => {
    const remaining = candles.filter((candle) => !candle.classList.contains("out"));
    if (!remaining.length) return;

    if (reduceMotion) {
      remaining.forEach((candle) => candle.classList.add("out"));
      refreshCake();
      return;
    }

    remaining.forEach((candle, index) => {
      const timer = window.setTimeout(() => {
        candle.classList.add("out");
        refreshCake();
      }, index * 190);
      blowTimers.push(timer);
    });
  });

  relightButton.addEventListener("click", () => {
    clearBlowTimers();
    candles.forEach((candle) => candle.classList.remove("out"));
    refreshCake();
  });

  refreshCake();
})();
