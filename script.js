// Set dimensions and margins for the visualizations
const width = 960;
const height = 600;
const margin = { top: 10, right: 30, bottom: 80, left: 60 };

// Parameters: State variables to control the construction of scenes
let currentNeighborhood = "";

// Scene templates for visual consistency
function createScene(id, title) {
    const container = d3.select(id);
    container.html(""); // Clear the container

    container.append("div")
        .attr("class", "title")
        .text(title);

    const svgContainer = container.append("div")
        .attr("class", "svg-container");

    const svg = svgContainer.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    return svg;
}

function createNavigationButtons(sceneId, backAction, nextAction) {
    const buttonContainer = d3.select(sceneId).append("div")
        .attr("class", "button-container");

    if (backAction) {
        buttonContainer.append("button")
            .attr("class", "button")
            .text("Back")
            .on("click", backAction);
    }

    if (nextAction) {
        buttonContainer.append("button")
            .attr("class", "button")
            .text("Next")
            .on("click", nextAction);
    }
}

// Scene 1: Overview of Listings by Neighborhood
function showScene1() {
    console.log("Showing Scene 1");
    d3.select("#scene1").style("display", "block");
    d3.select("#scene2").style("display", "none");
    d3.select("#scene5").style("display", "none");

    const svg = createScene("#scene1", "Overview of Listings by Neighborhood");

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
                console.log("Neighborhood clicked:", currentNeighborhood);
                showScene2(currentNeighborhood);
            });

        // Add annotations
        const annotation = svg.append("g")
            .attr("class", "annotation")
            .attr("transform", `translate(${width - 20},${height - 20})`);

        annotation.append("text")
            .attr("x", -10)
            .attr("y", -10)
            .attr("text-anchor", "end")
            .text("Click a neighborhood to explore listings");
    }).catch(error => {
        console.error("Error loading neighborhood data:", error);
    });
}

// Scene 2: Listings Details in Selected Neighborhood (Scatter Plot)
function showScene2(neighbourhood) {
    console.log("Showing Scene 2 for neighborhood:", neighbourhood);
    d3.select("#scene1").style("display", "none");
    d3.select("#scene2").style("display", "block");
    d3.select("#scene5").style("display", "none");

    const svg = createScene("#scene2", `Listings in ${neighbourhood}`);
    createNavigationButtons("#scene2", showScene1, showScene5);

    d3.csv("data/listings.csv").then(function(data) {
        const filteredData = data.filter(d => d.neighbourhood === neighbourhood);

        const x = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d.price)])
            .range([0, width]);
        const y = d3.scaleLinear()
            .domain([0, 5]) // Average review scale from 0 to 5
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("$.0f")));

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.price))
            .attr("cy", d => y(d.reviews_per_month))
            .attr("r", 5)
            .attr("fill", "steelblue")
            .on("mouseover", function(event, d) {
                const tooltip = d3.select("body").append("div").attr("class", "tooltip");
                tooltip.html(`Name: ${d.name}<br>Price: $${d.price}<br>Average Review: ${d.reviews_per_month}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .style("opacity", 0.9);
            })
            .on("mouseout", function() {
                d3.select(".tooltip").remove();
            });

        // Add annotations
        const maxPrice = d3.max(filteredData, d => +d.price);
        const annotation = svg.append("g")
            .attr("class", "annotation")
            .attr("transform", `translate(${x(maxPrice)},${y(4.5)})`);

        annotation.append("text")
            .attr("x", -10)
            .attr("y", -10)
            .attr("text-anchor", "end")
            .text("Max Price");

        annotation.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 20)
            .attr("y2", 20)
            .attr("stroke", "black");

        // Add labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 5)
            .attr("text-anchor", "middle")
            .text("Price");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 15)
            .attr("text-anchor", "middle")
            .text("Average Review");
    }).catch(error => {
        console.error("Error loading listings data:", error);
    });
}

// Scene 5: Aggregated Insights (Bar Chart)
function showScene5() {
    console.log("Showing Scene 5: Aggregated Insights");
    d3.select("#scene1").style("display", "none");
    d3.select("#scene2").style("display", "none");
    d3.select("#scene5").style("display", "block");

    const svg = createScene("#scene5", "Aggregated Insights");
    createNavigationButtons("#scene5", () => showScene2(currentNeighborhood), null);

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

        // Sort data by average price
        insights.sort((a, b) => b.avgPrice - a.avgPrice);

        const x = d3.scaleBand()
            .domain(insights.map(d => d.neighbourhood))
            .range([0, width])
            .padding(0.1);
        const y = d3.scaleLinear()
            .domain([0, d3.max(insights, d => d.avgPrice)])
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

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
            .attr("height", d => height - y(d.avgPrice))
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

        // Add annotations
        const highestAvgPrice = insights[0];
        const annotation = svg.append("g")
            .attr("class", "annotation")
            .attr("transform", `translate(${x(highestAvgPrice.neighbourhood) + x.bandwidth() / 2},${y(highestAvgPrice.avgPrice) - 10})`);

        annotation.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .text("Highest Avg Price");

        annotation.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 20)
            .attr("stroke", "black");

        // Add labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 35)
            .attr("text-anchor", "middle")
            .text("");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 15)
            .attr("text-anchor", "middle")
            .text("Avg Price($)");

        // Move back button down a little
        d3.select("#scene5 .button-container")
            .style("margin-top", "50px");
    }).catch(error => {
        console.error("Error loading listings data:", error);
    });
}

// Start with Scene 1
showScene1();
