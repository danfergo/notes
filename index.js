import { createProject, fetchProjects } from './db.js';


// Function to render the projects list
async function renderProjectsList() {
    const projects = await fetchProjects();
    const projectsList = document.getElementById('projects-list');
    projectsList.innerHTML = '';

    projects.forEach(project => {
        const listItem = document.createElement('li');
        const projectLink = document.createElement('a');
        projectLink.href = `project.html?id=${project.id}`;
        projectLink.textContent = project.title;
        listItem.appendChild(projectLink);
        projectsList.appendChild(listItem);
    });
}

// Handle the form submission
document.getElementById('create-project-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const titleInput = document.getElementById('project-title-input');
    const title = titleInput.value.trim();

    if (title) {
        await createProject(title);
        titleInput.value = '';
        renderProjectsList();
    }
});

// Render the projects list on page load
renderProjectsList();