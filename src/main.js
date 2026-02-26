import { fetchFeatures } from './data.js';
import { initGraph, filterGraph } from './graph.js';
import { initUI, showToast, displayNodeDetails } from './ui.js';

async function bootstrap() {
    try {
        // 1. Fetch data (qui renvoie maintenant { nodes, links })
        const graphData = await fetchFeatures();

        // On extrait juste les nœuds (sans le core) pour générer les filtres de l'UI
        const features = graphData.nodes.filter(n => n.id !== 'core');

        // 2. Init UI
        initUI(features);

        // 3. Init Graph
        const container = document.getElementById('cy');

        initGraph(
            container,
            graphData, // On passe tout l'objet graphData ici
            (nodeData) => displayNodeDetails(nodeData),
            (nodeData, isHovering) => { }
        );

        // 4. Bind Filter
        document.getElementById('domain-filter').addEventListener('change', (e) => {
            filterGraph(e.target.value);
        });


    } catch (err) {
        console.error("Erreur critique:", err);
        showToast("Erreur système lors du chargement des données.");
    }
}

document.addEventListener('DOMContentLoaded', bootstrap);