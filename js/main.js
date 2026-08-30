/**
 * ==============================================================================
 * 房仲個人網站核心前端腳本 (Main JavaScript Logic)
 * 品牌：群義房屋 七期市政店
 * 經紀人：黃書恩 (LEO)
 * ==============================================================================
 */

// 全域展開/收合狀態變數
window.isAllPropertiesExpanded = false;
window.currentActiveCategory = "all";

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

  if (expandBtnText) {
    if (window.isAllPropertiesExpanded) {
      expandBtnText.textContent = "收合部分物件（目前已顯示全部 25 件）";
      if (expandBtnIcon) expandBtnIcon.style.transform = "rotate(180deg)";
    } else {
      expandBtnText.textContent = "展開瀏覽更多好房（已顯示 3 / 25 件）";
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

  // 更新分頁標籤按鈕高亮
  tabs.forEach(t => t.classList.remove("active"));
  if (btnElement) btnElement.classList.add("active");

  allCards.forEach((card, index) => {
    const cardCat = card.getAttribute("data-category");
    const isMatch = (category === "all" || cardCat === category);

    if (isMatch) {
      if (category === "all") {
        if (window.isAllPropertiesExpanded || index < 3) {
          card.classList.remove("hidden");
          card.style.display = "flex";
        } else {
          card.classList.add("hidden");
          card.style.display = "none";
        }
      } else {
        // 分類檢視時直接顯示該分類全部
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

document.addEventListener("DOMContentLoaded", () => {
  try {
    const config = window.REALTOR_CONFIG;
    if (config) {
      initAgentProfile(config.agent, config.contact);
      initSocialLinks(config.contact);
      initServiceAreas(config.serviceAreas);
      initAchievements(config.achievements);
      initFormHandler(config.contact);
      initCopyLine(config.contact.lineId);
    }

    initPropertyEvents();
    initMobileMenu();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (err) {
    console.error("初始化腳本時發生錯誤:", err);
  }
});

/**
 * 綁定物件卡片展開與篩選事件
 */
function initPropertyEvents() {
  const expandBtn = document.getElementById("expand-btn");
  if (expandBtn) {
    expandBtn.onclick = function(e) {
      e.preventDefault();
      window.toggleExpandProperties();
    };
  }

  const tabs = document.querySelectorAll("#property-tabs .tab-btn");
  tabs.forEach(tab => {
    tab.onclick = function(e) {
      e.preventDefault();
      const filter = this.getAttribute("data-filter") || "all";
      window.filterPropertiesCategory(filter, this);
    };
  });
}

/**
 * 填入個人基本資料與文字
 */
function initAgentProfile(agent, contact) {
  if (!agent || !contact) return;
  setElementText("nav-brand-store", `${agent.brand} ${agent.store}`);
  setElementText("nav-agent-name", agent.name);
  setElementText("nav-agent-title", agent.title);

  setElementText("hero-badge", `${agent.brand} ${agent.store}・${agent.title.split("/")[0].trim()}`);
  setElementText("hero-license", agent.licenseNumber);
  setElementText("hero-phone-display", contact.phone);

  const heroLineCta = document.getElementById("hero-line-cta");
  if (heroLineCta) heroLineCta.href = contact.lineUrl;

  const heroPhoneCta = document.getElementById("hero-phone-cta");
  if (heroPhoneCta) heroPhoneCta.href = `tel:${contact.phoneRaw}`;

  const agentPhoto = document.getElementById("agent-photo");
  if (agentPhoto && agent.photoUrl) {
    agentPhoto.src = agent.photoUrl;
    agentPhoto.alt = `${agent.brand} ${agent.store} ${agent.name}`;
  }
  setElementText("card-agent-name", agent.name);
  setElementText("card-agent-title", `${agent.brand}・${agent.title}`);
  setElementText("card-phone", contact.phone);

  setElementText("footer-brand-store", `${agent.brand} ${agent.store}`);
  setElementText("footer-company", agent.company);
  setElementText("footer-license", `經紀人證號：${agent.licenseNumber}`);
  setElementText("footer-address", `門市地址：${agent.address}`);

  setElementText("form-phone", contact.phone);
  setElementText("form-line-id", contact.lineId);
  setElementText("form-address", `${agent.brand} ${agent.store} (${agent.address})`);
}

/**
 * 綁定所有社群與外部平台連結
 */
function initSocialLinks(contact) {
  if (!contact) return;
  setElementHref("nav-591-btn", contact.store591Url);
  setElementHref("nav-line-btn", contact.lineUrl);
  setElementHref("mobile-nav-591", contact.store591Url);
  setElementHref("mobile-nav-line", contact.lineUrl);

  setElementHref("channel-591", contact.store591Url);
  setElementHref("header-591-all-link", contact.store591Url);
  setElementHref("sticky-591", contact.store591Url);
  setElementHref("footer-591-link", contact.store591Url);

  setElementHref("channel-line", contact.lineUrl);
  setElementHref("sticky-line", contact.lineUrl);
  setElementHref("footer-line-link", contact.lineUrl);
  setElementText("channel-line-id", contact.lineId);

  setElementHref("channel-fb", contact.facebookUrl);
  setElementHref("footer-fb-link", contact.facebookUrl);

  setElementHref("channel-ig", contact.instagramUrl);
  setElementHref("footer-ig-link", contact.instagramUrl);
  setElementText("channel-ig-handle", contact.instagramHandle || "@leohome624");

  const stickyPhone = document.getElementById("sticky-phone");
  if (stickyPhone) stickyPhone.href = `tel:${contact.phoneRaw}`;
}

/**
 * 渲染服務區域標籤
 */
function initServiceAreas(serviceAreas) {
  const container = document.getElementById("service-tags-container");
  if (!container || !serviceAreas) return;

  container.innerHTML = serviceAreas.map((area, index) => {
    const isSpecial = index === serviceAreas.length - 1;
    const bgClass = isSpecial 
      ? "bg-brand-50 border-brand-200 text-brand-700 font-bold" 
      : "bg-white border-slate-200 text-slate-700";
    return `
      <span class="px-3 py-1 rounded-lg border ${bgClass} text-xs font-semibold shadow-sm inline-flex items-center gap-1" title="${area.desc}">
        ${area.name}
      </span>
    `;
  }).join("");
}

/**
 * 渲染成就數據
 */
function initAchievements(achievements) {
  const container = document.getElementById("stats-container");
  if (!container || !achievements) return;

  container.innerHTML = achievements.map(item => `
    <div class="space-y-1 p-2">
      <p class="text-3xl sm:text-4xl font-extrabold text-brand-700 font-number">
        ${item.number}
      </p>
      <p class="text-xs sm:text-sm text-slate-500 font-medium">${item.label}</p>
    </div>
  `).join("");
}

/**
 * 表單提交處理
 */
function initFormHandler(contact) {
  const form = document.getElementById("inquiry-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("client-name")?.value || "";
    const shouldOpenLine = confirm(`感謝您的填寫，${name}！\n\n我們已收到您的諮詢需求。是否立即開啟 LINE 將您的需求直接發送給書恩經紀人進行一對一快速排程？`);
    
    if (shouldOpenLine && contact && contact.lineUrl) {
      window.open(contact.lineUrl, "_blank");
    }
    showToast("已收到您的預約需求，書恩將於 24 小時內專人與您聯繫！");
    form.reset();
  });
}

/**
 * 一鍵複製 LINE ID
 */
function initCopyLine(lineId) {
  const copyBtn = document.getElementById("copy-line-btn");
  if (!copyBtn) return;

  copyBtn.addEventListener("click", async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(lineId);
        showToast(`已成功複製 LINE ID：${lineId}`);
      } else {
        showToast(`LINE ID：${lineId}`);
      }
    } catch (err) {
      showToast(`LINE ID：${lineId}`);
    }
  });
}

/**
 * 手機版導航選單切換
 */
function initMobileMenu() {
  const btn = document.getElementById("mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });

  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.add("hidden");
    });
  });
}

/**
 * Toast 提示條顯示
 */
function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-message");
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.remove("opacity-0", "-translate-y-4", "pointer-events-none");
  toast.classList.add("opacity-100", "translate-y-0");

  setTimeout(() => {
    toast.classList.remove("opacity-100", "translate-y-0");
    toast.classList.add("opacity-0", "-translate-y-4", "pointer-events-none");
  }, 3000);
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

function setElementHref(id, href) {
  const el = document.getElementById(id);
  if (el && href) el.href = href;
}
