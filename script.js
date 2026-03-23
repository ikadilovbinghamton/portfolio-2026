const canvas = document.getElementById("trail");
const ctx = canvas.getContext("2d");

const state = {
  width: 0,
  height: 0,
  dpr: Math.max(1, window.devicePixelRatio || 1),
  dragging: false,
  cursor: { x: 0, y: 0 },
  bounds: { left: 0, top: 0 },
};

const settings = {
  nodeCount: 70,
  maxSpeed: 0.85,
  jitter: 0.07,
  linkDistance: 140,
  cursorLinkDistance: 200,
  nodeRadius: 3.4,
  boundsPadding: 24,
};

const nodes = [];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateBounds() {
  const rect = canvas.getBoundingClientRect();
  state.bounds.left = rect.left;
  state.bounds.top = rect.top;
  state.width = rect.width;
  state.height = rect.height;
}

function seedNodes() {
  nodes.length = 0;
  for (let i = 0; i < settings.nodeCount; i += 1) {
    nodes.push({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      vx: (Math.random() - 0.5) * settings.maxSpeed * 2,
      vy: (Math.random() - 0.5) * settings.maxSpeed * 2,
    });
  }
}

function resize() {
  updateBounds();
  state.dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = state.width * state.dpr;
  canvas.height = state.height * state.dpr;
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  if (nodes.length === 0) {
    seedNodes();
  } else {
    nodes.forEach((node) => {
      node.x = clamp(node.x, 0, state.width);
      node.y = clamp(node.y, 0, state.height);
    });
  }
}

function onPointerDown(event) {
  updateBounds();
  canvas.setPointerCapture(event.pointerId);
  state.dragging = true;
  state.cursor.x = event.clientX - state.bounds.left;
  state.cursor.y = event.clientY - state.bounds.top;
}

function onPointerMove(event) {
  if (!state.dragging) return;
  updateBounds();
  state.cursor.x = event.clientX - state.bounds.left;
  state.cursor.y = event.clientY - state.bounds.top;
}

function onPointerUp(event) {
  canvas.releasePointerCapture(event.pointerId);
  state.dragging = false;
}

function update() {
  const padding = settings.boundsPadding;

  nodes.forEach((node) => {
    node.vx += (Math.random() - 0.5) * settings.jitter;
    node.vy += (Math.random() - 0.5) * settings.jitter;

    const speed = Math.hypot(node.vx, node.vy);
    if (speed > settings.maxSpeed) {
      node.vx = (node.vx / speed) * settings.maxSpeed;
      node.vy = (node.vy / speed) * settings.maxSpeed;
    }

    node.x += node.vx;
    node.y += node.vy;

    if (node.x < padding || node.x > state.width - padding) {
      node.vx *= -1;
      node.x = clamp(node.x, padding, state.width - padding);
    }

    if (node.y < padding || node.y > state.height - padding) {
      node.vy *= -1;
      node.y = clamp(node.y, padding, state.height - padding);
    }
  });
}

function drawLinks() {
  const maxDist = settings.linkDistance;
  const maxDist2 = maxDist * maxDist;

  ctx.lineWidth = 1;

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > maxDist2) continue;
      const alpha = 1 - dist2 / maxDist2;
      ctx.strokeStyle = `rgba(110, 110, 110, ${0.08 + alpha * 0.35})`;
      ctx.beginPath();
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(nodes[j].x, nodes[j].y);
      ctx.stroke();
    }
  }
}

function drawCursorLinks() {
  if (!state.dragging) return;
  const maxDist = settings.cursorLinkDistance;
  const maxDist2 = maxDist * maxDist;

  ctx.lineWidth = 1.6;

  nodes.forEach((node) => {
    const dx = node.x - state.cursor.x;
    const dy = node.y - state.cursor.y;
    const dist2 = dx * dx + dy * dy;
    if (dist2 > maxDist2) return;
    const alpha = 1 - dist2 / maxDist2;
    ctx.strokeStyle = `rgba(90, 90, 90, ${0.15 + alpha * 0.6})`;
    ctx.beginPath();
    ctx.moveTo(state.cursor.x, state.cursor.y);
    ctx.lineTo(node.x, node.y);
    ctx.stroke();
  });

  ctx.fillStyle = "rgba(211, 211, 211, 1)";
  ctx.beginPath();
  ctx.arc(state.cursor.x, state.cursor.y, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawNodes() {
  ctx.fillStyle = "rgba(211, 211, 211, .5)";
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, settings.nodeRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);
  drawLinks();
  drawCursorLinks();
  drawNodes();
}

function tick() {
  update();
  draw();
  requestAnimationFrame(tick);
}

window.addEventListener("resize", resize);
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);

function openModal(modal) {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

document.querySelectorAll("[data-modal-target]").forEach((trigger) => {
  const targetId = trigger.getAttribute("data-modal-target");
  const modal = document.getElementById(targetId);
  const openHandler = () => openModal(modal);

  trigger.addEventListener("click", openHandler);
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openHandler();
    }
  });
});

document.querySelectorAll(".modal [data-close]").forEach((closeEl) => {
  closeEl.addEventListener("click", () => {
    closeModal(closeEl.closest(".modal"));
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const openModalEl = document.querySelector(".modal.is-open");
  closeModal(openModalEl);
});

function ensureImagePreviewModal() {
  let modal = document.getElementById("image-preview-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal image-preview-modal";
  modal.id = "image-preview-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-card image-preview-modal__card" role="document">
      <button class="modal-close" type="button" data-close aria-label="Close">
        &times;
      </button>
      <img class="image-preview-modal__image" alt="" loading="lazy" />
    </div>
  `;

  modal.querySelectorAll("[data-close]").forEach((closeEl) => {
    closeEl.addEventListener("click", () => {
      closeModal(modal);
    });
  });

  document.body.appendChild(modal);
  return modal;
}

function openImagePreview(image) {
  const modal = ensureImagePreviewModal();
  const preview = modal.querySelector(".image-preview-modal__image");
  if (!preview) return;

  preview.src = image.getAttribute("src") || "";
  preview.alt = image.getAttribute("alt") || "";
  openModal(modal);
}

function setupPreviewableImages() {
  document.querySelectorAll("[data-preview-image]").forEach((image) => {
    const openHandler = () => openImagePreview(image);

    image.addEventListener("click", openHandler);
    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openHandler();
      }
    });
  });
}

function slugifyHeading(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function ensureHeadingId(element, prefix) {
  if (element.id) return element.id;
  const base = slugifyHeading(element.textContent || "") || prefix;
  let candidate = base;
  let index = 2;
  while (document.getElementById(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  element.id = candidate;
  return candidate;
}

function buildTableOfContents() {
  const tocNav = document.getElementById("toc-nav");
  if (!tocNav) return;

  const headingElements = Array.from(
    document.querySelectorAll("h2.section-header, .teaching-fieldset > legend"),
  );

  if (headingElements.length === 0) {
    tocNav.innerHTML = "";
    return;
  }

  const tocList = document.createElement("ul");
  tocList.className = "toc-list";

  let currentTopItem = null;
  let currentSublist = null;

  headingElements.forEach((heading) => {
    const isTopHeading = heading.matches("h2.section-header");
    const id = ensureHeadingId(heading, isTopHeading ? "section" : "subsection");

    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = (heading.textContent || "").trim();
    link.className = `toc-link ${isTopHeading ? "toc-link--top" : "toc-link--sub"}`;

    const item = document.createElement("li");
    item.className = "toc-item";
    item.appendChild(link);

    if (isTopHeading) {
      currentTopItem = item;
      currentSublist = null;
      tocList.appendChild(currentTopItem);
      return;
    }

    if (!currentTopItem) {
      tocList.appendChild(item);
      return;
    }

    if (!currentSublist) {
      currentSublist = document.createElement("ul");
      currentSublist.className = "toc-sublist";
      currentTopItem.appendChild(currentSublist);
    }

    currentSublist.appendChild(item);
  });

  tocNav.innerHTML = "";
  tocNav.appendChild(tocList);

  tocNav.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='#']");
    if (!link) return;
    const targetId = link.getAttribute("href")?.slice(1);
    const targetEl = targetId ? document.getElementById(targetId) : null;
    if (!targetEl) return;
    event.preventDefault();
    const offset = 24;
    const top = targetEl.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  });

  const links = Array.from(tocNav.querySelectorAll(".toc-link"));

  function updateActiveLink() {
    const scrollMarker = window.scrollY + 140;
    let activeHeading = headingElements[0];

    headingElements.forEach((heading) => {
      if (heading.offsetTop <= scrollMarker) {
        activeHeading = heading;
      }
    });

    links.forEach((tocLink) => {
      const isActive = tocLink.getAttribute("href") === `#${activeHeading.id}`;
      tocLink.classList.toggle("is-active", isActive);
    });
  }

  let isTicking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (isTicking) return;
      isTicking = true;
      window.requestAnimationFrame(() => {
        updateActiveLink();
        isTicking = false;
      });
    },
    { passive: true },
  );

  updateActiveLink();
}

