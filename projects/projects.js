import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');

let query = '';
let selectedIndex = -1;

function renderPieChart(projectList) {
  // Clear existing
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  // Group projects by year
  const rolled = d3.rollups(
    projectList,
    v => v.length,
    d => d.year
  );

  const data = rolled.map(([year, count]) => ({
    label: year,
    value: count
  }));

  const sliceGen = d3.pie().value(d => d.value);
  const arcGen = d3.arc().innerRadius(0).outerRadius(50);
  const arcData = sliceGen(data);
  const arcs = arcData.map(d => arcGen(d));
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcs.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', selectedIndex === i ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        // Update classes
        svg.selectAll('path')
          .attr('class', (_, idx) => selectedIndex === idx ? 'selected' : '');

        legend.selectAll('li')
          .attr('class', (_, idx) => selectedIndex === idx ? 'selected' : '');

        // Update project list
        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2');
        } else {
          const year = data[selectedIndex].label;
          const filtered = projects.filter(p => p.year === year);
          renderProjects(filtered, projectsContainer, 'h2');
        }
      });
  });

  data.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', selectedIndex === idx ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;

        svg.selectAll('path')
          .attr('class', (_, i) => selectedIndex === i ? 'selected' : '');

        legend.selectAll('li')
          .attr('class', (_, i) => selectedIndex === i ? 'selected' : '');

        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2');
        } else {
          const year = data[selectedIndex].label;
          const filtered = projects.filter(p => p.year === year);
          renderProjects(filtered, projectsContainer, 'h2');
        }
      });
  });
}

function handleSearch(event) {
  query = event.target.value.toLowerCase();
  const filtered = projects.filter(p =>
    Object.values(p).join('\n').toLowerCase().includes(query)
  );
  renderProjects(filtered, projectsContainer, 'h2');
  renderPieChart(filtered);
}

// Initial render
renderProjects(projects, projectsContainer, 'h2');
projectsTitle.textContent = `Projects (${projects.length})`;
renderPieChart(projects);

// Search event
searchInput.addEventListener('input', handleSearch);
