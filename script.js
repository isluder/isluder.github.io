const projects = [
  { 
    title: "Socket Sorting Robot",
    description: "Developed a robotic system for automated socket sorting as part of the Robotics Course Project. Implemented load cell sensing and mechanical design principles.",
    link: "https://github.com/isluder/Socket-sorting-robot-mece-444",
    image: "images/robot.png",
    technologies: ["Python", "PlatformIO", "Robotics", "Marlin"]
  },
  { 
    title: "Laptop Market Analysis",
    description: "Conducted comprehensive analysis of laptop market trends, focusing on price-performance relationships and consumer preferences.",
    link: "https://github.com/isluder/Exploring-the-Market-of-Laptops-through-Pricing-and-Performance-Testing",
    image: "images/TDS_project.png",
    technologies: ["Data Analysis", "Python", "Pandas", "Visualization"]
  },
];

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById("project-list");
  const cardContainer = document.getElementById("project-cards");
  
  if (container) {
    projects.forEach(p => {
      const div = document.createElement("div");
      div.className = "mb-3";
      div.innerHTML = `<h4><a href="${p.link}" target="_blank" rel="noopener noreferrer">${p.title}</a></h4>`;
      container.appendChild(div);
    });
  }

  if (cardContainer) {
    projects.forEach(p => {
      const col = document.createElement("div");
      col.className = "col-md-6 mb-4";
      col.innerHTML = `
        <div class="card h-100">
          <img src="${p.image}" class="card-img-top" alt="${p.title}" style="height: 200px; object-fit: cover;">
          <div class="card-body">
            <h5 class="card-title">${p.title}</h5>
            <p class="card-text">${p.description}</p>
            <div class="mb-3">
              ${p.technologies.map(tech => `<span class="badge bg-secondary me-2">${tech}</span>`).join('')}
            </div>
            <a href="${p.link}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">View Project</a>
          </div>
        </div>
      `;
      cardContainer.appendChild(col);
    });
  }
});

// Test tube cursor effect
let start = new Date().getTime();
let testtubesEnabled = true;

const originPosition = { x: 0, y: 0 };

const last = {
  testtubeTimestamp: start,
  testtubePosition: originPosition,
  mousePosition: originPosition
}

const config = {
  testtubeAnimationDuration: 1500,
  minimumTimeBetweenTesttubes: 250,
  minimumDistanceBetweenTesttubes: 75,
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

// Updated createTesttube function with brain emoji
const createTesttube = position => {
  const testtube = document.createElement("span");
  const color = selectRandom(config.colors);
  
  // Use brain emoji 🧠
  testtube.innerHTML = "🧪";
  testtube.className = "test-tube";
  
  testtube.style.position = "fixed";
  testtube.style.left = px(position.x);
  testtube.style.top = px(position.y);
  testtube.style.fontSize = selectRandom(config.sizes);
  // testtube.style.color = `rgb(${color})`;
  testtube.style.textShadow = `0px 0px 1.5rem rgb(${color} / 0.5)`;
  testtube.style.animationName = config.animations[count++ % 3];
  testtube.style.animationDuration = ms(config.testtubeAnimationDuration);
  testtube.style.pointerEvents = "none";
  testtube.style.zIndex = "9999";
  
  appendElement(testtube);
  removeElement(testtube, config.testtubeAnimationDuration);
}

const updateLastTesttube = position => {
  last.testtubeTimestamp = new Date().getTime();
  last.testtubePosition = position;
}

const updateLastMousePosition = position => last.mousePosition = position;

const adjustLastMousePosition = position => {
  if(last.mousePosition.x === 0 && last.mousePosition.y === 0) {
    last.mousePosition = position;
  }
};

const handleOnMove = e => {
  if (!testtubesEnabled) return;

  const mousePosition = { x: e.clientX, y: e.clientY };

  adjustLastMousePosition(mousePosition);

  const now = new Date().getTime();
  const hasMovedFarEnough = calcDistance(last.testtubePosition, mousePosition) >= config.minimumDistanceBetweenTesttubes;
  const hasBeenLongEnough = calcElapsedTime(last.testtubeTimestamp, now) > config.minimumTimeBetweenTesttubes;

  if(hasMovedFarEnough || hasBeenLongEnough) {
    createTesttube(mousePosition);
    updateLastTesttube(mousePosition);
  }

  updateLastMousePosition(mousePosition);
}

window.onmousemove = e => handleOnMove(e);
window.ontouchmove = e => handleOnMove(e.touches[0]);
document.body.onmouseleave = () => updateLastMousePosition(originPosition);

// Toggle test tube effect
document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggle-testtube');
  if (toggleButton) {
    toggleButton.addEventListener('click', function() {
      testtubesEnabled = !testtubesEnabled;
      if (testtubesEnabled) {
        toggleButton.classList.remove('inactive');
        toggleButton.classList.add('active');
      } else {
        toggleButton.classList.remove('active');
        toggleButton.classList.add('inactive');
      }
    });
  }
});