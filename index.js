const input = document.getElementById("search");
const results = document.getElementById("results");
const filters = document.querySelectorAll('input[name="filter"]');
const sidebar = document.getElementById("sidebar");
const toggleButton = document.getElementById("toggle-filters");

let currentFilter = "weapons";
let dataCache = {};

filters.forEach((radio) => {
    radio.addEventListener("change", () => {
        currentFilter = radio.value;
        loadDataAndSearch();
    });
});

input.addEventListener("input", loadDataAndSearch);

toggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("show");
});
document.getElementById("darkToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
});
async function loadDataAndSearch() {
    const query = input.value.trim().toLowerCase();
    if (query === "") {
        results.innerHTML = "";
        return;
    }

    const file = `json/${currentFilter}.json`;

    if (!dataCache[currentFilter]) {
        try {
            const res = await fetch(file);
            if (!res.ok) throw new Error(`Could not load ${file}`);
            const json = await res.json();
            dataCache[currentFilter] = json;
        } catch (err) {
            results.classList.remove("hidden");
            results.innerHTML = `<p>Error loading data: ${err.message}</p>`;
            return;
        }
    }

    const entries = dataCache[currentFilter];
    const matches = entries.filter((entry) => {
        const title = entry.title.toLowerCase();
        const words = title.split(/\s+/);
        const initials = words.map((w) => w[0]).join("");

        return (
            title.includes(query) ||
            initials.includes(query.replace(/\s+/g, ""))
        );
    });

    if (matches.length === 0) {
        results.innerHTML = `<p>No results found for "<strong>${query}</strong>"</p>`;
        return;
    }
    results.innerHTML = matches
        .map(
            (entry, index) => `
    <div class="result-item" data-index="${index}">
        <p class="result-title"><strong>${index + 1}.</strong> ${
                entry.title
            }</p>
        <div class="result-details hidden"></div>
    </div>
  `
        )
        .join("");

    // Add click handlers
    document.querySelectorAll(".result-item").forEach((item) => {
        item.addEventListener("click", () => {
            const index = parseInt(item.dataset.index, 10);
            const detailsDiv = item.querySelector(".result-details");
            const isOpen = !detailsDiv.classList.contains("hidden");

            if (isOpen) {
                detailsDiv.classList.add("hidden");
                detailsDiv.innerHTML = "";
            } else {
                detailsDiv.innerHTML = formatDetails(matches[index]);
                detailsDiv.classList.remove("hidden");
            }
        });
    });

    // Auto-expand if only one
    if (matches.length === 1) {
        const item = document.querySelector(".result-item");
        const detailsDiv = item.querySelector(".result-details");
        detailsDiv.innerHTML = formatDetails(matches[0]);
        detailsDiv.classList.remove("hidden");
    }
    function formatDetails(entry) {
        const imagePath = `assets/${currentFilter}/${encodeURIComponent(
            entry.title
        )}.png`;

        let html = `
    <div class="entry-header">
      <img src="${imagePath}" alt="${entry.title}" class="entry-image">
      <div class="entry-info">
        ${entry.tagline ? `<p class="tagline">"${entry.tagline}"</p>` : ""}
        ${
            entry.unlockLevel
                ? `<p><strong>Unlock Level:</strong> ${entry.unlockLevel}</p>`
                : ""
        }
        ${
            entry.unlockPlace
                ? `<p><strong>Unlock Place:</strong> ${entry.unlockPlace}</p>`
                : ""
        }
        ${entry.rarity ? `<p><strong>Rarity:</strong> ${entry.rarity}</p>` : ""}
      </div>
    </div>
  `;

        switch (currentFilter) {
            case "weapons":
                html += renderWeapon(entry);
                break;

            case "gadgets":
                html += renderGadget(entry);
                break;

            case "characters":
                html += renderCharacter(entry);
                break;

            default:
                html += `<pre>${JSON.stringify(entry, null, 2)}</pre>`;
        }

        return html;
    }
    function formatKey(key) {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (s) => s.toUpperCase());
    }

    function renderWeapon(entry) {
        let html = "";
        if (entry.mainAttack) {
            html += `<h3>Main Attack</h3><p>${entry.mainAttack.description}</p>`;
            for (const [key, value] of Object.entries(entry.mainAttack)) {
                if (key !== "description")
                    html += `<p style="text-indent: 1em"><strong>${formatKey(
                        key
                    )}:</strong> ${value}</p>`;
            }
        }

        if (entry.combo) {
            html += `<h3>Combo</h3><p>${entry.combo.description}</p>`;
            for (const [key, value] of Object.entries(entry.combo)) {
                if (key !== "description" && key !== "wolf")
                    html += `<p style="text-indent: 1em"><strong>${formatKey(
                        key
                    )}:</strong> ${value}</p>`;
                // Wolf stick
                if (key === "wolf") {
                    html += `<h2>Wolf</h2>
                             <p><strong>Health</strong>: ${value.health}</p>
                             <div style="text-indent: 1em;">
                                <h3>Wolf Main Attack</h3>
                                <p style="text-indent: 4em;"><strong>Damage</strong>: ${value.mainAttack.damage}</p>
                                <p style="text-indent: 4em;"><strong>Hit Speed</strong>: ${value.mainAttack.hitSpeed}</p>
                                <p style="text-indent: 4em;"><strong>First Hit</strong>: ${value.mainAttack.firstHit}</p>
                                <p style="text-indent: 4em;"><strong>Range</strong>: ${value.mainAttack.range}</p>
                                <p style="text-indent: 4em;"><strong>Spread</strong>: ${value.mainAttack.spread}</p>
                                <h3>Wolf Combo Attack</h3>
                                <p style="text-indent: 4em;"><strong>Damage</strong>: ${value.comboAttack.damage}</p>
                                <p style="text-indent: 4em;"><strong>Charge Time</strong>: ${value.comboAttack.chargeTime}</p>
                                <p style="text-indent: 4em;"><strong>Range</strong>: ${value.comboAttack.range}</p>
                             </div>`;
                }
            }
        }

        if (entry.strategy) {
            html += `<h2>Strategy</h2><p>${entry.strategy}</p>`;
        }

        return html;
    }
}
