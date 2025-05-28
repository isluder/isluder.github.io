const projects = [
  { title: "Socket Sorting Robot for Robotics Course Project", link: "https://github.com/isluder/Socket-sorting-robot-mece-444" },
  { title: "Exploring the Market of Laptops through pricing and performance testing", link: "https://github.com/isluder/Exploring-the-Market-of-Laptops-through-Pricing-and-Performance-Testing" },
  // Add more projects here
];

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById("project-list");
  
  // Check if container exists before trying to use it
  if (container) {
    projects.forEach(p => {
      const div = document.createElement("div");
      div.className = "mb-3"; // Add Bootstrap margin class
      div.innerHTML = `<h4><a href="${p.link}" target="_blank" rel="noopener noreferrer">${p.title}</a></h4>`;
      container.appendChild(div);
    });
  }
});