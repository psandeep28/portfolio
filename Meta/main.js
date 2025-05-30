// meta.js - Step 3 additions for scrollytelling (commits over time)

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale, yScale;
let commitProgress = 100;
let commitMaxTime;
let filteredCommits = [];
let colors = d3.scaleOrdinal(d3.schemeTableau10);

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([commit, lines]) => {
    const first = lines[0];
    return {
      id: commit,
      url: `https://github.com/psandeep28/portfolio/commit/${commit}`,
      author: first.author,
      date: first.date,
      time: first.time,
      timezone: first.timezone,
      datetime: first.datetime,
      hourFrac: first.datetime.getHours() + first.datetime.getMinutes() / 60,
      totalLines: lines.length,
      lines,
    };
  }).sort((a, b) => a.datetime - b.datetime);
}

function updateScatterPlot(data, commits) {
  const svg = d3.select('#chart svg');

  xScale.domain(d3.extent(commits, d => d.datetime)).nice();
  svg.select('g.x-axis').call(d3.axisBottom(xScale));

  const sorted = d3.sort(commits, d => -d.totalLines);
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const dots = svg.select('g.dots');
  dots.selectAll('circle')
    .data(sorted, d => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', updateTooltipPosition)
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

function renderCommitInfo(data, commits) { /* unchanged */ }
function renderTooltipContent(commit) { /* unchanged */ }
function updateTooltipVisibility(isVisible) { /* unchanged */ }
function updateTooltipPosition(event) { /* unchanged */ }
function isCommitSelected(selection, commit) { /* unchanged */ }
function renderSelectionCount(selection, commits) { /* unchanged */ }
function renderLanguageBreakdown(selection, commits) { /* unchanged */ }
function updateFileDisplay(filteredCommits) { /* unchanged */ }

function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  const timeElem = document.getElementById('slider-time');
  commitProgress = +slider.value;
  commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

  timeElem.textContent = commitMaxTime.toLocaleString(undefined, {
    dateStyle: 'long', timeStyle: 'short'
  });

  document.querySelector('#stats').innerHTML = '';
  renderCommitInfo(data, filteredCommits);
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}

const data = await loadData();
const commits = processCommits(data);

const timeScale = d3.scaleTime()
  .domain(d3.extent(commits, d => d.datetime))
  .range([0, 100]);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
updateFileDisplay(commits);

const slider = document.getElementById('commit-progress');
if (slider) {
  slider.addEventListener('input', onTimeSliderChange);
  onTimeSliderChange();
}

// Step 3.2: Generate commit text
const story = d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html((d, i) => `
    On ${d.datetime.toLocaleString('en', { dateStyle: 'full', timeStyle: 'short' })},
    I made <a href="${d.url}" target="_blank">
    ${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
    </a>. I edited ${d.totalLines} lines across ${
      d3.rollups(d.lines, D => D.length, d => d.file).length
    } files. Then I looked over all I had made, and I saw that it was very good.
  `);

// Step 3.3: Scrollama to link story to visualization
function onStepEnter(response) {
  const date = response.element.__data__.datetime;
  commitMaxTime = date;
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  document.getElementById('slider-time').textContent = commitMaxTime.toLocaleString(undefined, {
    dateStyle: 'long', timeStyle: 'short'
  });
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
  document.querySelector('#stats').innerHTML = '';
  renderCommitInfo(data, filteredCommits);
}

const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
  .onStepEnter(onStepEnter);
