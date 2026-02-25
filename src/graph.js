/**
 * Module de gestion et de rendu du grapheCytoscape.
 * @module src/graph
 */

import cytoscape from 'cytoscape';

let cy;

/**
 * Génère une couleur hexadécimale constante à partir d'une chaîne de caractères (domaine/champ).
 * @function getColor
 * @param {string} field - Le nom du domaine.
 * @returns {string} Une couleur au format hexadécimal.
 */
function getColor(field) {
    // Obsidian-like soft palette
    const colors = [
        '#8b9eb7', // soft blue/gray
        '#a882ff', // soft purple
        '#4db8ff', // soft teal
        '#ff8f8f', // soft red
        '#ffb84d', // soft orange
    ];
    let hash = 0;
    for (let i = 0; i < field.length; i++) {
        hash = field.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Initialise le graphe Cytoscape dans le conteneur spécifié.
 * @function initGraph
 * @param {HTMLElement} container - L'élément DOM conteneur du graphe.
 * @param {Array<Object>} elements - Les données des nœuds et arêtes.
 * @param {Function} onNodeClick - Callback appelé lors du clic sur un nœud.
 * @param {Function} onNodeHover - Callback appelé lors du survol d'un nœud.
 * @returns {Object} L'instance Cytoscape générée.
 */
export function initGraph(container, elements, onNodeClick, onNodeHover) {
    cy = cytoscape({
        container: container,
        elements: elements,
        style: [
            {
                selector: 'node',
                style: {
                    'width': 12,
                    'height': 12,
                    'content': 'data(name)',
                    'color': '#a0a0a0',
                    'font-family': 'Rajdhani',
                    'font-size': '12px',
                    'text-valign': 'bottom',
                    'text-margin-y': 5,
                    'text-outline-color': '#050b14', // Match background to make text readable over edges
                    'text-outline-width': 2,
                    'background-color': function (ele) {
                        return ele.id() === 'core' ? '#ffffff' : getColor(ele.data('field'));
                    },
                    'border-width': 0,
                    'transition-property': 'background-color, color, width, height',
                    'transition-duration': '0.2s'
                }
            },
            {
                selector: 'node:selected',
                style: {
                    'border-width': 4,
                    'border-color': '#fff'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 1.5,
                    'line-color': '#4d4d4d',
                    'curve-style': 'straight',
                    'target-arrow-shape': 'none',
                    'transition-property': 'line-color, opacity',
                    'transition-duration': '0.2s',
                    'opacity': 0.6
                }
            },
            {
                selector: '.dimmed',
                style: {
                    'opacity': 0.1
                }
            },
            {
                selector: '.highlighted-node',
                style: {
                    'color': '#ffffff', // bright text
                    'text-outline-color': '#000000'
                }
            },
            {
                selector: '.highlighted-edge',
                style: {
                    'line-color': '#ffffff',
                    'opacity': 1,
                    'width': 2
                }
            }
        ],
        layout: {
            name: 'cose', // Built-in physics layout
            idealEdgeLength: 100,
            nodeOverlap: 20,
            refresh: 20,
            fit: true,
            padding: 30,
            randomize: true,
            componentSpacing: 100,
            nodeRepulsion: 400000,
            edgeElasticity: 100,
            nestingFactor: 5,
            gravity: 80,
            numIter: 1000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0
        },
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false
    });

    // Ensure "core" node is larger but still minimalist
    cy.nodes('#core').style({
        'width': 18,
        'height': 18,
        'font-size': '14px',
        'color': '#ffffff'
    });

    // Pas d'animation dynamique (bobbing) : le réseau reste statique,
    // seul l'effet de layout initial 'cose' place les nœuds.

    // Events
    cy.on('tap', 'node', function (evt) {
        const node = evt.target;
        cy.nodes().removeClass('selected');
        node.addClass('selected');
        onNodeClick(node.data());
    });

    cy.on('mouseover', 'node', function (evt) {
        const node = evt.target;
        const neighborhood = node.closedNeighborhood();

        // Dim everything else
        cy.elements().not(neighborhood).addClass('dimmed');

        // Highlight local cluster
        node.addClass('highlighted-node');
        neighborhood.nodes().addClass('highlighted-node');
        neighborhood.edges().addClass('highlighted-edge');

        onNodeHover(node.data(), true);
    });

    cy.on('mouseout', 'node', function (evt) {
        const node = evt.target;
        cy.elements().removeClass('dimmed highlighted-node highlighted-edge');
        onNodeHover(node.data(), false);
    });

    // Reset click if background tapped
    cy.on('tap', function (evt) {
        if (evt.target === cy) {
            cy.nodes().removeClass('selected');
            onNodeClick(null);
        }
    });

    return cy;
}

/**
 * Filtre visuellement les nœuds du graphe en fonction du domaine sélectionné.
 * @function filterGraph
 * @param {string} field - Le domaine à isoler ou "all" pour tout afficher.
 */
export function filterGraph(field) {
    if (!cy) return;
    cy.batch(() => {
        if (field === 'all') {
            cy.elements().style('display', 'element');
        } else {
            cy.elements().style('display', 'none');
            const filtered = cy.nodes().filter(n => n.data('field') === field || n.id() === 'core');
            filtered.style('display', 'element');
            filtered.connectedEdges().style('display', 'element');
        }
        cy.layout({ name: 'cose', animate: true, animationDuration: 500 }).run();
    });
}
