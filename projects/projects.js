import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let query = '';

// Render search and project count
renderProjects(projects, projectsContainer, 'h2');
projectsTitle.textContent = `Projects (${projects.length})`;
renderPieChart(projects);

// Make search reactive
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  renderProjects(filteredProjects, projectsContainer, 'h2');
  projectsTitle.textContent = `Projects (${filteredProjects.length})`;
  renderPieChart(filteredProjects);
});

// Refactor all D3 charting code into a reusable function
function renderPieChart(projectsGiven) {
  // Group projects by year and count them
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let data = rolledData.map(([year, count]) => {
    return { label: year, value: count };
  });

  // Clear previous chart and legend
  d3.select('#projects-pie-plot').selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  // Arc and pie setup
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);
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

  // Draw legend
  let legend = d3.select('.legend');
  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}
