/**
 * Module de gestion de l'interface utilisateur (DOM, Modales, Notifications).
 * @module src/ui
 */

/**
 * Initialise les éléments de l'interface graphique.
 * @function initUI
 * @param {Array<Object>} features - Tableau brut des objets fonctionnalités.
 */
export function initUI(features) {
    populateDomainFilter(features);
    checkFirstVisit();
    bindStaticEvents();
}

/**
 * Remplit le menu déroulant de filtrage par domaine.
 * @function populateDomainFilter
 * @param {Array<Object>} features - Tableau brut des objets fonctionnalités.
 */
function populateDomainFilter(features) {
    const domains = [...new Set(features.map(f => f.field || 'Inconnu'))].sort();
    const select = document.getElementById('domain-filter');

    domains.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        select.appendChild(opt);
    });
}

/**
 * Vérifie si l'utilisateur visite le site pour la première fois (gestion via cookie).
 * @function checkFirstVisit
 */
function checkFirstVisit() {
    if (!document.cookie.includes('first_visit=true')) {
        const modal = document.getElementById('welcome-modal');
        modal.classList.remove('hidden');

        document.getElementById('start-btn').addEventListener('click', () => {
            document.cookie = "first_visit=true; max-age=31536000; path=/";
            modal.classList.add('hidden');
        });
    }
}



/**
 * Affiche une notification temporaire de type "toast".
 * @function showToast
 * @param {string} message - Le contenu de la notification.
 */
export function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => {
        if (container.contains(toast)) container.removeChild(toast);
    }, 3000);
}

/**
 * Affiche les détails d'un nœud spécifique dans le panneau dédié.
 * @function displayNodeDetails
 * @param {Object|null} nodeData - Les données du nœud sélectionné (null pour masquer).
 */
export function displayNodeDetails(nodeData) {
    const panel = document.getElementById('details-panel');
    if (!nodeData) {
        panel.classList.add('hidden');
        return;
    }

    document.getElementById('detail-name').textContent = nodeData.name;
    document.getElementById('detail-desc').textContent = nodeData.description || "Aucune description.";
    document.getElementById('detail-domain').textContent = nodeData.field || "Inconnu";

    const list = document.getElementById('detail-contributors');
    list.innerHTML = ""; // clear

    if (nodeData.contributors && nodeData.contributors.length > 0) {
        nodeData.contributors.forEach(c => {
            const a = document.createElement('a');
            a.className = 'contributor';
            a.href = c.profile_url || "#";
            a.target = "_blank";
            a.rel = "noopener noreferrer";

            const img = document.createElement('img');
            img.src = c.avatar_url;
            img.alt = `Avatar de ${c.name}`;

            const span = document.createElement('span');
            span.textContent = c.name;

            a.appendChild(img);
            a.appendChild(span);
            list.appendChild(a);
        });
    } else {
        list.innerHTML = "<span class='contributor'>Anonyme</span>";
    }

    panel.classList.remove('hidden');
}

/**
 * Associe les écouteurs d'événements aux éléments statiques du DOM.
 * @function bindStaticEvents
 */
function bindStaticEvents() {
    document.getElementById('close-details').addEventListener('click', () => {
        document.getElementById('details-panel').classList.add('hidden');
    });

    document.getElementById('add-node-btn').addEventListener('click', () => {
        const repoUrl = 'https://github.com/Slaytt/Hackathon-2026.git';
        window.open(repoUrl, "_blank", "noopener,noreferrer");
    });
}

