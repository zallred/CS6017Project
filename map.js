//Code to import voter data from a JSON file and display it on a stacked bar chart.
//Allows for two different views of popular vote and delegates.
//Authored by Koffi Danhounsrou and Zach Allred
//Date: 07/29/2024
//CS6017, Assignment 7


// Load the JSON data from the file.
d3.json("data.json").then(function(data) {
  // Setting up margins for the charts with the webpage
  const margin = {top: 20, right: 30, bottom: 40, left: 60};
  const width = 1200 - margin.left - margin.right;
  const height = 700 - margin.top - margin.bottom;

  // This handles the x and y of the charts based on the JSON data
  const x = d3.scaleBand().range([0, width]).padding(0.1);
  const y = d3.scaleLinear().range([height, 0]);

  // Set color to red and blue, grey for "other"
  //this handles our type colors.
  const color = d3.scaleOrdinal()
    .domain(["democrat", "republican", "other"])
    .range(["blue", "red", "grey"]);

  //this section handles setting up the margins of our chart
  //also handles the background color.
  const svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "lightgrey") 
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  function updateChart(type) {
    // Load an array with the state values from the JSON
    const states = Object.keys(data.votes);
    const chartData = states.map(state => {
      // Store the popular vote data or delegate data for each state
      const voteData = data.votes[state].popular;
      const delegateData = data.votes[state].electoral;
      const total = voteData.democrat + voteData.republican + voteData.other;
      const delegateTotal = delegateData.democrat + delegateData.republican;
      //return that data so we can access it in our rectangle builder
      return {
        state,
        //ternary operator to handle popular and delegate views.
        democrat: type === 'popular' ? voteData.democrat : delegateData.democrat,
        republican: type === 'popular' ? voteData.republican : delegateData.republican,
        other: type === 'popular' ? voteData.other : 0,
        total: type === 'popular' ? total : delegateTotal
      };
    });

    x.domain(chartData.map(d => d.state));
    y.domain([0, d3.max(chartData, d => d.total)]);

    //remove everything from the view when we switch views
    svg.selectAll("*").remove();

    // Section that handles gridlines on charts
    svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "white") 
      .call(d3.axisLeft(y)
        .ticks(10)
        .tickSize(-width)
        .tickFormat(""));

     // Set up the stack layout
     const stack = d3.stack().keys(["democrat", "republican", "other"]);
     const stackedData = stack(chartData);

     // Add bars to charts
     svg
       .selectAll("g.layer")
       .data(stackedData)
       .enter()
       .append("g")
       .attr("class", "layer")
       .attr("fill", (d) => color(d.key))
       .selectAll("rect")
       .data((d) => d)
       .enter()
       //append our rectangle to our graph
       .append("rect")
       .attr("x", (d) => x(d.data.state))
       .attr("y", (d) => y(d[1]))
       .attr("height", (d) => y(d[0]) - y(d[1]))
       .attr("width", x.bandwidth())
       //create function to handle labels on hover
       .on("mouseover", function (event, d) {
         const key = d3.select(this.parentNode).datum().key;
         tooltip.transition().duration(200).style("opacity", 0.9);
         tooltip
           .html(
            //switch/ternary to handle showing our labels on different views
             `${type === "popular" ? "Vote Count" : "Delegate Count"}<br>${
               key.charAt(0).toUpperCase() + key.slice(1)
             }: ${d.data[key].toLocaleString()}`
           )
           .style("left", event.pageX + 5 + "px")
           .style("top", event.pageY - 28 + "px");
       })
       //remove label on mouseout
       .on("mouseout", function () {
         tooltip.transition().duration(500).style("opacity", 0);
       });

    // Section to add axis to charts
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(10, "s"));

    // Add the state x axis
    svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", width / 2 + margin.left)
      .attr("y", height + margin.bottom - 10)
      .text("State");

    // Add a y axis label to the chart. Name depends on type
    svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("y", -margin.left + 20)
      .attr("x", -height / 2 + margin.top)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      //ternary to handle different views
      .text(type === 'popular' ? "Popular Votes" : "Delegate Count");

    // Add a legend to the charts
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 60}, ${margin.top})`);

    const keys = ["democrat", "republican", "other"];
    const legendSize = 20;
    legend.selectAll("rect")
      .data(keys)
      .enter()
      .append("rect")
      // This is where you can adjust values of rectangles only
      .attr("x", legendSize + -40)
      .attr("y", (d, i) => i * (legendSize + 13))
      .attr("width", legendSize)
      .attr("height", legendSize)
      .attr("fill", d => color(d));

    legend.selectAll("text")
      .data(keys)
      .enter()
      .append("text")
      //here is handling the text location on the legend
      //NOTE Does not adjust rectangles.
      .attr("x", legendSize + -10)
      .attr("y", (d, i) => i * (legendSize + 13) + (legendSize / 2))
      .attr("dy", "0.35em")
      .text(d => d.charAt(0).toUpperCase() + d.slice(1));
  }

  // Set up listeners for both buttons to change views
  d3.select("#showPopularVotesButton").on("click", function() {
    updateChart('popular');
  });

  d3.select("#showDelegatesButton").on("click", function() {
    updateChart('delegates');
  });
});
