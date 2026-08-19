const projects = [
  { 
    title: "Automated Polymer-Degradation Data Extraction",
    description: "An end-to-end research pipeline that transforms unstructured journal articles into curated, machine-readable chemical and materials data. The same software supports a literature-grounded research assistant that can produce traceable reports, datasets, plots, and chemical structure diagrams.",
    icon: "fas fa-database",
    technologies: ["Python", "Gemini", "Knowledge Graphs", "GraphRAG", "KuzuDB", "SQLite"]
  },
  { 
    title: "Hygrothermal Degradation of 3D-Printed Composites",
    description: "Experimental research examining how moisture, temperature, and environmental exposure affect the tensile and impact performance of additively manufactured short-carbon-fiber composites.",
    link: "https://doi.org/10.1016/j.compositesb.2026.114107",
    linkLabel: "View Publication",
    icon: "fas fa-microscope",
    technologies: ["Composite Materials", "Additive Manufacturing", "Environmental Testing", "Statistical Analysis"]
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
        <div class="card h-100 shadow-sm border-0 project-card">
          <div class="project-image-placeholder" aria-label="Image placeholder for ${p.title}">
            <i class="${p.icon}" aria-hidden="true"></i>
            <span>Project image coming soon</span>
          </div>
          <div class="card-body">
            <h5 class="card-title">${p.title}</h5>
            <p class="card-text">${p.description}</p>
            <div class="mb-3">
              ${p.technologies.map(tech => `<span class="badge bg-secondary me-2">${tech}</span>`).join('')}
            </div>
            ${p.link ? `<a href="${p.link}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">${p.linkLabel || 'View Project'}</a>` : ''}
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
    
    mdFiles.sort((a, b) => a.name.localeCompare(b.name));
    
    for (const file of mdFiles) {
      let contentResponse;
      try {
        contentResponse = await fetch(`blogs/${file.name}?t=${new Date().getTime()}`);
        if (!contentResponse.ok) throw new Error();
      } catch (e) {
        contentResponse = await fetch(file.download_url);
      }
      
      const content = await contentResponse.text();
      
      // Remove leading numbers (e.g. "01_") and replace underscores with spaces
      const title = file.name.replace('.md', '').replace(/^\d+_/, '').replace(/_/g, ' ');
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
    const response = await fetch(`blogs/${fileName}?t=${new Date().getTime()}`);
    if (!response.ok) {
      throw new Error('Post not found');
    }
    const markdown = await response.text();
    
    if (window.marked) {
      // Protect math blocks from marked by saving them and replacing with placeholders
      let mathBlocks = [];
      let processedMarkdown = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
        mathBlocks.push(match);
        return `%%%MATHBLOCK_${mathBlocks.length - 1}%%%`;
      });
      processedMarkdown = processedMarkdown.replace(/\$(.*?)\$/g, (match) => {
        mathBlocks.push(match);
        return `%%%MATHBLOCK_${mathBlocks.length - 1}%%%`;
      });

      // Fix relative image paths manually before parsing to avoid marked.js API version issues
      processedMarkdown = processedMarkdown.replace(/!\[([^\]]*)\]\((?!http|\/)(.*?)\)/g, '![$1](blogs/$2)');
      
      let html = marked.parse(processedMarkdown);
      
      // Restore math blocks
      html = html.replace(/%%%MATHBLOCK_(\d+)%%%/g, (match, i) => {
        return mathBlocks[i];
      });
      
      contentDiv.innerHTML = html;
      
      // Trigger MathJax to render
      if (window.MathJax) {
        MathJax.typesetPromise([contentDiv]).catch((err) => console.log('MathJax error:', err));
      }
    } else {
      contentDiv.innerHTML = '<p class="text-danger">Error: Markdown parser not loaded.</p>';
    }
    
    loadingDiv.style.display = 'none';
    contentDiv.style.display = 'block';
    
    // Remove leading numbers and underscores for the tab title
    const title = fileName.replace('.md', '').replace(/^\d+_/, '').replace(/_/g, ' ');
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
    // Projects remains available at projects.html while the portfolio is being developed.
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
