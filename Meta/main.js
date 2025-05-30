// meta.js - CLEAN version with slider and matching original layout

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale, yScale;
let commitProgress = 100;
let commitMaxTime;
let filteredCommits = [];

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
  });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');
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

function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY + 10}px`;
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
  const p = document.getElementById('selection-count');
  p.textContent = `${selected.length || 'No'} commits selected`;
  return selected;
}

function renderLanguageBreakdown(selection, commits) {
  const selected = selection ? commits.filter(d => isCommitSelected(selection, d)) : [];
  const container = document.querySelector('#language-breakdown tbody');

  if (selected.length === 0) {
    container.innerHTML = '';
    return;
  }

  const lines = selected.flatMap(d => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);

  container.innerHTML = '';
  for (const [lang, count] of breakdown) {
    const percent = count / lines.length;
    container.innerHTML += `
      <tr>
        <td>${lang}</td>
        <td>${count}</td>
        <td>${d3.format('.1~%')(percent)}</td>
      </tr>
    `;
  }
}

function renderScatterPlot(data, commits) {
  const width = 1000, height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 50 };
  const usable = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom
  };

  const svg = d3.select('#chart').append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usable.left, usable.right])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([usable.bottom, usable.top]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat(d => `${String(d).padStart(2, '0')}:00`);

  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usable.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usable.width));

  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usable.bottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${usable.left}, 0)`)
    .attr('class', 'y-axis')
    .call(yAxis);

  const dots = svg.append('g').attr('class', 'dots');

  const sorted = d3.sort(commits, d => -d.totalLines);
  dots.selectAll('circle')
    .data(sorted, d => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => d.totalLines)
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

  svg.call(d3.brush().on('start brush end', (event) => {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', d => isCommitSelected(selection, d));
    renderSelectionCount(selection, commits);
    renderLanguageBreakdown(selection, commits);
  }));

  svg.selectAll('.dots, .overlay ~ *').raise();
}

function updateScatterPlot(data, commits) {
  const svg = d3.select('#chart svg');

  xScale.domain(d3.extent(commits, d => d.datetime)).nice();
  svg.select('g.x-axis').call(d3.axisBottom(xScale));

  const dots = svg.select('g.dots');
  const sorted = d3.sort(commits, d => -d.totalLines);
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

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
    .on('mouseleave', () => updateTooltipVisibility(false));
}

function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  const timeElem = document.getElementById('slider-time');
  commitProgress = +slider.value;
  commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  timeElem.textContent = commitMaxTime.toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  updateScatterPlot(data, filteredCommits);
  document.querySelector('#stats').innerHTML = '';
  renderCommitInfo(data, filteredCommits);
}

const data = await loadData();
const commits = processCommits(data);

const timeScale = d3.scaleTime()
  .domain(d3.extent(commits, d => d.datetime))
  .range([0, 100]);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

const slider = document.getElementById('commit-progress');
if (slider) {
  slider.addEventListener('input', onTimeSliderChange);
  onTimeSliderChange();
}
