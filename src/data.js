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

function formatDataForGraph(repoContents) {
    const nodes = [];
    const links = [];

    // Nœud central (Core) plus gros
    nodes.push({
        id: 'core',
        name: REPO_NAME,
        description: `Dépôt principal : ${REPO_OWNER}/${REPO_NAME}`,
        field: 'Repository',
        val: 25, // Taille du nœud pour ForceGraph
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
        const nodeId = `node_${index}`;

        // Ajout du nœud
        nodes.push({
            id: nodeId,
            name: item.name,
            description: `Type: ${item.type} | Taille: ${item.size} octets\nLien: ${item.html_url}`,
            field: getField(item),
            val: 8, // Taille normale
            contributors: [{ name: "GitHub System", avatar_url: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" }]
        });

        // Ajout du lien vers le centre
        links.push({ source: nodeId, target: 'core' });
    });

    return { nodes, links };
}