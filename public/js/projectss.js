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
    'Vue': 'bg-info',
    'Angular': 'bg-danger',
    'Bootstrap': 'bg-primary'
};

// ROBUST DOM READY CHECK - handles cases where DOMContentLoaded already fired
function initializeApp() {
    console.log('🚀 Initializing Erasmus Projects App');
    console.log('Document ready state:', document.readyState);
    
    fetchProjects();
}

// Check if DOM is already loaded or wait for it
if (document.readyState === 'loading') {
    console.log('⏳ DOM is still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    console.log('✅ DOM already loaded, initializing immediately');
    initializeApp();
}

// Fetch projects from API
async function fetchProjects() {
    try {
        console.log('📡 Fetching projects from /api/projects...');
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        projects = await response.json();
        console.log('✅ Projects fetched:', projects.length, 'projects');
        console.log('📦 Sample project object:', projects[0]);

        
        // Render all projects first
        renderProjects(projects);
        
        // Initialize search and sort with retry logic
        initializeSearchAndSortWithRetry();
        
    } catch (error) {
        console.error('❌ Error fetching projects:', error);
        const container = document.getElementById('projectsContainer');
        if (container) {
            container.innerHTML = '<div class="col-12 text-center py-5"><div class="alert alert-danger"><h4>Error loading projects</h4><p>' + error.message + '</p><button class="btn btn-primary mt-2" onclick="location.reload()">Retry</button></div></div>';
        }
    }
}

// Initialize search and sort with retry logic
function initializeSearchAndSortWithRetry(maxRetries = 5, currentRetry = 0) {
    console.log(`🔧 Attempting to initialize search and sort (attempt ${currentRetry + 1}/${maxRetries})`);
    
    const searchInput = document.getElementById('searchInput');
    const sortOption = document.getElementById('sortOption');
    const projectsContainer = document.getElementById('projectsContainer');
    
    // Check if all required elements exist
    if (!searchInput || !sortOption || !projectsContainer) {
        console.warn('⚠️ Some required elements not found:', {
            searchInput: !!searchInput,
            sortOption: !!sortOption,
            projectsContainer: !!projectsContainer
        });
        
        if (currentRetry < maxRetries) {
            console.log(`🔄 Retrying in 200ms...`);
            setTimeout(() => {
                initializeSearchAndSortWithRetry(maxRetries, currentRetry + 1);
            }, 200);
            return;
        } else {
            console.error('❌ Failed to find required elements after maximum retries');
            return;
        }
    }
    
    console.log('✅ All elements found, initializing event listeners...');
    
    // Remove any existing listeners to prevent duplicates
    const newSearchInput = searchInput.cloneNode(true);
    const newSortOption = sortOption.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    sortOption.parentNode.replaceChild(newSortOption, sortOption);
    
    // Add event listeners to the new elements
    newSearchInput.addEventListener('input', handleSearch);
    newSortOption.addEventListener('change', handleSort);
    
    // Initialize tag click handlers
    initializeTagClickHandlers();
    
    console.log('🎉 Search and sort initialized successfully!');
}

// Handle search input changes
function handleSearch(event) {
    console.log('🔍 Search input changed:', event.target.value);
    filterAndDisplayProjects();
}

// Handle sort option changes
function handleSort(event) {
    console.log('🔄 Sort option changed:', event.target.value);
    filterAndDisplayProjects();
}

// Initialize tag click handlers using event delegation
function initializeTagClickHandlers() {
    console.log('🏷️ Initializing tag click handlers...');
    
    const projectsContainer = document.getElementById('projectsContainer');
    if (!projectsContainer) {
        console.error('❌ Projects container not found for tag click handlers!');
        return;
    }
    
    // Remove existing listener if any
    projectsContainer.removeEventListener('click', handleTagClick);
    projectsContainer.addEventListener('click', handleTagClick);
    
    console.log('✅ Tag click delegation added to projects container');
}

// Handle tag clicks using event delegation
function handleTagClick(event) {
    // Check if the clicked element is a tag badge
    if (event.target.classList.contains('badge') && event.target.classList.contains('tag-clickable')) {
        event.preventDefault();
        event.stopPropagation();
        
        const tagName = event.target.textContent.trim();
        console.log('🏷️ Tag clicked:', tagName);
        
        // Toggle the filter
        if (activeFilters[tagName]) {
            delete activeFilters[tagName];
            console.log('➖ Removed filter:', tagName);
        } else {
            activeFilters[tagName] = true;
            console.log('➕ Added filter:', tagName);
        }
        
        // Update the display
        filterAndDisplayProjects();
    }
}

// Filter and display projects based on search and filters
function filterAndDisplayProjects() {
    console.log('🔄 === FILTERING PROJECTS ===');
    
    const searchInput = document.getElementById('searchInput');
    const sortOption = document.getElementById('sortOption');
    
    let filteredProjects = [...projects]; // Copy original projects array
    console.log('📊 Starting with', filteredProjects.length, 'projects');
    
    // Apply search filter
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase().trim();
        console.log('🔍 Applying search filter:', searchTerm);
        
        filteredProjects = filteredProjects.filter(project => {
            const title = (project.title || '').toLowerCase();
            const description = (project.description || '').toLowerCase();
            const tags = Array.isArray(project.tags) ? project.tags.map(t => t.toLowerCase()) : [];
            const creators = Array.isArray(project.creators) ? project.creators.map(c => c.toLowerCase()) : [];
        
            const matchesTitle = title.includes(searchTerm);
            const matchesDescription = description.includes(searchTerm);
            const matchesTags = tags.some(tag => tag.includes(searchTerm));
            const matchesCreators = creators.some(creator => creator.includes(searchTerm));
        
            return matchesTitle || matchesDescription || matchesTags || matchesCreators;
        });             
        console.log('🔍 After search filter:', filteredProjects.length, 'projects');
    }
    
    // Apply tag filters
    const activeTagFilters = Object.keys(activeFilters);
    if (activeTagFilters.length > 0) {
        console.log('🏷️ Applying tag filters:', activeTagFilters);
        
        filteredProjects = filteredProjects.filter(project => {
            return activeTagFilters.every(filterTag => 
                project.tags && project.tags.includes(filterTag)
            );
        });
        
        console.log('🏷️ After tag filter:', filteredProjects.length, 'projects');
    }
    
    // Apply sorting
    if (sortOption && sortOption.value) {
        console.log('🔄 Applying sort:', sortOption.value);
        
        filteredProjects.sort((a, b) => {
            switch(sortOption.value) {
                case 'year':
                    return b.year - a.year; // Newest first
                case 'title':
                    return a.title.localeCompare(b.title); // Alphabetical
                default:
                    return 0;
            }
        });
    }
    
    console.log('✅ Final filtered projects count:', filteredProjects.length);
    renderProjects(filteredProjects);
    updateActiveFiltersDisplay();
}