function setupTocScrollPosition() {
  const tocSidebar = document.querySelector(".toc-sidebar");
  const trailCanvas = document.getElementById("trail");
  if (!tocSidebar || !trailCanvas) return;

  let startOffset = 0;

  function calculateStartOffset() {
    const canvasRect = trailCanvas.getBoundingClientRect();
    startOffset = canvasRect.top + window.scrollY + canvasRect.height + 18;
  }

  function updateTocTop() {
    const top = Math.max(0, startOffset - window.scrollY);
    tocSidebar.style.top = `${top}px`;
  }

  function refreshPosition() {
    calculateStartOffset();
    updateTocTop();
  }

  let scrollTicking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(() => {
        updateTocTop();
        scrollTicking = false;
      });
    },
    { passive: true },
  );

  let resizeTicking = false;
  window.addEventListener("resize", () => {
    if (resizeTicking) return;
    resizeTicking = true;
    window.requestAnimationFrame(() => {
      refreshPosition();
      resizeTicking = false;
    });
  });

  refreshPosition();
}

function normalizeCellText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function createTableElement(tableData) {
  const block = document.createElement("div");
  block.className = "table-block";

  const title = document.createElement("h3");
  title.className = "table-title";
  title.textContent = tableData.title;
  block.appendChild(title);

  const wrap = document.createElement("div");
  wrap.className = "table-wrap";

  const table = document.createElement("table");
  table.className = "teaching-table";
  table.dataset.tableId = tableData.id;

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  tableData.columns.forEach((column) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = column;
    headerRow.appendChild(cell);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tableData.rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      tr.appendChild(cell);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  block.appendChild(wrap);

  if (tableData.description) {
    const description = document.createElement("p");
    description.className = "value-text table-description";
    description.textContent = tableData.description;
    block.appendChild(description);
  }

  return block;
}

async function renderTableRoots() {
  const roots = Array.from(document.querySelectorAll(".table-render-root"));

  await Promise.all(
    roots.map(async (root) => {
      const source = root.dataset.source;
      if (!source) return;

      try {
        const embeddedData =
          window.TABLE_DATA?.[source] ||
          (source.includes("?") ? window.TABLE_DATA?.[source.split("?")[0]] : null);

        let data = embeddedData;

        if (!data) {
          let response = await fetch(source, { cache: "no-store" });
          if (!response.ok && source.includes("?")) {
            response = await fetch(source.split("?")[0], { cache: "no-store" });
          }
          if (!response.ok) {
            throw new Error(`Failed to load ${source}: ${response.status}`);
          }

          data = await response.json();
        }
        root.innerHTML = "";
        (data.tables || []).forEach((tableData) => {
          root.appendChild(createTableElement(tableData));
        });
      } catch (error) {
        console.error(error);
        root.innerHTML = '<p class="table-error">Table data could not be loaded.</p>';
      }
    }),
  );
}

function formatPercent(value, fractionDigits = 1) {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

const DISPLAY_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDisplayDate(value) {
  if (!value) return "Date unavailable";
  const normalizedValue =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return String(value);
  return DISPLAY_DATE_FORMATTER.format(date);
}

function createStudentSuccessMetric(label, value, detail) {
  const card = document.createElement("article");
  card.className = "student-success-card student-success-card--metric";

  const eyebrow = document.createElement("p");
  eyebrow.className = "student-success-card__eyebrow";
  eyebrow.textContent = label;

  const metricValue = document.createElement("p");
  metricValue.className = "student-success-card__value";
  metricValue.textContent = value;

  const meta = document.createElement("p");
  meta.className = "student-success-card__meta";
  meta.textContent = detail;

  card.appendChild(eyebrow);
  card.appendChild(metricValue);
  card.appendChild(meta);
  return card;
}

function createStudentSuccessPanel(title, description) {
  const panel = document.createElement("section");
  panel.className = "student-success-panel";

  const header = document.createElement("div");
  header.className = "student-success-panel__header";

  const heading = document.createElement("h5");
  heading.className = "student-success-panel__title";
  heading.textContent = title;

  header.appendChild(heading);

  if (description) {
    const note = document.createElement("p");
    note.className = "student-success-panel__note";
    note.textContent = description;
    header.appendChild(note);
  }

  panel.appendChild(header);
  return panel;
}

function createInsightPieChartContent(entries, options = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = `insight-chart ${options.compact ? "insight-chart--compact" : ""}`.trim();

  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  const compact = Boolean(options.compact);

  const chartFrame = document.createElement("div");
  chartFrame.className = "insight-chart__frame";

  if (window.d3 && total > 0) {
    const chartSize = compact ? 208 : 280;
    const outerRadius = compact ? 92 : 126;
    const innerRadius = compact ? 54 : 74;
    const pie = window.d3.pie().sort(null).value((entry) => entry.count);
    const arc = window.d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(compact ? 7 : 10)
      .padAngle(0.015);
    const svg = window.d3
      .create("svg")
      .attr("class", "insight-chart__pie insight-chart__svg")
      .attr("viewBox", `${-chartSize / 2} ${-chartSize / 2} ${chartSize} ${chartSize}`)
      .attr("width", chartSize)
      .attr("height", chartSize)
      .attr("role", "img")
      .attr("aria-label", options.centerLabel || "Pie chart");

    svg
      .append("g")
      .selectAll("path")
      .data(pie(entries.filter((entry) => entry.count > 0)))
      .join("path")
      .attr("class", "insight-chart__slice")
      .attr("fill", (entry) => entry.data.color)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", compact ? 2.5 : 3)
      .attr("d", arc)
      .append("title")
      .text((entry) => {
        const percent = total > 0 ? Math.round((entry.data.count / total) * 100) : 0;
        return `${entry.data.label}: ${entry.data.count} (${percent}%)`;
      });

    chartFrame.appendChild(svg.node());
  } else {
    let currentStop = 0;
    const gradientStops = entries.map((entry) => {
      const start = currentStop;
      const share = total > 0 ? (entry.count / total) * 100 : 0;
      currentStop += share;
      return `${entry.color} ${start}% ${currentStop}%`;
    });

    const chart = document.createElement("div");
    chart.className = "insight-chart__pie";
    chart.style.background = `conic-gradient(${gradientStops.join(", ")})`;
    chartFrame.appendChild(chart);
  }

  const chartCenter = document.createElement("div");
  chartCenter.className = "insight-chart__center";
  chartCenter.innerHTML = `
    <span class="insight-chart__center-label">${options.centerLabel || "Total"}</span>
    <span class="insight-chart__center-value">${options.centerValue || total}</span>
  `;

  chartFrame.appendChild(chartCenter);
  wrapper.appendChild(chartFrame);

  const legend = document.createElement("div");
  legend.className = "insight-chart__legend";

  entries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "insight-chart__legend-item";
    const percent = total > 0 ? Math.round((entry.count / total) * 100) : 0;
    item.innerHTML = `
      <span class="insight-chart__swatch" style="background:${entry.color}"></span>
      <span class="insight-chart__legend-label">${entry.label}</span>
      <span class="insight-chart__legend-value">${entry.count} (${percent}%)</span>
    `;
    legend.appendChild(item);
  });

  wrapper.appendChild(legend);
  return wrapper;
}

function createStudentSuccessTrendPanel(semesters) {
  const panel = createStudentSuccessPanel(
    "Semester Pass Rate Trend",
    "Grouped A-C outcomes divided by total enrolled students for each semester.",
  );
  const trend = document.createElement("div");
  trend.className = "student-success-trend";

  semesters.forEach((semester) => {
    const row = document.createElement("div");
    row.className = "student-success-trend__row";

    const labels = document.createElement("div");
    labels.className = "student-success-trend__labels";

    const title = document.createElement("p");
    title.className = "student-success-trend__title";
    title.textContent = semester.semester;

    const meta = document.createElement("p");
    meta.className = "student-success-trend__meta";
    meta.textContent = `${semester.passCount}/${semester.total} passed · ${semester.sections} sections`;

    labels.appendChild(title);
    labels.appendChild(meta);

    const barWrap = document.createElement("div");
    barWrap.className = "student-success-trend__bar-wrap";

    const barTrack = document.createElement("div");
    barTrack.className = "student-success-trend__bar-track";

    const barFill = document.createElement("div");
    barFill.className = "student-success-trend__bar-fill";
    barFill.style.width = formatPercent(semester.passRate, 1);
    barTrack.appendChild(barFill);

    const value = document.createElement("p");
    value.className = "student-success-trend__value";
    value.textContent = formatPercent(semester.passRate, 1);

    barWrap.appendChild(barTrack);
    barWrap.appendChild(value);

    row.appendChild(labels);
    row.appendChild(barWrap);
    trend.appendChild(row);
  });

  panel.appendChild(trend);
  return panel;
}

