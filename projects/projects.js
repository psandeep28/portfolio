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

// ✅ PIE CHART: visualize number of projects by year

// Count number of projects by year
let yearCounts = {};
for (let project of projects) {
  const year = project.year;
  yearCounts[year] = (yearCounts[year] || 0) + 1;
}

// Transform into D3-friendly format
let data = Object.entries(yearCounts).map(([year, count]) => ({
  label: year,
  value: count
}));

// Arc generator
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Pie slice generator
const sliceGenerator = d3.pie().value(d => d.value);

// Generate angle data
const arcData = sliceGenerator(data);

// Color scale
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// Draw pie chart
arcData.forEach((d, idx) => {
  d3.select('#projects-pie-plot')
    .append('path')
    .attr('d', arcGenerator(d))
    .attr('fill', colors(idx))
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.5);
});

// ✅ Add legend
let legend = d3.select('.legend');

data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('class', 'legend-item')
    .attr('style', `--color:${colors(idx)}`)
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});