// Update active filters display
function updateActiveFiltersDisplay() {
    const container = document.getElementById('activeFilters');
    if (!container) {
        console.log('⚠️ Active filters container not found');
        return;
    }
    
    container.innerHTML = '';
    
    const activeTagFilters = Object.keys(activeFilters);
    console.log('🏷️ Updating active filters display:', activeTagFilters);
    
    if (activeTagFilters.length === 0) {
        return; // No active filters to display
    }
    
    // Add a label
    const label = document.createElement('span');
    label.textContent = 'Active filters: ';
    label.className = 'me-2 fw-semibold';
    container.appendChild(label);
    
    activeTagFilters.forEach(filterTag => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-primary me-2 mb-2 d-inline-flex align-items-center';
        
        const text = document.createElement('span');
        text.textContent = filterTag;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn-close btn-close-white ms-2';
        closeBtn.style.fontSize = '0.7em';
        closeBtn.setAttribute('aria-label', 'Remove filter');
        
        // Add click handler to remove filter
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🗑️ Removing filter:', filterTag);
            delete activeFilters[filterTag];
            filterAndDisplayProjects();
        });
        
        badge.appendChild(text);
        badge.appendChild(closeBtn);
        container.appendChild(badge);
    });
}

function renderProjects(filteredProjects) {
    console.log("🎨 === RENDER PROJECTS START ===");
    console.log("Projects to render:", filteredProjects ? filteredProjects.length : 0);

    // GET the container element
    const projectsContainer = document.getElementById('projectsContainer');
    
    if (!projectsContainer) {
        console.error("❌ Error: projectsContainer not found in the DOM");
        return;
    }

    console.log("✅ Container found, clearing content...");
    projectsContainer.innerHTML = ''; // Clear previous content

    if (!filteredProjects || filteredProjects.length === 0) {
        console.log("📭 No projects to render");
        projectsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-info">
                    <h4><i class="fas fa-search"></i> No projects found</h4>
                    <p>Try adjusting your search criteria or removing some filters.</p>
                </div>
            </div>`;
        return;
    }

    console.log("✅ Projects exist, starting render loop...");

    // Check admin status
    const isAdminAttr = projectsContainer.dataset.isAdmin;
    const isAdmin = isAdminAttr === 'true' || window.location.pathname.includes('/admin');
    console.log("🔐 Admin status:", isAdmin);

    // Process each project
    filteredProjects.forEach((project, index) => {
        console.log(`📋 Rendering project ${index + 1}: ${project.title}`);

        // Handle projects with invalid tags
        if (!project.tags || !Array.isArray(project.tags)) {
            console.warn(`⚠️ Project has invalid tags, fixing:`, project.title);
            project.tags = [];
        }

        const colDiv = document.createElement('div');
        colDiv.className = 'col-lg-4 col-md-6 mb-4';

        const cardDiv = document.createElement('div');
        cardDiv.className = 'card h-100 shadow-sm rounded-4 border-0 position-relative';

        // Create image
        const cardImg = document.createElement('img');
        cardImg.className = 'card-img-top p-3 rounded-5';
        cardImg.src = project.imageUrl || 'https://via.placeholder.com/300x150?text=No+Image';
        cardImg.alt = `${project.title} image`;
        cardImg.style.height = '200px';
        cardImg.style.objectFit = 'cover';
        cardImg.loading = 'lazy'; // Add lazy loading
        
        // Add error handling for images
        cardImg.onerror = function() {
            this.src = 'https://via.placeholder.com/300x150?text=Image+Not+Found';
        };

        // Create card body
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex flex-column';

        const title = document.createElement('h5');
        title.className = 'card-title text-primary fw-bold';
        title.textContent = project.title;

        const subtitle = document.createElement('h6');
        subtitle.className = 'card-subtitle mb-2 text-muted';
        subtitle.innerHTML = `<i class="fas fa-calendar"></i> Year: ${project.year}`;

        const description = document.createElement('p');
        description.className = 'card-text flex-grow-1';
        description.textContent = project.description;

        // Create tags container
        const badgeContainer = document.createElement('div');
        badgeContainer.className = 'mb-3';

        // Add tags if they exist - MAKE THEM CLICKABLE
        if (project.tags && project.tags.length > 0) {
            project.tags.forEach((tag) => {
                if (!tag) return;
                
                const tagBadge = document.createElement('span');
                const badgeColor = BADGE_COLORS[tag] || 'bg-secondary';
                tagBadge.className = `badge me-1 mb-1 ${badgeColor} tag-clickable`;
                tagBadge.textContent = tag;
                tagBadge.style.cursor = 'pointer';
                tagBadge.title = `Click to filter by ${tag}`;
                
                // Add visual feedback
                tagBadge.addEventListener('mouseenter', function() {
                    this.style.opacity = '0.8';
                    this.style.transform = 'scale(1.05)';
                });
                tagBadge.addEventListener('mouseleave', function() {
                    this.style.opacity = '1';
                    this.style.transform = 'scale(1)';
                });
                
                badgeContainer.appendChild(tagBadge);
            });
        }

        // Create buttons container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'gap-2 mt-auto';

        // Create view button
        if (project.websiteLink || project.websiteLink || project.Link !== '') {
            const viewButton = document.createElement('a');
            viewButton.href = project.websiteLink || project.link;
            viewButton.className = 'btn btn-outline-primary btn-sm';
            viewButton.innerHTML = '<i class="fas fa-external-link-alt"></i> View Project';
            viewButton.target = '_blank';
            viewButton.rel = 'noopener noreferrer';
            buttonContainer.appendChild(viewButton);
        }

        // Add admin buttons if needed
        if (isAdmin) {
            const editButton = document.createElement('a');
            editButton.href = `/admin/projects/${project._id}/edit`;
            editButton.className = 'btn btn-outline-warning btn-sm';
            editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-outline-danger btn-sm';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
            deleteButton.onclick = () => deleteProject(project._id);
            
            buttonContainer.appendChild(editButton);
            buttonContainer.appendChild(deleteButton);
        }

        // Assemble the card
        try {
            cardBody.appendChild(title);
            cardBody.appendChild(subtitle);
            cardBody.appendChild(description);
            cardBody.appendChild(badgeContainer);
            cardBody.appendChild(buttonContainer);

            cardDiv.appendChild(cardImg);
            cardDiv.appendChild(cardBody);
            
            colDiv.appendChild(cardDiv);
            projectsContainer.appendChild(colDiv);
            
        } catch (error) {
            console.error(`❌ Error assembling card for project ${index + 1}:`, error);
        }
    });

    console.log("✅ === RENDER PROJECTS END ===");
}

// Helper function for deleting projects (admin only)
async function deleteProject(projectId) {
    if (!confirm('⚠️ Are you sure you want to delete this project? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from local array
            projects = projects.filter(p => p._id !== projectId);
            // Re-render
            filterAndDisplayProjects();
            alert('✅ Project deleted successfully');
        } else {
            alert('❌ Error deleting project');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('❌ Error deleting project');
    }
}

// Add global error handler for debugging
window.addEventListener('error', function(event) {
    console.error('🚨 Global error caught:', event.error);
    console.error('Error details:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

// Debug function to check current state
window.debugProjectsApp = function() {
    console.log('🔍 === DEBUG INFO ===');
    console.log('Projects loaded:', projects.length);
    console.log('Active filters:', activeFilters);
    console.log('Search input element:', document.getElementById('searchInput'));
    console.log('Sort option element:', document.getElementById('sortOption'));
    console.log('Projects container element:', document.getElementById('projectsContainer'));
    console.log('Document ready state:', document.readyState);
};

console.log('📋 Projects JavaScript file loaded successfully');
console.log('🔧 You can debug the app state by calling: window.debugProjectsApp()');