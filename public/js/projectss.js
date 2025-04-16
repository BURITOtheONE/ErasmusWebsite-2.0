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

    // Modified admin check: properly handle string values
    const isAdminAttr = projectsContainer.dataset.isAdmin;
    const isAdmin = isAdminAttr === 'true' || isAdminAttr === true || window.location.pathname.includes('/admin');
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

        // Add delete button for admins - MODIFIED THIS PART
        if (isAdmin) {
            console.log("Adding delete button for project:", project.title);
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger btn-sm position-absolute end-0 top-0 m-2';
            deleteButton.innerHTML = '🗑️'; // Fallback emoji
            deleteButton.style.zIndex = '10'; // Ensure button is above other elements
            deleteButton.setAttribute('data-project-id', project._id);
            
            // Make the delete button more visible for testing
            deleteButton.style.fontSize = '16px';
            deleteButton.style.padding = '5px 10px';
            
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

        // Rest of the function remains the same...
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