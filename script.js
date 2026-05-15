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



// --- Blog Functionality ---

async function loadBlogList() {
  const container = document.getElementById("blog-posts");
  if (!container) return;

  container.innerHTML = '<div class="col-md-8 mx-auto text-center"><div class="spinner-border text-primary" role="status"></div><p>Loading posts...</p></div>';

  try {
    const response = await fetch(`https://api.github.com/repos/isluder/isluder.github.io/contents/blogs`);
    if (!response.ok) {
      if (response.status === 404) {
        container.innerHTML = '<div class="col-md-8 mx-auto"><p class="text-center">No blog posts found yet. Check back soon!</p></div>';
        return;
      }
      throw new Error('Failed to fetch from GitHub API');
    }
    
    const files = await response.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md'));
    
    if (mdFiles.length === 0) {
      container.innerHTML = '<div class="col-md-8 mx-auto"><p class="text-center">No blog posts found yet. Check back soon!</p></div>';
      return;
    }
    
    container.innerHTML = '';
    
    mdFiles.sort((a, b) => b.name.localeCompare(a.name));
    
    for (const file of mdFiles) {
      let contentResponse;
      try {
        contentResponse = await fetch(`blogs/${file.name}`);
      } catch (e) {
        contentResponse = await fetch(file.download_url);
      }
      
      const content = await contentResponse.text();
      
      const title = file.name.replace('.md', '').replace(/_/g, ' ');
      // Remove images completely
      let cleanText = content.replace(/!\[.*?\]\(.*?\)/g, '');
      // Remove links completely
      cleanText = cleanText.replace(/\[.*?\]\(.*?\)/g, '');
      // Remove markdown headings, bold, italic, code
      cleanText = cleanText.replace(/[#*`_>]/g, '').trim();
      const words = cleanText.split(/\s+/).filter(w => w.length > 0);
      const description = words.slice(0, 50).join(' ') + (words.length > 50 ? '...' : '');
      
      const col = document.createElement("div");
      col.className = "col-md-8 mx-auto mb-4";
      col.innerHTML = `
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <h3 class="card-title">${title}</h3>
            <p class="card-text text-muted">${description}</p>
            <a href="post.html?file=${encodeURIComponent(file.name)}" class="btn btn-primary mt-2">Read Article</a>
          </div>
        </div>
      `;
      container.appendChild(col);
    }
  } catch (error) {
    console.error('Error loading blogs:', error);
    container.innerHTML = '<div class="col-md-8 mx-auto"><p class="text-center text-danger">Failed to load blog posts. Please ensure the blogs folder exists and try refreshing.</p></div>';
  }
}

async function loadBlogPost() {
  const contentDiv = document.getElementById("post-content");
  const loadingDiv = document.getElementById("post-loading");
  if (!contentDiv) return;

  const urlParams = new URLSearchParams(window.location.search);
  const fileName = urlParams.get('file');

  if (!fileName) {
    loadingDiv.style.display = 'none';
    contentDiv.style.display = 'block';
    contentDiv.innerHTML = '<p class="text-danger">No post specified.</p>';
    return;
  }

  try {
    const response = await fetch(`blogs/${fileName}`);
    if (!response.ok) {
      throw new Error('Post not found');
    }
    const markdown = await response.text();
    
    if (window.marked) {
      const renderer = new marked.Renderer();
      const originalImage = renderer.image.bind(renderer);
      renderer.image = function(href, title, text) {
        if (href && !href.startsWith('http') && !href.startsWith('/')) {
          href = 'blogs/' + href;
        }
        return originalImage(href, title, text);
      };
      marked.setOptions({ renderer: renderer });
      
      contentDiv.innerHTML = marked.parse(markdown);
    } else {
      contentDiv.innerHTML = '<p class="text-danger">Error: Markdown parser not loaded.</p>';
    }
    
    loadingDiv.style.display = 'none';
    contentDiv.style.display = 'block';
    
    const title = fileName.replace('.md', '').replace(/_/g, ' ');
    document.title = `${title} - Isaac Sluder`;
    
  } catch (error) {
    console.error('Error loading post:', error);
    loadingDiv.style.display = 'none';
    contentDiv.style.display = 'block';
    contentDiv.innerHTML = '<p class="text-danger">Failed to load the post. It may have been removed or renamed.</p>';
  }
}

function loadNavbar() {
  const navbarContainer = document.getElementById('navbar-container');
  if (!navbarContainer) return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const navLinks = [
    { name: 'About', url: 'index.html#about', match: 'index.html' },
    { name: 'Projects', url: 'projects.html', match: 'projects.html' },
    { name: 'Publications', url: 'publications.html', match: 'publications.html' },
    { name: 'Service & Awards', url: 'awards.html', match: 'awards.html' },
    { name: 'Blog', url: 'blog.html', match: ['blog.html', 'post.html'] },
    { name: 'CV', url: 'cv.html', match: 'cv.html' },
    { name: 'Contact', url: 'contact.html', match: 'contact.html' }
  ];

  let linksHTML = '';
  navLinks.forEach(link => {
    let isActive = false;
    if (Array.isArray(link.match)) {
      isActive = link.match.includes(currentPage);
    } else if (link.match) {
      if ((currentPage === '' || currentPage === '/') && link.match === 'index.html') {
        isActive = true;
      } else {
        isActive = currentPage === link.match;
      }
    }

    linksHTML += `
            <li class="nav-item">
              <a class="nav-link ${isActive ? 'active' : ''}" href="${link.url}">${link.name}</a>
            </li>`;
  });

  navbarContainer.innerHTML = `
    <nav class="navbar navbar-expand-md navbar-dark bg-dark fixed-top w-100">
      <div class="container-fluid">
        <a href="/" class="navbar-brand">Isaac Sluder</a>
        <button aria-controls="basic-navbar-nav" type="button" aria-label="Toggle navigation" class="navbar-toggler collapsed" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
${linksHTML}
          </ul>
        </div>
      </div>
    </nav>
  `;
}

document.addEventListener('DOMContentLoaded', function() {
  loadNavbar();
  loadBlogList();
  loadBlogPost();
});