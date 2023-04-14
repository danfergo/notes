import {findProjectById, fetchNotes, createNote, updateNote, deleteNote, addEdge, fetchLayersByProjectId, fetchEdgesByNoteIds } from './db.js';


let ACTIVE_LAYER;


function getProjectIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = parseInt(urlParams.get('id'), 10);
    return projectId;
  }
  

function renderNote(note, notesContainer) {
    const noteHTML = `
        <div class="note" data-id="${note.id}" style="left: ${note.x}px; top: ${note.y}px;">
            <div class="content">
                <div class="note-title" contenteditable="true">${note.title}</div>
                <div class="note-description" contenteditable="true">${note.description}</div>
            </div>
            <div class="nav">
                <button class="btn delete-btn">
                    <i class="bi bi-trash"></i>
                </button>
                <button class="btn link-btn">
                    <i class="bi bi-arrow-down-right"></i>
                </button>
            </div>
        </div>
    `;

    notesContainer.insertAdjacentHTML('beforeend', noteHTML);

    const noteElement = notesContainer.querySelector(`[data-id="${note.id}"]`);
    const titleElement = noteElement.querySelector('.note-title');
    const descriptionElement = noteElement.querySelector('.note-description');
    
    const deleteBtn = noteElement.querySelector('.delete-btn');
    const linkBtn = noteElement.querySelector('.link-btn');


    // Add event listeners for drag and drop functionality here
    noteElement.addEventListener('mousedown', (event) => onMouseDown(event, noteElement, note));
    noteElement.addEventListener('click', (event) => onNoteClick(event, noteElement, titleElement, descriptionElement));
    titleElement.addEventListener('input', () => updateNote(note.id, titleElement.textContent, descriptionElement.textContent, note.x, note.y));
    descriptionElement.addEventListener('input', () => updateNote(note.id, titleElement.textContent, descriptionElement.textContent, note.x, note.y));

    deleteBtn.addEventListener('click', () => {
        deleteNote(note.id);
        noteElement.remove();
    });

    linkBtn.addEventListener('click', () => {
        noteElement.classList.add('first-note');
    });

    

    return noteElement;
}


// Add a function to render the edge on the screen
function renderEdge(edge) {
    const sourceElement = document.querySelector(`[data-id="${edge.source}"]`);
    const targetElement = document.querySelector(`[data-id="${edge.target}"]`);

    const edgeElement = document.createElement('div');
    edgeElement.dataset.source = edge.source;
    edgeElement.dataset.target = edge.target;
    edgeElement.classList.add('edge');
    edgeElement.style.position = 'absolute';
    edgeElement.style.backgroundColor = 'black';
    edgeElement.style.overflow = 'visible';

    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    const x1 = sourceRect.left + sourceRect.width / 2;
    const y1 = sourceRect.top + sourceRect.height / 2;
    const x2 = targetRect.left + targetRect.width / 2;
    const y2 = targetRect.top + targetRect.height / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    const angle = Math.atan2(dy, dx) * 180 / Math.PI + Math.PI/2;

    edgeElement.style.width = `${length}px`;
    edgeElement.style.height = '2px';
    edgeElement.style.transformOrigin = 'left center';
    edgeElement.style.transform = `translate(${x1}px, ${y1}px) rotate(${angle}deg)`;

    const triangleElement = document.createElement('div');
    triangleElement.classList.add('triangle');
    triangleElement.style.position = 'absolute';
    triangleElement.style.width = '0';
    triangleElement.style.height = '0';
    triangleElement.style.borderBottom = '10px solid transparent';
    triangleElement.style.borderTop = '10px solid transparent';
    triangleElement.style.borderLeft = '15px solid black';
    
    const boxWidth = targetRect.width;
    const boxHeight = targetRect.height;
    const distX = (boxWidth / 2) / (length / dx);
    const distY = (boxHeight / 2) / (length / dy);
    const intersectionX = x2 - distX;
    const intersectionY = y2 - distY;

    const triangleDistance = Math.sqrt(Math.pow(intersectionX - x1, 2) + Math.pow(intersectionY - y1, 2)) - 75;
    const triangleY = -9;

    triangleElement.style.transformOrigin = 'center center';
    triangleElement.style.transform = `translate(${triangleDistance}px, ${triangleY}px)`;

    edgeElement.appendChild(triangleElement);
    document.getElementById('notes-container').appendChild(edgeElement);
    return edgeElement;
}


