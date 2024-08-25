document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = "https://opendata.ecdc.europa.eu/covid19/casedistribution/json/";
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const countrySelect = document.getElementById("country");
    const contentDiv = document.getElementById("content");
    const tableTab = document.getElementById("tableTab");
    const chartTab = document.getElementById("chartTab");
    const covidChartCanvas = document.getElementById('covidChart');

    let currentPage = 1;
    const rowsPerPage = 20;
    let allData = [];

    // Fetch data from API
    async function fetchData() {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data.records;
    }

    // Populate country dropdown
    async function populateCountries() {
        const data = await fetchData();
        const countries = new Set(data.map(record => record.countriesAndTerritories));
        countrySelect.innerHTML = '<option value="All">All Countries</option>';
        countries.forEach(country => {
            const option = document.createElement("option");
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
    }

    // Filter data based on selected filters
    function filterData(data) {
        const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
        const selectedCountry = countrySelect.value;
        
        return data.filter(record => {
            const recordDate = new Date(record.dateRep.split("/").reverse().join("-"));
            const isWithinDateRange = (!startDate || recordDate >= startDate) &&
                                      (!endDate || recordDate <= endDate);
            const isCountryMatch = selectedCountry === "All" || record.countriesAndTerritories === selectedCountry;
            return isWithinDateRange && isCountryMatch;
        });
    }

    // Render table
    function renderTable(data) {
        const table = document.createElement("table");
        table.innerHTML = `
            <tr>
                <th>Country</th>
                <th>Date</th>
                <th>Cases</th>
                <th>Deaths</th>
            </tr>
        `;

        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedData = data.slice(start, end);

        paginatedData.forEach(record => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${record.countriesAndTerritories}</td>
                <td>${record.dateRep}</td>
                <td>${record.cases}</td>
                <td>${record.deaths}</td>
            `;
            table.appendChild(row);
        });

        contentDiv.innerHTML = "";
        contentDiv.appendChild(table);
    }

    // Render pagination
    function renderPagination(totalRows) {
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        const paginationDiv = document.createElement("div");
        paginationDiv.style.display = "flex";
        paginationDiv.style.justifyContent = "center";
        paginationDiv.style.alignItems = "center";
        paginationDiv.style.marginTop = "20px";
        paginationDiv.classList.add("pagination");

        // Clear existing pagination if any
        const existingPagination = contentDiv.querySelector(".pagination");
        if (existingPagination) {
            contentDiv.removeChild(existingPagination);
        }

        // Previous button
        const prevButton = document.createElement("button");
        prevButton.textContent = "Prev";
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                applyFilters(false); // Apply filters to update table and pagination, without resetting the page
            }
        });
        paginationDiv.appendChild(prevButton);

        // Page number display
        const pageNumberDisplay = document.createElement("span");
        pageNumberDisplay.textContent = `Page ${currentPage} of ${totalPages}`;
        pageNumberDisplay.style.margin = "0 10px";
        paginationDiv.appendChild(pageNumberDisplay);

        // Next button
        const nextButton = document.createElement("button");
        nextButton.textContent = "Next";
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                applyFilters(false); // Apply filters to update table and pagination, without resetting the page
            }
        });
        paginationDiv.appendChild(nextButton);

        contentDiv.appendChild(paginationDiv);
    }

    // Apply filters and update view
    async function applyFilters(resetPage = true) {
        if (resetPage) {
            currentPage = 1; // Reset to the first page if resetPage is true
        }

        const data = await fetchData();
        allData = filterData(data);

        if (allData.length > 0) {
            renderTable(allData);
            renderPagination(allData.length); // Render pagination after rendering the table
        } else {
            contentDiv.innerHTML = "<p>No data found for the selected filters.</p>";
        }
    }

    // Toggle between table and chart
    function toggleView(view) {
        if (view === "table") {
            tableTab.classList.add("active");
            chartTab.classList.remove("active");
            contentDiv.style.display = 'block';
            covidChartCanvas.style.display = 'none'; // Hide chart
            applyFilters(true);
        } else {
            tableTab.classList.remove("active");
            chartTab.classList.add("active");
            contentDiv.style.display = 'none'; // Hide table
            covidChartCanvas.style.display = 'block'; // Show chart
            renderChart(allData);
        }
    }

    function renderChart(data) {
        if (!data || data.length === 0) {
            console.error("No data available for rendering the chart.");
            return;
        }
    
        const ctx = covidChartCanvas.getContext('2d');
        covidChartCanvas.width = 1200; // Set fixed width
        covidChartCanvas.height = 700; // Set fixed height
    
        const labels = data.map(record => record.dateRep.split("/").reverse().join("-"));
        const cases = data.map(record => record.cases);
        const deaths = data.map(record => record.deaths);
    
        console.log("Rendering chart with data:", { labels, cases, deaths });
    
        // Clear previous chart if it exists
        if (window.covidChart && typeof window.covidChart.destroy === 'function') {
            window.covidChart.destroy();
        }
    
        window.covidChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Cases',
                        data: cases,
                        borderColor: '#FFAA00', // Set color similar to your example
                        backgroundColor: 'rgba(255, 170, 0, 0.1)', // Light fill color
                        fill: true,
                        borderWidth: 1.5, // Fine line
                        tension: 0.4, // Smooth curve
                        pointRadius: 0, // Remove points from the line
                    },
                    {
                        label: 'Deaths',
                        data: deaths,
                        borderColor: '#FF5555', // Set color similar to your example
                        backgroundColor: 'rgba(255, 85, 85, 0.1)', // Light fill color
                        fill: true,
                        borderWidth: 1.5, // Fine line
                        tension: 0.4, // Smooth curve
                        pointRadius: 0, // Remove points from the line
                        order: 1, // Ensure this dataset is rendered on top of the cases
                    },
                ],
            },
            options: {
                responsive: false, // Disable responsiveness to prevent resizing
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Period',
                            font: {
                                size: 12,
                                style: 'italic',
                                family: 'Arial'
                            },
                        },
                        ticks: {
                            font: {
                                size: 10,
                                family: 'Arial'
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Cases',
                            font: {
                                size: 12,
                                style: 'italic',
                                family: 'Arial'
                            },
                        },
                        ticks: {
                            font: {
                                size: 10,
                                family: 'Arial'
                            }
                        },
                        beginAtZero: true,
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 12,
                                family: 'Arial'
                            }
                        }
                    }
                }
            }
        });
    }
    
    
    
    // Initial load
    populateCountries().then(() => applyFilters(true));

    // Event listeners
    document.getElementById("applyFilters").addEventListener("click", () => applyFilters(true));
    tableTab.addEventListener("click", () => toggleView("table"));
    chartTab.addEventListener("click", () => toggleView("chart"));
});

