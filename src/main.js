/**
 * Point d'entrée principal de l'application Dashboard.
 * Initialise les données, l'interface graphique et le graphe interactif.
 * @module src/main
 */

import { fetchFeatures } from './data.js';
import { initGraph, filterGraph } from './graph.js';
import {
    initUI,
    showToast,
    displayNodeDetails
} from './ui.js';

/**
 * Fonction d'amorçage responsable de l'initialisation complète de l'application.
 * Elle charge les données, configure l'UI et instancie Cytoscape.
 * @async
 * @function bootstrap
 */
async function bootstrap() {
    try {
        // 1. Fetch data
        const elements = await fetchFeatures(); // elements containing 'core' and repo files

        // Convert Cytoscape elements back to a simple feature list for UI stats
        const features = elements.filter(e => e.data.id !== 'core' && !e.data.source).map(e => e.data);

        // 2. Init UI Stats
        initUI(features);

        // 3. Init Graph
        const container = document.getElementById('cy');

        initGraph(
            container,
            elements,
            // onClick
            (nodeData) => {
                displayNodeDetails(nodeData);
            },
            // onHover
            (nodeData, isHovering) => {
                // Can optionally show simple tooltip, but right now styling handles glow
            }
        );

        // 4. Bind Filter
        document.getElementById('domain-filter').addEventListener('change', (e) => {
            filterGraph(e.target.value);
        });

        showToast("Synchronisation réussie.");

    } catch (err) {
        console.error("Erreur critique:", err);
        showToast("Erreur système lors du chargement des données.");
    }
}

document.addEventListener('DOMContentLoaded', bootstrap);