function updateEdge(note){
    const connectedEdges = Array.from(document.querySelectorAll(`[data-source="${note.id}"], [data-target="${note.id}"]`));
    for (const edgeElement of connectedEdges) {
        const edge = {
            source: parseInt(edgeElement.dataset.source),
            target: parseInt(edgeElement.dataset.target)
        };
        const sourceElement = document.querySelector(`[data-id="${edge.source}"]`);
        const targetElement = document.querySelector(`[data-id="${edge.target}"]`);

        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const x1 = sourceRect.left + sourceRect.width / 2;
        const y1 = sourceRect.top + sourceRect.height / 2;
        const x2 = targetRect.left + targetRect.width / 2;
        const y2 = targetRect.top + targetRect.height / 2;

        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        edgeElement.style.width = `${length}px`;
        edgeElement.style.height = '2px';
        edgeElement.style.transformOrigin = 'left center';
        edgeElement.style.transform = `translate(${x1}px, ${y1}px) rotate(${angle}deg)`;

        const dx = x2 - x1;
        const dy = y2 - y1;

        const boxWidth = targetRect.width;
        const boxHeight = targetRect.height;
        const distX = (boxWidth / 2) / (length / dx);
        const distY = (boxHeight / 2) / (length / dy);
        const intersectionX = x2 - distX;
        const intersectionY = y2 - distY; 
    
        const triangleDistance = Math.sqrt(Math.pow(intersectionX - x1, 2) + Math.pow(intersectionY - y1, 2)) - 75;
        const triangleY = -9;
    
        const triangleElement = edgeElement.querySelector('.triangle');
        triangleElement.style.transformOrigin = 'center center';
        triangleElement.style.transform = `translate(${triangleDistance}px, ${triangleY}px)`;
    }
}

