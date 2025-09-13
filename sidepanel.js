// Toast通知管理类
class ToastManager {
  constructor() {
    this.container = document.getElementById("toast-container");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    }
    this.toasts = [];
  }

  show(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;

    const closeBtn = document.createElement("span");
    closeBtn.className = "toast-close";
    closeBtn.textContent = "×";
    closeBtn.onclick = () => this.remove(toast);

    toast.appendChild(messageSpan);
    toast.appendChild(closeBtn);

    this.container.appendChild(toast);
    this.toasts.push(toast);

    // 自动移除
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    return toast;
  }

  remove(toast) {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      const index = this.toasts.indexOf(toast);
      if (index > -1) {
        this.toasts.splice(index, 1);
      }
    }, 300);
  }

  success(message, duration) {
    return this.show(message, "success", duration);
  }

  error(message, duration) {
    return this.show(message, "error", duration);
  }

  warning(message, duration) {
    return this.show(message, "warning", duration);
  }

  info(message, duration) {
    return this.show(message, "info", duration);
  }
}

// 主题管理类
class ThemeManager {
  constructor() {
    this.isDarkMode = localStorage.getItem("darkMode") === "true";
    this.themes = {
      light: {
        "--light-color": "#f8f9fa",
        "--dark-color": "#212529",
        "--section-bg": "white",
        "--section-content-bg": "#f9f9f9",
        "--border-color": "#eee",
        "--tab-bg": "white",
        "--section-title-color": "var(--secondary-color)",
        "--tab-text-color": "var(--dark-color)",
        "--markdown-bg-light": "#f0f0f0",
        "--markdown-bg-dark": "#e0e0e0",
        "--markdown-border-light": "#ddd",
        "--markdown-border-dark": "#ccc",
        "--markdown-text-light": "#666",
        "--markdown-text-dark": "#555",
        "--primary-color": "#4361ee",
        "--secondary-color": "#3a0ca3",
        "--accent-color": "#7209b7",
        "--success-color": "#4cc9f0",
        "--warning-color": "#f72585",
      },
      dark: {
        "--light-color": "#212529",
        "--dark-color": "#f8f9fa",
        "--section-bg": "#2d2d2d",
        "--section-content-bg": "#3d3d3d",
        "--border-color": "#444",
        "--tab-bg": "#2d2d2d",
        "--section-title-color": "#8b9cff",
        "--tab-text-color": "#ffffff",
        "--markdown-bg-light": "#2d2d2d",
        "--markdown-bg-dark": "#1a1a1a",
        "--markdown-border-light": "#555",
        "--markdown-border-dark": "#666",
        "--markdown-text-light": "#ccc",
        "--markdown-text-dark": "#aaa",
        "--primary-color": "#6b8cff",
        "--secondary-color": "#5a4bd0",
        "--accent-color": "#9b4fd0",
        "--success-color": "#4db8d8",
        "--warning-color": "#e63946",
      },
    };
  }

  applyTheme(theme) {
    const root = document.documentElement;
    const themeVars = this.themes[theme];

    // 批量设置CSS变量
    Object.entries(themeVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // 设置data-theme属性
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }

    this.isDarkMode = theme === "dark";
    localStorage.setItem("darkMode", this.isDarkMode);
  }

  toggle() {
    const newTheme = this.isDarkMode ? "light" : "dark";
    this.applyTheme(newTheme);
  }

  initialize() {
    this.applyTheme(this.isDarkMode ? "dark" : "light");
  }
}

//supabase初始化
const client = supabase.createClient(
  "https://jnzoquhmgpjbqcabgxrd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impuem9xdWhtZ3BqYnFjYWJneHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDc4OTgsImV4cCI6MjA3MjA4Mzg5OH0.BKMFZNbTgGf5yxfAQuFbA912fISlbbL3GE6YDn-OkaA"
);

async function getNews(url) {
  console.log("[DEBUG-AI] getNews() 被调用，URL:", url);
  try {
    const { data, error } = await client
      .from("News")
      .select("url,summarizer")
      .eq("url", url);
    
    if (error) {
      console.error("[DEBUG-AI] 数据库查询错误:", error);
      return [];
    }
    
    console.log("[DEBUG-AI] 数据库查询结果:", data);
    return data || [];
  } catch (error) {
    console.error("[DEBUG-AI] getNews() 异常:", error);
    return [];
  }
}

// 显示从数据库获取的summarizer数据
function displayNewsSummarizer(summarizerData) {
  console.log("[DEBUG-AI] displayNewsSummarizer() 被调用，数据:", summarizerData);
  
  if (!summarizerData || summarizerData.length === 0) {
    console.log("[DEBUG-AI] 没有summarizer数据，返回false");
    return false; // 没有数据，返回false
  }

  const summarizer = summarizerData[0].summarizer;
  if (!summarizer) {
    console.log("[DEBUG-AI] summarizer内容为空，返回false");
    return false; // 没有summarizer内容，返回false
  }

  // 隐藏AI状态区域
  document.getElementById("ai-status-section").style.display = "none";

  // 显示summarizer内容
  document.getElementById("ai-summary-result").innerHTML = `
    <div id="streaming-content"></div>
  `;

  // 在独立的状态区域显示数据库来源信息
  const statusElement = document.getElementById("ai-summary-status");
  statusElement.style.display = "block";
  statusElement.innerHTML = `
    <span style="background: #d1ecf1; padding: 2px 6px; border-radius: 3px;">数据库内容</span>
    <span style="margin-left: 10px;">从数据库加载</span>
  `;

  // 使用marked渲染markdown
  document.getElementById("streaming-content").innerHTML =
    marked.parse(summarizer);

  // 确保AI总结内容区域显示
  const aiSummarySection = document.querySelector(
    "#ai-tab .section:nth-child(2)"
  );
  if (aiSummarySection) {
    aiSummarySection.style.display = "block";
  }

  return true; // 成功显示，返回true
}

async function insertNews() {}

// 创建全局主题管理器实例
const themeManager = new ThemeManager();

// 创建全局Toast管理器实例
const toastManager = new ToastManager();

