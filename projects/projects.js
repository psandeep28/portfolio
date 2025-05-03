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

// ✅ Use D3 to draw a full red circle via arc
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let arc = arcGenerator({
  startAngle: 0,
  endAngle: 2 * Math.PI,
});

d3.select('#projects-pie-plot')
  .append('path')
  .attr('d', arc)
  .attr('fill', 'red');