function createStudentSuccessRankingList(title, courses, toneClass) {
  const block = document.createElement("div");
  block.className = "student-success-ranking";

  const heading = document.createElement("h6");
  heading.className = "student-success-ranking__title";
  heading.textContent = title;
  block.appendChild(heading);

  const list = document.createElement("div");
  list.className = "student-success-ranking__list";

  courses.forEach((course) => {
    const row = document.createElement("div");
    row.className = "student-success-ranking__item";

    const content = document.createElement("div");
    content.className = "student-success-ranking__content";

    const courseName = document.createElement("p");
    courseName.className = "student-success-ranking__course";
    courseName.textContent = course.course;

    const meta = document.createElement("p");
    meta.className = "student-success-ranking__meta";
    meta.textContent = `${course.passCount}/${course.total} passed · ${course.sections} sections`;

    const badge = document.createElement("span");
    badge.className = `student-success-ranking__value ${toneClass}`;
    badge.textContent = formatPercent(course.passRate, 1);

    content.appendChild(courseName);
    content.appendChild(meta);
    row.appendChild(content);
    row.appendChild(badge);
    list.appendChild(row);
  });

  block.appendChild(list);
  return block;
}

function createCourseDistributionBarChartContent(course) {
  const wrapper = document.createElement("div");
  wrapper.className = "insight-bar-chart";

  const summary = document.createElement("div");
  summary.className = "insight-bar-chart__summary";
  summary.innerHTML = `
    <p class="insight-bar-chart__eyebrow">Course Snapshot</p>
    <p class="insight-bar-chart__headline">${formatPercent(course.passRate, 1)} pass rate</p>
    <p class="insight-bar-chart__meta">${course.passCount}/${course.total} passed · ${course.sections} sections</p>
  `;
  wrapper.appendChild(summary);

  const colors = {
    A: "#3f7a53",
    B: "#4d8b8f",
    C: "#5976b6",
    D: "#c59643",
    F: "#b45a54",
    W: "#81889a",
  };

  const rows = document.createElement("div");
  rows.className = "insight-bar-chart__rows";

  ["A", "B", "C", "D", "F", "W"].forEach((grade) => {
    const count = course[grade];
    const row = document.createElement("div");
    row.className = "insight-bar-chart__row";

    const label = document.createElement("p");
    label.className = "insight-bar-chart__label";
    label.textContent = grade;

    const track = document.createElement("div");
    track.className = "insight-bar-chart__track";

    const fill = document.createElement("div");
    fill.className = "insight-bar-chart__fill";
    fill.style.width = course.total > 0 ? `${(count / course.total) * 100}%` : "0%";
    fill.style.background = colors[grade];
    track.appendChild(fill);

    const value = document.createElement("p");
    value.className = "insight-bar-chart__value";
    value.textContent = `${count} · ${formatPercent(course.total > 0 ? count / course.total : 0, 1)}`;

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    rows.appendChild(row);
  });

  wrapper.appendChild(rows);
  return wrapper;
}

function createStudentSuccessCoursePanel(courses) {
  const sortedCourses = [...courses].sort((left, right) => {
    if (right.passRate !== left.passRate) return right.passRate - left.passRate;
    if (right.total !== left.total) return right.total - left.total;
    return left.course.localeCompare(right.course);
  });
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(sortedCourses.length / pageSize));
  let pageIndex = 0;

  const panel = createStudentSuccessPanel(
    "Course Pass-Rate Comparison",
    "All included courses ranked by aggregated pass rate. Use the pagination controls to browse the full list, then open any course for its grade breakdown.",
  );
  panel.classList.add("student-success-panel--wide");

  const grid = document.createElement("div");
  grid.className = "student-success-course-grid";
  panel.appendChild(grid);

  const pagination = document.createElement("div");
  pagination.className = "student-success-course-pagination";

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "student-success-course-pagination__button";
  previousButton.textContent = "Previous";
  previousButton.addEventListener("click", () => {
    if (pageIndex === 0) return;
    pageIndex -= 1;
    renderPage();
  });

  const status = document.createElement("p");
  status.className = "student-success-course-pagination__status";

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "student-success-course-pagination__button";
  nextButton.textContent = "Next";
  nextButton.addEventListener("click", () => {
    if (pageIndex >= totalPages - 1) return;
    pageIndex += 1;
    renderPage();
  });

  const summary = document.createElement("p");
  summary.className = "student-success-course-pagination__summary";

  pagination.appendChild(previousButton);
  pagination.appendChild(status);
  pagination.appendChild(nextButton);
  pagination.appendChild(summary);
  panel.appendChild(pagination);

  function renderPage() {
    const start = pageIndex * pageSize;
    const pageCourses = sortedCourses.slice(start, start + pageSize);

    grid.innerHTML = "";

    pageCourses.forEach((course) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "student-success-course-card";
      card.addEventListener("click", () => {
        showInsightModal(course.course, createCourseDistributionBarChartContent(course));
      });

      const title = document.createElement("p");
      title.className = "student-success-course-card__title";
      title.textContent = course.course;

      const meta = document.createElement("p");
      meta.className = "student-success-course-card__meta";
      meta.textContent = `${course.passCount}/${course.total} passed · ${course.sections} sections`;

      const footer = document.createElement("div");
      footer.className = "student-success-course-card__footer";

      const badge = document.createElement("span");
      badge.className = "student-success-course-card__value";
      badge.textContent = formatPercent(course.passRate, 1);

      const action = document.createElement("span");
      action.className = "student-success-course-card__action";
      action.textContent = "View breakdown";

      footer.appendChild(badge);
      footer.appendChild(action);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(footer);
      grid.appendChild(card);
    });

    status.textContent = `Page ${pageIndex + 1} of ${totalPages}`;
    summary.textContent = `Showing ${start + 1}-${start + pageCourses.length} of ${sortedCourses.length} courses · sorted by pass rate`;
    previousButton.disabled = pageIndex === 0;
    nextButton.disabled = pageIndex >= totalPages - 1;
  }

  renderPage();
  return panel;
}

function createStudentSuccessDistributionPanel(distribution, totalStudents) {
  const panel = createStudentSuccessPanel(
    "Overall Grade Distribution",
    "Grouped grade totals from all included course sections.",
  );
  panel.classList.add("student-success-panel--wide");

  const colors = {
    A: "#3f7a53",
    B: "#4d8b8f",
    C: "#5976b6",
    D: "#c59643",
    F: "#b45a54",
    W: "#81889a",
  };
  const entries = Object.entries(distribution).map(([grade, count]) => ({
    label: grade,
    count,
    color: colors[grade],
  }));

  panel.appendChild(
    createInsightPieChartContent(entries, {
      centerLabel: "Students",
      centerValue: totalStudents,
    }),
  );
  return panel;
}

function renderStudentSuccessDashboard() {
  const root = document.getElementById("student-success-dashboard");
  const source = document.getElementById("student-success-dashboard-source");
  if (!root) return;

  const data = window.STUDENT_SUCCESS_DATA;
  if (!data) {
    root.innerHTML = '<p class="table-error">Student success dashboard data could not be loaded.</p>';
    if (source) source.textContent = "";
    return;
  }

  root.innerHTML = "";

  const summaryGrid = document.createElement("div");
  summaryGrid.className = "student-success-summary";
  summaryGrid.appendChild(
    createStudentSuccessMetric(
      "Overall Pass Rate",
      formatPercent(data.summary.passRate, 1),
      `${data.summary.passCount}/${data.summary.totalStudents} students passed (A-C)`,
    ),
  );
  summaryGrid.appendChild(
    createStudentSuccessMetric(
      "Students Represented",
      String(data.summary.totalStudents),
      `${data.summary.withdrawals} withdrawals recorded across all sections`,
    ),
  );
  summaryGrid.appendChild(
    createStudentSuccessMetric(
      "Course Sections",
      String(data.summary.sections),
      "Sections taught between Fall 2021 and Spring 2025",
    ),
  );
  summaryGrid.appendChild(
    createStudentSuccessMetric(
      "Distinct Courses",
      String(data.summary.uniqueCourses),
      "Unique Courses taught between Fall 2021 and Spring 2025",
    ),
  );
  root.appendChild(summaryGrid);

  const panels = document.createElement("div");
  panels.className = "student-success-panels";
  panels.appendChild(
    createStudentSuccessDistributionPanel(data.distribution, data.summary.totalStudents),
  );
  panels.appendChild(createStudentSuccessCoursePanel(data.courses));
  root.appendChild(panels);

  if (source) {
    source.textContent = `Source: ${data.source.workbook} · ${data.source.sheet} sheet · ${data.source.generatedFromRows} course-semester rows. ${data.source.notes}`;
  }
}

