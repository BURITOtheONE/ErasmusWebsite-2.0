// Sample Erasmus projects data
const projects = [
    { title: "Digital Skills for Future", year: 2024, description: "Improving digital literacy for students and teachers." },
    { title: "Green Europe Initiative", year: 2025, description: "Promoting sustainable development and green practices." },
    { title: "Cultural Heritage Exchange", year: 2026, description: "Exploring cultural diversity and preserving traditions." },
    { title: "STEM Innovators", year: 2027, description: "Encouraging innovation in science, technology, engineering, and mathematics." }
];

// DOM Elements
const projectsContainer = document.getElementById('projectsContainer');
const searchInput = document.getElementById('searchInput');
const sortOption = document.getElementById('sortOption');

// Function to render projects
function renderProjects(filteredProjects) {
    projectsContainer.innerHTML = ''; // Clear previous content
    filteredProjects.forEach(project => {
        const projectCard = `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${project.title}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${project.year}</h6>
                        <p class="card-text">${project.description}</p>
                    </div>
                </div>
            </div>
        `;
        projectsContainer.innerHTML += projectCard;
    });
}

// Function to sort projects
function sortProjects(projects, criteria) {
    if (criteria === 'year') {
        return [...projects].sort((a, b) => a.year - b.year);
    } else if (criteria === 'title') {
        return [...projects].sort((a, b) => a.title.localeCompare(b.title));
    }
    return projects;
}

// Function to filter and sort projects
function updateProjects() {
    const query = searchInput.value.toLowerCase();
    const sortBy = sortOption.value;

    // Filter projects by search query
    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
    );

    // Sort the filtered projects
    const sortedProjects = sortProjects(filteredProjects, sortBy);

    // Render the final list
    renderProjects(sortedProjects);
}

// Event Listeners
searchInput.addEventListener('input', updateProjects);
sortOption.addEventListener('change', updateProjects);

// Initial Render
updateProjects();
