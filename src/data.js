const REPO_OWNER = 'Slaytt';
const REPO_NAME = 'Hackathon-2026';
const REGISTRY_URL = 'https://raw.githubusercontent.com/Slaytt/Hackathon-2026/main/public/registry.json';

const STATS_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/stats/contributors`;

export async function fetchFeatures() {
    try {
        // 1. On récupère le JSON des étudiants
        const response = await fetch(REGISTRY_URL);
        if (!response.ok) throw new Error("Erreur JSON");
        const registryData = await response.json();

        let linesOfCodeData = {};
        try {
            const cacheKey = 'github_stats_cache';
            const cachedTime = sessionStorage.getItem(`${cacheKey}_time`);
            const cachedData = sessionStorage.getItem(cacheKey);

            if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime) < 10 * 60 * 1000)) {
                linesOfCodeData = JSON.parse(cachedData);
            } else {
                const statsResponse = await fetch(STATS_URL);
                if (statsResponse.status === 200) {
                    const statsData = await statsResponse.json();
                    statsData.forEach(stat => {
                        if (stat.author && stat.author.login) {
                            const totalAdditions = stat.weeks.reduce((sum, week) => sum + week.a, 0);
                            linesOfCodeData[stat.author.login.toLowerCase()] = totalAdditions;
                        }
                    });
                    sessionStorage.setItem(cacheKey, JSON.stringify(linesOfCodeData));
                    sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
                } else if (statsResponse.status === 403) {
                    console.warn("API GitHub: Limite de requêtes atteinte (60/heure pour IP non authentifiée).");
                    if (cachedData) linesOfCodeData = JSON.parse(cachedData); // Fallback old cache
                }
            }
        } catch (e) {
            console.warn("Impossible de récupérer les stats Github, tailles par défaut appliquées.");
        }

        return formatDataForGraph(registryData, linesOfCodeData);
    } catch (error) {
        console.error("Erreur API GitHub :", error);
        throw error;
    }
}

// Petit générateur de couleurs néon aléatoires pour ceux qui oublient de choisir
function getRandomPastelColor() {
    const pastels = [
        '#ffb3ba',
        '#ffdfba',
        '#ffffba',
        '#baffc9',
        '#bae1ff',
        '#e8baff'
    ];
    return pastels[Math.floor(Math.random() * pastels.length)];
}


function formatDataForGraph(repoContents, linesOfCodeData) {
    const nodes = [];
    const links = [];

    // Noeud central (Core)
    nodes.push({
        id: 'core',
        name: REPO_NAME,
        description: `Dépôt principal : ${REPO_OWNER}/${REPO_NAME}`,
        field: 'Repository',
        author: REPO_OWNER,
        color: '#ffffff',
        val: 25,
        img: 'logo-rond-amu.png',
        loc: 0,
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

        const authorLoc = (linesOfCodeData && linesOfCodeData[nodeAuthor.toLowerCase()]) ? linesOfCodeData[nodeAuthor.toLowerCase()] : 0;

        nodes.push({
            id: nodeId,
            name: item.name,
            description: item.short_description || item.description || `Projet ajouté par ${nodeAuthor}`,
            field: getField(item),
            author: nodeAuthor,
            img: `https://github.com/${nodeAuthor.replace(/\s+/g, '')}.png`,
            color: nodeColor,
            loc: authorLoc,
            val: 8,
            contributors: [{
                name: nodeAuthor,
                avatar_url: `https://github.com/${nodeAuthor.replace(/\s+/g, '')}.png`,
                profile_url: `https://github.com/${nodeAuthor.replace(/\s+/g, '')}`
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