const SURVEY_FAMILY_CONFIG = {
  courseDesign: {
    title: "Course Design and Overall Experience",
    description:
      "Agreement-based summary of instructional materials, lecture clarity, course alignment, and overall course quality.",
    primaryLabel: "Positive",
    labelMap: { positive: "Positive", neutral: "Neutral", negative: "Negative" },
  },
  learningOutcomes: {
    title: "Confidence in Learning Outcomes",
    description: "Student confidence in course-specific learning outcomes and applied understanding.",
    primaryLabel: "Positive",
    labelMap: { positive: "Positive", neutral: "Neutral", negative: "Negative" },
  },
  performanceConfidence: {
    title: "Performance Confidence",
    description: "Self-reported confidence in overall performance in each course.",
    primaryLabel: "Confident",
    labelMap: { positive: "Confident", neutral: "Mixed / Neutral", negative: "Unconfident" },
  },
  workloadHours: {
    title: "Workload",
    description: "Reported hours spent per week on the course.",
  },
  pace: {
    title: "Pace",
    description: "Pace ratings, with About Right emphasized.",
    primaryLabel: "About Right",
    labelMap: { positive: "About Right", negative: "Too Fast / Slow" },
  },
  difficulty: {
    title: "Difficulty",
    description: "Difficulty ratings, with About Right emphasized.",
    primaryLabel: "About Right",
    labelMap: { positive: "About Right", neutral: "A Little Off", negative: "Too Hard" },
  },
};

const SURVEY_NORMALIZED_COLORS = {
  positive: "#3f7a53",
  neutral: "#7c879c",
  negative: "#b45a54",
};

const SURVEY_RESPONSE_COLORS = {
  Agree: "#3f7a53",
  "Agree Slightly": "#66a579",
  "Neither Agree nor Disagree": "#8a94a8",
  Neutral: "#9ca5b7",
  "Disagree Slightly": "#d29b51",
  Disagree: "#b45a54",
  "Very confident": "#3f7a53",
  "Somewhat confident": "#66a579",
  "Neither confident nor unconfident": "#8a94a8",
  "Somewhat unconfident": "#d08968",
  "Very unconfident": "#b45a54",
  "3-5 hours per week": "#7d9fcf",
  "6-8 hours per week": "#5f89c8",
  "9-11 hours per week": "#4b74aa",
  "12-14 hours per week": "#c59643",
  "15-17 hours per week": "#b45a54",
  "About Right": "#3f7a53",
  "A Little Too Fast": "#d08968",
  "A Little Too Slow": "#9a84c5",
  "A Little Too Hard": "#c59643",
  "A Little Too Easy": "#7d9fcf",
  "Too Hard": "#b45a54",
};

function getSurveyResponseEntries(responsePairs = []) {
  const total = responsePairs.reduce((sum, [, count]) => sum + count, 0);
  return responsePairs.map(([label, count]) => ({
    label,
    count,
    share: total > 0 ? count / total : 0,
  }));
}

function getSurveyNormalizedRate(normalized, bucket = "positive") {
  if (!normalized || !normalized.total) return 0;
  return (normalized[bucket] || 0) / normalized.total;
}

function getSurveyResponseColor(label, highlightLabel) {
  if (highlightLabel && label === highlightLabel) return "#3f7a53";
  return SURVEY_RESPONSE_COLORS[label] || "#7c879c";
}

function createSurveyNormalizedSummary(normalized, options = {}) {
  const section = document.createElement("section");
  section.className = "survey-evaluation-normalized";

  const header = document.createElement("div");
  header.className = "survey-evaluation-normalized__header";
  header.innerHTML = `
    <p class="survey-evaluation-normalized__label">${options.primaryLabel || "Positive"}</p>
    <p class="survey-evaluation-normalized__value">${formatPercent(
      getSurveyNormalizedRate(normalized, options.primaryBucket || "positive"),
      1,
    )}</p>
    <p class="survey-evaluation-normalized__meta">${normalized.total} total responses</p>
  `;
  section.appendChild(header);

  const rail = document.createElement("div");
  rail.className = "survey-evaluation-normalized__rail";

  ["positive", "neutral", "negative"].forEach((bucket) => {
    if (!(bucket in normalized)) return;
    const segment = document.createElement("span");
    segment.className = `survey-evaluation-normalized__segment is-${bucket}`;
    segment.style.width = normalized.total > 0 ? `${(normalized[bucket] / normalized.total) * 100}%` : "0%";
    rail.appendChild(segment);
  });

  section.appendChild(rail);

  const legend = document.createElement("div");
  legend.className = "survey-evaluation-normalized__legend";

  ["positive", "neutral", "negative"].forEach((bucket) => {
    if (!(bucket in normalized)) return;
    const item = document.createElement("div");
    item.className = "survey-evaluation-normalized__legend-item";
    item.innerHTML = `
      <span class="survey-evaluation-normalized__swatch is-${bucket}"></span>
      <span class="survey-evaluation-normalized__legend-label">${
        options.labelMap?.[bucket] || bucket
      }</span>
      <span class="survey-evaluation-normalized__legend-value">${normalized[bucket]} · ${formatPercent(
        getSurveyNormalizedRate(normalized, bucket),
        1,
      )}</span>
    `;
    legend.appendChild(item);
  });

  section.appendChild(legend);
  return section;
}

function createSurveyResponseDistribution(family) {
  const section = document.createElement("section");
  section.className = "survey-evaluation-responses";

  const header = document.createElement("div");
  header.className = "survey-evaluation-responses__header";
  header.innerHTML = `
    <p class="survey-evaluation-responses__title">Response Distribution</p>
    <p class="survey-evaluation-responses__meta">${family.totalResponses} total responses</p>
  `;
  section.appendChild(header);

  getSurveyResponseEntries(family.responses).forEach((entry) => {
    const row = document.createElement("div");
    row.className = "survey-evaluation-response";

    const labels = document.createElement("div");
    labels.className = "survey-evaluation-response__labels";
    labels.innerHTML = `
      <p class="survey-evaluation-response__label">${entry.label}</p>
      <p class="survey-evaluation-response__value">${entry.count} · ${formatPercent(entry.share, 1)}</p>
    `;

    const track = document.createElement("div");
    track.className = "survey-evaluation-response__track";

    const fill = document.createElement("div");
    fill.className = "survey-evaluation-response__fill";
    fill.style.width = `${entry.share * 100}%`;
    fill.style.background = getSurveyResponseColor(entry.label, family.highlightLabel);
    track.appendChild(fill);

    row.appendChild(labels);
    row.appendChild(track);
    section.appendChild(row);
  });

  return section;
}

function createSurveyEvaluationFamilyBody(familyKey, family) {
  const body = document.createElement("div");
  body.className = "survey-evaluation-panel__body";
  const config = SURVEY_FAMILY_CONFIG[familyKey] || {};

  if (family.normalized) {
    body.appendChild(
      createSurveyNormalizedSummary(family.normalized, {
        primaryLabel: config.primaryLabel || "Positive",
        primaryBucket: "positive",
        labelMap: config.labelMap,
      }),
    );
  }

  body.appendChild(createSurveyResponseDistribution(family));
  return body;
}

function createSurveyEvaluationFamilyPanel(familyKey, family) {
  const config = SURVEY_FAMILY_CONFIG[familyKey] || {};
  const panel = createStudentSuccessPanel(config.title || family.title, config.description || "");
  panel.appendChild(createSurveyEvaluationFamilyBody(familyKey, family));
  return panel;
}

function createSurveyEvaluationCourseDetailContent(course) {
  const wrapper = document.createElement("div");
  wrapper.className = "survey-evaluation-course-modal";

  const summary = document.createElement("div");
  summary.className = "survey-evaluation-course-modal__summary";
  summary.appendChild(
    createStudentSuccessMetric(
      "Respondents",
      String(course.respondentCount),
      `${course.mergedRows} merged aggregate rows`,
    ),
  );
  summary.appendChild(
    createStudentSuccessMetric(
      "Course Design",
      formatPercent(course.courseDesignPositiveRate, 1),
      "Positive course-design responses",
    ),
  );
  summary.appendChild(
    createStudentSuccessMetric(
      "Learning Outcomes",
      formatPercent(course.learningOutcomesPositiveRate, 1),
      "Positive learning-outcomes responses",
    ),
  );
  wrapper.appendChild(summary);

  const sections = document.createElement("div");
  sections.className = "survey-evaluation-course-modal__sections";

  [
    "courseDesign",
    "learningOutcomes",
    "performanceConfidence",
    "workloadHours",
    "pace",
    "difficulty",
  ].forEach((familyKey) => {
    const family = course.families[familyKey];
    if (!family) return;

    const card = document.createElement("article");
    card.className = "survey-evaluation-course-modal__family";

    const title = document.createElement("h4");
    title.className = "survey-evaluation-course-modal__family-title";
    title.textContent = SURVEY_FAMILY_CONFIG[familyKey]?.title || family.title;

    const meta = document.createElement("p");
    meta.className = "survey-evaluation-course-modal__family-meta";
    meta.textContent = `${family.totalResponses} responses`;

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(createSurveyEvaluationFamilyBody(familyKey, family));
    sections.appendChild(card);
  });

  wrapper.appendChild(sections);
  return wrapper;
}

