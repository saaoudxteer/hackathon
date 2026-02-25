/**
 * Module responsable du chargement et du formatage des données.
 * @module src/data
 */

const REPO_OWNER = 'Slaytt';
const REPO_NAME = 'Hackathon-2026';

const REGISTRY_URL = 'https://raw.githubusercontent.com/Slaytt/Hackathon-2026/main/public/registry.json';

/**
 * Récupère le contenu du registry.json depuis le dépôt GitHub et le formate pour le graphe.
 * @async
 * @function fetchFeatures
 * @returns {Promise<Array<Object>>} Un tableau d'éléments formatés pour Cytoscape.js.
 * @throws {Error} Si la requête réseau échoue.
 */
export async function fetchFeatures() {
    try {
        const response = await fetch(REGISTRY_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return formatDataForGraph(data);
    } catch (error) {
        console.error("Erreur API GitHub (fetchFeatures) :", error);
        throw error;
    }
}

/**
 * Convertit le contenu de l'API GitHub en éléments compatibles avec Cytoscape.js (nœuds et arêtes).
 * @function formatDataForGraph
 * @param {Array<Object>} repoContents - Tableau des fichiers/dossiers renvoyés par l'API GitHub.
 * @returns {Array<Object>} Tableau d'éléments Cytoscape (nœuds et arêtes).
 */
function formatDataForGraph(repoContents) {
    const elements = [];

    // Nœud racine représentant le dépôt
    elements.push({
        data: {
            id: 'core',
            name: REPO_NAME,
            description: `Dépôt principal : ${REPO_OWNER}/${REPO_NAME}`,
            field: 'Repository',
            contributors: []
        }
    });

    if (!Array.isArray(repoContents)) return elements;

    // Fonction utilitaire pour deviner le domaine selon l'extension/type
    const getField = (item) => {
        if (item.type === 'dir') return 'Dossier';
        if (item.name.endsWith('.js') || item.name.endsWith('.ts')) return 'JavaScript / TypeScript';
        if (item.name.endsWith('.css') || item.name.endsWith('.html')) return 'Frontend (UI/CSS)';
        if (item.name.endsWith('.json')) return 'Configuration / Données';
        if (item.name.endsWith('.md')) return 'Documentation';
        return 'Fichier racine';
    };

    repoContents.forEach((item, index) => {
        const nodeId = `node_${index}`;

        // Add node
        elements.push({
            data: {
                id: nodeId,
                name: item.name,
                description: `Type: ${item.type} | Taille: ${item.size} octets\nLien: ${item.html_url}`,
                field: getField(item),
                contributors: [
                    {
                        name: "GitHub System",
                        avatar_url: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
                        profile_url: item.html_url
                    }
                ]
            }
        });

        // Add edge connecting to core
        elements.push({
            data: {
                id: `e_${nodeId}_core`,
                source: nodeId,
                target: 'core'
            }
        });
    });

    return elements;
}

/**
 * Récupère le dernier commit du dépôt GitHub pour extraire l'heure de la dernière mise à jour.
 * @async
 * @function fetchLastUpdate
 * @returns {Promise<string>} L'heure formatée en chaîne de caractères, ou un message d'erreur.
 */
export async function fetchLastUpdate() {
    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=1`);
        if (!response.ok) return "--";

        const commits = await response.json();
        if (commits.length > 0 && commits[0].commit && commits[0].commit.author) {
            const dateStr = commits[0].commit.author.date;
            const dateObj = new Date(dateStr);
            return dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
        return "--";
    } catch (err) {
        console.error("Erreur récupération commmits:", err);
        return "--";
    }
}
