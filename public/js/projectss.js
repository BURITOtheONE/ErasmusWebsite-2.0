document.addEventListener('DOMContentLoaded', () => {
    // Badge color constants using Bootstrap colors and custom vibrant colors
    const BADGE_COLORS = {
        "Education": "bg-primary",      // Blue
        "Sustainability": "bg-success", // Green
        "Culture": "bg-warning",        // Yellow
        "Health": "bg-danger",          // Red
        "Technology": "bg-info",        // Light blue
        "Innovation": "bg-secondary",   // Grey
        "Leadership": "bg-dark",        // Dark
        "Youth": "bg-orange",           // Orange (custom)
        "Collaboration": "bg-pink",     // Pink (custom)
        "Research": "bg-purple",        // Purple (custom)
        "Global": "bg-teal"             // Teal (custom)
    };

    // DOM Elements
    const projectsContainer = document.getElementById('projectsContainer');
    const searchInput = document.getElementById('searchInput');
    const sortOption = document.getElementById('sortOption');
    const activeFiltersContainer = document.getElementById('activeFilters');

    // Active filters object
    let activeFilters = {};
    let projects = []; // To store projects fetched from the server

    async function fetchProjects() {
        console.log("fetchProjects() called ✅"); 

        try {
            const response = await fetch('/api/projects');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const data = await response.json();
            console.log("Fetched projects:", data);

            projects = data; // Store projects globally
            
            console.log("Calling renderProjects() with projects:", projects);
            renderProjects(projects);

        } catch (error) {
            console.error('Error fetching projects:', error);
            if (projectsContainer) {
                projectsContainer.innerHTML = `<div class="col-12 text-center py-5"><h4>Error loading projects: ${error.message}</h4></div>`;
            }
        }
    }

    // Function to render active filter tags
    function renderActiveFilters() {
        if (!activeFiltersContainer) return;
        
        activeFiltersContainer.innerHTML = ''; // Clear existing filters

        Object.keys(activeFilters).forEach((filterType) => {
            if (activeFilters[filterType]) {
                const badgeColor = BADGE_COLORS[filterType] || 'bg-secondary'; // Get the correct badge color

                const badge = document.createElement('span');
                badge.className = `badge me-2 mb-2 clickable-badge ${badgeColor} text-white`;
                badge.textContent = activeFilters[filterType];
                badge.setAttribute('data-filter-type', filterType);
                badge.setAttribute('data-filter-value', activeFilters[filterType]);

                const closeButton = document.createElement('span');
                closeButton.className = 'badge-close ms-2';
                closeButton.innerHTML = '&times;';
                closeButton.style.cursor = 'pointer'; // Cursor for the close button
                closeButton.style.color = 'white'; // Ensure the "x" stays visible

                closeButton.onclick = (e) => {
                    e.stopPropagation();
                    activeFilters[filterType] = null;
                    updateProjects();
                    renderActiveFilters();
                };

                // Make the whole badge clickable
                badge.onclick = () => {
                    activeFilters[filterType] = null;
                    updateProjects();
                    renderActiveFilters();
                };

                badge.appendChild(closeButton);
                activeFiltersContainer.appendChild(badge);
            }
        });
    }

    // Function to create project cards
    function renderProjects(filteredProjects) {
        console.log("renderProjects() called with:", filteredProjects); 

        if (!projectsContainer) {
            console.error("Error: projectsContainer not found in the DOM ❌");
            return;
        }

        projectsContainer.innerHTML = ''; // Clear previous content

        if (!filteredProjects || filteredProjects.length === 0) {
            projectsContainer.innerHTML = '<div class="col-12 text-center py-5"><h4>No projects found matching your criteria</h4></div>';
            return;
        }

        // Check if user is admin by looking for a data attribute on the projects container
        // Also check URL path as a backup method
        const isAdmin = projectsContainer.dataset.isAdmin === 'true' || window.location.pathname.includes('/admin');
        console.log("Admin status:", isAdmin, "Container dataset:", projectsContainer.dataset);

        filteredProjects.forEach((project) => {
            console.log("Rendering project:", project.title);

            // Skip projects with invalid tags
            if (!project.tags || !Array.isArray(project.tags)) {
                console.warn(`Skipping project with invalid tags:`, project);
                return; // Skip this project if tags is not an array
            }

            const colDiv = document.createElement('div');
            colDiv.className = 'col-lg-4 col-md-6 mb-4';

            const cardDiv = document.createElement('div');
            cardDiv.className = 'card h-100 shadow-sm rounded-4 border-0 position-relative';

            // Add delete button for admins
            if (isAdmin) {
                console.log("Adding delete button for project:", project.title);
                
                const deleteButton = document.createElement('button');
                deleteButton.className = 'btn btn-danger btn-sm position-absolute end-0 top-0 m-2';
                deleteButton.innerHTML = '🗑️'; // Fallback emoji
                deleteButton.style.zIndex = '10'; // Ensure button is above other elements
                deleteButton.setAttribute('data-project-id', project._id);
                
                // Add click event for delete
                deleteButton.addEventListener('click', async function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (confirm('Are you sure you want to delete this project?')) {
                        try {
                            const response = await fetch(`/api/projects/${project._id}`, {
                                method: 'DELETE'
                            });
                            
                            if (response.ok) {
                                // Remove the project card from the DOM
                                colDiv.remove();
                                // Also remove from projects array
                                const index = projects.findIndex(p => p._id === project._id);
                                if (index !== -1) {
                                    projects.splice(index, 1);
                                }
                                alert('Project deleted successfully');
                            } else {
                                const error = await response.text();
                                alert(`Failed to delete project: ${error}`);
                            }
                        } catch (error) {
                            console.error('Error deleting project:', error);
                            alert('Error deleting project');
                        }
                    }
                });
                
                cardDiv.appendChild(deleteButton);
            }

            const cardImg = document.createElement('img');
            cardImg.className = 'card-img-top p-3 rounded-5';
            cardImg.src = project.imageUrl || 'https://via.placeholder.com/300x150';
            cardImg.alt = `${project.title} image`;
            
            // Error handling for images
            cardImg.onerror = function() {
                this.onerror = null;
                this.src = 'https://via.placeholder.com/300x150?text=No+Image';
            };

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            const title = document.createElement('h5');
            title.className = 'card-title text-primary fw-bold';
            title.textContent = project.title;

            const subtitle = document.createElement('h6');
            subtitle.className = 'card-subtitle mb-2 text-muted';
            subtitle.textContent = `Year: ${project.year}`;

            const description = document.createElement('p');
            description.className = 'card-text';
            // Use text-truncate for long descriptions
            if (project.description && project.description.length > 100) {
                description.className += ' text-truncate';
            }
            description.textContent = project.description;

            const badgeContainer = document.createElement('div');
            badgeContainer.className = 'mb-3';

            // Process tags
            project.tags.forEach((tag) => {
                if (!tag) return; // Skip empty tags
                
                console.log("Rendering tag:", tag);
                const badgeColor = BADGE_COLORS[tag] || 'bg-secondary';

                const tagBadge = document.createElement('span');
                tagBadge.className = `badge me-1 clickable-badge ${badgeColor}`;
                tagBadge.textContent = tag;
                
                // Add click event to filter by this tag
                tagBadge.style.cursor = 'pointer';
                tagBadge.onclick = () => {
                    activeFilters[tag] = tag;
                    updateProjects();
                };
                
                badgeContainer.appendChild(tagBadge);
            });

            const viewButton = document.createElement('a');
            viewButton.href = `${project.websiteLink}`;
            viewButton.className = 'btn btn-outline-primary btn-sm';
            viewButton.textContent = 'View Project';

            cardBody.appendChild(title);
            cardBody.appendChild(subtitle);
            cardBody.appendChild(description);
            cardBody.appendChild(badgeContainer);
            cardBody.appendChild(viewButton);

            cardDiv.appendChild(cardImg);
            cardDiv.appendChild(cardBody);

            colDiv.appendChild(cardDiv);

            projectsContainer.appendChild(colDiv);
        });

        console.log("renderProjects() completed ✅");
    }

    // Function to filter and sort projects based on input and active filters
    function updateProjects() {
        let filteredProjects = [...projects];

        // Filter by search term
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        if (searchTerm) {
            filteredProjects = filteredProjects.filter(project =>
                project.title.toLowerCase().includes(searchTerm) ||
                project.description.toLowerCase().includes(searchTerm)
            );
        }

        // Sort projects based on selected option
        if (sortOption && sortOption.value) {
            if (sortOption.value === 'year') {
                filteredProjects.sort((a, b) => a.year - b.year);
            } else if (sortOption.value === 'year-desc') {
                filteredProjects.sort((a, b) => b.year - a.year);
            } else if (sortOption.value === 'title') {
                filteredProjects.sort((a, b) => a.title.localeCompare(b.title));
            } else if (sortOption.value === 'title-desc') {
                filteredProjects.sort((a, b) => b.title.localeCompare(a.title));
            }
        }

        // Apply active filters
        filteredProjects = filteredProjects.filter(project => {
            // Skip if project has invalid tags
            if (!project.tags || !Array.isArray(project.tags)) {
                return false;
            }
            
            return Object.keys(activeFilters).every(filterType => {
                return !activeFilters[filterType] || project.tags.includes(activeFilters[filterType]);
            });
        });

        renderProjects(filteredProjects);  // Re-render projects after filtering
        renderActiveFilters();  // Re-render active filters
    }

    // Event listeners - only add if elements exist
    if (searchInput) {
        searchInput.addEventListener('input', updateProjects);
    }
    
    if (sortOption) {
        sortOption.addEventListener('change', updateProjects);
    }

    // Setup tag filter clicks on the document level
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('clickable-badge')) {
            const tagName = e.target.textContent;
            activeFilters[tagName] = tagName;
            updateProjects();
        }
    });

    // Fetch and render projects on load only if we're on a page with projects
    if (projectsContainer) {
        fetchProjects();
        console.log("Script initialized on projects page ✅");
    } else {
        console.log("Not on projects page, script initialized but not fetching projects");
    }
});