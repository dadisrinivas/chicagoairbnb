// Set dimensions and margins for the visualizations
const width = 960;
const height = 600;

// Add title and buttons for navigation
function addTitleAndButtons(scene, title) {
    const container = d3.select(scene);
    container.html("");

    container.append("div")
        .attr("class", "title")
        .text(title);

    const buttonContainer = container.append("div")
        .attr("class", "button-container");

    if (scene !== "#scene1") {
        buttonContainer.append("button")
            .attr("class", "button")
            .text("Back")
            .on("click", () => {
                if (scene === "#scene2") showScene1();
                else if (scene === "#scene3") showScene2(currentNeighborhood);
                else if (scene === "#scene5") showScene3(currentListing);
            });
    }

    if (scene !== "#scene5") {
        buttonContainer.append("button")
            .attr("class", "button")
            .text("Next")
            .on("click", () => {
                if (scene === "#scene1") showScene2(currentNeighborhood);
                else if (scene === "#scene2") showScene3(currentListing);
                else if (scene === "#scene3") showScene5();
            });
    }
}

// Scene 1: Overview of Listings by Neighborhood
function showScene1() {
    addTitleAndButtons("#scene1", "Overview of Listings by Neighborhood");
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
                currentNeighborhood = d.properties.neighbourhood;
                showScene2(currentNeighborhood);
            });
    });
}

// Scene 2: Listings Details in Selected Neighborhood
function showScene2(neighbourhood) {
    addTitleAndButtons("#scene2", `Listings in ${neighbourhood}`);
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
                currentListing = d;
                showScene3(d);
            });
    });
}

// Scene 3: Listing Reviews Analysis
function showScene3(listing) {
    addTitleAndButtons("#scene3", `Reviews for ${listing.name}`);
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

        const line = d3.line()
            .x(d => x(new Date(d.date)))
            .y(d => y(d.rating));

        svg.append("path")
            .datum(filteredData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        svg.selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", d => x(new Date(d.date)))
            .attr("cy", d => y(d.rating))
            .attr("r", 5)
            .attr("fill", "green")
            .on("mouseover", function(event, d) {
                const tooltip = d3.select("body").append("div").attr("class", "tooltip");
                tooltip.html(`Date: ${d.date}<br>Rating: ${d.rating}`)
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
    addTitleAndButtons("#scene5", "Aggregated Insights");
    d3.select("#scene1").style("display", "none");
    d3.select("#scene2").style("display", "none");
    d3.select("#scene3").style("display", "none");
    d3.select("#scene5").style("display", "block");

    d3.csv("data/listings.csv").then(function(data) {
        // Calculate aggregated insights
        const groupedData = d3.groups(data, d => d.neighbourhood);

        const insights = groupedData.map(([neighbourhood, listings]) => {
            const avgPrice = d3.mean(listings, d => +d.price);
            const avgReviewsPerMonth = d3.mean(listings, d => +d.reviews_per_month);
            return {
                neighbourhood,
                avgPrice,
                avgReviewsPerMonth
            };
        });

        const margin = {top: 10, right: 30, bottom: 30, left: 60};
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select("#scene5").append("svg")
            .attr("width", innerWidth + margin.left + margin.right)
            .attr("height", innerHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(insights.map(d => d.neighbourhood))
            .range([0, innerWidth])
            .padding(0.1);
        svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        const y = d3.scaleLinear()
            .domain([0, d3.max(insights, d => d.avgPrice)])
            .range([innerHeight, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        svg.selectAll(".bar")
            .data(insights)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.neighbourhood))
            .attr("y", d => y(d.avgPrice))
            .attr("width", x.bandwidth())
            .attr("height", d => innerHeight - y(d.avgPrice))
            .attr("fill", "steelblue")
            .on("mouseover", function(event, d) {
                const tooltip = d3.select("body").append("div").attr("class", "tooltip");
                tooltip.html(`Neighbourhood: ${d.neighbourhood}<br>Avg Price: $${d.avgPrice.toFixed(2)}<br>Avg Reviews/Month: ${d.avgReviewsPerMonth.toFixed(2)}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .style("opacity", 0.9);
            })
            .on("mouseout", function() {
                d3.select(".tooltip").remove();
            });
    });
}

// Global variables to keep track of the current neighborhood and listing
let currentNeighborhood = "";
let currentListing = {};

// Start with Scene 1
showScene1();
