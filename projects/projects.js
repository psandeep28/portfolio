// ✅ Import D3 first
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// ✅ Fetch and render projects
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

// ✅ Set title with project count
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `Projects (${projects.length})`;

// PIE CHART SETUP
let data = [1, 2, 3, 4, 5, 5];

// Arc generator (donut = set innerRadius > 0)
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Pie slice angle generator
let sliceGenerator = d3.pie();

// Use sliceGenerator to get start/end angles
let arcData = sliceGenerator(data);

// Map data to arc paths
let arcs = arcData.map((d) => arcGenerator(d));

// Ordinal color scale using Tableau10 (10 safe & distinct colors)
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Draw pie chart into SVG
arcs.forEach((arc, idx) => {
  d3.select('#projects-pie-plot')
    .append('path')
    .attr('d', arc)
    .attr('fill', colors(idx));
});


let arc = arcGenerator({
  startAngle: 0,
  endAngle: 2 * Math.PI,
});

d3.select('#projects-pie-plot')
  .append('path')
  .attr('d', arc)
  .attr('fill', 'red');
