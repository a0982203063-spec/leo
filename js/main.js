/**
 * ==============================================================================
 * 房仲個人網站核心前端腳本 (Main JavaScript Logic)
 * 品牌：群義房屋 七期市政店
 * 經紀人：黃書恩 (LEO)
 * 核心功能：591 雲端即時動態連線同步 ＋ 本地快速渲染
 * ==============================================================================
 */

window.isAllPropertiesExpanded = false;
window.currentActiveCategory = "all";
window.livePropertiesData = [];

/**
 * 點擊【展開瀏覽更多好房 / 收合】的切換函數
 */
window.toggleExpandProperties = function() {
  const extraCards = document.querySelectorAll(".extra-property-card");
  const expandBtnText = document.getElementById("expand-btn-text");
  const expandBtnIcon = document.getElementById("expand-btn-icon");
  const propertiesSec = document.getElementById("properties");

  window.isAllPropertiesExpanded = !window.isAllPropertiesExpanded;

  extraCards.forEach(card => {
    const cardCat = card.getAttribute("data-category");
    const isCategoryMatch = (window.currentActiveCategory === "all" || cardCat === window.currentActiveCategory);

    if (isCategoryMatch) {
      if (window.isAllPropertiesExpanded) {
        card.classList.remove("hidden");
        card.style.display = "flex";
      } else {
        card.classList.add("hidden");
        card.style.display = "none";
      }
    } else {
      card.classList.add("hidden");
      card.style.display = "none";
    }
  });

  const totalCount = window.livePropertiesData.length || document.querySelectorAll(".prop-item").length || 14;

  if (expandBtnText) {
    if (window.isAllPropertiesExpanded) {
      expandBtnText.textContent = `收合部分物件（目前已顯示全部 ${totalCount} 件）`;
      if (expandBtnIcon) expandBtnIcon.style.transform = "rotate(180deg)";
    } else {
      expandBtnText.textContent = `展開瀏覽更多好房（已顯示 6 / ${totalCount} 件）`;
      if (expandBtnIcon) expandBtnIcon.style.transform = "rotate(0deg)";
      if (propertiesSec) {
        propertiesSec.scrollIntoView({ behavior: "smooth" });
      }
    }
  }
};

/**
 * 分類標籤切換過濾函數
 */
window.filterPropertiesCategory = function(category, btnElement) {
  window.currentActiveCategory = category;
  const allCards = document.querySelectorAll(".prop-item");
  const expandContainer = document.getElementById("expand-properties-container");
  const tabs = document.querySelectorAll("#property-tabs .tab-btn");

  tabs.forEach(t => t.classList.remove("active"));
  if (btnElement) btnElement.classList.add("active");

  allCards.forEach((card, index) => {
    const cardCat = card.getAttribute("data-category");
    const isMatch = (category === "all" || cardCat === category);

    if (isMatch) {
      if (category === "all") {
        if (window.isAllPropertiesExpanded || index < 6) {
          card.classList.remove("hidden");
          card.style.display = "flex";
        } else {
          card.classList.add("hidden");
          card.style.display = "none";
        }
      } else {
        card.classList.remove("hidden");
        card.style.display = "flex";
      }
    } else {
      card.classList.add("hidden");
      card.style.display = "none";
    }
  });

  if (expandContainer) {
    if (category === "all") {
      expandContainer.classList.remove("hidden");
      expandContainer.style.display = "block";
    } else {
      expandContainer.classList.add("hidden");
      expandContainer.style.display = "none";
    }
  }
};

/**
 * 動態渲染 591 物件卡片 (當雲端 API 獲取到最新資料時自動觸發)
 */
