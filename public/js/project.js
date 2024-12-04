// Badge color constants using Bootstrap colors and a couple of extra vibrant colors
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

// Expanded Erasmus projects data with more titles
const projects = [
    { title: "Digital Skills for Future", year: 2024, description: "Improving digital literacy for students and teachers.", tags: ["Education", "Innovation"] },
    { title: "Green Europe Initiative", year: 2025, description: "Promoting sustainable development and green practices.", tags: ["Sustainability", "Environment"] },
    { title: "Cultural Heritage Exchange", year: 2026, description: "Exploring cultural diversity and preserving traditions.", tags: ["Culture", "Sustainability"] },
    { title: "STEM Innovators", year: 2027, description: "Encouraging innovation in science, technology, engineering, and mathematics.", tags: ["Education", "Innovation"] },
    { title: "Youth Leadership Program", year: 2024, description: "Empowering young leaders through mentorship and training.", tags: ["Leadership", "Youth"] },
    { title: "Tech for Good", year: 2025, description: "Leveraging technology to solve social and environmental issues.", tags: ["Technology", "Social Impact"] },
    { title: "Healthy Living Campaign", year: 2024, description: "Promoting healthy lifestyles and wellness among communities.", tags: ["Health", "Wellness"] },
    { title: "Art for All", year: 2026, description: "Fostering creativity and access to art for everyone.", tags: ["Culture", "Art"] },
    { title: "Women in Science", year: 2025, description: "Encouraging young women to pursue careers in science and technology.", tags: ["Gender", "Technology"] },
    { title: "Future Cities Project", year: 2027, description: "Designing sustainable and smart urban solutions for the future.", tags: ["Innovation", "Urban"] },
    { title: "AI for Education", year: 2026, description: "Leveraging artificial intelligence to enhance learning experiences.", tags: ["Technology", "Education"] },
    { title: "Innovation for Climate Change", year: 2027, description: "Developing solutions for climate change through technological innovation.", tags: ["Innovation", "Environment"] },
    { title: "Digital Nomads Program", year: 2025, description: "Helping youth embrace remote work and digital nomad lifestyles.", tags: ["Technology", "Youth"] },
    { title: "AI in Healthcare", year: 2026, description: "Using AI to enhance healthcare services and patient care.", tags: ["Technology", "Health"] },
    { title: "Global Citizens Initiative", year: 2024, description: "Promoting global citizenship and awareness among young people.", tags: ["Culture", "Social Impact"] },
    { title: "Future of Education", year: 2027, description: "Innovating new educational models for the future of learning.", tags: ["Education", "Innovation"] },
    { title: "Youth in Politics", year: 2024, description: "Encouraging youth participation in politics and governance.", tags: ["Youth", "Political Engagement"] }
];

// DOM Elements
const projectsContainer = document.getElementById('projectsContainer');
const searchInput = document.getElementById('searchInput');
const sortOption = document.getElementById('sortOption');
const activeFiltersContainer = document.getElementById('activeFilters');

// Active filters object
let activeFilters = {};

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
        cardDiv.className = 'card h-100 shadow-sm';

        const cardImg = document.createElement('img');
        cardImg.className = 'card-img-top';
        cardImg.src = 'https://via.placeholder.com/300x150';
        cardImg.alt = `${project.title} image`;

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const title = document.createElement('h5');
        title.className = 'card-title';
        title.textContent = project.title;

        const subtitle = document.createElement('h6');
        subtitle.className = 'card-subtitle mb-2 text-muted';
        subtitle.textContent = project.year;

        const description = document.createElement('p');
        description.className = 'card-text';
        description.textContent = project.description;

        // Create badges based on tags
        const badgeContainer = document.createElement('div');
        badgeContainer.className = 'mb-2';

        project.tags.forEach(tag => {
            const badgeColor = BADGE_COLORS[tag] || 'bg-secondary';  // Default to grey if no match

            const tagBadge = document.createElement('span');
            tagBadge.className = `badge me-1 clickable-badge ${badgeColor}`;
            tagBadge.textContent = tag;  // Badge text will be the tag name
            tagBadge.onclick = () => {
                activeFilters[tag] = tag;
                updateProjects();
                renderActiveFilters();
            };
            badgeContainer.appendChild(tagBadge);
        });

        cardBody.appendChild(title);
        cardBody.appendChild(subtitle);
        cardBody.appendChild(description);
        cardBody.appendChild(badgeContainer);

        cardDiv.appendChild(cardImg);
        cardDiv.appendChild(cardBody);

        colDiv.appendChild(cardDiv);
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

// Initial render
updateProjects();
