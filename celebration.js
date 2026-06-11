const CELEBRATION_PARTICLES = ['🔥', '✨', '💥', '⭐', '🎉'];

function celebrateHabitComplete(x, y, habitId) {
  spawnParticles(x, y);

  if (habitId) {
    requestAnimationFrame(() => {
      const card = document.querySelector(`.habit-card[data-habit-id="${habitId}"]`);
      if (card) {
        card.classList.add('habit-celebrate');
        setTimeout(() => card.classList.remove('habit-celebrate'), 700);
      }
    });
  }
}

function celebrateAtElement(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  celebrateHabitComplete(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function spawnParticles(cx, cy) {
  const layer = document.getElementById('celebration-layer');
  if (!layer) return;

  for (let i = 0; i < 16; i++) {
    const particle = document.createElement('span');
    particle.className = 'celebration-particle';
    particle.textContent = CELEBRATION_PARTICLES[i % CELEBRATION_PARTICLES.length];

    const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.4;
    const distance = 50 + Math.random() * 70;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 40;

    particle.style.left = `${cx}px`;
    particle.style.top = `${cy}px`;
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--rot', `${Math.random() * 360}deg`);
    particle.style.animationDelay = `${Math.random() * 0.08}s`;

    layer.appendChild(particle);
    particle.addEventListener('animationend', () => particle.remove());
  }

  for (let i = 0; i < 8; i++) {
    const spark = document.createElement('span');
    spark.className = 'celebration-spark';
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 50;
    spark.style.left = `${cx}px`;
    spark.style.top = `${cy}px`;
    spark.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
    spark.style.background = ['#ff6b35', '#ff9500', '#ffd700', '#ff4500'][i % 4];
    layer.appendChild(spark);
    spark.addEventListener('animationend', () => spark.remove());
  }
}
