document.addEventListener('DOMContentLoaded', function() {
  const projectsContainer = document.getElementById('projectsContainer');
  const searchInput = document.getElementById('searchInput');
  const sortOption = document.getElementById('sortOption');
  const activeFilters = document.getElementById('activeFilters');
  const editProjectModal = document.getElementById('editProjectModal');
  const editProjectForm = document.getElementById('editProjectForm');
  const saveEditButton = document.getElementById('saveEditButton');
  
  let allProjects = [];
  let activeFilterTags = new Set();
  
  // Check if we're on the admin or projects page
  const isAdmin = projectsContainer ? projectsContainer.getAttribute('data-is-admin') === 'true' : false;
  
  // Fetch projects from API
  function fetchProjects() {
    fetch('/api/projects')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(projects => {
        allProjects = projects;
        displayProjects(projects);
      })
      .catch(error => {
        console.error('Error fetching projects:', error);
        projectsContainer.innerHTML = `
          <div class="col-12 text-center">
            <div class="alert alert-danger">
              Error loading projects. Please try again later.
            </div>
          </div>
        `;
      });
  }
  
  // Display projects in container
  function displayProjects(projects) {
    if (!projectsContainer) return;
    
    if (projects.length === 0) {
      projectsContainer.innerHTML = `
        <div class="col-12 text-center">
          <div class="alert alert-info">
            No projects found matching your criteria.
          </div>
        </div>
      `;
      return;
    }
    
    projectsContainer.innerHTML = '';
    
    projects.forEach(project => {
      // Ensure tags is an array
      let tagsArray = [];
      if (typeof project.tags === 'string') {
        tagsArray = project.tags.split(/[\s,]+/).filter(Boolean);
      } else if (Array.isArray(project.tags)) {
        tagsArray = project.tags;
      }
      
      // Create project card
      const projectCard = document.createElement('div');
      projectCard.className = 'col-md-6 col-lg-4 mb-4';
      
      // Default image if none provided
      const imageUrl = project.imageUrl ? project.imageUrl : '/assets/img/default-project.jpg';
      
      projectCard.innerHTML = `
        <div class="card h-100">
          <img class="card-img-top" src="${imageUrl}" alt="${project.title}">
          <div class="card-body">
            <h5 class="card-title">${project.title}</h5>
            <p class="card-text">${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
            <div class="d-flex flex-wrap mb-2">
              ${tagsArray.map(tag => `<span class="badge bg-primary me-1 mb-1 tag-badge" style="cursor: pointer;">${tag}</span>`).join('')}
            </div>
            <p class="text-muted">Year: ${project.year}</p>
            <a href="/projects/${project._id}" class="btn btn-primary">View Details</a>
            ${isAdmin ? `
              <button class="btn btn-warning edit-project ms-2" data-id="${project._id}">Edit</button>
              <button class="btn btn-danger delete-project ms-2" data-id="${project._id}">Delete</button>
            ` : ''}
          </div>
        </div>
      `;
      
      projectsContainer.appendChild(projectCard);
      
      // Add event listeners to tag badges for filtering
      const tagBadges = projectCard.querySelectorAll('.tag-badge');
      tagBadges.forEach(badge => {
        badge.addEventListener('click', function() {
          const tag = this.textContent;
          if (!activeFilterTags.has(tag)) {
            activeFilterTags.add(tag);
            updateActiveFilterDisplay();
            filterProjects();
          }
        });
      });
    });
    
// Add event listeners for admin buttons if in admin mode
if (isAdmin) {
  console.log("Adding edit button for project:", project.title);
  
  // Create edit button
  const editButton = document.createElement('button');
  editButton.className = 'btn btn-primary btn-sm position-absolute start-0 top-0 m-2';
  editButton.innerHTML = '✏️'; // Edit emoji
  editButton.style.zIndex = '10';
  editButton.setAttribute('data-project-id', project._id);
  
  // Make the edit button more visible
  editButton.style.fontSize = '16px';
  editButton.style.padding = '5px 10px';
  
  // Add click event for edit
  editButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      editProject(project);
  });
  
  cardDiv.appendChild(editButton);
} 

function editProject(project) {
  try {
      console.log("Editing project:", project);
      
      // Find form elements
      const titleInput = document.getElementById('projectTitle');
      const descriptionInput = document.getElementById('projectDescription');
      const creatorsInput = document.getElementById('projectCreators');
      const websiteLinkInput = document.getElementById('projectWebsiteLink');
      const tagsInput = document.getElementById('projectTags');
      const yearInput = document.getElementById('projectYear');
      const imagePreview = document.getElementById('projectImagePreview');
      
      // Check if all elements exist before setting values
      if (!titleInput || !descriptionInput || !creatorsInput || 
          !websiteLinkInput || !tagsInput || !yearInput) {
          console.error("One or more form elements not found", { 
              titleInput, descriptionInput, creatorsInput, 
              websiteLinkInput, tagsInput, yearInput 
          });
          alert("Error loading project for editing: Form elements not found");
          return;
      }
      
      // Set values
      titleInput.value = project.title || '';
      descriptionInput.value = project.description || '';
      creatorsInput.value = Array.isArray(project.creators) ? 
          project.creators.join(' ') : project.creators || '';
      websiteLinkInput.value = project.websiteLink || '';
      tagsInput.value = Array.isArray(project.tags) ? 
          project.tags.join(' ') : project.tags || '';
      yearInput.value = project.year || '';
      
      // Show project image in preview if available
      if (project.imageUrl) {
          imagePreview.innerHTML = `<img src="${project.imageUrl}" alt="Project Image" 
              class="img-fluid" style="max-width: 100px; max-height: 100px;">`;
      }
      
      // Update form action to include project ID for update
      const projectForm = document.getElementById('projectForm');
      if (projectForm) {
          projectForm.action = `/admin/project/${project._id}`;
          
          // Add hidden field to indicate this is an update
          let hiddenField = document.getElementById('projectUpdateField');
          if (!hiddenField) {
              hiddenField = document.createElement('input');
              hiddenField.type = 'hidden';
              hiddenField.id = 'projectUpdateField';
              hiddenField.name = 'updateProject';
              hiddenField.value = 'true';
              projectForm.appendChild(hiddenField);
          }
          
          // Change button text
          const submitButton = projectForm.querySelector('button[type="submit"]');
          if (submitButton) {
              submitButton.textContent = 'Update Project';
          }
          
          // Scroll to form
          projectForm.scrollIntoView({ behavior: 'smooth' });
      }
  } catch (error) {
      console.error('Error loading project for editing:', error);
      alert('Error loading project for editing: ' + error.message);
  }
}

  // Load project data for editing
  function loadProjectForEditing(projectId) {
    fetch(`/api/projects/${projectId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch project data');
        }
        return response.json();
      })
      .then(project => {
        // Populate the edit form with project data
        document.getElementById('editProjectId').value = project._id;
        document.getElementById('editProjectTitle').value = project.title;
        document.getElementById('editProjectDescription').value = project.description;
        
        // Handle creators array
        let creatorsString = '';
        if (Array.isArray(project.creators)) {
          creatorsString = project.creators.join(' ');
        } else if (typeof project.creators === 'string') {
          creatorsString = project.creators;
        }
        document.getElementById('editProjectCreators').value = creatorsString;
        
        document.getElementById('editProjectWebsiteLink').value = project.websiteLink || '';
        document.getElementById('editProjectTags').value = project.tags;
        document.getElementById('editProjectYear').value = project.year;
        
        // Display current image
        const currentImageElement = document.querySelector('#currentProjectImage img');
        if (currentImageElement) {
          currentImageElement.src = project.imageUrl || '/assets/img/default-project.jpg';
        }
        
        // Clear any previously selected new image
        document.getElementById('editProjectImage').value = '';
        document.getElementById('editProjectImagePreview').innerHTML = '';
        
        // Show the modal
        const editModal = new bootstrap.Modal(document.getElementById('editProjectModal'));
        editModal.show();
      })
      .catch(error => {
        console.error('Error loading project for editing:', error);
        alert('Error loading project for editing: ' + error.message);
      });
  }
  
  // Save edited project
  function saveEditedProject() {
    const projectId = document.getElementById('editProjectId').value;
    const formData = new FormData(document.getElementById('editProjectForm'));
    
    fetch(`/api/projects/${projectId}`, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Failed to update project');
        });
      }
      return response.json();
    })
    .then(data => {
      // Hide the modal
      const editModal = bootstrap.Modal.getInstance(document.getElementById('editProjectModal'));
      if (editModal) {
        editModal.hide();
      }
      
      // Refresh projects list
      fetchProjects();
      
      // Show success message
      alert('Project updated successfully!');
    })
    .catch(error => {
      console.error('Error updating project:', error);
      alert('Error updating project: ' + error.message);
    });
  }
  
  // Delete project
  function deleteProject(projectId) {
    fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      // Refresh projects
      fetchProjects();
    })
    .catch(error => {
      console.error('Error deleting project:', error);
      alert('Error deleting project: ' + error.message);
    });
  }
  
  // Update active filter display
  function updateActiveFilterDisplay() {
    if (!activeFilters) return;
    
    activeFilters.innerHTML = '';
    activeFilterTags.forEach(tag => {
      const badge = document.createElement('span');
      badge.className = 'badge bg-secondary me-1 mb-1';
      badge.innerHTML = `${tag} <i class="fas fa-times"></i>`;
      badge.style.cursor = 'pointer';
      badge.addEventListener('click', function() {
        activeFilterTags.delete(tag);
        updateActiveFilterDisplay();
        filterProjects();
      });
      activeFilters.appendChild(badge);
    });
  }
  
  // Filter projects based on search and active filters
  function filterProjects() {
    if (!allProjects) return;
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const sortBy = sortOption ? sortOption.value : 'year';
    
    let filtered = allProjects.filter(project => {
      // Search term filter
      const matchesSearch = project.title.toLowerCase().includes(searchTerm) || 
                           project.description.toLowerCase().includes(searchTerm);
      
      // Tag filter
      let matchesTags = true;
      if (activeFilterTags.size > 0) {
        // Make sure project.tags is normalized to an array
        let projectTags = [];
        if (typeof project.tags === 'string') {
          projectTags = project.tags.split(/[\s,]+/).filter(Boolean);
        } else if (Array.isArray(project.tags)) {
          projectTags = project.tags;
        }
        
        // Check if all active filter tags are included in project tags
        matchesTags = Array.from(activeFilterTags).every(tag => 
          projectTags.some(projectTag => projectTag.toLowerCase() === tag.toLowerCase())
        );
      }
      
      return matchesSearch && matchesTags;
    });
    
    // Sort projects
    filtered.sort((a, b) => {
      if (sortBy === 'year') {
        return b.year - a.year;  // Descending by year
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);  // Alphabetically by title
      }
      return 0;
    });
    
    // Display filtered projects
    displayProjects(filtered);
  }
  
  // Set up edit project image preview
  const editProjectImageInput = document.getElementById('editProjectImage');
  const editProjectImagePreview = document.getElementById('editProjectImagePreview');
  
  if (editProjectImageInput && editProjectImagePreview) {
    editProjectImageInput.addEventListener('change', function(e) {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          editProjectImagePreview.innerHTML = `
            <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px;" />
          `;
        }
        reader.readAsDataURL(file);
      } else {
        editProjectImagePreview.innerHTML = '';
      }
    });
  }
  
  // Add event listener for save edit button
  if (saveEditButton) {
    saveEditButton.addEventListener('click', saveEditedProject);
  }
  
  // Initialize event listeners
  if (searchInput) {
    searchInput.addEventListener('input', filterProjects);
  }
  
  if (sortOption) {
    sortOption.addEventListener('change', filterProjects);
  }
  
  // Initial fetch
  if (projectsContainer) {
    fetchProjects();
  }
});