function renderPropertiesToGrid(props) {
  const grid = document.getElementById("properties-grid");
  if (!grid || !props || props.length === 0) return;

  window.livePropertiesData = props;
  const totalCount = props.length;

  // 更新所有計數標籤
  const headerCount = document.getElementById("header-591-count");
  if (headerCount) headerCount.textContent = totalCount;

  const countAll = document.getElementById("count-all");
  if (countAll) countAll.textContent = totalCount;

  const expandBtnText = document.getElementById("expand-btn-text");
  if (expandBtnText && !window.isAllPropertiesExpanded) {
    expandBtnText.textContent = `展開瀏覽更多好房（已顯示 6 / ${totalCount} 件）`;
  }

  let html = "";

  props.forEach((p, idx) => {
    let badgeStyle = "bg-brand-700 text-white";
    if (p.category === "xitun") badgeStyle = "bg-amber-600 text-white";
    else if (p.category === "nantun") badgeStyle = "bg-emerald-600 text-white";
    else if (p.category === "west") badgeStyle = "bg-purple-600 text-white";
    else if (p.category === "beitun") badgeStyle = "bg-blue-600 text-white";

    const isExtra = idx >= 6;
    const extraClass = isExtra && !window.isAllPropertiesExpanded ? "hidden extra-property-card" : (isExtra ? "extra-property-card" : "");
    const tagsHtml = (p.tags || []).map(t => `<span class='px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600'>${t}</span>`).join("\n                  ");
    const unitPriceDisplay = p.unitPrice ? `<span class='text-[11px] text-slate-400 font-medium'>單價約 ${p.unitPrice} 萬/坪</span>` : "";
    const floorDisplay = p.floor ? `${p.floor} 樓` : "高樓層";

    html += `
        <!-- 物件卡片 #${p.id} (${p.title}) -->
        <div class="prop-item ${extraClass} bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group" data-category="${p.category}" data-id="${p.id}">
          <!-- 卡片圖片區 (直接可點擊跳轉 591) -->
          <a href="${p.link591}" target="_blank" rel="noopener noreferrer" class="relative block aspect-[16/10] overflow-hidden bg-slate-100 group/img">
            <img src="${p.imageUrl}" 
                 alt="${p.title}" 
                 loading="lazy"
                 class="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-3">
              <span class="text-xs font-bold text-white flex items-center gap-1 bg-accent-591/90 px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-md">
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                <span>前往 591 查看實拍詳情</span>
              </span>
            </div>
            <!-- 分類標籤 -->
            <div class="absolute top-3 left-3 flex items-center gap-1.5">
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold shadow-md ${badgeStyle}">
                ${p.categoryName}
              </span>
            </div>
            <!-- 591 專屬標籤 -->
            <div class="absolute top-3 right-3">
              <span class="px-2 py-0.5 rounded bg-accent-591 text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
                <i data-lucide="check-circle-2" class="w-3 h-3"></i> 591實拍
              </span>
            </div>
          </a>

          <!-- 卡片內容區 -->
          <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <div class="flex flex-wrap gap-1.5 mb-2">
                ${tagsHtml}
              </div>
              <a href="${p.link591}" target="_blank" rel="noopener noreferrer" class="block">
                <h3 class="font-bold text-base sm:text-lg text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                  ${p.title}
                </h3>
              </a>
              <p class="text-xs text-slate-500 mt-1 truncate flex items-center gap-1">
                <i data-lucide="map-pin" class="w-3 h-3 text-brand-600 flex-shrink-0"></i>
                <span>${p.location}・${p.community}</span>
              </p>
            </div>

            <!-- 物件規格參數 -->
            <div class="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div class="p-1.5 rounded-lg bg-slate-50">
                <p class="text-[10px] text-slate-400">格局</p>
                <p class="font-bold text-slate-700 mt-0.5">${p.layout}</p>
              </div>
              <div class="p-1.5 rounded-lg bg-slate-50">
                <p class="text-[10px] text-slate-400">建坪</p>
                <p class="font-bold text-slate-700 mt-0.5">${p.area} 坪</p>
              </div>
              <div class="p-1.5 rounded-lg bg-slate-50">
                <p class="text-[10px] text-slate-400">樓層</p>
                <p class="font-bold text-slate-700 mt-0.5 truncate">${floorDisplay}</p>
              </div>
            </div>

            <!-- 價格與行動按鈕 -->
            <div class="pt-2 flex items-center justify-between">
              <div>
                <div class="flex items-baseline gap-1">
                  <span class="text-2xl font-black text-rose-600">${p.price}</span>
                  <span class="text-xs font-bold text-rose-600">萬</span>
                </div>
                ${unitPriceDisplay}
              </div>
              <a href="${p.link591}" target="_blank" rel="noopener noreferrer"
                 class="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 transition-colors flex items-center gap-1 shadow-sm">
                <span>看詳情</span>
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </a>
            </div>
          </div>
        </div>
    `;
  });

  grid.innerHTML = html;
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * 自動雲端連線 591 API (零手動操作，用戶打開網頁時自動即時同步)
 */
async function autoFetchLive591() {
  try {
    // 優先呼叫 Vercel Serverless Function /api/properties
    const res = await fetch("/api/properties");
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.length > 0) {
        console.log(`[591 Auto-Sync] Successfully loaded ${json.data.length} live properties from 591 cloud.`);
        renderPropertiesToGrid(json.data);
      }
    }
  } catch (err) {
    console.log("[591 Auto-Sync] Running in static/local mode.");
  }
}

// 頁面加載完成後執行
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 初始化分類切換按鈕事件
  const tabButtons = document.querySelectorAll("#property-tabs .tab-btn");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const category = btn.getAttribute("data-filter");
      window.filterPropertiesCategory(category, btn);
    });
  });

  // 手機選單切換
  const mobileBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  // 🚀 啟動 591 雲端即時同步（完全零手動、自動更新）
  autoFetchLive591();
});