function createSurveyEvaluationCoursePanel(courses) {
  const sortedCourses = [...courses].sort((left, right) => {
    if (right.courseDesignPositiveRate !== left.courseDesignPositiveRate) {
      return right.courseDesignPositiveRate - left.courseDesignPositiveRate;
    }
    if (right.learningOutcomesPositiveRate !== left.learningOutcomesPositiveRate) {
      return right.learningOutcomesPositiveRate - left.learningOutcomesPositiveRate;
    }
    return left.name.localeCompare(right.name);
  });
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(sortedCourses.length / pageSize));
  let pageIndex = 0;

  const panel = createStudentSuccessPanel(
    "Course Comparison",
    "Courses are ranked by positive ratings in Course Design and Overall Experience. Open any course for detailed survey distributions.",
  );
  panel.classList.add("student-success-panel--wide");

  const grid = document.createElement("div");
  grid.className = "survey-evaluation-course-grid";
  panel.appendChild(grid);

  const pagination = document.createElement("div");
  pagination.className = "student-success-course-pagination";

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "student-success-course-pagination__button";
  previousButton.textContent = "Previous";
  previousButton.addEventListener("click", () => {
    if (pageIndex === 0) return;
    pageIndex -= 1;
    renderPage();
  });

  const status = document.createElement("p");
  status.className = "student-success-course-pagination__status";

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "student-success-course-pagination__button";
  nextButton.textContent = "Next";
  nextButton.addEventListener("click", () => {
    if (pageIndex >= totalPages - 1) return;
    pageIndex += 1;
    renderPage();
  });

  const summary = document.createElement("p");
  summary.className = "student-success-course-pagination__summary";

  pagination.appendChild(previousButton);
  pagination.appendChild(status);
  pagination.appendChild(nextButton);
  pagination.appendChild(summary);
  panel.appendChild(pagination);

  function renderPage() {
    const start = pageIndex * pageSize;
    const pageCourses = sortedCourses.slice(start, start + pageSize);

    grid.innerHTML = "";

    pageCourses.forEach((course) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "survey-evaluation-course-card";
      card.addEventListener("click", () => {
        showInsightModal(course.name, createSurveyEvaluationCourseDetailContent(course));
      });

      const title = document.createElement("p");
      title.className = "survey-evaluation-course-card__title";
      title.textContent = course.name;

      const meta = document.createElement("p");
      meta.className = "survey-evaluation-course-card__meta";
      meta.textContent = `${course.respondentCount} respondents · ${course.mergedRows} merged rows`;

      const metrics = document.createElement("div");
      metrics.className = "survey-evaluation-course-card__metrics";
      metrics.innerHTML = `
        <span class="survey-evaluation-course-card__metric">
          <span class="survey-evaluation-course-card__metric-label">Course Design</span>
          <span class="survey-evaluation-course-card__metric-value">${formatPercent(
            course.courseDesignPositiveRate,
            1,
          )}</span>
        </span>
        <span class="survey-evaluation-course-card__metric">
          <span class="survey-evaluation-course-card__metric-label">Learning Outcomes</span>
          <span class="survey-evaluation-course-card__metric-value">${formatPercent(
            course.learningOutcomesPositiveRate,
            1,
          )}</span>
        </span>
      `;

      const action = document.createElement("p");
      action.className = "survey-evaluation-course-card__action";
      action.textContent = "Open survey detail";

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(metrics);
      card.appendChild(action);
      grid.appendChild(card);
    });

    status.textContent = `Page ${pageIndex + 1} of ${totalPages}`;
    summary.textContent = `Showing ${start + 1}-${start + pageCourses.length} of ${sortedCourses.length} courses`;
    previousButton.disabled = pageIndex === 0;
    nextButton.disabled = pageIndex >= totalPages - 1;
  }

  renderPage();
  return panel;
}

function renderSurveyEvaluationDashboard() {
  const root = document.getElementById("survey-evaluation-dashboard");
  const source = document.getElementById("survey-evaluation-dashboard-source");
  if (!root) return;

  const data = window.SURVEY_EVALUATION_DATA;
  if (!data) {
    root.innerHTML = '<p class="table-error">Student evaluation dashboard data could not be loaded.</p>';
    if (source) source.textContent = "";
    return;
  }

  root.innerHTML = "";

  const summaryGrid = document.createElement("div");
  summaryGrid.className = "student-success-summary";
  summaryGrid.appendChild(
    createStudentSuccessMetric(
      "Courses Represented",
      String(data.summary.courseCount),
      `${data.summary.mergedRows} total responses`,
    ),
  );
  summaryGrid.appendChild(
    createStudentSuccessMetric(
      "Inferred Respondents",
      String(data.summary.inferredRespondents),
      "Derived from per-course question totals",
    ),
  );
  summaryGrid.appendChild(
    createStudentSuccessMetric(
      "Course Design Positive",
      formatPercent(data.summary.courseDesignPositiveRate, 1),
      `${data.families.courseDesign.normalized.positive} of ${data.families.courseDesign.normalized.total} responses`,
    ),
  );
  summaryGrid.appendChild(
    createStudentSuccessMetric(
      "Learning Outcomes Positive",
      formatPercent(data.summary.learningOutcomesPositiveRate, 1),
      `${data.families.learningOutcomes.normalized.positive} of ${data.families.learningOutcomes.normalized.total} responses`,
    ),
  );
  root.appendChild(summaryGrid);

  const panels = document.createElement("div");
  panels.className = "student-success-panels survey-evaluation-panels";
  panels.appendChild(createSurveyEvaluationFamilyPanel("courseDesign", data.families.courseDesign));
  panels.appendChild(
    createSurveyEvaluationFamilyPanel("learningOutcomes", data.families.learningOutcomes),
  );
  panels.appendChild(
    createSurveyEvaluationFamilyPanel(
      "performanceConfidence",
      data.families.performanceConfidence,
    ),
  );
  panels.appendChild(createSurveyEvaluationFamilyPanel("workloadHours", data.families.workloadHours));
  panels.appendChild(createSurveyEvaluationFamilyPanel("pace", data.families.pace));
  panels.appendChild(createSurveyEvaluationFamilyPanel("difficulty", data.families.difficulty));
  panels.appendChild(createSurveyEvaluationCoursePanel(data.courses));
  root.appendChild(panels);

  if (source) {
    source.textContent = `Source: ${data.source.workbook} · ${data.source.sheet} sheet · ${data.source.generatedFromRows} merged rows · ${data.source.uniqueQuestionTexts} unique question texts. ${data.source.notes}`;
  }
}

const OBSERVATION_TONE_CONFIG = {
  strength: { label: "Strength", color: "#3f7a53" },
  context: { label: "Context", color: "#7c879c" },
  growth: { label: "Growth", color: "#c59643" },
};

function getObservationToneEntries(toneCounts) {
  return ["strength", "context", "growth"].map((toneKey) => ({
    key: toneKey,
    label: OBSERVATION_TONE_CONFIG[toneKey].label,
    color: OBSERVATION_TONE_CONFIG[toneKey].color,
    count: toneCounts[toneKey] || 0,
  }));
}

function createObservationToneRail(toneCounts, extraClass = "") {
  const rail = document.createElement("div");
  rail.className = `observation-tone-rail ${extraClass}`.trim();
  const total = toneCounts.total || 0;

  getObservationToneEntries(toneCounts).forEach((entry) => {
    const segment = document.createElement("span");
    segment.className = `observation-tone-rail__segment is-${entry.key}`;
    segment.style.width = total > 0 ? `${(entry.count / total) * 100}%` : "0%";
    rail.appendChild(segment);
  });

  return rail;
}

