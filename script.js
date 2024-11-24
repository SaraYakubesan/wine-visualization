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

    // Example: Draw a static circle
    svg.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", 50)
        .attr("fill", "steelblue");
});
