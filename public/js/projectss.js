// Fix the isAdmin detection in the renderProjects function
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
            cardDiv.className = 'card h-100 shadow-sm rounded-4 border-0';

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