const projects = [
  { title: "Socket Sorting Robot for Robotics Course Project", link: "https://github.com/isluder/Socket-sorting-robot-mece-444" },
  { title: "Exploring the Market of Laptops through pricing and performance testing", link: "https://github.com/isluder/Exploring-the-Market-of-Laptops-through-Pricing-and-Performance-Testing" },
];

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById("project-list");
  
  if (container) {
    projects.forEach(p => {
      const div = document.createElement("div");
      div.className = "mb-3";
      div.innerHTML = `<h4><a href="${p.link}" target="_blank" rel="noopener noreferrer">${p.title}</a></h4>`;
      container.appendChild(div);
    });
  }
});

// Brain cursor effect
let start = new Date().getTime();

const originPosition = { x: 0, y: 0 };

const last = {
  BrainTimestamp: start,
  BrainPosition: originPosition,
  mousePosition: originPosition
}

const config = {
  BrainAnimationDuration: 1500,
  minimumTimeBetweenBrains: 250,
  minimumDistanceBetweenBrains: 75,
  colors: ["249 146 253", "252 254 255"],
  sizes: ["2.5rem", "2rem", "1.5rem"],
  animations: ["fall-1", "fall-2", "fall-3"]
}

let count = 0;
  
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const selectRandom = items => items[rand(0, items.length - 1)];
const withUnit = (value, unit) => `${value}${unit}`;
const px = value => withUnit(value, "px");
const ms = value => withUnit(value, "ms");

const calcDistance = (a, b) => {
  const diffX = b.x - a.x;
  const diffY = b.y - a.y;
  return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
}

const calcElapsedTime = (start, end) => end - start;

const appendElement = element => document.body.appendChild(element);
const removeElement = (element, delay) => setTimeout(() => {
  if (element && element.parentNode) {
    document.body.removeChild(element);
  }
}, delay);

// Updated createBrain function with brain emoji
const createBrain = position => {
  const brain = document.createElement("span");
  const color = selectRandom(config.colors);
  
  // Use brain emoji 🧠
  brain.innerHTML = "🧠";
  brain.className = "brain";
  
  brain.style.position = "fixed";
  brain.style.left = px(position.x);
  brain.style.top = px(position.y);
  brain.style.fontSize = selectRandom(config.sizes);
  // brain.style.color = `rgb(${color})`;
  brain.style.textShadow = `0px 0px 1.5rem rgb(${color} / 0.5)`;
  brain.style.animationName = config.animations[count++ % 3];
  brain.style.animationDuration = ms(config.BrainAnimationDuration);
  brain.style.pointerEvents = "none";
  brain.style.zIndex = "9999";
  
  appendElement(brain);
  removeElement(brain, config.BrainAnimationDuration);
}

const updateLastBrain = position => {
  last.BrainTimestamp = new Date().getTime();
  last.BrainPosition = position;
}

const updateLastMousePosition = position => last.mousePosition = position;

const adjustLastMousePosition = position => {
  if(last.mousePosition.x === 0 && last.mousePosition.y === 0) {
    last.mousePosition = position;
  }
};

const handleOnMove = e => {
  const mousePosition = { x: e.clientX, y: e.clientY };
  
  adjustLastMousePosition(mousePosition);
  
  const now = new Date().getTime();
  const hasMovedFarEnough = calcDistance(last.BrainPosition, mousePosition) >= config.minimumDistanceBetweenBrains;
  const hasBeenLongEnough = calcElapsedTime(last.BrainTimestamp, now) > config.minimumTimeBetweenBrains;
  
  if(hasMovedFarEnough || hasBeenLongEnough) {
    createBrain(mousePosition);
    updateLastBrain(mousePosition);
  }
  
  updateLastMousePosition(mousePosition);
}

window.onmousemove = e => handleOnMove(e);
window.ontouchmove = e => handleOnMove(e.touches[0]);
document.body.onmouseleave = () => updateLastMousePosition(originPosition);