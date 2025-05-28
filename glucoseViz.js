// Load and filter data
d3.json("01_full_day.json").then(data => {
    data.forEach(d => {
      d.datetime = new Date(d.datetime);
      d.glucose = +d.glucose;
    });
  
     // Since data is only for one day, no need to filter
    const dailyData = data;

    // Get the date string from the first datapoint to use for x axis labels/title
    const focusDate = dailyData.length > 0
        ? dailyData[0].datetime.toISOString().slice(0, 10)
        : "Unknown Date";
    const margin = { top: 50, right: 30, bottom: 50, left: 60 },
          width = 1000 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;
  
    const svg = d3.select("svg")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
      const x = d3.scaleTime()
      .domain([
        new Date(`${focusDate}T00:00:00`),
        new Date(`${focusDate}T23:59:59`)
      ])
      .range([0, width]);    
  
    const y = d3.scaleLinear()
      .domain([d3.min(dailyData, d => d.glucose) - 10, d3.max(dailyData, d => d.glucose) + 10])
      .range([height, 0]);
  
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(d3.timeHour.every(1)).tickFormat(d3.timeFormat("%H:%M")));
  
    svg.append("g").call(d3.axisLeft(y));
  
    // X Axis
    svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(d3.timeHour.every(1)).tickFormat(d3.timeFormat("%H:%M")));

    // X axis label
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.bottom - 10)
    .text("Time of Day");

    // Y Axis
    svg.append("g")
    .call(d3.axisLeft(y));

    // Y axis label
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 18)
    .attr("x", -margin.top - 100)
    .text("Glucose (mg/dL)");

    svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text(`Glucose Trend on ${focusDate}`);

    // Draw line
    const line = d3.line()
      .x(d => x(d.datetime))
      .y(d => y(d.glucose));
  
    svg.append("path")
      .datum(dailyData)
      .attr("fill", "none")
      .attr("stroke", "#0077cc")
      .attr("stroke-width", 2)
      .attr("d", line);
  
    // Tooltip div
    const quizDiv = d3.select("#quiz");
    const resultDiv = d3.select("#result");
  
    // Points with logged food
    const meals = dailyData.filter(d => d.logged_food);
  
    svg.selectAll(".meal-dot")
      .data(meals)
      .enter()
      .append("circle")
      .attr("class", "meal-dot")
      .attr("cx", d => x(d.datetime))
      .attr("cy", d => y(d.glucose))
      .attr("r", 6)
      .attr("fill", "orange")
      .style("cursor", "pointer")
      .on("mouseover", function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", 9) // increase size on hover
          .attr("fill", "#ff9900"); // slightly brighter color
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", 6)
          .attr("fill", "orange");
      })
      .on("click", (event, d) => {
        const options = getMealChoices(meals, d);
        quizDiv
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 30) + "px")
          .style("display", "block")
          .html(`
            <strong>Which meal was eaten at ${d3.timeFormat("%H:%M")(d.datetime)}?</strong><br>
            ${options.map(m => `<button>${m}</button>`).join("<br>")}
          `);
  
          quizDiv.selectAll("button")
          .on("click", function () {
            const chosen = d3.select(this).text();
            const correct = d.logged_food;
    
            // Display result text in the resultDiv
            if (chosen === correct) {
              resultDiv.text("✅ Correct!").style("color", "green");
            } else {
              resultDiv.text(`❌ Incorrect. It was: ${correct}`).style("color", "red");
            }
    
            quizDiv.style("display", "none");
          });
      });
  
    function getMealChoices(allMeals, currentMeal) {
      const correct = currentMeal.logged_food;
      const others = allMeals
        .map(d => d.logged_food)
        .filter(m => m !== correct);
      const randoms = d3.shuffle(others).slice(0, 2);
      return d3.shuffle([correct, ...randoms]);
    }
  });
  