function createObservationToneSummary(toneCounts, options = {}) {
  const section = document.createElement("section");
  section.className = "observation-tone-summary";
  const total = toneCounts.total || 0;

  if (options.title || options.meta) {
    const header = document.createElement("div");
    header.className = "observation-tone-summary__header";

    if (options.title) {
      const title = document.createElement("h4");
      title.className = "observation-tone-summary__title";
      title.textContent = options.title;
      header.appendChild(title);
    }

    if (options.meta) {
      const meta = document.createElement("p");
      meta.className = "observation-tone-summary__meta";
      meta.textContent = options.meta;
      header.appendChild(meta);
    }

    section.appendChild(header);
  }

  section.appendChild(createObservationToneRail(toneCounts));

  const legend = document.createElement("div");
  legend.className = "observation-tone-summary__legend";

  getObservationToneEntries(toneCounts).forEach((entry) => {
    const item = document.createElement("div");
    item.className = "observation-tone-summary__item";
    const percent = total > 0 ? entry.count / total : 0;
    item.innerHTML = `
      <span class="observation-tone-summary__swatch is-${entry.key}"></span>
      <span class="observation-tone-summary__label">${entry.label}</span>
      <span class="observation-tone-summary__value">${entry.count} · ${formatPercent(percent, 1)}</span>
    `;
    legend.appendChild(item);
  });

  section.appendChild(legend);
  return section;
}

function createObservationCountList(title, counts) {
  const section = document.createElement("section");
  section.className = "observation-coverage__section";

  const heading = document.createElement("h6");
  heading.className = "observation-coverage__title";
  heading.textContent = title;
  section.appendChild(heading);

  const list = document.createElement("div");
  list.className = "insight-list";

  Object.entries(counts).forEach(([label, count]) => {
    const row = document.createElement("div");
    row.className = "insight-list__row";
    row.innerHTML = `
      <span class="insight-list__label">${label}</span>
      <span class="insight-list__value">${count}</span>
    `;
    list.appendChild(row);
  });

  section.appendChild(list);
  return section;
}

function createObservationToneMixPanel(data) {
  const panel = createStudentSuccessPanel(
    "Observation Tone Mix",
    `${formatDisplayDate(data.summary.dateStart)} to ${formatDisplayDate(data.summary.dateEnd)} · ${data.summary.observerCount} observers`,
  );
  panel.classList.add("student-success-panel--wide");

  panel.appendChild(
    createInsightPieChartContent(
      getObservationToneEntries(data.toneDistribution).map((entry) => ({
        label: entry.label,
        count: entry.count,
        color: entry.color,
      })),
      {
        centerLabel: "Evidence Rows",
        centerValue: data.toneDistribution.total,
      },
    ),
  );

  return panel;
}

function createObservationCoveragePanel(data) {
  const panel = createStudentSuccessPanel(
    "Coverage Snapshot",
    `${data.summary.observationCount} observations across ${data.summary.courseCount} courses.`,
  );

  const body = document.createElement("div");
  body.className = "observation-coverage";
  body.appendChild(createObservationCountList("Observers", data.coverage.observers));
  body.appendChild(createObservationCountList("Modalities", data.coverage.modalities));

  panel.appendChild(body);
  return panel;
}

function createObservationDetailCard(label, value, detail) {
  const card = document.createElement("article");
  card.className = "student-success-card observation-detail-card";
  card.innerHTML = `
    <p class="student-success-card__eyebrow">${label}</p>
    <p class="observation-detail-card__value">${value}</p>
    <p class="student-success-card__meta">${detail}</p>
  `;
  return card;
}

function createObservationCriteriaCountList(criteriaCounts) {
  const list = document.createElement("div");
  list.className = "observation-criteria-counts";

  Object.entries(criteriaCounts)
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1];
      return left[0].localeCompare(right[0]);
    })
    .forEach(([criterion, count]) => {
      const row = document.createElement("div");
      row.className = "observation-criteria-counts__row";
      row.innerHTML = `
        <span class="observation-criteria-counts__label">${criterion}</span>
        <span class="observation-criteria-counts__value">${count}</span>
      `;
      list.appendChild(row);
    });

  return list;
}

function createObservationEvidenceList(evidenceRows) {
  const list = document.createElement("div");
  list.className = "observation-evidence-list";

  evidenceRows.forEach((item) => {
    const article = document.createElement("article");
    article.className = "observation-evidence-item";
    article.innerHTML = `
      <div class="observation-evidence-item__header">
        <div>
          <p class="observation-evidence-item__criterion">${item.criterion}</p>
          <p class="observation-evidence-item__raw">${item.rawCriterion}</p>
        </div>
        <span class="observation-tone-badge is-${item.tone}">${OBSERVATION_TONE_CONFIG[item.tone]?.label || item.tone}</span>
      </div>
      <p class="observation-evidence-item__comment">${item.comment}</p>
    `;
    list.appendChild(article);
  });

  return list;
}

function createObservationEvidencePanelContent(evidenceRows) {
  const pageSize = 2;
  const totalPages = Math.max(1, Math.ceil(evidenceRows.length / pageSize));
  let pageIndex = 0;

  const wrapper = document.createElement("div");
  wrapper.className = "observation-evidence-panel";

  const list = document.createElement("div");
  wrapper.appendChild(list);

  const pagination = document.createElement("div");
  pagination.className = "student-success-course-pagination";

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "student-success-course-pagination__button";
  previousButton.textContent = "Previous";
  previousButton.addEventListener("click", () => {
    if (pageIndex === 0) return;
    pageIndex -= 1;
    renderPage();
  });

  const status = document.createElement("p");
  status.className = "student-success-course-pagination__status";

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "student-success-course-pagination__button";
  nextButton.textContent = "Next";
  nextButton.addEventListener("click", () => {
    if (pageIndex >= totalPages - 1) return;
    pageIndex += 1;
    renderPage();
  });

  const summary = document.createElement("p");
  summary.className = "student-success-course-pagination__summary";

  pagination.appendChild(previousButton);
  pagination.appendChild(status);
  pagination.appendChild(nextButton);
  pagination.appendChild(summary);
  wrapper.appendChild(pagination);

  function renderPage() {
    const start = pageIndex * pageSize;
    const pageEvidence = evidenceRows.slice(start, start + pageSize);
    list.innerHTML = "";
    list.appendChild(createObservationEvidenceList(pageEvidence));

    status.textContent = `Page ${pageIndex + 1} of ${totalPages}`;
    summary.textContent = `Showing ${start + 1}-${start + pageEvidence.length} of ${evidenceRows.length} comments`;
    previousButton.disabled = pageIndex === 0;
    nextButton.disabled = pageIndex >= totalPages - 1;
  }

  renderPage();

  if (evidenceRows.length <= pageSize) {
    pagination.hidden = true;
  }

  return wrapper;
}

function openObservationDetailModal(observation) {
  showInsightModal(
    observation.course,
    createObservationDetailContent(observation),
    { cardClass: "insight-modal__card--observation-detail" },
  );
}

function createObservationDetailContent(observation) {
  const wrapper = document.createElement("div");
  wrapper.className = "observation-detail-modal";

  const summary = document.createElement("div");
  summary.className = "observation-detail-modal__summary";
  summary.appendChild(
    createObservationDetailCard(
      "Date",
      formatDisplayDate(observation.date),
      `${observation.evidenceRows} evidence rows`,
    ),
  );
  summary.appendChild(
    createObservationDetailCard(
      "Course",
      observation.course,
      observation.lessonModule || "Classroom observation entry",
    ),
  );
  summary.appendChild(
    createObservationDetailCard("Observer", observation.observer, observation.sourceFile),
  );
  wrapper.appendChild(summary);

  const sections = document.createElement("div");
  sections.className = "observation-detail-modal__sections";

  const criteriaPanel = createStudentSuccessPanel(
    "Criteria Breakdown",
    "Criteria represented in this observation, sorted by evidence count.",
  );
  criteriaPanel.appendChild(createObservationCriteriaCountList(observation.criteriaCounts));
  sections.appendChild(criteriaPanel);

  const evidencePanel = createStudentSuccessPanel(
    "Evidence Comments",
    "Merged classroom-observation comments for this observation entry.",
  );
  evidencePanel.classList.add("observation-detail-modal__evidence-panel");
  evidencePanel.appendChild(createObservationEvidencePanelContent(observation.evidence));
  sections.appendChild(evidencePanel);

  wrapper.appendChild(sections);
  return wrapper;
}

function createObservationCriterionRelatedList(criterion, observations) {
  const list = document.createElement("div");
  list.className = "observation-related-list";

  observations
    .filter((observation) =>
      Object.prototype.hasOwnProperty.call(observation.criteriaCounts, criterion.criterion),
    )
    .forEach((observation) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "observation-related-list__item";
      item.addEventListener("click", () => {
        openObservationDetailModal(observation);
      });
      item.innerHTML = `
        <span class="observation-related-list__title">${observation.course}</span>
        <span class="observation-related-list__meta">${formatDisplayDate(observation.date)} · ${observation.observer} · ${observation.modality}</span>
      `;
      list.appendChild(item);
    });

  return list;
}

