/**
 * Module de gestion et de rendu du graphe avec Force-Graph.
 * @module src/graph
 */

import ForceGraph from 'force-graph';

let graph;

// Couleurs de secours pour les bordures selon le domaine
const COLORS = {
    'Repository': '#ffffff',
    'Dossier': '#a882ff',
    'JavaScript': '#ffb84d',
    'Frontend': '#4db8ff',
    'Configuration': '#ff8f8f',
    'Documentation': '#8b9eb7',
    'Fichier racine': '#a0a0a0'
};

/**
 * Initialise le graphe interactif dans le conteneur spécifié.
 */
export function initGraph(container, graphData, onNodeClick, onNodeHover) {
    let hoverNode = null;
    let highlightNodes = new Set();
    let highlightLinks = new Set();

    graph = ForceGraph()(container)
        .graphData(graphData)
        .nodeId('id')
        .nodeLabel(node => '') // Désactive le tooltip textuel par défaut

        .nodePointerAreaPaint((node, color, ctx) => {
            let size = 12; // Base légèrement plus grande
            if (node.id === 'core') {
                size = 45; // Max central réduit
            } else if (node.loc > 0) {
                // Racine carrée avec un diviseur plus élevé pour lisser l'échelle (delta moins violent)
                size = Math.min(12 + Math.sqrt(node.loc) / 4, 35);
            }
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fill();
        })

        .nodeCanvasObject((node, ctx, globalScale) => {

            let size = 12;
            if (node.id === 'core') {
                size = 45;
            } else if (node.loc > 0) {
                size = Math.min(12 + Math.sqrt(node.loc) / 4, 35);
            }

            if (!node.imgObj && node.img) {
                node.imgObj = new Image();
                node.imgObj.src = node.img;
            }

            // 2. On sauvegarde l'état du pinceau et on crée un masque circulaire
            ctx.save();
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.clip(); // Coupe tout ce qui dépasse du rond !

            // 3. Dessin de l'image de profil (ou fond gris si erreur/chargement)
            try {
                if (node.imgObj && node.imgObj.complete) {
                    ctx.drawImage(node.imgObj, node.x - size, node.y - size, size * 2, size * 2);
                } else {
                    ctx.fillStyle = '#333';
                    ctx.fill();
                }
            } catch (e) {
                ctx.fillStyle = '#333';
                ctx.fill();
            }

            ctx.restore();


            if (node.isNew) {
                const time = performance.now();
                const pulseRadius = size + 2 + Math.abs(Math.sin(time / 400)) * 8;
                const pulseOpacity = 0.5 - Math.abs(Math.sin(time / 400)) * 0.4;

                ctx.beginPath();
                ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.globalAlpha = pulseOpacity;
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.lineWidth = highlightNodes.has(node) ? 3 : 1.5;
            ctx.strokeStyle = highlightNodes.has(node) ? '#ffffff' : node.color;
            ctx.stroke();

            if (globalScale > 2 || highlightNodes.has(node)) {
                const label = node.name;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.fillStyle = highlightNodes.has(node) ? '#ffffff' : node.color;
                ctx.fillText(label, node.x, node.y + size + (15 / globalScale));
            }
        })

        .linkColor(link => highlightLinks.has(link) ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.05)')
        .linkWidth(link => highlightLinks.has(link) ? 2 : 1)
        .linkDirectionalParticles(link => highlightLinks.has(link) ? 3 : 0)
        .linkDirectionalParticleWidth(3)
        .linkDirectionalParticleColor(link => link.source.color || '#ffffff')
        .linkDirectionalParticleSpeed(0.01)

        // --- INTERACTIONS UTILISATEUR ---
        .onNodeHover(node => {
            highlightNodes.clear();
            highlightLinks.clear();

            if (node) {
                highlightNodes.add(node);
                // On illumine les liens connectés et les voisins
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

            // On force le graphe à redessiner les liens
            graph.linkWidth(graph.linkWidth()).linkDirectionalParticles(graph.linkDirectionalParticles());
        })
        .onNodeClick(node => {
            // Mouvement de caméra vers le nœud cliqué
            graph.centerAt(node.x, node.y, 1000);
            graph.zoom(3, 1500); // Zoom x3
            onNodeClick(node);
        })
        .onBackgroundClick(() => {
            onNodeClick(null);
            graph.zoomToFit(1000);
        });

    // --- LA PHYSIQUE VIVANTE ---
    // Répulsion forte pour bien écarter les avatars (augmentée car les nœuds sont plus gros)
    graph.d3Force('charge').strength(-550);
    // Éloigne les nœuds du centre pour que l'étoile respire (augmentée pour la clarté)
    graph.d3Force('link').distance(180);
    // Force douce vers le centre pour éviter que le graphe n'explose à l'infini
    graph.d3Force('center').strength(0.04);

    window.addEventListener('resize', () => {
        graph.width(container.clientWidth);
        graph.height(container.clientHeight);
    });

    return graph;
}

/**
 * Filtre visuellement les nœuds sans les supprimer (beaucoup plus performant).
 */
export function filterGraph(field) {
    if (!graph) return;

    // On cache simplement les nœuds qui ne correspondent pas
    graph.nodeVisibility(node => {
        if (field === 'all') return true;
        return node.field === field || node.id === 'core';
    });

    // Pareil pour les liens
    graph.linkVisibility(link => {
        if (field === 'all') return true;
        return link.source.field === field || link.target.field === field || link.source.id === 'core';
    });
}
