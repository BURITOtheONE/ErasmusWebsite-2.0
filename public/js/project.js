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
    try {
        const response = await fetch('/api/projects'); // Replace with your actual endpoint
        const data = await response.json(); // Parse the JSON response
        renderProjects(data); // Render the fetched projects
    } catch (error) {
        console.error('Error fetching projects:', error);
    }
}

// Call fetchProjects() to load the data initially
fetchProjects();

// Function to render active filter tags
function renderActiveFilters() {
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

            closeButton.onclick = () => {
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
    // Clear previous content
    projectsContainer.innerHTML = '';

    // Loop through the filtered projects and create cards
    filteredProjects.forEach((project) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-lg-4 col-md-6 mb-4';

        const cardDiv = document.createElement('div');
        cardDiv.className = 'card h-100 shadow-sm border-0';

        const cardImg = document.createElement('img');
        cardImg.className = 'card-img-top rounded';
        cardImg.src = project.imageUrl || 'https://via.placeholder.com/300x150'; // Use project image or placeholder
        cardImg.alt = `${project.title} image`;

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const title = document.createElement('h5');
        title.className = 'card-title text-primary fw-bold';
        title.textContent = project.title;

        const subtitle = document.createElement('h6');
        subtitle.className = 'card-subtitle mb-2 text-muted';
        subtitle.textContent = `Year: ${project.year}`;

        const description = document.createElement('p');
        description.className = 'card-text text-truncate';
        description.textContent = project.description;

        // Create badges based on tags
        const badgeContainer = document.createElement('div');
        badgeContainer.className = 'mb-3';

        project.tags.forEach((tag) => {
            const badgeColor = BADGE_COLORS[tag] || 'bg-secondary'; // Default to grey if no match

            const tagBadge = document.createElement('span');
            tagBadge.className = `badge me-1 clickable-badge ${badgeColor}`;
            tagBadge.textContent = tag; // Badge text will be the tag name
            tagBadge.onclick = () => {
                activeFilters[tag] = tag;
                updateProjects();
                renderActiveFilters();
            };
            badgeContainer.appendChild(tagBadge);
        });

        // Add View Project button
        const viewButton = document.createElement('a');
        viewButton.href = `/projects/${project._id}`; // Adjust URL to fit your routing logic
        viewButton.className = 'btn btn-outline-primary btn-sm';
        viewButton.textContent = 'View Project';

        // Append elements to card body
        cardBody.appendChild(title);
        cardBody.appendChild(subtitle);
        cardBody.appendChild(description);
        cardBody.appendChild(badgeContainer);
        cardBody.appendChild(viewButton);

        // Append card body and image to card
        cardDiv.appendChild(cardImg);
        cardDiv.appendChild(cardBody);

        // Append card to column
        colDiv.appendChild(cardDiv);

        // Append column to container
        projectsContainer.appendChild(colDiv);
    });
}

// Function to filter and sort projects based on input and active filters
function updateProjects() {
    let filteredProjects = [...projects];

    // Filter by search term
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredProjects = filteredProjects.filter(project =>
            project.title.toLowerCase().includes(searchTerm) ||
            project.description.toLowerCase().includes(searchTerm)
        );
    }

    // Sort projects based on selected option
    if (sortOption.value === 'year') {
        filteredProjects.sort((a, b) => a.year - b.year);
    }

    // Apply active filters
    filteredProjects = filteredProjects.filter(project =>
        Object.keys(activeFilters).every(filterType =>
            !activeFilters[filterType] || project.tags.includes(activeFilters[filterType])
        )
    );

    renderProjects(filteredProjects);  // Re-render projects after filtering
    renderActiveFilters();  // Re-render active filters
}

// Event listeners
searchInput.addEventListener('input', updateProjects);
sortOption.addEventListener('change', updateProjects);

// Fetch and render projects on load
fetchProjects();