function createObservationCriterionDetailContent(criterion, observations) {
  const wrapper = document.createElement("div");
  wrapper.className = "observation-criterion-modal";

  const summary = document.createElement("div");
  summary.className = "observation-detail-modal__summary";
  summary.appendChild(
    createObservationDetailCard(
      "Evidence Rows",
      String(criterion.evidenceRows),
      `${criterion.observationCount} related observations`,
    ),
  );
  summary.appendChild(
    createObservationDetailCard(
      "Strength Share",
      formatPercent(criterion.evidenceRows > 0 ? criterion.strengthRows / criterion.evidenceRows : 0, 1),
      `${criterion.strengthRows} of ${criterion.evidenceRows} evidence rows`,
    ),
  );
  summary.appendChild(
    createObservationDetailCard(
      "Context",
      String(criterion.contextRows),
      "Context and neutral observations",
    ),
  );
  summary.appendChild(
    createObservationDetailCard(
      "Growth",
      String(criterion.growthRows),
      "Recommendations and improvement notes",
    ),
  );
  wrapper.appendChild(summary);

  wrapper.appendChild(
    createObservationToneSummary(
      {
        strength: criterion.strengthRows,
        context: criterion.contextRows,
        growth: criterion.growthRows,
        total: criterion.evidenceRows,
      },
      {
        title: "Tone Breakdown",
        meta: `${criterion.observationCount} observations contribute to this criterion.`,
      },
    ),
  );

  const quote = document.createElement("section");
  quote.className = "observation-quote";
  quote.innerHTML = `
    <p class="observation-quote__label">Representative Evidence</p>
    <blockquote class="observation-quote__body">${criterion.representativeEvidence}</blockquote>
  `;
  wrapper.appendChild(quote);

  const relatedSection = document.createElement("section");
  relatedSection.className = "observation-related";

  const heading = document.createElement("h4");
  heading.className = "observation-related__title";
  heading.textContent = "Related Observations";
  relatedSection.appendChild(heading);
  relatedSection.appendChild(createObservationCriterionRelatedList(criterion, observations));
  wrapper.appendChild(relatedSection);

  return wrapper;
}

function createObservationCriteriaPanel(criteria, observations) {
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(criteria.length / pageSize));
  let pageIndex = 0;

  const panel = createStudentSuccessPanel(
    "Portfolio Criteria Coverage",
    "Criteria counts come from the merged criteria summary; open any row for representative evidence and linked observations.",
  );
  panel.classList.add("student-success-panel--wide");

  const list = document.createElement("div");
  list.className = "observation-criteria-list";
  panel.appendChild(list);

  const pagination = document.createElement("div");
  pagination.className = "student-success-course-pagination";

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "student-success-course-pagination__button";
  previousButton.textContent = "Previous";
  previousButton.addEventListener("click", () => {
    if (pageIndex === 0) return;
    pageIndex -= 1;
    renderPage();
  });

  const status = document.createElement("p");
  status.className = "student-success-course-pagination__status";

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "student-success-course-pagination__button";
  nextButton.textContent = "Next";
  nextButton.addEventListener("click", () => {
    if (pageIndex >= totalPages - 1) return;
    pageIndex += 1;
    renderPage();
  });

  const summary = document.createElement("p");
  summary.className = "student-success-course-pagination__summary";

  pagination.appendChild(previousButton);
  pagination.appendChild(status);
  pagination.appendChild(nextButton);
  pagination.appendChild(summary);
  panel.appendChild(pagination);

  function renderPage() {
    const start = pageIndex * pageSize;
    const pageCriteria = criteria.slice(start, start + pageSize);

    list.innerHTML = "";

    pageCriteria.forEach((criterion) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "observation-criteria-row";
    row.addEventListener("click", () => {
      showInsightModal(
        criterion.criterion,
        createObservationCriterionDetailContent(criterion, observations),
        { cardClass: "insight-modal__card--observation-criterion" },
      );
    });

      const details = document.createElement("div");
      details.className = "observation-criteria-row__details";
      details.innerHTML = `
        <p class="observation-criteria-row__title">${criterion.criterion}</p>
        <p class="observation-criteria-row__meta">${criterion.observationCount} observations · ${criterion.evidenceRows} evidence rows</p>
      `;

      const railWrap = document.createElement("div");
      railWrap.className = "observation-criteria-row__rail";
      railWrap.appendChild(
        createObservationToneRail(
          {
            strength: criterion.strengthRows,
            context: criterion.contextRows,
            growth: criterion.growthRows,
            total: criterion.evidenceRows,
          },
          "observation-tone-rail--compact",
        ),
      );

      const value = document.createElement("span");
      value.className = "observation-criteria-row__value";
      value.textContent = `${criterion.evidenceRows} rows`;

      row.appendChild(details);
      row.appendChild(railWrap);
      row.appendChild(value);
      list.appendChild(row);
    });

    status.textContent = `Page ${pageIndex + 1} of ${totalPages}`;
    summary.textContent = `Showing ${start + 1}-${start + pageCriteria.length} of ${criteria.length} criteria`;
    previousButton.disabled = pageIndex === 0;
    nextButton.disabled = pageIndex >= totalPages - 1;
  }

  renderPage();

  if (criteria.length <= pageSize) {
    pagination.hidden = true;
  }

  return panel;
}

function createObservationArchivePanel(observations) {
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(observations.length / pageSize));
  let pageIndex = 0;

  const panel = createStudentSuccessPanel(
    "Observation Archive",
    "Observation entries are ordered newest first. Open any card for full evidence comments and criterion coverage.",
  );
  panel.classList.add("student-success-panel--wide");

  const grid = document.createElement("div");
  grid.className = "observation-card-grid";
  panel.appendChild(grid);

  const pagination = document.createElement("div");
  pagination.className = "student-success-course-pagination";

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "student-success-course-pagination__button";
  previousButton.textContent = "Previous";
  previousButton.addEventListener("click", () => {
    if (pageIndex === 0) return;
    pageIndex -= 1;
    renderPage();
  });

  const status = document.createElement("p");
  status.className = "student-success-course-pagination__status";

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "student-success-course-pagination__button";
  nextButton.textContent = "Next";
  nextButton.addEventListener("click", () => {
    if (pageIndex >= totalPages - 1) return;
    pageIndex += 1;
    renderPage();
  });

  const summary = document.createElement("p");
  summary.className = "student-success-course-pagination__summary";

  pagination.appendChild(previousButton);
  pagination.appendChild(status);
  pagination.appendChild(nextButton);
  pagination.appendChild(summary);
  panel.appendChild(pagination);

  function renderPage() {
    const start = pageIndex * pageSize;
    const pageObservations = observations.slice(start, start + pageSize);

    grid.innerHTML = "";

    pageObservations.forEach((observation) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "observation-card";
      card.addEventListener("click", () => {
        openObservationDetailModal(observation);
      });

      const title = document.createElement("p");
      title.className = "observation-card__title";
      title.textContent = observation.course;

      const meta = document.createElement("p");
      meta.className = "observation-card__meta";
      meta.textContent = `${formatDisplayDate(observation.date)} · ${observation.observer}`;

      const submeta = document.createElement("p");
      submeta.className = "observation-card__submeta";
      submeta.textContent = `${observation.modality} · ${observation.evidenceRows} evidence rows`;

      const tones = document.createElement("div");
      tones.className = "observation-card__tones";
      getObservationToneEntries(observation.toneCounts).forEach((entry) => {
        const badge = document.createElement("span");
        badge.className = `observation-tone-badge is-${entry.key}`;
        badge.textContent = `${entry.label} ${entry.count}`;
        tones.appendChild(badge);
      });

      const action = document.createElement("p");
      action.className = "observation-card__action";
      action.textContent = "Open observation detail";

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(submeta);
      card.appendChild(tones);
      card.appendChild(action);
      grid.appendChild(card);
    });

    status.textContent = `Page ${pageIndex + 1} of ${totalPages}`;
    summary.textContent = `Showing ${start + 1}-${start + pageObservations.length} of ${observations.length} observations`;
    previousButton.disabled = pageIndex === 0;
    nextButton.disabled = pageIndex >= totalPages - 1;
  }

  renderPage();
  return panel;
}

function renderObservationEvidenceDashboard() {
  const root = document.getElementById("classroom-observations-dashboard");
  if (!root) return;

  const data = window.OBSERVATION_EVIDENCE_DATA;
  if (!data) {
    root.innerHTML =
      '<p class="table-error">Classroom observations dashboard data could not be loaded.</p>';
    return;
  }

  root.innerHTML = "";

  const summaryGrid = document.createElement("div");
  summaryGrid.className = "student-success-summary";
  summaryGrid.appendChild(
    createStudentSuccessMetric(
      "Observations",
      String(data.summary.observationCount),
      `${formatDisplayDate(data.summary.dateStart)} to ${formatDisplayDate(data.summary.dateEnd)}`,
    ),
  );
  summaryGrid.appendChild(
    createStudentSuccessMetric(
      "Evidence Rows",
      String(data.summary.evidenceRows),
      `${data.summary.observerCount} observers across the archive`,
    ),
  );
  summaryGrid.appendChild(
    createStudentSuccessMetric(
      "Courses Observed",
      String(data.summary.courseCount),
      "Distinct courses represented in classroom observations",
    ),
  );
  summaryGrid.appendChild(
    createStudentSuccessMetric(
      "Strength-Oriented Evidence",
      formatPercent(data.summary.strengthRate, 1),
      `${data.toneDistribution.strength} of ${data.toneDistribution.total} evidence rows`,
    ),
  );
  root.appendChild(summaryGrid);

  const panels = document.createElement("div");
  panels.className = "student-success-panels classroom-observations-panels";
  panels.appendChild(createObservationToneMixPanel(data));
  panels.appendChild(createObservationCriteriaPanel(data.criteria, data.observations));
  panels.appendChild(createObservationArchivePanel(data.observations));
  root.appendChild(panels);
}

