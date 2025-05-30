// meta.js - Full Rebuild (Slider + Tooltip + Files + Scrollytelling)

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale, yScale;
let commitProgress = 100;
let commitMaxTime;
let filteredCommits = [];
let data, commits;

const colors = d3.scaleOrdinal(d3.schemeTableau10);

async function loadData() {
  const raw = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return raw;
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

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').html('').append('dl').attr('class', 'stats');
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);
  dl.append('dt').text('Number of files');
  dl.append('dd').text(d3.groups(data, d => d.file).length);
  dl.append('dt').text('Max depth');
  dl.append('dd').text(d3.max(data, d => d.depth));
  dl.append('dt').text('Average line length');
  dl.append('dd').text(d3.mean(data, d => d.length).toFixed(2));
  const longest = d3.greatest(data, d => d.length);
  dl.append('dt').text('Longest line');
  dl.append('dd').text(longest?.text || 'N/A');
}

function renderTooltipContent(commit) {
  document.getElementById('commit-link').href = commit.url;
  document.getElementById('commit-link').textContent = commit.id;
  document.getElementById('commit-date').textContent = commit.datetime.toLocaleDateString();
  document.getElementById('tooltip-time').textContent = commit.datetime.toLocaleTimeString();
  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent = commit.totalLines;
}

function updateTooltipVisibility(show) {
  document.getElementById('commit-tooltip').hidden = !show;
}

function updateTooltipPosition(event) {
  const tip = document.getElementById('commit-tooltip');
  tip.style.left = `${event.clientX + 10}px`;
  tip.style.top = `${event.clientY + 10}px`;
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function renderSelectionCount(selection, commits) {
  const selected = selection ? commits.filter(d => isCommitSelected(selection, d)) : [];
  document.getElementById('selection-count').textContent = `${selected.length || 'No'} commits selected`;
  return selected;
}

function renderLanguageBreakdown(selection, commits) {
  const selected = selection ? commits.filter(d => isCommitSelected(selection, d)) : [];
  const tbody = document.querySelector('#language-breakdown tbody');
  if (selected.length === 0) return tbody.innerHTML = '';
  const lines = selected.flatMap(d => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);
  tbody.innerHTML = '';
  for (const [lang, count] of breakdown) {
    const pct = count / lines.length;
    tbody.innerHTML += `<tr><td>${lang}</td><td>${count}</td><td>${d3.format('.1~%')(pct)}</td></tr>`;
  }
}

function renderScatterPlot(data, commits) {
  const width = 1000, height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 50 };
  const usable = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom
  };

  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3.scaleTime().range([usable.left, usable.right]);
  yScale = d3.scaleLinear().domain([0, 24]).range([usable.bottom, usable.top]);

  svg.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${usable.bottom})`);
  svg.append('g').attr('class', 'y-axis').attr('transform', `translate(${usable.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat(d => `${String(d).padStart(2, '0')}:00`));

  svg.append('g').attr('class', 'dots');

  svg.call(d3.brush().on('start brush end', (event) => {
    const sel = event.selection;
    d3.selectAll('circle').classed('selected', d => isCommitSelected(sel, d));
    renderSelectionCount(sel, commits);
    renderLanguageBreakdown(sel, commits);
  }));

  updateScatterPlot(data, commits);
}

function updateScatterPlot(data, commits) {
  xScale.domain(d3.extent(commits, d => d.datetime)).nice();
  const svg = d3.select('#chart svg');
  svg.select('g.x-axis').call(d3.axisBottom(xScale));

  const sorted = d3.sort(commits, d => -d.totalLines);
  const [min, max] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([min, max]).range([2, 30]);

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

function updateFileDisplay(filteredCommits) {
  const lines = filteredCommits.flatMap(d => d.lines);
  const files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const container = d3.select('#files').html('').selectAll('div')
    .data(files, d => d.name)
    .join(enter => enter.append('div').call(div => {
      div.append('dt').append('code');
      div.append('dd');
    }));

  container.select('dt > code')
    .html(d => `${d.name}<br><small>${d.lines.length} lines</small>`);

  container.select('dd')
    .selectAll('div')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', d => `background: ${colors(d.type)}`);
}

function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  const timeElem = document.getElementById('slider-time');
  commitProgress = +slider.value;
  commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

  timeElem.textContent = commitMaxTime.toLocaleString(undefined, {
    dateStyle: 'long', timeStyle: 'short'
  });

  renderCommitInfo(data, filteredCommits);
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}

// Load & init

data = await loadData();
commits = processCommits(data);

const timeScale = d3.scaleTime()
  .domain(d3.extent(commits, d => d.datetime))
  .range([0, 100]);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
updateFileDisplay(commits);

document.getElementById('commit-progress')?.addEventListener('input', onTimeSliderChange);
onTimeSliderChange();

// Step 3.2 Scrollytelling entries
const story = d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html((d, i) => `
    On ${d.datetime.toLocaleString('en', { dateStyle: 'full', timeStyle: 'short' })},
    I made <a href="${d.url}" target="_blank">
    ${i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}</a>.
    I edited ${d.totalLines} lines across ${
      d3.rollups(d.lines, D => D.length, d => d.file).length
    } files. Then I looked over all I had made, and I saw that it was very good.
  `);

// Step 3.3 Scrollama linking
function onStepEnter(response) {
  const date = response.element.__data__.datetime;
  commitMaxTime = date;
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  document.getElementById('slider-time').textContent = commitMaxTime.toLocaleString(undefined, {
    dateStyle: 'long', timeStyle: 'short'
  });
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
  renderCommitInfo(data, filteredCommits);
}

scrollama().setup({
  container: '#scrolly-1',
  step: '#scrolly-1 .step',
}).onStepEnter(onStepEnter);