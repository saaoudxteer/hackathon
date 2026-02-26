import ForceGraph from 'force-graph';

let graph;

const COLORS = {
    'Repository': '#ffffff',
    'Dossier': '#a882ff',
    'JavaScript': '#ffb84d',
    'Frontend': '#4db8ff',
    'Configuration': '#ff8f8f',
    'Documentation': '#8b9eb7',
    'Fichier racine': '#a0a0a0'
};

export function initGraph(container, graphData, onNodeClick, onNodeHover) {
    let hoverNode = null;
    let highlightNodes = new Set();
    let highlightLinks = new Set();

    graph = ForceGraph()(container)
        .graphData(graphData)
        .nodeId('id')
        .nodeLabel('name')
        .nodeRelSize(6)
        // Couleurs des nœuds
        .nodeColor(node => COLORS[node.field] || COLORS['Fichier racine'])
        // Esthétique des liens
        .linkColor(link => highlightLinks.has(link) ? '#2dffc4' : 'rgba(45, 255, 196, 0.15)')
        .linkWidth(link => highlightLinks.has(link) ? 3 : 1)
        // Particules de données qui voyagent sur les liens (Effet Waouh garanti)
        .linkDirectionalParticles(link => highlightLinks.has(link) ? 4 : 0)
        .linkDirectionalParticleWidth(3)
        .linkDirectionalParticleSpeed(0.01)

        // Interactions
        .onNodeHover(node => {
            highlightNodes.clear();
            highlightLinks.clear();

            if (node) {
                highlightNodes.add(node);
                // Trouver les liens connectés
                graphData.links.forEach(link => {
                    if (link.source.id === node.id || link.target.id === node.id) {
                        highlightLinks.add(link);
                        highlightNodes.add(link.source);
                        highlightNodes.add(link.target);
                    }
                });
            }

            hoverNode = node || null;
            container.style.cursor = node ? 'pointer' : null;
            onNodeHover(node, !!node);

            // Forcer le rafraîchissement visuel
            graph.nodeColor(graph.nodeColor()).linkWidth(graph.linkWidth()).linkDirectionalParticles(graph.linkDirectionalParticles());
        })
        .onNodeClick(node => {
            // Animation de caméra qui centre sur le nœud cliqué !
            graph.centerAt(node.x, node.y, 1000);
            graph.zoom(2.5, 2000);
            onNodeClick(node);
        })
        .onBackgroundClick(() => {
            onNodeClick(null);
            graph.zoomToFit(1000);
        });

    // --- LA PHYSIQUE VIVANTE ---
    // Repousse fortement les nœuds pour créer une belle étoile
    graph.d3Force('charge').strength(-400);
    // Éloigne le centre des nœuds enfants
    graph.d3Force('link').distance(120);
    // Empêche le graphe de s'arrêter complètement (le fait "respirer")
    graph.d3Force('center').strength(0.05);

    // Ajuster le graphe à la taille de la fenêtre
    window.addEventListener('resize', () => {
        graph.width(container.clientWidth);
        graph.height(container.clientHeight);
    });

    return graph;
}

export function filterGraph(field) {
    if (!graph) return;

    // Au lieu de supprimer les nœuds, on utilise nodeVisibility (beaucoup plus fluide)
    graph.nodeVisibility(node => {
        if (field === 'all') return true;
        return node.field === field || node.id === 'core';
    });

    graph.linkVisibility(link => {
        if (field === 'all') return true;
        return link.source.field === field || link.target.field === field || link.source.id === 'core';
    });
}