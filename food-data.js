let FOOD_MENU = [];

async function loadMenu() {
  try {
    const url = `https://raw.githubusercontent.com/geeslane/level3-rooftop/main/content/menu.json?t=${Date.now()}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      FOOD_MENU = data.categories || data;
      return FOOD_MENU;
    }
  } catch (_) {}

  const res = await fetch("content/menu.json");
  if (!res.ok) throw new Error("Menu file not found");
  const data = await res.json();
  FOOD_MENU = data.categories || data;
  return FOOD_MENU;
}

function foodImagePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function renderMenu(container) {
  container.innerHTML = FOOD_MENU.map((category, index) => {
    const sectionId = "menu-" + category.group.toLowerCase().replace(/\s+/g, "-");
    const cards = category.items.map(item => `
      <div class="m-card reveal">
        <img class="m-card-img" src="${foodImagePath(item.image)}" alt="${item.name}">
        <div class="m-card-overlay">
          ${item.badge ? `<div class="m-badge">${item.badge}</div>` : ""}
          <div class="m-group">${category.group}</div>
          <div class="m-name">${item.name}</div>
          <div class="m-desc">${item.desc}</div>
        </div>
      </div>
    `).join("");

    return `
      <section class="menu-category${index === 0 ? " active-section" : ""}" id="${sectionId}" data-group="${category.group}">
        <div class="container">
          <div class="cat-intro reveal">
            <span class="eyebrow">${category.eyebrow}</span>
            <h2 class="sec-title">${category.group}</h2>
            <div class="gold-bar"></div>
            <p class="body-text">${category.intro}</p>
          </div>
        </div>
        <div class="menu-grid">${cards}</div>
      </section>
      ${index < FOOD_MENU.length - 1 ? '<div class="section-divider"></div>' : ""}
    `;
  }).join("");
}
