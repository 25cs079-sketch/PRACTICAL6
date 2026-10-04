document.addEventListener("DOMContentLoaded", () => {
    const state = {
        currentSource: "events",
        rawData: [],
        filteredData: [],
        currentPage: 1,
        pageSize: 6
    };
    const container =
        document.getElementById("dataContainer");
    const statusMsg =
        document.getElementById("statusMessage");
    const searchInput =
        document.getElementById("searchInput");
    const categoryFilter =
        document.getElementById("categoryFilter");
    const sortSelect =
        document.getElementById("sortSelect");
    const resetBtn =
        document.getElementById("resetBtn");
    const prevBtn =
        document.getElementById("prevPageBtn");
    const nextBtn =
        document.getElementById("nextPageBtn");
    const pageIndicator =
        document.getElementById("pageIndicator");
    const datasetButtons =
        document.querySelectorAll(".dataset-btn");
    async function loadData(source) {
        showStatus(
            "Loading records from server...",
            "loading"
        );
        container.innerHTML = "";
        const cacheKey =
            `portal_cache_${source}`;
        const cachedData =
            localStorage.getItem(cacheKey);
        if (cachedData) {
            try {
                state.rawData =
                    JSON.parse(cachedData);
                processData();
            } catch (error) {
                localStorage.removeItem(cacheKey);
            }
        }
        try {
            const response =
                await fetch(`data/${source}.json`);
            if (!response.ok) {
                throw new Error(
                    `Failed to load data/${source}.json`
                );
            }
            const json =
                await response.json();
            state.rawData = json;
            localStorage.setItem(
                cacheKey,
                JSON.stringify(json)
            );
            processData();
        }
        catch (error) {
            if (!cachedData) {
                showStatus(
                    `Error: ${error.message}. Please run using Live Server or localhost.`,
                    "error"
                );
            }
        }
    }
    function processData() {
        hideStatus();
        populateCategoryDropdown();
        applyFilterSortAndPaginate();
    }
    function populateCategoryDropdown() {
        categoryFilter.innerHTML =
            `<option value="ALL">All Categories</option>`;
        const key =
            state.currentSource === "students"
                ? "course"
                : "category";
        const categories =
            [
                ...new Set(
                    state.rawData
                        .map(item => item[key])
                        .filter(Boolean)
                )
            ];
        categories.forEach(category => {
            const option =
                document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
    function applyFilterSortAndPaginate() {
        const term =
            searchInput.value
                .trim()
                .toLowerCase();
        const selectedCategory =
            categoryFilter.value;
        const sortChoice =
            sortSelect.value;
        const categoryField =
            state.currentSource === "students"
                ? "course"
                : "category";
        const labelField =
            state.currentSource === "events"
                ? "title"
                : state.currentSource === "students"
                    ? "name"
                    : "question";
        state.filteredData =
            state.rawData.filter(item => {
                const matchesCategory =
                    selectedCategory === "ALL" ||
                    item[categoryField] === selectedCategory;
                const matchesSearch =
                    Object.values(item)
                        .join(" ")
                        .toLowerCase()
                        .includes(term);
                return (
                    matchesCategory &&
                    matchesSearch
                );
            });
        if (sortChoice === "asc") {
            state.filteredData.sort(
                (a, b) =>
                    a[labelField]
                        .localeCompare(b[labelField])
            );
        }
        else if (sortChoice === "desc") {
            state.filteredData.sort(
                (a, b) =>
                    b[labelField]
                        .localeCompare(a[labelField])
            );
        }
        state.currentPage = 1;
        renderCards();
    }
    function renderCards() {
        container.innerHTML = "";
        const totalRecords =
            state.filteredData.length;
        if (totalRecords === 0) {
            container.innerHTML = `
                <p class="no-records">
                    No matching records found.
                </p>
            `;
            updatePaginationUI(0, 0);
            return;
        }
        const totalPages =
            Math.ceil(
                totalRecords /
                state.pageSize
            );
        const startIndex =
            (state.currentPage - 1) *
            state.pageSize;
        const visibleRecords =
            state.filteredData.slice(
                startIndex,
                startIndex + state.pageSize
            );
        visibleRecords.forEach(item => {
            const card =
                document.createElement("div");
            card.className = "card";
            if (state.currentSource === "events") {
                card.innerHTML = `
                    <span class="badge">
                        ${item.category}
                    </span>
                    <h3>
                        ${item.title}
                    </h3>
                    <p>
                        <strong>Date:</strong>
                        ${item.date}
                    </p>
                    <p>
                        <strong>Venue:</strong>
                        ${item.location}
                    </p>
                `;
            }
            else if (
                state.currentSource === "students"
            ) {
                card.innerHTML = `
                    <span class="badge">
                        ${item.course}
                        |
                        Sem ${item.semester}
                    </span>
                    <h3>
                        ${item.name}
                    </h3>
                    <p>
                        <strong>Roll No:</strong>
                        ${item.id}
                    </p>
                    <p>
                        <strong>CGPA:</strong>
                        ${item.cgpa}
                    </p>
                `;
            }
            else if (
                state.currentSource === "faqs"
            ) {
                card.innerHTML = `
                    <span class="badge">
                        ${item.category}
                    </span>
                    <h3>
                        ${item.question}
                    </h3>
                    <p>
                        ${item.answer}
                    </p>
                `;
            }
            container.appendChild(card);
        });
        updatePaginationUI(
            state.currentPage,
            totalPages
        );
    }
    function updatePaginationUI(
        current,
        total
    ) {
        if (total > 0) {
            pageIndicator.textContent =
                `Page ${current} of ${total}`;
        }
        else {
            pageIndicator.textContent =
                "Page 0 of 0";
        }
        prevBtn.disabled =
            current <= 1;
        nextBtn.disabled =
            current >= total;
    }
    function showStatus(
        message,
        type
    ) {
        statusMsg.textContent =
            message;
        statusMsg.className =
            `status-msg ${type}`;
    }
    function hideStatus() {
        statusMsg.className =
            "status-msg hidden";
    }
    searchInput.addEventListener(
        "input",
        applyFilterSortAndPaginate
    );
    categoryFilter.addEventListener(
        "change",
        applyFilterSortAndPaginate
    );
    sortSelect.addEventListener(
        "change",
        applyFilterSortAndPaginate
    );
    prevBtn.addEventListener(
        "click",
        () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderCards();
            }
        }
    );
    nextBtn.addEventListener(
        "click",
        () => {
            const totalPages =
                Math.ceil(
                    state.filteredData.length /
                    state.pageSize
                );
            if (
                state.currentPage <
                totalPages
            ) {
                state.currentPage++;
                renderCards();
            }
        }
    );
    resetBtn.addEventListener(
        "click",
        () => {
            searchInput.value = "";
            categoryFilter.value = "ALL";
            sortSelect.value = "default";
            applyFilterSortAndPaginate();
        }
    );
    datasetButtons.forEach(button => {
        button.addEventListener(
            "click",
            () => {
                datasetButtons.forEach(btn => {
                    btn.classList.remove("active");
                });
                button.classList.add("active");
                state.currentSource =
                    button.dataset.source;
                searchInput.value = "";
                sortSelect.value = "default";
                loadData(
                    state.currentSource
                );
            }
        );
    });
    loadData("events");
});