document.addEventListener("DOMContentLoaded", function () {
  // 初始化变量
  let extractedData = {};
  let currentTab = "results";
  
  // 添加AI总结加载状态标志，防止竞态条件
  let isLoadingAISummary = false;

  // DOM加载完成后，启用AI总结按钮并恢复原始文本
  const aiSummaryBtn = document.getElementById("ai-summary-btn");
  const aiSummaryBtnText = document.getElementById("ai-summary-btn-text");
  if (aiSummaryBtn) {
    aiSummaryBtn.disabled = false;
    if (aiSummaryBtnText) {
      aiSummaryBtnText.textContent = "AI总结";
    }
  }

  // 加载保存的设置
  loadSettings();

  // 清理过期数据
  cleanExpiredData();

  // 标签切换功能
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.getAttribute("data-tab");
      switchTab(tabName);
    });
  });

  // 提取按钮事件
  document.getElementById("extract-btn").addEventListener("click", extractData);

  // 保存提取设置按钮事件
  document
    .getElementById("save-extract-settings-btn")
    .addEventListener("click", saveSettings);

  // 复制全部按钮事件
  document
    .getElementById("copy-all-btn")
    .addEventListener("click", copyAllData);

  // 查看全部图片按钮事件
  document
    .getElementById("view-images-btn")
    .addEventListener("click", viewAllImages);

  // 下载全部图片按钮事件
  document
    .getElementById("download-images-btn")
    .addEventListener("click", downloadAllImages);

  // 查看全部链接按钮事件
  document
    .getElementById("view-links-btn")
    .addEventListener("click", viewAllLinks);

  // 导出按钮事件
  document.getElementById("export-btn").addEventListener("click", exportData);

  // 清除按钮事件
  document.getElementById("clear-btn").addEventListener("click", clearData);

  // 保存设置按钮事件
  document
    .getElementById("save-settings-btn")
    .addEventListener("click", saveSettings);

  // AI总结按钮事件
  document
    .getElementById("ai-summary-btn")
    .addEventListener("click", generateAISummary);

  // 复制总结按钮事件
  document
    .getElementById("copy-summary-btn")
    .addEventListener("click", copySummary);

  // 清除缓存按钮事件
  document
    .getElementById("clear-cache-btn")
    .addEventListener("click", clearAISummaryCacheForCurrentTab);

  // 图片过滤功能
  document
    .getElementById("image-filter")
    .addEventListener("input", filterImages);

  // 链接过滤功能
  document.getElementById("link-filter").addEventListener("input", filterLinks);

  // 暗色模式切换
  const darkModeToggle = document.getElementById("dark-mode");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("change", toggleDarkMode);
  }

  // 默认自动提取
  extractData();

  // 加载当前页面的AI总结
  loadAISummaryForCurrentTab();

  // 监听浏览器tab切换事件
  chrome.tabs.onActivated.addListener(function (activeInfo) {
    console.log("[DEBUG-AI] chrome.tabs.onActivated 被调用，tabId:", activeInfo.tabId);
    
    // 当用户切换到不同的tab时，自动执行数据提取和AI总结加载
    refreshDataForNewTab();

    // 获取当前tab的URL并调用统一的AI总结加载函数
    chrome.tabs.get(activeInfo.tabId, function (tab) {
      if (tab && tab.url) {
        console.log("[DEBUG-AI] Tab切换时URL:", tab.url);
        // 使用统一的AI总结加载函数
        loadAndDisplayAISummary(tab.url, "Tab切换");
      }
    });
  });

  // 监听当前tab的URL变化（例如在同一个tab内导航到不同页面）
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    console.log("[DEBUG-AI] chrome.tabs.onUpdated 被调用，tabId:", tabId, "changeInfo:", changeInfo, "tab.active:", tab.active);
    
    // 如果URL发生变化且是当前活动标签页，立即清空面板内容
    if (changeInfo.url && tab.active) {
      console.log("[DEBUG-AI] 检测到URL变化，立即清空面板内容");
      clearPanelData();
    }

    //立即刷新数据
    refreshDataForNewTab();

    // 获取当前URL并调用统一的AI总结加载函数
    if (tab.url) {
      console.log("[DEBUG-AI] URL更新时处理URL:", tab.url);
      // 使用统一的AI总结加载函数
      loadAndDisplayAISummary(tab.url, "URL更新");
    }
  });

  // 监听总结类型切换事件
  document.querySelectorAll('input[name="summary-type"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      loadAISummaryForCurrentTab();
    });
  });

  // 切换标签页函数
  function switchTab(tabName) {
    // 更新活动标签
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-tab") === tabName);
    });

    // 更新活动内容
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.toggle("active", content.id === `${tabName}-tab`);
    });

    currentTab = tabName;
  }

  // 加载设置
  function loadSettings() {
    // 加载显示预览设置
    document.getElementById("show-previews").checked =
      localStorage.getItem("showPreviews") !== "false";

    // 加载数据保留设置
    document.getElementById("data-retention").value =
      localStorage.getItem("dataRetention") || "7";

    // 加载提取选项设置
    document.getElementById("extract-html").checked =
      localStorage.getItem("extractHtml") !== "false";
    document.getElementById("extract-text").checked =
      localStorage.getItem("extractText") !== "false";
    document.getElementById("extract-images").checked =
      localStorage.getItem("extractImages") !== "false";
    document.getElementById("extract-links").checked =
      localStorage.getItem("extractLinks") !== "false";
    document.getElementById("extract-meta").checked =
      localStorage.getItem("extractMeta") !== "false";
    document.getElementById("extract-styles").checked =
      localStorage.getItem("extractStyles") === "true";
    document.getElementById("extract-scripts").checked =
      localStorage.getItem("extractScripts") === "true";

    // 加载OpenAI API设置
    document.getElementById("openai-api-key").value =
      localStorage.getItem("openaiApiKey") || "";
    document.getElementById("openai-base-url").value =
      localStorage.getItem("openaiBaseUrl") || "https://api.openai.com/v1";
    document.getElementById("ai-model").value =
      localStorage.getItem("aiModel") || "gpt-3.5-turbo";

    // 初始化主题
    themeManager.initialize();

    // 同步暗色模式按钮状态与当前主题
    const darkModeToggle = document.getElementById("dark-mode");
    if (darkModeToggle) {
      darkModeToggle.checked = themeManager.isDarkMode;
    }
  }

  // 保存设置
  function saveSettings() {
    localStorage.setItem(
      "showPreviews",
      document.getElementById("show-previews").checked
    );
    localStorage.setItem(
      "darkMode",
      document.getElementById("dark-mode").checked
    );
    localStorage.setItem(
      "dataRetention",
      document.getElementById("data-retention").value
    );

    // 保存提取选项设置
    localStorage.setItem(
      "extractHtml",
      document.getElementById("extract-html").checked
    );
    localStorage.setItem(
      "extractText",
      document.getElementById("extract-text").checked
    );
    localStorage.setItem(
      "extractImages",
      document.getElementById("extract-images").checked
    );
    localStorage.setItem(
      "extractLinks",
      document.getElementById("extract-links").checked
    );
    localStorage.setItem(
      "extractMeta",
      document.getElementById("extract-meta").checked
    );
    localStorage.setItem(
      "extractStyles",
      document.getElementById("extract-styles").checked
    );
    localStorage.setItem(
      "extractScripts",
      document.getElementById("extract-scripts").checked
    );

    // 保存OpenAI API设置
    const apiKey = document.getElementById("openai-api-key").value.trim();
    if (apiKey) {
      localStorage.setItem("openaiApiKey", apiKey);
    }
    localStorage.setItem(
      "openaiBaseUrl",
      document.getElementById("openai-base-url").value.trim()
    );
    localStorage.setItem(
      "aiModel",
      document.getElementById("ai-model").value.trim()
    );

    toastManager.success("设置已保存！");
  }

  // 切换暗色模式
  function toggleDarkMode() {
    themeManager.toggle();
  }

  // 提取数据函数
  function extractData() {
    // 获取选中的提取选项
    const options = {
      html: document.getElementById("extract-html").checked,
      text: document.getElementById("extract-text").checked,
      images: document.getElementById("extract-images").checked,
      links: document.getElementById("extract-links").checked,
      meta: document.getElementById("extract-meta").checked,
      styles: document.getElementById("extract-styles").checked,
      scripts: document.getElementById("extract-scripts").checked,
      article: document.getElementById("extract-article").checked,
    };

    // 如果没有选中任何选项，提示用户
    if (!Object.values(options).some((opt) => opt)) {
      toastManager.warning("请至少选择一个提取选项！");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // 检查tab是否存在且URL是否有效
      if (!tabs[0] || !tabs[0].url) {
        console.log("[DEBUG] 无法获取当前页面URL，停止提取");
        return;
      }

      const currentUrl = tabs[0].url;

      // 检查URL是否为http或https协议
      const urlProtocol = currentUrl.split(":")[0].toLowerCase();
      if (urlProtocol !== "http" && urlProtocol !== "https") {
        console.log("[DEBUG] 非http/https页面，停止提取");
        return;
      }

      // 如果通过了所有检查，则执行提取
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: getPageData,
          args: [options],
        },
        (results) => {
          if (results && results[0]) {
            console.log("[DEBUG] 提取成功");
            extractedData = results[0].result;

            // 显示统计信息
            displayStats(extractedData);

            // 显示提取结果
            displayResults(extractedData);

            // 不再自动切换到结果标签页，让AI总结逻辑决定最终的tab位置
            // switchTab("results");

            // 保存提取的数据
            saveExtractedData(extractedData);
          } else if (chrome.runtime.lastError) {
            console.error("[DEBUG] 提取错误:", chrome.runtime.lastError);
            console.error(
              "[DEBUG] 错误信息:",
              chrome.runtime.lastError.message
            );
            // 不再显示alert，只在console中记录错误
          }
        }
      );
    });
  }

  // 在页面上执行的数据提取函数
  function getPageData(options) {
    const data = {};

    if (options.html) {
      data.html = document.documentElement.outerHTML;
    }

    if (options.text) {
      data.text = document.body.innerText;
      data.wordCount = data.text.length;
    }

    if (options.images) {
      data.images = Array.from(document.images).map((img) => ({
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      }));
    }

    if (options.links) {
      data.links = Array.from(document.links)
        .map((link) => ({
          href: link.href,
          text: link.textContent.trim(),
          title: link.title,
          rel: link.rel,
        }))
        .filter((link) => link.href && !link.href.startsWith("javascript:"));
    }

    if (options.meta) {
      data.meta = {};
      const metaTags = document.querySelectorAll("meta");
      metaTags.forEach((tag) => {
        const name =
          tag.getAttribute("name") || tag.getAttribute("property") || "unknown";
        data.meta[name] = tag.getAttribute("content");
      });
      data.title = document.title;
      data.url = window.location.href;

      // 提取主域名
      try {
        const urlObj = new URL(window.location.href);
        data.host = urlObj.hostname.replace(/^www\./, "");
      } catch (e) {
        data.host = "invalid-host";
      }
    }

    if (options.styles) {
      data.styles = {
        styleSheets: Array.from(document.styleSheets).map(
          (sheet) => sheet.href || "inline"
        ),
        styles: Array.from(document.querySelectorAll("style")).map(
          (style) => style.innerHTML
        ),
      };
    }

    if (options.scripts) {
      data.scripts = Array.from(document.scripts).map((script) => ({
        src: script.src,
        type: script.type,
        async: script.async,
        defer: script.defer,
      }));
    }

    if (options.article) {
      // 查找article标签并提取内容
      const articleElements = document.querySelectorAll("article");
      if (articleElements.length > 0) {
        // 如果找到article标签，提取第一个article标签的innerText
        data.article = articleElements[0].innerText;
      } else {
        // 如果没有找到article标签，设置为null
        data.article = null;
      }
    }

    data.extractedAt = new Date().toISOString();

    return data;
  }

  // 显示统计信息
  function displayStats(data) {
    document.getElementById("images-count").textContent = data.images
      ? data.images.length
      : 0;
    document.getElementById("links-count").textContent = data.links
      ? data.links.length
      : 0;
    document.getElementById("words-count").textContent = data.wordCount || 0;
  }

  // 显示提取结果
  function displayResults(data) {
    // 显示网页信息
    displayPageInfo(data);

    // 显示图片
    displayImages(data.images);

    // 显示链接
    displayLinks(data.links);

    // 控制图片和链接栏目的显示
    toggleSectionsVisibility(data);
  }

  // 控制图片和链接栏目的显示
  function toggleSectionsVisibility(data) {
    // 获取图片和链接的section元素
    const imagesSection = document.querySelector(
      "#results-tab .section:nth-child(3)"
    );
    const linksSection = document.querySelector(
      "#results-tab .section:nth-child(4)"
    );

    // 如果没有图片数据，隐藏图片栏目
    if (!data.images || data.images.length === 0) {
      if (imagesSection) {
        imagesSection.style.display = "none";
      }
    } else {
      if (imagesSection) {
        imagesSection.style.display = "block";
      }
    }

    // 如果没有链接数据，隐藏链接栏目
    if (!data.links || data.links.length === 0) {
      if (linksSection) {
        linksSection.style.display = "none";
      }
    } else {
      if (linksSection) {
        linksSection.style.display = "block";
      }
    }
  }

  // 显示网页信息
  function displayPageInfo(data) {
    const pageInfoElement = document.getElementById("page-info-result");
    let html = "";

    if (data.title) {
      const truncatedTitle =
        data.title.length > 50
          ? data.title.substring(0, 50) + "..."
          : data.title;
      html += `<div><strong>标题:</strong> <span title="${data.title}">${truncatedTitle}</span></div>`;
    }

    if (data.host) {
      html += `<div><strong>主域名:</strong> ${data.host}</div>`;
    }

    if (data.wordCount) {
      html += `<div><strong>字数:</strong> ${data.wordCount}</div>`;
    }

    if (data.article !== undefined) {
      if (data.article) {
        // 如果article内容存在，显示截断版本
        const truncatedArticle =
          data.article.length > 100
            ? data.article.substring(0, 100) + "..."
            : data.article;
        html += `<div><strong>文章内容:</strong> <span title="${data.article.replace(
          /"/g,
          '"'
        )}">${truncatedArticle}</span></div>`;
      } else {
        // 如果article为null，显示未找到
        html += `<div><strong>文章内容:</strong> 未找到article标签</div>`;
      }
    }

    pageInfoElement.innerHTML = html;
  }

  // 显示图片
  function displayImages(images) {
    const imagesElement = document.getElementById("images-result");

    if (!images || images.length === 0) {
      imagesElement.innerHTML = "<div>未提取到图片</div>";
      return;
    }

    let html = "";

    // 只显示前12张图片的预览
    const imagesToShow = images.slice(0, 12);

    imagesToShow.forEach((img) => {
      html += `
        <div class="image-item">
          <img src="${img.src}" alt="${img.alt || "无描述"}">
          <div class="image-info">
            ${img.width}x${img.height}
          </div>
        </div>
      `;
    });

    // 如果图片数量超过12张，显示查看全部的提示
    if (images.length > 12) {
      html += `<div class="image-item" style="display: flex; align-items: center; justify-content: center; background: #f0f0f0;">
                <div>+${images.length - 12}更多</div>
              </div>`;
    }

    imagesElement.innerHTML = html;
  }

  // 显示链接
  function displayLinks(links) {
    const linksElement = document.getElementById("links-result");

    if (!links || links.length === 0) {
      linksElement.innerHTML = "<div>未提取到链接</div>";
      return;
    }

    let html = "";

    // 只显示前10个链接
    const linksToShow = links.slice(0, 10);

    linksToShow.forEach((link) => {
      const linkText = link.text || "无文本";
      const truncatedText =
        linkText.length > 30 ? linkText.substring(0, 30) + "..." : linkText;
      const truncatedHref =
        link.href.length > 50 ? link.href.substring(0, 50) + "..." : link.href;
      html += `<div><strong title="${linkText}">${truncatedText}:</strong> <a href="${link.href}" target="_blank" title="${link.href}">${truncatedHref}</a></div>`;
    });

    // 如果链接数量超过10个，显示查看全部的提示
    if (links.length > 10) {
      html += `<div>... 还有 ${links.length - 10} 个链接</div>`;
    }

    linksElement.innerHTML = html;
  }

  // 过滤图片
  function filterImages() {
    const filterText = document
      .getElementById("image-filter")
      .value.toLowerCase();
    const images = extractedData.images || [];

    if (!filterText) {
      displayImages(images);
      return;
    }

    const filteredImages = images.filter(
      (img) =>
        img.src.toLowerCase().includes(filterText) ||
        (img.alt && img.alt.toLowerCase().includes(filterText))
    );

    displayImages(filteredImages);
  }

  // 过滤链接
  function filterLinks() {
    const filterText = document
      .getElementById("link-filter")
      .value.toLowerCase();
    const links = extractedData.links || [];

    if (!filterText) {
      displayLinks(links);
      return;
    }

    const filteredLinks = links.filter(
      (link) =>
        link.href.toLowerCase().includes(filterText) ||
        (link.text && link.text.toLowerCase().includes(filterText))
    );

    displayLinks(filteredLinks);
  }

  // 查看全部图片
  function viewAllImages() {
    if (!extractedData.images || extractedData.images.length === 0) {
      toastManager.warning("没有可查看的图片");
      return;
    }

    // 在新标签页中打开图片查看器
    chrome.tabs.create({
      url: chrome.runtime.getURL("image-viewer.html"),
    });
  }

  // 下载全部图片
  function downloadAllImages() {
    if (!extractedData.images || extractedData.images.length === 0) {
      toastManager.warning("没有可下载的图片");
      return;
    }

    // 这里应该实现下载逻辑
    toastManager.success(`开始下载 ${extractedData.images.length} 张图片`);

    // 实际实现会使用chrome.downloads API
    extractedData.images.forEach((img, index) => {
      chrome.downloads.download({
        url: img.src,
        filename: `image-${index + 1}.${
          img.src.split(".").pop().split("?")[0]
        }`,
        saveAs: false,
      });
    });
  }

  // 查看全部链接
  function viewAllLinks() {
    if (!extractedData.links || extractedData.links.length === 0) {
      toastManager.warning("没有可查看的链接");
      return;
    }

    // 在新标签页中打开链接查看器
    chrome.tabs.create({
      url: chrome.runtime.getURL("link-viewer.html"),
    });
  }

  // 复制全部数据
  function copyAllData() {
    const text = JSON.stringify(extractedData, null, 2);

    navigator.clipboard
      .writeText(text)
      .then(() => {
        toastManager.success("数据已复制到剪贴板！");
      })
      .catch((err) => {
        console.error("复制失败:", err);
        toastManager.error("复制失败，请重试");
      });
  }

  // 导出数据
  function exportData() {
    if (Object.keys(extractedData).length === 0) {
      toastManager.warning("没有数据可导出");
      return;
    }

    const blob = new Blob([JSON.stringify(extractedData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    // 获取标题和URL来构建文件名
    let title = extractedData.title || "untitled";
    let urlPart = extractedData.url || "no-url";

    // 清理标题，移除不适合文件名的字符
    title = title.replace(/[\\/:*?"<>|]/g, "-").substring(0, 50);

    // 从URL中提取域名部分
    try {
      const urlObj = new URL(urlPart);
      urlPart = urlObj.hostname.replace(/^www\./, "");
    } catch (e) {
      urlPart = "invalid-url";
    }

    const date = new Date().toISOString().slice(0, 10);
    const filename = `${title}-${urlPart}-${date}.json`;

    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true,
    });
  }

  // 清除数据
  function clearData() {
    if (confirm("确定要清除所有提取的数据吗？")) {
      extractedData = {};
      document.getElementById("page-info-result").innerHTML = "";
      document.getElementById("images-result").innerHTML = "";
      document.getElementById("links-result").innerHTML = "";
      document.getElementById("images-count").textContent = "0";
      document.getElementById("links-count").textContent = "0";
      document.getElementById("words-count").textContent = "0";

      // 清除存储的数据
      localStorage.removeItem("extractedData");
    }
  }

  // 清理过期数据
  function cleanExpiredData() {
    console.log("[DEBUG] 开始清理过期数据");

    // 获取数据保留时间设置（天）
    const retentionDays = parseInt(
      localStorage.getItem("dataRetention") || "7"
    );

    // 如果设置为永久保留（0天），则不进行清理
    if (retentionDays === 0) {
      console.log("[DEBUG] 数据保留设置为永久，跳过清理");
      return;
    }

    // 计算截止时间（毫秒）
    const cutoffTime =
      new Date().getTime() - retentionDays * 24 * 60 * 60 * 1000;
    console.log("[DEBUG] 数据保留时间:", retentionDays, "天");
    console.log("[DEBUG] 截止时间戳:", cutoffTime);

    // 清理提取的数据
    const extractedDataStr = localStorage.getItem("extractedData");
    if (extractedDataStr) {
      try {
        const extractedData = JSON.parse(extractedDataStr);
        if (extractedData.extractedAt) {
          const extractedTime = new Date(extractedData.extractedAt).getTime();
          if (extractedTime < cutoffTime) {
            console.log("[DEBUG] 删除过期的提取数据");
            localStorage.removeItem("extractedData");
          } else {
            console.log("[DEBUG] 提取数据未过期，保留");
          }
        }
      } catch (e) {
        console.error("[DEBUG] 解析提取数据时出错:", e);
      }
    }

    // 清理AI总结数据
    let cleanedCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // 检查是否是AI总结数据的key
      if (key && key.startsWith("aiSummary_")) {
        try {
          const summaryDataStr = localStorage.getItem(key);
          if (summaryDataStr) {
            const summaryData = JSON.parse(summaryDataStr);
            if (summaryData.createdAt) {
              const createdTime = new Date(summaryData.createdAt).getTime();
              if (createdTime < cutoffTime) {
                console.log("[DEBUG] 删除过期的AI总结数据:", key);
                localStorage.removeItem(key);
                cleanedCount++;
              }
            }
          }
        } catch (e) {
          console.error("[DEBUG] 解析AI总结数据时出错:", e, "key:", key);
        }
      }
    }

    console.log("[DEBUG] 清理完成，删除了", cleanedCount, "条AI总结数据");
  }

  // 保存提取的数据
  function saveExtractedData(data) {
    // 在保存新数据前先清理过期数据
    cleanExpiredData();

    // 只保存必要的数据，避免存储过大
    const dataToSave = {
      meta: data.meta,
      title: data.title,
      url: data.url,
      wordCount: data.wordCount,
      imagesCount: data.images ? data.images.length : 0,
      linksCount: data.links ? data.links.length : 0,
      article: data.article, // 添加article字段
      extractedAt: data.extractedAt,
    };

    localStorage.setItem("extractedData", JSON.stringify(dataToSave));
  }

  // 生成AI总结
  function generateAISummary() {
    // 防止重复点击
    const aiButton = document.getElementById("ai-summary-btn");
    if (aiButton.disabled) {
      return;
    }

    // 禁用按钮防止重复请求
    aiButton.disabled = true;
    const aiSummaryBtnText = document.getElementById("ai-summary-btn-text");
    const originalButtonText = aiSummaryBtnText
      ? aiSummaryBtnText.textContent
      : "AI总结";
    if (aiSummaryBtnText) {
      aiSummaryBtnText.textContent = "生成中...";
    }

    try {
      const content = extractedData.text || "";
      if (!content) {
        console.log("[DEBUG] 未识别到任何需要总结的数据");
        // 恢复按钮状态
        aiButton.disabled = false;
        const aiSummaryBtnText = document.getElementById("ai-summary-btn-text");
        if (aiSummaryBtnText) {
          aiSummaryBtnText.textContent = originalButtonText;
        }
        return;
      }

      // 检查是否已提取数据
      if (Object.keys(extractedData).length === 0) {
        console.log("[DEBUG] 请先提取网页数据");
        // 恢复按钮状态
        aiButton.disabled = false;
        const aiSummaryBtnText = document.getElementById("ai-summary-btn-text");
        if (aiSummaryBtnText) {
          aiSummaryBtnText.textContent = originalButtonText;
        }
        switchTab("settings");
        return;
      }

      // 检查API密钥
      const apiKey = localStorage.getItem("openaiApiKey");
      if (!apiKey) {
        console.log("[DEBUG] 请先在设置中配置OpenAI API密钥");
        // 恢复按钮状态
        aiButton.disabled = false;
        const aiSummaryBtnText = document.getElementById("ai-summary-btn-text");
        if (aiSummaryBtnText) {
          aiSummaryBtnText.textContent = originalButtonText;
        }
        switchTab("settings");
        return;
      }

      // 获取总结类型
      const summaryType = document.querySelector(
        'input[name="summary-type"]:checked'
      ).value;

      // 显示加载状态
      document.getElementById("ai-status-section").style.display = "block";
      document.getElementById("ai-summary-result").innerHTML =
        '<div style="text-align: center; color: #666; padding: 20px;">正在生成AI总结...</div>';

      // 根据总结类型准备内容
      let system_prompt = "";

      switch (summaryType) {
        case "full":
          system_prompt =
            "对用户提供的内容进行总结，要求简洁明了，突出重点，禁止遗漏任何关键和重要信息，回复语言：简体中文。";
          break;
        case "keyinfo":
          system_prompt =
            "对用户提供的内容提取关键信息，包括：主要主题、重要数据、关键人物、时间地点等核心信息，回复语言：简体中文。";
          break;
      }

      // 调用OpenAI API
      callOpenAI(apiKey, system_prompt, content).finally(() => {
        // 请求完成后恢复按钮状态
        aiButton.disabled = false;
        const aiSummaryBtnText = document.getElementById("ai-summary-btn-text");
        if (aiSummaryBtnText) {
          aiSummaryBtnText.textContent = originalButtonText;
        }
      });
    } catch (error) {
      console.error("生成AI总结时出错:", error);
      // 发生错误时恢复按钮状态
      aiButton.disabled = false;
      const aiSummaryBtnText = document.getElementById("ai-summary-btn-text");
      if (aiSummaryBtnText) {
        aiSummaryBtnText.textContent = originalButtonText;
      }
    }
  }

  // 调用OpenAI API
  async function callOpenAI(apiKey, system_prompt, input) {
    const model = localStorage.getItem("aiModel") || "deepseek-chat";
    const baseUrl =
      localStorage.getItem("openaiBaseUrl") || "https://api.deepseek.com";
    const apiUrl = `${baseUrl}/chat/completions`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: system_prompt },
            {
              role: "user",
              content: input,
            },
          ],
          stream: true,
          max_tokens: 5000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API请求失败");
      }

      // 初始化流式输出显示
      document.getElementById("ai-status-section").style.display = "none";
      document.getElementById("ai-summary-result").innerHTML = `
        <div id="streaming-content"></div>
      `;

      // 确保AI总结内容区域显示
      const aiSummarySection = document.querySelector(
        "#ai-tab .section:nth-child(2)"
      );
      if (aiSummarySection) {
        aiSummarySection.style.display = "block";
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              // 保存AI总结到localStorage
              chrome.tabs.query(
                { active: true, currentWindow: true },
                function (tabs) {
                  if (tabs && tabs[0]) {
                    const url = tabs[0].url;
                    const summaryType = document.querySelector(
                      'input[name="summary-type"]:checked'
                    ).value;
                    saveAISummary(url, accumulatedContent, summaryType);

                    // 添加保存指示器到独立的状态区域
                    const statusElement =
                      document.getElementById("ai-summary-status");
                    statusElement.style.display = "block";
                    statusElement.innerHTML = `
                      <span style="background: #d4edda; padding: 2px 6px; border-radius: 3px;">已保存</span>
                      <span style="margin-left: 10px;">生成时间: ${new Date().toLocaleString()}</span>
                    `;
                  }
                }
              );
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || "";
              if (content) {
                accumulatedContent += content;
                // 使用marked渲染markdown
                document.getElementById("streaming-content").innerHTML =
                  marked.parse(accumulatedContent);
                // 自动滚动到底部
                document.getElementById("ai-summary-result").scrollTop =
                  document.getElementById("ai-summary-result").scrollHeight;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error("OpenAI API调用失败:", error);
      document.getElementById("ai-status-section").style.display = "none";
      document.getElementById("ai-summary-result").innerHTML = `
          <div style="color: #f72585; padding: 20px; text-align: center;">
            <strong>AI总结失败</strong><br>
            ${error.message}<br>
          <small>请检查API密钥是否正确，或稍后重试</small>
          </div>
        `;
    }
  }

  // 显示AI总结结果
  function displayAISummary(summary) {
    document.getElementById("ai-status-section").style.display = "none";
    document.getElementById("ai-summary-result").innerHTML = `
      <div style="white-space: pre-wrap; line-height: 1.6;">
        ${summary}
      </div>
    `;
  }

  // 复制AI总结
  function copySummary() {
    const streamingContent = document.getElementById("streaming-content");
    if (!streamingContent) {
      toastManager.warning("没有可复制的总结内容");
      return;
    }

    const summaryText = streamingContent.textContent;

    if (
      !summaryText ||
      summaryText.includes('点击"AI总结"按钮开始生成网页内容总结')
    ) {
      toastManager.warning("没有可复制的总结内容");
      return;
    }

    navigator.clipboard
      .writeText(summaryText)
      .then(() => {
        toastManager.success("AI总结已复制到剪贴板！");
      })
      .catch((err) => {
        console.error("复制失败:", err);
        toastManager.error("复制失败，请重试");
      });
  }

  // 保存AI总结到localStorage
  function saveAISummary(url, content, summaryType) {
    // 在保存新数据前先清理过期数据
    cleanExpiredData();

    const summaryData = {
      content: content,
      summaryType: summaryType,
      createdAt: new Date().toISOString(),
      url: url,
    };

    // 使用URL和总结类型作为key存储AI总结，这样不同类型的总结可以分别保存
    const key = `aiSummary_${url}_${summaryType}`;
    localStorage.setItem(key, JSON.stringify(summaryData));
  }

  // 从localStorage加载AI总结
  function loadAISummary(url, summaryType) {
    // 使用URL和总结类型作为key加载AI总结
    const key = `aiSummary_${url}_${summaryType}`;
    const summaryData = localStorage.getItem(key);

    if (summaryData) {
      return JSON.parse(summaryData);
    }

    return null;
  }

  // 清除特定URL的AI总结缓存
  function clearAISummaryCache(url, summaryType) {
    // 使用URL和总结类型作为key清除AI总结缓存
    const key = `aiSummary_${url}_${summaryType}`;
    localStorage.removeItem(key);

    // 隐藏状态区域
    const statusElement = document.getElementById("ai-summary-status");
    statusElement.style.display = "none";
  }

  // 显示缓存的AI总结
  function displayCachedAISummary(summaryData) {
    document.getElementById("ai-status-section").style.display = "none";
    document.getElementById("ai-summary-result").innerHTML = `
      <div id="streaming-content"></div>
    `;

    // 在独立的状态区域显示缓存信息
    const statusElement = document.getElementById("ai-summary-status");
    statusElement.style.display = "block";
    statusElement.innerHTML = `
      <span style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">缓存内容</span>
      <span style="margin-left: 10px;">生成时间: ${new Date(
        summaryData.createdAt
      ).toLocaleString()}</span>
    `;

    // 使用marked渲染markdown
    document.getElementById("streaming-content").innerHTML = marked.parse(
      summaryData.content
    );

    // 确保AI总结内容区域显示
    const aiSummarySection = document.querySelector(
      "#ai-tab .section:nth-child(2)"
    );
    if (aiSummarySection) {
      aiSummarySection.style.display = "block";
    }

    // 显示清除缓存按钮
    document.getElementById("clear-cache-btn").style.display = "inline-block";
  }

  // 获取当前标签页URL并加载AI总结
  function loadAISummaryForCurrentTab() {
    console.log("[DEBUG-AI] loadAISummaryForCurrentTab() 开始执行");
    
    // 检查是否正在加载AI总结，防止竞态条件
    if (isLoadingAISummary) {
      console.log("[DEBUG-AI] 正在加载AI总结，跳过此次请求");
      return;
    }
    
    // 设置加载状态标志
    isLoadingAISummary = true;
    
    // 检查当前所在的tab
    const currentActiveTab = document.querySelector(".tab.active");
    const currentTabName = currentActiveTab
      ? currentActiveTab.getAttribute("data-tab")
      : "unknown";
    
    console.log("[DEBUG-AI] 当前活动tab:", currentTabName);

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0]) {
        const url = tabs[0].url;
        // 获取当前选中的总结类型
        const summaryType = document.querySelector(
          'input[name="summary-type"]:checked'
        ).value;

        const summaryData = loadAISummary(url, summaryType);

        // 检查是否存在任何类型的AI总结
        const fullSummaryData = loadAISummary(url, "full");
        const keySummaryData = loadAISummary(url, "keyinfo");
        const hasAnySummary = fullSummaryData || keySummaryData;

        if (summaryData) {
          displayCachedAISummary(summaryData);
          // 显示清除缓存按钮
          document.getElementById("clear-cache-btn").style.display =
            "inline-block";

          // 如果存在AI总结，自动切换到AI tab
          switchTab("ai");
        } else {
          console.log("[DEBUG-AI] storage中没有对应类型的总结数据，尝试从数据库加载");
          // 如果storage中没有对应类型的总结数据，尝试从数据库加载summarizer
          getNews(url)
            .then((newsData) => {
              console.log("[DEBUG-AI] 数据库查询完成，结果:", newsData);
              if (displayNewsSummarizer(newsData)) {
                console.log("[DEBUG-AI] 成功显示数据库summarizer数据，切换到AI tab");
                // 如果成功从数据库显示了summarizer数据，切换到AI tab
                switchTab("ai");
              } else {
                console.log("[DEBUG-AI] 数据库中也没有summarizer数据，隐藏AI总结区域");
                // 如果数据库中也没有summarizer数据，隐藏AI总结结果区域
                document.getElementById("ai-status-section").style.display =
                  "none";
                document.getElementById("ai-summary-result").innerHTML = `
                <div style="text-align: center; color: #666; padding: 3px;">
                  点击"AI总结"按钮开始生成网页内容总结
                </div>
              `;
                // 隐藏整个AI总结内容区域
                const aiSummarySection = document.querySelector(
                  "#ai-tab .section:nth-child(2)"
                );
                if (aiSummarySection) {
                  aiSummarySection.style.display = "none";
                }
                // 隐藏清除缓存按钮
                document.getElementById("clear-cache-btn").style.display =
                  "none";

                // 如果没有任何AI总结，只有在非AI tab时才切换到results tab
                if (currentTabName !== "ai") {
                  switchTab("results");
                }
              }
            })
            .catch((error) => {
              console.error("[DEBUG-AI] 从数据库获取新闻数据失败:", error);
              // 如果获取数据库数据失败，也隐藏AI总结结果区域
              document.getElementById("ai-status-section").style.display =
                "none";
              document.getElementById("ai-summary-result").innerHTML = `
              <div style="text-align: center; color: #666; padding: 3px;">
                点击"AI总结"按钮开始生成网页内容总结
              </div>
            `;
              // 隐藏整个AI总结内容区域
              const aiSummarySection = document.querySelector(
                "#ai-tab .section:nth-child(2)"
              );
              if (aiSummarySection) {
                aiSummarySection.style.display = "none";
              }
              // 隐藏清除缓存按钮
              document.getElementById("clear-cache-btn").style.display = "none";

              // 如果没有任何AI总结，只有在非AI tab时才切换到results tab
              if (currentTabName !== "ai") {
                switchTab("results");
              }
            });
        }

        // 如果存在任何类型的AI总结，但当前选中的类型没有数据，
        // 只有在用户不在AI tab中操作时才自动切换到有数据的总结类型
        if (hasAnySummary && !summaryData && currentTabName !== "ai") {
          if (fullSummaryData) {
            document.querySelector(
              'input[name="summary-type"][value="full"]'
            ).checked = true;
            displayCachedAISummary(fullSummaryData);
            document.getElementById("clear-cache-btn").style.display =
              "inline-block";
          } else if (keySummaryData) {
            document.querySelector(
              'input[name="summary-type"][value="keyinfo"]'
            ).checked = true;
            displayCachedAISummary(keySummaryData);
            document.getElementById("clear-cache-btn").style.display =
              "inline-block";
          }
          // 自动切换到AI tab
          switchTab("ai");
        }
      }
      
      // 无论成功与否，都要重置加载状态标志
      isLoadingAISummary = false;
    });
  }

  // 统一的AI总结加载函数，避免重复逻辑
  async function loadAndDisplayAISummary(url, source = "unknown") {
    console.log(`[DEBUG-AI] loadAndDisplayAISummary() 被调用，来源: ${source}, URL: ${url}`);
    
    // 检查是否正在加载AI总结，防止竞态条件
    if (isLoadingAISummary) {
      console.log("[DEBUG-AI] 正在加载AI总结，跳过此次请求");
      return;
    }
    
    // 设置加载状态标志
    isLoadingAISummary = true;
    
    try {
      // 获取当前选中的总结类型
      const summaryType = document.querySelector(
        'input[name="summary-type"]:checked'
      ).value;
      
      // 首先尝试从storage加载AI总结
      const summaryData = loadAISummary(url, summaryType);
      
      if (summaryData) {
        console.log(`[DEBUG-AI] 从${source}的storage中找到总结数据`);
        displayCachedAISummary(summaryData);
        switchTab("ai");
      } else {
        console.log(`[DEBUG-AI] 从${source}的storage中没有数据，尝试从数据库加载`);
        // 如果storage中没有，再从数据库加载summarizer
        const newsData = await getNews(url);
        
        if (displayNewsSummarizer(newsData)) {
          console.log(`[DEBUG-AI] 从${source}的数据库中成功显示summarizer数据`);
          switchTab("ai");
        } else {
          console.log(`[DEBUG-AI] 从${source}的数据库中也没有summarizer数据`);
          // 如果数据库中也没有summarizer数据，隐藏AI总结结果区域
          document.getElementById("ai-status-section").style.display = "none";
          document.getElementById("ai-summary-result").innerHTML = `
          <div style="text-align: center; color: #666; padding: 3px;">
            点击"AI总结"按钮开始生成网页内容总结
          </div>
        `;
          // 隐藏整个AI总结内容区域
          const aiSummarySection = document.querySelector(
            "#ai-tab .section:nth-child(2)"
          );
          if (aiSummarySection) {
            aiSummarySection.style.display = "none";
          }
          // 隐藏清除缓存按钮
          document.getElementById("clear-cache-btn").style.display = "none";
        }
      }
    } catch (error) {
      console.error(`[DEBUG-AI] 从${source}加载AI总结时出错:`, error);
      // 如果获取数据失败，也隐藏AI总结结果区域
      document.getElementById("ai-status-section").style.display = "none";
      document.getElementById("ai-summary-result").innerHTML = `
      <div style="text-align: center; color: #666; padding: 3px;">
        点击"AI总结"按钮开始生成网页内容总结
      </div>
    `;
      // 隐藏整个AI总结内容区域
      const aiSummarySection = document.querySelector(
        "#ai-tab .section:nth-child(2)"
      );
      if (aiSummarySection) {
        aiSummarySection.style.display = "none";
      }
      // 隐藏清除缓存按钮
      document.getElementById("clear-cache-btn").style.display = "none";
    } finally {
      // 无论成功与否，都要重置加载状态标志
      isLoadingAISummary = false;
    }
  }

  // 清除当前URL的AI总结缓存
  function clearAISummaryCacheForCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0]) {
        const url = tabs[0].url;
        // 获取当前选中的总结类型
        const summaryType = document.querySelector(
          'input[name="summary-type"]:checked'
        ).value;
        clearAISummaryCache(url, summaryType);

        // 重置AI总结区域
        document.getElementById("ai-summary-result").innerHTML = `
          <div style="text-align: center; color: #666; padding: 20px;">
            点击"AI总结"按钮开始生成网页内容总结
          </div>
        `;

        toastManager.success("缓存已清除");
      }
    });
  }

  // 清空panel数据
  function clearPanelData() {
    // 清空提取的数据
    extractedData = {};

    // 清空显示的内容
    document.getElementById("page-info-result").innerHTML = "";
    document.getElementById("images-result").innerHTML = "";
    document.getElementById("links-result").innerHTML = "";
    document.getElementById("images-count").textContent = "0";
    document.getElementById("links-count").textContent = "0";
    document.getElementById("words-count").textContent = "0";

    // 清空AI总结区域
    document.getElementById("ai-summary-result").innerHTML = `
      <div style="text-align: center; color: #666; padding: 20px;">
        点击"AI总结"按钮开始生成网页内容总结
      </div>
    `;
    document.getElementById("ai-status-section").style.display = "none";

    // 隐藏AI总结内容区域
    const aiSummarySection = document.querySelector(
      "#ai-tab .section:nth-child(2)"
    );
    if (aiSummarySection) {
      aiSummarySection.style.display = "none";
    }

    // 禁用AI总结按钮并更新文本
    const aiSummaryBtn = document.getElementById("ai-summary-btn");
    const aiSummaryBtnText = document.getElementById("ai-summary-btn-text");
    if (aiSummaryBtn) {
      aiSummaryBtn.disabled = true;
      if (aiSummaryBtnText) {
        aiSummaryBtnText.textContent = "等待页面加载...";
      }
    }
  }

  // 当切换到新的tab或URL变化时刷新数据
  function refreshDataForNewTab() {
    console.log("[DEBUG] refreshDataForNewTab() 函数被调用");

    // 立即清空当前panel数据
    clearPanelData();

    // 获取当前tab的加载状态
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || !tabs[0]) {
        console.log("[DEBUG] 无法获取当前tab信息");
        return;
      }

      const currentTab = tabs[0];
      console.log("[DEBUG] 当前tab状态:", currentTab.status);

      // 检查页面是否正在加载
      if (currentTab.status === "loading") {
        console.log("[DEBUG] 页面正在加载中，保持loading状态");

        // 设置AI总结按钮为loading状态
        const aiSummaryBtn = document.getElementById("ai-summary-btn");
        const aiSummaryBtnText = document.getElementById("ai-summary-btn-text");
        if (aiSummaryBtn) {
          aiSummaryBtn.disabled = true;
          if (aiSummaryBtnText) {
            aiSummaryBtnText.textContent = "页面加载中...";
          }
        }

        // 等待页面加载完成
        waitForPageLoadComplete(currentTab.id);
      } else {
        console.log("[DEBUG] 页面已加载完成，立即提取数据");

        // 延迟执行以确保新页面已完全加载
        setTimeout(() => {
          console.log(
            "[DEBUG] 在refreshDataForNewTab的setTimeout中调用extractData()"
          );
          // 提取新页面的数据
          extractData();

          // 获取当前URL的新闻数据
          if (currentTab.url) {
            // 使用统一的AI总结加载函数
            loadAndDisplayAISummary(currentTab.url, "refreshDataForNewTab");
          }

          // 页面数据加载完成后，启用AI总结按钮并恢复原始文本
          const aiSummaryBtn = document.getElementById("ai-summary-btn");
          const aiSummaryBtnText = document.getElementById(
            "ai-summary-btn-text"
          );
          if (aiSummaryBtn) {
            aiSummaryBtn.disabled = false;
            if (aiSummaryBtnText) {
              aiSummaryBtnText.textContent = "AI总结";
            }
          }
        }, 500);
      }
    });
  }

  // 等待页面加载完成
  function waitForPageLoadComplete(tabId) {
    console.log("[DEBUG] 开始等待页面加载完成，tabId:", tabId);

    // 设置超时时间，防止无限等待
    const timeout = setTimeout(() => {
      console.log("[DEBUG] 页面加载超时，强制执行数据提取");
      proceedWithDataExtraction();
    }, 30000); // 30秒超时

    // 监听tab更新事件
    const updateListener = (updatedTabId, changeInfo, tab) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        console.log("[DEBUG] 检测到页面加载完成");
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(updateListener);
        proceedWithDataExtraction();
      }
    };

    chrome.tabs.onUpdated.addListener(updateListener);

    // 检查当前tab是否已经加载完成（防止在添加监听器之前就已经完成）
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.error("[DEBUG] 获取tab信息失败:", chrome.runtime.lastError);
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(updateListener);
        return;
      }

      if (tab.status === "complete") {
        console.log("[DEBUG] 当前tab已经加载完成");
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(updateListener);
        proceedWithDataExtraction();
      }
    });
  }

  // 执行数据提取和相关操作
  function proceedWithDataExtraction() {
    console.log("[DEBUG-AI] proceedWithDataExtraction() 开始执行");

    // 提取新页面的数据
    extractData();

    // 加载新页面的AI总结
    loadAISummaryForCurrentTab();

    // 获取当前URL的新闻数据
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        console.log("[DEBUG-AI] proceedWithDataExtraction中处理URL:", tabs[0].url);
        // 使用统一的AI总结加载函数
        loadAndDisplayAISummary(tabs[0].url, "proceedWithDataExtraction");
      }
    });

    // 页面数据加载完成后，启用AI总结按钮并恢复原始文本
    const aiSummaryBtn = document.getElementById("ai-summary-btn");
    const aiSummaryBtnText = document.getElementById("ai-summary-btn-text");
    if (aiSummaryBtn) {
      aiSummaryBtn.disabled = false;
      if (aiSummaryBtnText) {
        aiSummaryBtnText.textContent = "AI总结";
      }
    }
  }
});