function onMouseDown(event, noteElement, note) {
    if (noteElement.classList.contains('focused')) {
        return;
    }

    const offsetX = event.clientX - noteElement.getBoundingClientRect().left;
    const offsetY = event.clientY - noteElement.getBoundingClientRect().top;

    function onMouseMove(event) {
        const notesContainer = document.getElementById('notes-container');
        const notesContainerRect = notesContainer.getBoundingClientRect();
        
        const x = event.clientX - offsetX - notesContainerRect.left;
        const y = event.clientY - offsetY - notesContainerRect.top;

        noteElement.style.left = `${x}px`;
        noteElement.style.top = `${y}px`;

        updateNote(note.id, note.title, note.description, x, y);
        updateEdge(note);
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        

    }

    // Update the position of all edges connected to the moved note
    const connectedEdges = Array.from(document.querySelectorAll(`[data-source="${note.id}"], [data-target="${note.id}"]`));
    for (const edgeElement of connectedEdges) {
        const edge = {
            source: parseInt(edgeElement.dataset.source),
            target: parseInt(edgeElement.dataset.target)
        };
        const sourceElement = document.querySelector(`[data-id="${edge.source}"]`);
        const targetElement = document.querySelector(`[data-id="${edge.target}"]`);

        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const x1 = sourceRect.left + sourceRect.width / 2;
        const y1 = sourceRect.top + sourceRect.height / 2;
        const x2 = targetRect.left + targetRect.width / 2;
        const y2 = targetRect.top + targetRect.height / 2;

        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        edgeElement.style.width = `${length}px`;
        edgeElement.style.height = '2px';
        edgeElement.style.transformOrigin = 'left center';
        edgeElement.style.transform = `translate(${x1}px, ${y1}px) rotate(${angle}deg)`;
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}


function onNoteClick(event, noteElement, titleElement, descriptionElement) {
    const firstNote = document.getElementById('notes-container').querySelector('.first-note');
    if(firstNote &&firstNote != noteElement){
            const source = parseInt(firstNote.dataset.id);
            const target = parseInt(noteElement.dataset.id);
            addEdge(source, target).then((id) => {
                const edge = {
                    id,
                    source,
                    target
                };
                renderEdge(edge);

                firstNote.classList.remove('first-note');
            });
    }else {
        event.stopPropagation();

        defocusFocusedNote();

        noteElement.classList.add('focused');
        titleElement.contentEditable = true;
        descriptionElement.contentEditable = true;
        if(event.target !== titleElement){
            descriptionElement.focus();
        } else  {
            titleElement.focus();
        }
    }

}


function defocusFocusedNote(){
    const previouslyFocusedNote = document.querySelector('.note.focused');
    if (previouslyFocusedNote) {
        previouslyFocusedNote.classList.remove('focused');
        const prevTitle = previouslyFocusedNote.querySelector('.note-title');
        const prevDescription = previouslyFocusedNote.querySelector('.note-description');
        prevTitle.contentEditable = false;
        prevDescription.contentEditable = false;
    }

    //const deleteNoteButton = document.getElementById('delete-note');
    //deleteNoteButton.style.display = 'none';
}


async function renderLayers(layers) {
    const sidebar = document.querySelector('.sidebar');
    
    // Clear the sidebar content
    sidebar.innerHTML = '';

    // Add a title to the sidebar
    const sidebarTitle = document.createElement('h3');
    sidebarTitle.textContent = 'Layers';
    sidebar.appendChild(sidebarTitle);

    // Create a list to hold the layers
    const layerList = document.createElement('ul');

    // Loop through the layers and create list items for each layer
    layers.forEach(layer => {
        const layerListItem = document.createElement('li');
        layerListItem.textContent = layer.title;

        // Append the list item to the layer list
        layerList.appendChild(layerListItem);
    });

    // Append the layer list to the sidebar
    sidebar.appendChild(layerList);
}


window.addEventListener('DOMContentLoaded', async () => {
    const projectId = getProjectIdFromUrl();
    const project = await findProjectById(projectId);
    document.querySelector('.project-title').innerHTML = project.title;

    const layers = await fetchLayersByProjectId(projectId);
    renderLayers(layers);

    const notes = await fetchNotes(layers.map(l => l.id));  
    const notesContainer = document.getElementById('notes-container');

    ACTIVE_LAYER = layers[0];

    notesContainer.addEventListener('dblclick', (event) => {
        if (event.target === notesContainer) {
            defocusFocusedNote();

            const notesContainerRect = notesContainer.getBoundingClientRect();
            
            const x = event.clientX - notesContainerRect.left;
            const y = event.clientY - notesContainerRect.top;

            createNote({
                title: "New Note", 
                description: "", 
                x: x, 
                y: y,
                layer_id: ACTIVE_LAYER.id
            }).then((id) => {
                renderNote({
                    id,
                    title: "New Note",
                    description: "",
                    x,
                    y
                }, notesContainer);
            });
        }
    });

    notesContainer.addEventListener('click', (event) => {
        if (event.target === notesContainer) {
            defocusFocusedNote();
        }
    });


    //const deleteNoteButton = document.getElementById('delete-note');
    //deleteNoteButton.addEventListener('click', deleteFocusedNote);

    for (const note of notes) {
        renderNote(note, notesContainer);
    }

    /*const edgeButton = document.getElementById('edge-btn');
    edgeButton.addEventListener('click', () => {
        const notesContainer = document.getElementById('notes-container');
        let linkingMode = false;
        let firstNote = null;

        if (!notesContainer.classList.contains('linking')) {
            notesContainer.classList.add('linking');
            linkingMode = true;
        } else {
            notesContainer.classList.remove('linking');
            linkingMode = false;
        }

        notesContainer.addEventListener('click', (event) => {
            const linkingMode = document.getElementById('notes-container').classList.contains('linking');
            if (linkingMode && event.target.classList.contains('note')) {
                if (!firstNote) {
                    firstNote = event.target;
                } else {
                    const source = parseInt(firstNote.dataset.id);
                    const target = parseInt(event.target.dataset.id);
                    addEdge(source, target).then((id) => {
                        const edge = {
                            id,
                            source,
                            target
                        };
                        renderEdge(edge);
                    });
                    firstNote = null;
                }
            }
        });
    });*/

    const edges = await fetchEdgesByNoteIds(notes.map(n => n.id));
    for (const edge of edges) {
        renderEdge(edge);
    }

});