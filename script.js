// Set up SVG dimensions
const width = 800;
const height = 600;
const margin = { top: 70, right: 50, bottom: 70, left: 70 };

// Append SVG to the chart div
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "5px 10px")
    .style("border-radius", "4px")
    .style("box-shadow", "0px 0px 5px rgba(0, 0, 0, 0.3)")
    .style("pointer-events", "none")
    .style("opacity", 0);

document.addEventListener("DOMContentLoaded", function () {
    // Ensure the dropdown elements exist before adding event listeners
    const wineTypeDropdown = d3.select("#wineTypeDropdown");
    const metricDropdown = d3.select("#metricDropdown");

    if (wineTypeDropdown.empty()) {
        console.error("Wine Type dropdown not found");
    } else {
        wineTypeDropdown.on("change", function () {
            const selectedWineType = wineTypeDropdown.property("value");
            filterAndUpdateChart(selectedWineType, selectedMetric);
        });
    }

    if (metricDropdown.empty()) {
        console.error("Metric dropdown not found");
    } else {
        metricDropdown.on("change", function () {
            selectedMetric = metricDropdown.property("value");
            filterAndUpdateChart(wineTypeDropdown.property("value"), selectedMetric);
        });
    }

    // Declare global variables
    let allData = [];  // To store the original unfiltered dataset
    let filteredData = [];  // To store the filtered data

    // Load data
    d3.csv("data/wine_data.csv").then(loadedData => {
        console.log("Loaded data:", loadedData);

        // Parse the necessary data fields as numbers
        loadedData.forEach(function (d) {
            d.quality = +d.quality;
            d.alcohol = +d.alcohol;
            d.fixed_acidity = +d["fixed acidity"];
            d.volatile_acidity = +d["volatile acidity"];
            d.residual_sugar = +d["residual sugar"];
            d.ph = +d.pH;
        });

        allData = loadedData;
        filteredData = allData;  // Initially set the filtered data to allData

        // Initial chart creation
        filterAndUpdateChart("All");

    }).catch(function (error) {
        console.error("Error loading the data: ", error);
    });

    // Function to filter and update chart
    function filterAndUpdateChart(wineType = "All", metric = "alcohol") {
        console.log("Filtering data for wine type:", wineType);
        console.log("Filtering data for metric:", metric);

        let currentFilteredData = wineType === "All"
            ? allData
            : allData.filter(d => d.type && d.type.toLowerCase() === wineType.toLowerCase());

        console.log("Filtered Data:", currentFilteredData);

        if (currentFilteredData.length === 0) {
            console.error("No data found for the selected wine type.");
            return;
        }

        const qualityCounts = d3.rollup(currentFilteredData, v => v.length, d => d.quality);

        const metricAvgByQuality = d3.rollup(
            currentFilteredData,
            v => d3.mean(v, d => d[metric]),
            d => d.quality
        );

        const countsArray = Array.from(qualityCounts, ([quality, count]) => ({
            quality,
            count,
            avgMetric: metric === "count" ? count : metricAvgByQuality.get(+quality) || 0
        })).sort((a, b) => a.quality - b.quality);

        createBarChart(countsArray, metric);
    }

    // Function to create the bar chart
    function createBarChart(data, metric) {
        const margin = { top: 100, right: 30, bottom: 70, left: 60 };  // Increase top margin for the legend
        const width = 900 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        const minBarHeight = 5; // Set minimum bar height to 5px

        d3.select("#chart-container svg").remove();

        const svg = d3.select("#chart-container").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Wine Quality vs " + (metric.charAt(0).toUpperCase() + metric.slice(1)));

        const x = d3.scaleBand()
            .domain(data.map(d => d.quality))
            .range([0, width])
            .padding(0.1);

        // Adjust the y-scale depending on the metric
        const maxVal = d3.max(data, d => d.avgMetric);
        const minVal = d3.min(data, d => d.avgMetric);

        // For pH (or any metric with small variance), add some custom scaling logic
        let y;
        if (metric === "ph" || metric === "alcohol" || metric === "fixed_acidity") {
            y = d3.scaleLinear()
                .domain([minVal - 0.1, maxVal + 0.05])  // Adjust the domain for better visualization of pH
                .nice()
                .range([height, 0]);
        } else {
            y = d3.scaleLinear()
                .domain([0, maxVal])  // Default scale for other metrics
                .nice()
                .range([height, 0]);
        }

        const colorScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.avgMetric)])
            .range(["lightblue", "darkblue"]);

        svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.quality))
            .attr("y", d => {
                const barHeight = height - y(d.avgMetric);
                // Ensure the bar starts above the axis if its height is less than the minimum
                return barHeight < minBarHeight ? height - minBarHeight : y(d.avgMetric);
            })
            .attr("width", x.bandwidth())
            .attr("height", d => {
                const barHeight = height - y(d.avgMetric);
                return barHeight < minBarHeight ? minBarHeight : barHeight; // Apply minimum bar height
            })
            .attr("fill", d => colorScale(d.avgMetric))
            .on("mouseover", function (event, d) {
                tooltip.style("opacity", 1)
                    .html(`
                        Quality: ${d.quality}<br>
                        Count: ${d.count}<br>
                        Avg Metric: ${d.avgMetric.toFixed(2)}
                    `)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 40}px`);
                d3.select(this).attr("fill", "#ff9800");  // Change color on hover
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 40}px`);
            })
            .on("mouseout", function () {
                tooltip.style("opacity", 0);  // Hide the tooltip
                d3.select(this).attr("fill", d => colorScale(d.avgMetric));  // Reset color
            });

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Wine Quality");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(metric === "count" ? "Number of Wines" : metric.charAt(0).toUpperCase() + metric.slice(1));

        // Add color scale legend
        addColorLegend(svg, colorScale, data, width, height);
    }

    // Function to add a color scale legend
    function addColorLegend(svg, colorScale, data, width, height) {
        const legendWidth = 200;
        const legendHeight = 20;

    // Create a group for the legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - legendWidth - 40}, ${-margin.top + 10})`);  // Position the legend above the chart

    // Define the gradient for the legend
        const gradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "color-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale(0)); // Color for low value

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale(d3.max([0, d3.max(data, d => d.avgMetric)]))); // Color for high value

        // Add the legend rectangle
        legend.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#color-gradient)");

        // Add labels for the legend
        legend.append("text")
          .attr("x", 0)
          .attr("y", legendHeight + 15)
          .style("font-size", "12px")
          .text("Low");

          legend.append("text")
          .attr("x", legendWidth)
          .attr("y", legendHeight + 15)
          .style("font-size", "12px")
          .attr("text-anchor", "end")
          .text("High");
}

});  // Close the DOMContentLoaded event listener
