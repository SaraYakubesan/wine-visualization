// Set up SVG dimensions
const width = 800;
const height = 500;
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

// Load data
d3.csv("data/wine_data.csv").then(data => {
  // Log data to check the structure and contents
    console.log(data);
  // Parse the necessary data fields as numbers
    data.forEach(function(d) {
        d.quality = +d.quality; // Convert 'quality' to a number
        d.alcohol = +d.alcohol;   // Convert 'alcohol' to a number (ensures decimals are handled)
        // Log to confirm conversion
        //console.log(`Quality: ${d.quality}, Alcohol: ${d.alcohol}`);
    });
    // Check if there are any 'alcohol' values that are NaN
    const invalidAlcohols = data.filter(d => isNaN(d.alcohol));
    console.log("Invalid Alcohol Data:", invalidAlcohols);  // Show rows with invalid alcohol values

    // Group data by quality and count the occurrences
    const qualityCounts = d3.rollup(
        data,
        v => v.length,       // Count wines
        d => d.quality       // Group by quality
    );

    // Group data by quality and calculate average alcohol content per quality
    const alcoholAvgByQuality = d3.rollup(data,
        v => d3.mean(v, d => d.alcohol), // Calculate average alcohol
        d => d.quality // Group by quality
    );
    console.log("Average Alcohol by Quality:", alcoholAvgByQuality);  // Log the rollup result

    // Add alcohol averages to the countsArray
    const countsArray = Array.from(qualityCounts, ([quality, count]) => ({
        quality,
        count,
        avgAlcohol: alcoholAvgByQuality.get(+quality) // Add average alcohol content
    })).sort((a, b) => a.quality - b.quality);

    console.log("Counts Array with Avg Alcohol:", countsArray);


    // Call function to create the chart
    createBarChart(countsArray);
}).catch(function(error) {
    console.error("Error loading the data: ", error);
});

// Function to create the bar chart
function createBarChart(data) {
    const margin = { top: 30, right: 30, bottom: 47, left: 60 };
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;


    // Remove any previous SVG
    d3.select("#chart-container svg").remove();

    // Create the SVG container
    const svg = d3.select("#chart-container").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Frequency of Wine Quality Ratings");

    // Set up scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.quality))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .nice()
        .range([height, 0]);

    const extent = d3.extent(data, d => d.avgAlcohol);
    console.log("Color scale extent:", extent);
    const colorScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.avgAlcohol)) // Use the min and max of the avgAlcohol data
        .range([d3.interpolateCool(0), d3.interpolateCool(1)]);  // Smooth color interpolation from cool to warm tones


    console.log("Color Scale Domain:", colorScale.domain());
    console.log("Color for alcohol value 10:", colorScale(10));

    // Draw bars
svg.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.quality))
    .attr("y", d => {
        const barHeight = height - y(d.count);
        return barHeight < 5 ? height - 5 : y(d.count);  // Ensure bars don't go below x-axis
    })
    .attr("width", x.bandwidth())
    .attr("height", d => {
        const barHeight = height - y(d.count);
        return barHeight < 5 ? 5 : barHeight;  // Minimum bar height of 5
    })
    .attr("fill", d => {
        const color = colorScale(d.avgAlcohol);  // Define the color variable
        console.log("Setting fill color for avgAlcohol:", d.avgAlcohol, "Color:", color);  // Log the color
        return color;  // Return the color
    })
    .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "#ff9800");
        tooltip
            .style("opacity", 1)
            .html(`Quality: ${d.quality}<br>Count: ${d.count}<br>Avg Alcohol: ${d.avgAlcohol.toFixed(2)}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
    })
    .on("mousemove", function (event) {
        tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", function () {
        d3.select(this).attr("fill", d => colorScale(d.avgAlcohol));
        tooltip.style("opacity", 0);
    });


    // Add X-axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // Add Y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add axis labels
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
        .text("Count of Wines");

    // Add legend
    addAlcoholLegend(data, svg, width, height);
}

function addAlcoholLegend(data, svg, width, height) {
    // Check for valid data first (just to be safe)
    if (!data || data.length === 0) {
        console.error("No data available.");
        return;
    }
    const legendWidth = 150;
    const legendHeight = 20;

    // Log the extent of the data
    const extent = d3.extent(data, d => d.avgAlcohol);
    console.log("Data extent:", extent);  // Log to see the min/max of avgAlcohol values

    // Ensure there is variation in the data
    if (extent[0] === extent[1]) {
        console.warn("The data for 'avgAlcohol' is uniform. No color gradient will be visible.");
    }

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - legendWidth - 40}, 20)`);

    const colorScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.avgAlcohol)) // Use the min and max of the avgAlcohol data
        .range([d3.interpolateCool(0), d3.interpolateCool(1)]);  // Smooth color interpolation from cool to warm tones

    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "alcoholGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(d3.extent(data, d => d.avgAlcohol)[0])); // Cool side

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(d3.extent(data, d => d.avgAlcohol)[1])); // Warm side

        console.log(colorScale(0));  // Should be the cool side color
        console.log(colorScale(1));  // Should be the warm side color
        console.log(colorScale(d3.extent(data, d => d.avgAlcohol)[0]));  // Color for the minimum value
        console.log(colorScale(d3.extent(data, d => d.avgAlcohol)[1]));  // Color for the maximum value

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#alcoholGradient)")
        .style("stroke", "black");  // Optional: Add a stroke to make sure the rect is visible

    legend.append("text")
        .attr("x", 0)
        .attr("y", legendHeight + 15)
        .style("font-size", "12px")
        .text("Low Alcohol");

    legend.append("text")
        .attr("x", legendWidth)
        .attr("y", legendHeight + 15)
        .style("font-size", "12px")
        .attr("text-anchor", "end")
        .text("High Alcohol");
}
