const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let mouseX = -100, mouseY = -100, ringX = -100, ringY = -100;

window.addEventListener('mousemove', (event) => {
  mouseX = event.clientX; mouseY = event.clientY;
  dot.style.left = `${mouseX}px`; dot.style.top = `${mouseY}px`;
});
function animateCursor() {
  ringX += (mouseX - ringX) * .14; ringY += (mouseY - ringY) * .14;
  ring.style.left = `${ringX}px`; ring.style.top = `${ringY}px`;
  requestAnimationFrame(animateCursor);
}
animateCursor();
document.querySelectorAll('a, .project').forEach((item) => {
  item.addEventListener('mouseenter', () => ring.classList.add('hover'));
  item.addEventListener('mouseleave', () => ring.classList.remove('hover'));
});

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), { threshold: .15 });
document.querySelectorAll('.reveal').forEach((section) => observer.observe(section));
