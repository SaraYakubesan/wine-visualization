// Set up SVG dimensions
const width = 800;
const height = 500;
const margin = { top: 20, right: 30, bottom: 50, left: 50 };

// Append SVG to the chart div
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load data
d3.csv("data/wine_data.csv").then(data => {
    console.log(data);

    // Call function to create the chart
    createBarChart(data);
}).catch(function(error) {
    console.error("Error loading the data: ", error);
});

// Function to create the bar chart
function createBarChart(data) {
    // Parse the necessary data fields as numbers
    data.forEach(function(d) {
        d.fixed_acidity = +d.fixed_acidity;  // Convert to number
        d.quality = +d.quality;              // Convert to number
    });

    // Set up dimensions and margins for the chart
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#chart-container").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up scales for the X and Y axes
    const x = d3.scaleBand()
        .domain(data.map(function(d) { return d.fixed_acidity; }))  // Use fixed_acidity values for X-axis
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return d.quality; })])  // Max quality for Y-axis
        .nice()
        .range([height, 0]);

    // Create the bars
    svg.append("g")
        .selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.fixed_acidity); })
        .attr("y", function(d) { return y(d.quality); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.quality); });

    // Add X-axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add Y-axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));
}
