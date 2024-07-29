// Set dimensions and margins for the visualizations
const width = 960;
const height = 600;
const margin = { top: 10, right: 30, bottom: 30, left: 60 };

// Parameters: State variables to control the construction of scenes
let currentNeighborhood = "";
let currentListing = {};

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

// Annotations template for visual consistency
function addAnnotations(svg, annotations) {
    annotations.forEach(ann => {
        svg.append("text")
            .attr("x", ann.x)
            .attr("y", ann.y)
            .attr("dy", ann.dy || -10)
            .attr("dx", ann.dx || -10)
            .attr("class", "annotation")
            .text(ann.text);
    });
}

// Scene 1: Overview of Listings by Neighborhood
function showScene1() {
    const svg = createScene("#scene1", "Overview of Listings by Neighborhood");
    createNavigationButtons("#scene1", null, () => {
        if (currentNeighborhood) {
            showScene2(currentNeighborhood);
        }
    });

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
                console.log("Neighborhood clicked:", currentNeighborhood); // Debugging
                showScene2(currentNeighborhood);
            });

        // Add annotations
        const topNeighborhoods = data.features.slice(0, 3);
        const annotations = topNeighborhoods.map((d, i) => ({
            x: projection(d.geometry.coordinates[0][0][0])[0],
            y: projection(d.geometry.coordinates[0][0][0])[1],
            text: `Top ${i + 1}: ${d.properties.neighbourhood}`
        }));
        addAnnotations(svg, annotations);
    }).catch(error => {
        console.error("Error loading neighborhood data:", error); // Error handling
    });
}

// Scene 2: Listings Details in Selected Neighborhood
function showScene2(neighbourhood) {
    console.log("Showing Scene 2 for neighborhood:", neighbourhood); // Debugging
    const svg = createScene("#scene2", `Listings in ${neighbourhood}`);
    createNavigationButtons("#scene2", showScene1, () => {
        if (currentListing) {
            showScene3(currentListing);
        }
    });

    d3.csv("data/listings.csv").then(function(data) {
        const filteredData = data.filter(d => d.neighbourhood === neighbourhood);

        const x = d3.scaleBand()
            .domain(filteredData.map(d => d.name))
            .range([0, width])
            .padding(0.1);
        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d.price)])
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
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.name))
            .attr("y", d => y(d.price))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.price))
            .attr("fill", "steelblue")
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
                console.log("Listing clicked:", currentListing); // Debugging
                showScene3(d);
            });

        // Add annotations
        const maxPriceListing = filteredData.reduce((prev, current) => (prev.price > current.price) ? prev : current);
        const maxReviewsListing = filteredData.reduce((prev, current) => (prev.reviews_per_month > current.reviews_per_month) ? prev : current);

        const annotations = [
            {
                x: x(maxPriceListing.name),
                y: y(maxPriceListing.price),
                text: `Max Price: $${maxPriceListing.price}`
            },
            {
                x: x(maxReviewsListing.name),
                y: y(maxReviewsListing.price),
                text: `Max Reviews: ${maxReviewsListing.reviews_per_month}`
            }
        ];
        addAnnotations(svg, annotations);
    }).catch(error => {
        console.error("Error loading listings data:", error); // Error handling
    });
}

// Scene 3: Listing Reviews Analysis
function showScene3(listing) {
    console.log("Showing Scene 3 for listing:", listing); // Debugging
    const svg = createScene("#scene3", `Reviews for ${listing.name}`);
    createNavigationButtons("#scene3", () => showScene2(currentNeighborhood), showScene5);

    d3.csv("data/reviews.csv").then(function(data) {
        const filteredData = data.filter(d => d.listing_id === listing.id);

        const x = d3.scaleTime()
            .domain(d3.extent(filteredData, d => new Date(d.date)))
            .range([0, width]);
        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.rating)]) // Assuming rating scale is 0-5
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .call(d3.axisLeft(y));

        const area = d3.area()
            .x(d => x(new Date(d.date)))
            .y0(height)
            .y1(d => y(d.rating));

        svg.append("path")
            .datum(filteredData)
            .attr("fill", "steelblue")
            .attr("d", area);

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
            });

        // Add annotations
        const maxRating = d3.max(filteredData, d => d.rating);
        const minRating = d3.min(filteredData, d => d.rating);

        const annotations = [
            {
                x: x(new Date(filteredData.find(d => d.rating === maxRating).date)),
                y: y(maxRating),
                text: `Max Rating: ${maxRating}`
            },
            {
                x: x(new Date(filteredData.find(d => d.rating === minRating).date)),
                y: y(minRating),
                text: `Min Rating: ${minRating}`
            }
        ];
        addAnnotations(svg, annotations);
    }).catch(error => {
        console.error("Error loading reviews data:", error); // Error handling
    });
}

// Scene 5: Aggregated Insights
function showScene5() {
    console.log("Showing Scene 5: Aggregated Insights"); // Debugging
    const svg = createScene("#scene5", "Aggregated Insights");
    createNavigationButtons("#scene5", showScene3, null);

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
        const topPriceNeighborhood = insights.reduce((prev, current) => (prev.avgPrice > current.avgPrice) ? prev : current);
        const topReviewsNeighborhood = insights.reduce((prev, current) => (prev.avgReviewsPerMonth > current.avgReviewsPerMonth) ? prev : current);

        const annotations = [
            {
                x: x(topPriceNeighborhood.neighbourhood) + x.bandwidth() / 2,
                y: y(topPriceNeighborhood.avgPrice),
                text: `Highest Avg Price: $${topPriceNeighborhood.avgPrice.toFixed(2)}`
            },
            {
                x: x(topReviewsNeighborhood.neighbourhood) + x.bandwidth() / 2,
                y: y(topReviewsNeighborhood.avgReviewsPerMonth),
                text: `Highest Avg Reviews: ${topReviewsNeighborhood.avgReviewsPerMonth.toFixed(2)}`
            }
        ];
        addAnnotations(svg, annotations);
    }).catch(error => {
        console.error("Error loading listings data:", error); // Error handling
    });
}

// Start with Scene 1
showScene1();
