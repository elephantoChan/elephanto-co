const filters = document.querySelectorAll('input[name="filter"]');
const filterButton = document.getElementById("toggle-filters");
const searchBox = document.getElementById("search");
const sidebar = document.getElementById("sidebar");
const footer = document.getElementById("footer");
const resultsBox = document.getElementById("results");
const icon = document.getElementById("icon");
const mainContent = document.getElementById("main");
// Filters button, footer
filterButton.addEventListener("click", () => {
    sidebar.classList.toggle("show");
});
footer.addEventListener("click", () => {
    footer.remove();
});
let debounceTimeout;
searchBox.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(handleSearch, 600);
});
function getSelectedFilter() {
    const selected = [...filters].find((f) => f.checked);
    return selected ? selected.value : null;
}

function showResults(matches) {
    if (!matches.length) {
        resultsBox.classList.add("hidden");
        resultsBox.innerHTML = "";

        // Reset styles
        mainContent.classList.remove("shift-up");
        icon.classList.remove("shrink");
        return;
    }

    resultsBox.classList.remove("hidden");
    resultsBox.innerHTML = matches
        .map(
            ({ name, file }) =>
                `<div class="result-item" data-file="${file}">${name}</div>`
        )
        .join("");

    // Apply styles
    mainContent.classList.add("shift-up");
    icon.classList.add("shrink");

    document.querySelectorAll(".result-item").forEach((item) => {
        item.addEventListener("click", () => {
            const file = item.getAttribute("data-file");
            window.location.href = file;
        });
    });
}

async function handleSearch() {
    const query = searchBox.value.trim().toLowerCase();
    if (!query) return showResults([]);

    const filter = getSelectedFilter();
    if (!filter) return showResults([]);

    try {
        const res = await fetch("wiki/pages.json");
        const data = await res.json();
        const category = data[filter];
        if (!category) return showResults([]);

        const matches = [];

        for (const key in category) {
            const keyLower = key.toLowerCase();

            // Match 1: Includes query
            const includesMatch = keyLower.includes(query);

            // Match 2: Initials match
            const initials = key
                .split(/\s+/)
                .map((word) => word[0]?.toLowerCase())
                .join("");
            const initialsMatch = initials === query;

            if (includesMatch || initialsMatch) {
                matches.push({
                    name: key,
                    file: `wiki/${filter}/${category[key]}`,
                });
            }
        }

        showResults(matches);
    } catch (err) {
        console.error("Error loading or processing search:", err);
        showResults([]);
    }
}
