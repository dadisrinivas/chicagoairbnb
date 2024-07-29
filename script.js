// Set dimensions and margins for the visualizations
const width = 960;
const height = 600;

// Scene 1: Overview of Listings by Neighborhood
function showScene1() {
    d3.select("#scene1").style("display", "block");
    d3.select("#scene2").style("display", "none");
    d3.select("#scene3").style("display", "none");
    d3.select("#scene5").style("display", "none");

    const svg = d3.select("#scene1").append("svg")
        .attr("width", width)
        .attr("height", height);

    d3.json("data/neighbourhoods.geojson").then(function(data) {
        const projection = d3.geoMercator().fitSize([width, height], data);
        const path = d3.geoPath().projection(projection);

        svg.selectAll("path")
            .data(data.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "lightgray")
            .attr("stroke", "white")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", "orange");
                const tooltip = d3.select("body").append("div").attr("class", "tooltip");
                tooltip.html(d.properties.neighbourhood)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .style("opacity", 0.9);
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", "lightgray");
                d3.select(".tooltip").remove();
            })
            .on("click", function(event, d) {
                showScene2(d.properties.neighbourhood);
            });
    });
}

// Scene 2: Listings Details in Selected Neighborhood
function showScene2(neighbourhood) {
    d3.select("#scene1").style("display", "none");
    d3.select("#scene2").style("display", "block");
    d3.select("#scene3").style("display", "none");
    d3.select("#scene5").style("display", "none");

    d3.csv("data/listings.csv").then(function(data) {
        const filteredData = data.filter(d => d.neighbourhood === neighbourhood);

        const margin = {top: 10, right: 30, bottom: 30, left: 60};
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select("#scene2").append("svg")
            .attr("width", innerWidth + margin.left + margin.right)
            .attr("height", innerHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d.price)])
            .range([0, innerWidth]);
        svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x));

        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d.reviews_per_month)])
            .range([innerHeight, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        svg.selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.price))
            .attr("cy", d => y(d.reviews_per_month))
            .attr("r", 5)
            .attr("fill", "blue")
            .on("mouseover", function(event, d) {
                const tooltip = d3.select("body").append("div").attr("class", "tooltip");
                tooltip.html(`Name: ${d.name}<br>Price: $${d.price}<br>Reviews/Month: ${d.reviews_per_month}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .style("opacity", 0.9);
            })
            .on("mouseout", function() {
                d3.select(".tooltip").remove();
            })
            .on("click", function(event, d) {
                showScene3(d);
            });
    });
}

// Scene 3: Listing Reviews Analysis
function showScene3(listing) {
    d3.select("#scene1").style("display", "none");
    d3.select("#scene2").style("display", "none");
    d3.select("#scene3").style("display", "block");
    d3.select("#scene5").style("display", "none");

    d3.csv("data/reviews.csv").then(function(data) {
        const filteredData = data.filter(d => d.listing_id === listing.id);

        const margin = {top: 10, right: 30, bottom: 30, left: 60};
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select("#scene3").append("svg")
            .attr("width", innerWidth + margin.left + margin.right)
            .attr("height", innerHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime()
            .domain(d3.extent(filteredData, d => new Date(d.date)))
            .range([0, innerWidth]);
        svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x));

        const y = d3.scaleLinear()
            .domain([0, 5]) // Assuming rating scale is 0-5
            .range([innerHeight, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        svg.selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", d => x(new Date(d.date)))
            .attr("cy", d => y(5)) // Assuming a placeholder rating value
            .attr("r", 5)
            .attr("fill", "green")
            .on("mouseover", function(event, d) {
                const tooltip = d3.select("body").append("div").attr("class", "tooltip");
                tooltip.html(`Date: ${d.date}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .style("opacity", 0.9);
            })
            .on("mouseout", function() {
                d3.select(".tooltip").remove();
            })
            .on("click", function() {
                showScene5();
            });
    });
}

// Scene 5: Aggregated Insights
function showScene5() {
    d3.select("#scene1").style("display", "none");
    d3.select("#scene2").style("display", "none");
    d3.select("#scene3").style("display", "none");
    d3.select("#scene5").style("display", "block");

    const svg = d3.select("#scene5").append("svg")
        .attr("width", width)
        .attr("height", height);

    // This is a placeholder for aggregated insights
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text("Aggregated Insights Coming Soon!");
}

// Start with Scene 1
showScene1();