function createStatActionButton(label, iconPath) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "teaching-stats__action";
  button.setAttribute("aria-label", label);
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="${iconPath}"></path>
    </svg>
  `;
  return button;
}

function ensureInsightModal() {
  let modal = document.getElementById("teaching-insight-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal insight-modal";
  modal.id = "teaching-insight-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-card insight-modal__card" role="document">
      <button class="modal-close" type="button" data-close aria-label="Close">
        &times;
      </button>
      <div class="insight-modal__content"></div>
    </div>
  `;

  modal.querySelectorAll("[data-close]").forEach((closeEl) => {
    closeEl.addEventListener("click", () => {
      closeModal(modal);
    });
  });

  document.body.appendChild(modal);
  return modal;
}

function showInsightModal(title, content, options = {}) {
  const modal = ensureInsightModal();
  const card = modal.querySelector(".insight-modal__card");
  const contentRoot = modal.querySelector(".insight-modal__content");
  if (!contentRoot || !card) return;

  card.className = "modal-card insight-modal__card";

  if (options.cardClass) {
    card.classList.add(options.cardClass);
  }

  contentRoot.innerHTML = "";

  const heading = document.createElement("h3");
  heading.className = "insight-modal__title";
  heading.textContent = title;
  contentRoot.appendChild(heading);
  contentRoot.appendChild(content);

  openModal(modal);
}

function createModalityChartContent(modalityCounts) {
  const entries = Object.entries(modalityCounts).sort((a, b) => b[1] - a[1]);
  const colors = ["#5a6f9e", "#8894ad", "#b7bfcb"];
  return createInsightPieChartContent(
    entries.map(([label, count], index) => ({
      label,
      count,
      color: colors[index % colors.length],
    })),
    {
      centerLabel: "Course Sections",
      centerValue: entries.reduce((sum, [, count]) => sum + count, 0),
    },
  );
}

function createCourseFrequencyContent(courseCounts) {
  const wrapper = document.createElement("div");
  wrapper.className = "insight-list";

  const entries = Object.entries(courseCounts).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  entries.forEach(([course, count]) => {
    const row = document.createElement("div");
    row.className = "insight-list__row";
    row.innerHTML = `
      <span class="insight-list__label">${course}</span>
      <span class="insight-list__value">${count}</span>
    `;
    wrapper.appendChild(row);
  });

  return wrapper;
}

function buildTeachingStatistics() {
  const teachingFieldsets = Array.from(document.querySelectorAll(".teaching-fieldset"));
  const teachingExperienceFieldset = teachingFieldsets.find((fieldset) => {
    const legend = fieldset.querySelector(".teaching-legend");
    return normalizeCellText(legend?.textContent) === "Teaching Experience";
  });

  if (!teachingExperienceFieldset) return;

  const tables = Array.from(teachingExperienceFieldset.querySelectorAll(".teaching-table"));
  const courseTable = tables.find((table) => {
    const headers = Array.from(table.querySelectorAll("thead th")).map((cell) =>
      normalizeCellText(cell.textContent),
    );
    return headers.includes("Modality") && headers.includes("Course Name");
  });
  const labTable = tables.find((table) => table !== courseTable);

  if (!courseTable) return;

  const courseRows = Array.from(courseTable.querySelectorAll("tbody tr"))
    .map((row) => Array.from(row.cells).map((cell) => normalizeCellText(cell.textContent)))
    .filter((cells) => cells.length >= 4 && cells.some(Boolean));

  if (courseRows.length === 0) return;

  teachingExperienceFieldset.querySelector(".teaching-stats")?.remove();

  const modalityCounts = courseRows.reduce((counts, cells) => {
    const modality = cells[3];
    if (!modality) return counts;
    counts[modality] = (counts[modality] || 0) + 1;
    return counts;
  }, {});
  const courseCounts = courseRows.reduce((counts, cells) => {
    const course = cells[2];
    if (!course) return counts;
    counts[course] = (counts[course] || 0) + 1;
    return counts;
  }, {});

  const uniqueCourses = new Set(courseRows.map((cells) => cells[2]).filter(Boolean));
  const years = courseRows
    .map((cells) => Number.parseInt(cells[0], 10))
    .filter((year) => Number.isFinite(year));
  const yearMin = years.length > 0 ? Math.min(...years) : null;
  const yearMax = years.length > 0 ? Math.max(...years) : null;
  const topModalityEntry = Object.entries(modalityCounts).sort((a, b) => b[1] - a[1])[0];
  const labCount = labTable
    ? Array.from(labTable.querySelectorAll("tbody tr")).filter((row) => row.cells.length >= 3).length
    : 0;

  const statsBlock = document.createElement("section");
  statsBlock.className = "teaching-stats";
  statsBlock.setAttribute("aria-label", "Teaching statistics");

  const statsHeading = document.createElement("div");
  statsHeading.className = "teaching-stats__intro";
  statsHeading.innerHTML = `
    <p class="teaching-stats__eyebrow">Teaching Snapshot</p>
    <p class="teaching-stats__summary">
      ${courseRows.length} course sections across ${uniqueCourses.size} distinct courses${
        yearMin && yearMax ? ` from ${yearMin} to ${yearMax}` : ""
      }.
    </p>
  `;
  statsBlock.appendChild(statsHeading);

  const metrics = [
    { label: "Course Sections", value: String(courseRows.length), action: "modality-chart" },
    { label: "Distinct Courses", value: String(uniqueCourses.size), action: "course-frequency" },
    { label: "Years Covered", value: yearMin && yearMax ? `${yearMin}-${yearMax}` : "N/A" },
    { label: "Lab Sections", value: String(labCount) },
  ];

  if (topModalityEntry) {
    metrics.push({
      label: "Most Common Format",
      value: `${topModalityEntry[0]} (${topModalityEntry[1]})`,
    });
  }

  const metricGrid = document.createElement("div");
  metricGrid.className = "teaching-stats__grid";
  metrics.forEach((metric) => {
    const card = document.createElement("article");
    card.className = "teaching-stats__card";

    const header = document.createElement("div");
    header.className = "teaching-stats__card-header";

    const label = document.createElement("p");
    label.className = "teaching-stats__label";
    label.textContent = metric.label;
    header.appendChild(label);

    if (metric.action === "modality-chart") {
      const button = createStatActionButton(
        "Show modality breakdown",
        "M12 2a10 10 0 1 0 10 10V2A10 10 0 0 0 12 2Zm2 2.29v7.3l6.31 3.64A8 8 0 0 0 14 4.3ZM12 22a10 10 0 0 0 9.66-7.42L12 9v13Z",
      );
      button.addEventListener("click", () => {
        showInsightModal("Course Sections by Modality", createModalityChartContent(modalityCounts));
      });
      header.appendChild(button);
    }

    if (metric.action === "course-frequency") {
      const button = createStatActionButton(
        "Show course frequency list",
        "M4 5h16v2H4zm0 6h16v2H4zm0 6h10v2H4z",
      );
      button.addEventListener("click", () => {
        showInsightModal("Distinct Courses and Frequency", createCourseFrequencyContent(courseCounts));
      });
      header.appendChild(button);
    }

    const value = document.createElement("p");
    value.className = "teaching-stats__value";
    value.textContent = metric.value;

    card.appendChild(header);
    card.appendChild(value);
    metricGrid.appendChild(card);
  });
  statsBlock.appendChild(metricGrid);

  const tableRoot = teachingExperienceFieldset.querySelector(".table-render-root");
  if (tableRoot) {
    teachingExperienceFieldset.insertBefore(statsBlock, tableRoot);
    return;
  }

  teachingExperienceFieldset.appendChild(statsBlock);
}

async function initializePage() {
  setupPreviewableImages();
  buildTableOfContents();
  setupTocScrollPosition();
  await renderTableRoots();
  renderStudentSuccessDashboard();
  renderSurveyEvaluationDashboard();
  renderObservationEvidenceDashboard();
  buildTeachingStatistics();
  resize();
  tick();
}

initializePage();
