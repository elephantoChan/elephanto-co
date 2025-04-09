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
      <p class="result-title"><strong>${index + 1}.</strong> ${entry.title}</p>
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
                    html += `<p><strong>${formatKey(
                        key
                    )}:</strong> ${value}</p>`;
            }
        }

        if (entry.combo) {
            html += `<h3>Combo</h3><p>${entry.combo.description}</p>`;
            for (const [key, value] of Object.entries(entry.combo)) {
                if (key !== "description")
                    html += `<p><strong>${formatKey(
                        key
                    )}:</strong> ${value}</p>`;
            }
        }

        if (entry.strategy) {
            html += `<h2>Strategy</h2><p>${entry.strategy}</p>`;
        }

        return html;
    }
}
