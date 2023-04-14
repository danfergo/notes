// Create a new instance of Dexie
const db = new Dexie('ProjectsDatabase');

// Define the schema for the projects table
db.version(2).stores({
    projects: '++id, title',

    // project stuff.
    layers: '++id, title, project_id',
    notes: '++id, title, description, x, y, layer_id',
    edges: '++id, source_id, target_id'
});

async function findProjectById(projectId) {
    const project = await db.projects.get(projectId);
    return project;
}

// Function to create a new project
async function createProject(title) {
    const projectId = await db.projects.add({ title });
    await createLayer('Default', projectId);
    return projectId;
}

// Function to fetch all projects
async function fetchProjects() {
    const projects = await db.projects.toArray();
    return projects;
}


// LAYERS.

async function createLayer(title, project_id) {
    const layerId = await db.layers.add({ title, project_id });
    return layerId;
}

async function fetchLayersByProjectId(project_id) {
    const layers = await db.layers.where('project_id').equals(project_id).toArray();
    return layers;
}


// NOTES.

async function fetchNotes(layerIds) {
    const notes = await db.notes.where('layer_id').anyOf(layerIds).toArray();
    return notes;
}

function createNote(note) {
    return db.notes.add(note);
}

function updateNote(id, title, description, x, y) {
    return db.notes.update(id, {title, description, x, y});
}

function deleteNote(id) {
    return db.notes.delete(id);
}

async function addEdge(source, target) {
    return db.edges.add({ source, target });
}

async function fetchEdges() {
    const edges = await db.edges.toArray();
    return edges;
}

async function fetchEdgesByNoteIds(notesIds) {
    const edges = await db.edges
        .where('source_id')
        .anyOf(notesIds)
        .or('target_id')
        .anyOf(notesIds)
        .toArray();

    return edges;
}

db.open().catch((error) => {
    console.error("Failed to open database: " + error);
});

export { 
    createProject, 
    fetchProjects,
    findProjectById,

    // layers
    fetchLayersByProjectId,
    createLayer,

    // notes
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,

    // edges
    fetchEdges,
    fetchEdgesByNoteIds,
    addEdge
};
