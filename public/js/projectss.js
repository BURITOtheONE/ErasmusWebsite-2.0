// Define missing variables at the top of the file
let projects = []; // Store all projects
let activeFilters = {}; // Store active filters

// Define badge colors
const BADGE_COLORS = {
    'JavaScript': 'bg-warning',
    'React': 'bg-info',
    'Node.js': 'bg-success',
    'Python': 'bg-primary',
    'HTML': 'bg-danger',
    'CSS': 'bg-dark',
    'MongoDB': 'bg-success',
    'Express': 'bg-secondary',
    // Add more colors as needed
};

// Load projects when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, fetching projects...');
    await fetchProjects();
});

// Fetch projects from API
async function fetchProjects() {
    try {
        console.log('Fetching projects from /api/projects...');
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        projects = await response.json();
        console.log('Projects fetched:', projects.length, 'projects');
        console.log('Projects data:', projects);
        
        // Render all projects
        renderProjects(projects);
        
    } catch (error) {
        console.error('Error fetching projects:', error);
        const container = document.getElementById('projectsContainer');
        if (container) {
            container.innerHTML = '<div class="col-12 text-center py-5"><h4>Error loading projects</h4><p>' + error.message + '</p></div>';
        }
    }
}

// Update projects based on filters
function updateProjects() {
    const filteredProjects = projects.filter(project => {
        // Apply active filters
        for (let filterTag in activeFilters) {
            if (!project.tags.includes(filterTag)) {
                return false;
            }
        }
        return true;
    });
    
    renderProjects(filteredProjects);
}

