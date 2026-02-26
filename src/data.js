const REPO_OWNER = 'Slaytt';
const REPO_NAME = 'Hackathon-2026';
const REGISTRY_URL = 'https://raw.githubusercontent.com/Slaytt/Hackathon-2026/main/public/registry.json';

export async function fetchFeatures() {
    try {
        const response = await fetch(REGISTRY_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return formatDataForGraph(data);
    } catch (error) {
        console.error("Erreur API GitHub :", error);
        throw error;
    }
}

// Petit générateur de couleurs néon aléatoires pour ceux qui oublient de choisir
function getRandomPastelColor() {
    const pastels = [
        '#ffb3ba', // Rose pastel
        '#ffdfba', // Pêche / Orange doux
        '#ffffba', // Jaune pastel
        '#baffc9', // Menthe / Vert doux
        '#bae1ff', // Bleu ciel pastel
        '#e8baff'  // Lilas / Violet doux
    ];
    return pastels[Math.floor(Math.random() * pastels.length)];
}

function formatDataForGraph(repoContents) {
    const nodes = [];
    const links = [];

    // Nœud central (Core)
    nodes.push({
        id: 'core',
        name: REPO_NAME,
        description: `Dépôt principal : ${REPO_OWNER}/${REPO_NAME}`,
        field: 'Repository',
        author: REPO_OWNER,
        color: '#ffffff',
        val: 25,
        img: 'logo-rond-amu.png',
        contributors: []
    });

    if (!Array.isArray(repoContents)) return { nodes, links };

    const getField = (item) => {
        if (item.type === 'dir') return 'Dossier';
        if (item.name.endsWith('.js') || item.name.endsWith('.ts')) return 'JavaScript';
        if (item.name.endsWith('.css') || item.name.endsWith('.html')) return 'Frontend';
        if (item.name.endsWith('.json')) return 'Configuration';
        if (item.name.endsWith('.md')) return 'Documentation';
        return 'Fichier racine';
    };

    repoContents.forEach((item, index) => {
        const nodeId = item.id || `node_${index}`;
        const nodeAuthor = item.author || 'github';

        const nodeColor = item.color || getRandomPastelColor();

        nodes.push({
            id: nodeId,
            name: item.name,
            description: item.short_description || item.description || `Projet ajouté par ${nodeAuthor}`,
            field: getField(item),
            author: nodeAuthor,
            img: `https://github.com/${nodeAuthor.replace(/\s+/g, '')}.png`,
            color: nodeColor,
            val: 8,
            contributors: [{
                name: nodeAuthor,
                avatar_url: `https://github.com/${nodeAuthor.replace(/\\s+/g, '')}.png`,
                profile_url: `https://github.com/${nodeAuthor.replace(/\\s+/g, '')}`
            }]
        });

        if (item.dependencies && item.dependencies.length > 0) {
            item.dependencies.forEach(depId => {
                links.push({ source: nodeId, target: depId });
            });
        } else {
            links.push({ source: nodeId, target: 'core' });
        }
    });

    const recentNodes = nodes.filter(n => n.id !== 'core').slice(-3);
    recentNodes.forEach(n => n.isNew = true);

    return { nodes, links };
}