// Fixed renderProjects function
function renderProjects(filteredProjects) {
    console.log("=== RENDER PROJECTS DEBUG START ===");
    console.log("renderProjects() called with:", filteredProjects); 
    console.log("Number of projects:", filteredProjects ? filteredProjects.length : 0);

    // GET the container element
    const projectsContainer = document.getElementById('projectsContainer');
    console.log("Container search result:", projectsContainer);
    console.log("Container innerHTML before clear:", projectsContainer ? projectsContainer.innerHTML : "CONTAINER NOT FOUND");
    
    if (!projectsContainer) {
        console.error("Error: projectsContainer not found in the DOM ❌");
        return;
    }

    console.log("✅ Container found, clearing content...");
    projectsContainer.innerHTML = ''; // Clear previous content
    console.log("✅ Container cleared");

    if (!filteredProjects || filteredProjects.length === 0) {
        console.log("❌ No projects to render");
        projectsContainer.innerHTML = '<div class="col-12 text-center py-5"><h4>No projects found matching your criteria</h4></div>';
        console.log("✅ No projects message added to container");
        console.log("Container innerHTML after no projects message:", projectsContainer.innerHTML);
        return;
    }

    console.log("✅ Projects exist, starting render loop...");

    // Modified admin check
    const isAdminAttr = projectsContainer.dataset.isAdmin;
    const isAdmin = isAdminAttr === 'true' || isAdminAttr === true || window.location.pathname.includes('/admin');
    console.log("Admin status:", isAdmin);

    // Process each project with detailed logging
    filteredProjects.forEach((project, index) => {
        console.log(`\n--- RENDERING PROJECT ${index + 1}/${filteredProjects.length} ---`);
        console.log("Project data:", project);
        console.log("Project title:", project.title);
        console.log("Project tags:", project.tags);
        console.log("Project tags type:", typeof project.tags);
        console.log("Is tags array:", Array.isArray(project.tags));

        // Handle projects with invalid tags
        if (!project.tags || !Array.isArray(project.tags)) {
            console.warn(`⚠️ Project has invalid tags, fixing:`, project);
            project.tags = [];
        }

        console.log("✅ Creating colDiv...");
        const colDiv = document.createElement('div');
        colDiv.className = 'col-lg-4 col-md-6 mb-4';
        console.log("✅ colDiv created:", colDiv);

        console.log("✅ Creating cardDiv...");
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card h-100 shadow-sm rounded-4 border-0 position-relative';
        console.log("✅ cardDiv created:", cardDiv);

        // Create image
        console.log("✅ Creating image...");
        const cardImg = document.createElement('img');
        cardImg.className = 'card-img-top p-3 rounded-5';
        cardImg.src = project.imageUrl || 'https://via.placeholder.com/300x150';
        cardImg.alt = `${project.title} image`;
        console.log("✅ Image created with src:", cardImg.src);

        // Create card body
        console.log("✅ Creating card body...");
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const title = document.createElement('h5');
        title.className = 'card-title text-primary fw-bold';
        title.textContent = project.title;
        console.log("✅ Title created:", title.textContent);

        const subtitle = document.createElement('h6');
        subtitle.className = 'card-subtitle mb-2 text-muted';
        subtitle.textContent = `Year: ${project.year}`;
        console.log("✅ Subtitle created:", subtitle.textContent);

        const description = document.createElement('p');
        description.className = 'card-text';
        description.textContent = project.description;
        console.log("✅ Description created");

        // Create tags container
        console.log("✅ Creating tags...");
        const badgeContainer = document.createElement('div');
        badgeContainer.className = 'mb-3';

        // Add tags if they exist
        if (project.tags && project.tags.length > 0) {
            project.tags.forEach((tag, tagIndex) => {
                if (!tag) return;
                console.log(`  Creating tag ${tagIndex + 1}: ${tag}`);
                
                const tagBadge = document.createElement('span');
                tagBadge.className = 'badge me-1 bg-secondary';
                tagBadge.textContent = tag;
                badgeContainer.appendChild(tagBadge);
                console.log(`  ✅ Tag added: ${tag}`);
            });
        } else {
            console.log("  No tags to add");
        }

        // Create view button
        console.log("✅ Creating view button...");
        const viewButton = document.createElement('a');
        viewButton.href = project.websiteLink || '#';
        viewButton.className = 'btn btn-outline-primary btn-sm';
        viewButton.textContent = 'View Project';
        console.log("✅ View button created");

        // Assemble the card
        console.log("✅ Assembling card...");
        try {
            cardBody.appendChild(title);
            console.log("  ✅ Title added to body");
            
            cardBody.appendChild(subtitle);
            console.log("  ✅ Subtitle added to body");
            
            cardBody.appendChild(description);
            console.log("  ✅ Description added to body");
            
            cardBody.appendChild(badgeContainer);
            console.log("  ✅ Badge container added to body");
            
            cardBody.appendChild(viewButton);
            console.log("  ✅ View button added to body");

            cardDiv.appendChild(cardImg);
            console.log("  ✅ Image added to card");
            
            cardDiv.appendChild(cardBody);
            console.log("  ✅ Body added to card");
            
            colDiv.appendChild(cardDiv);
            console.log("  ✅ Card added to column");
            
            console.log("✅ About to add to container...");
            projectsContainer.appendChild(colDiv);
            console.log("  ✅ Column added to container!");
            
            // Verify it was added
            console.log("Container children count:", projectsContainer.children.length);
            console.log("Container innerHTML length:", projectsContainer.innerHTML.length);
            
        } catch (error) {
            console.error(`❌ Error assembling card for project ${index + 1}:`, error);
            console.error("Error details:", error.stack);
        }

        console.log(`--- PROJECT ${index + 1} RENDER COMPLETE ---\n`);
    });

    console.log("=== FINAL RENDER STATE ===");
    console.log("Final container children count:", projectsContainer.children.length);
    console.log("Final container innerHTML length:", projectsContainer.innerHTML.length);
    console.log("Final container innerHTML preview:", projectsContainer.innerHTML.substring(0, 200) + "...");
    console.log("=== RENDER PROJECTS DEBUG END ===");
}