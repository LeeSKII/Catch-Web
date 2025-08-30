document.addEventListener('DOMContentLoaded', function() {
  // 初始化变量
  let extractedData = {};
  let currentTab = 'extract';
  
  // 加载保存的设置
  loadSettings();
  
  // 标签切换功能
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // 提取按钮事件
  document.getElementById('extract-btn').addEventListener('click', extractData);
  
  // 复制全部按钮事件
  document.getElementById('copy-all-btn').addEventListener('click', copyAllData);
  
  // 查看全部图片按钮事件
  document.getElementById('view-images-btn').addEventListener('click', viewAllImages);
  
  // 下载全部图片按钮事件
  document.getElementById('download-images-btn').addEventListener('click', downloadAllImages);
  
  // 查看全部链接按钮事件
  document.getElementById('view-links-btn').addEventListener('click', viewAllLinks);
  
  // 导出按钮事件
  document.getElementById('export-btn').addEventListener('click', exportData);
  
  // 清除按钮事件
  document.getElementById('clear-btn').addEventListener('click', clearData);
  
  // 保存设置按钮事件
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
  
  // 图片过滤功能
  document.getElementById('image-filter').addEventListener('input', filterImages);
  
  // 链接过滤功能
  document.getElementById('link-filter').addEventListener('input', filterLinks);
  
  // 暗色模式切换
  document.getElementById('dark-mode').addEventListener('change', toggleDarkMode);
  
  // 如果设置了自动提取，则打开时自动提取
  if (localStorage.getItem('autoExtract') === 'true') {
    extractData();
  }
  
  // 切换标签页函数
  function switchTab(tabName) {
    // 更新活动标签
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });
    
    // 更新活动内容
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    currentTab = tabName;
  }
  
  // 加载设置
  function loadSettings() {
    document.getElementById('auto-extract').checked = localStorage.getItem('autoExtract') === 'true';
    document.getElementById('show-previews').checked = localStorage.getItem('showPreviews') !== 'false';
    document.getElementById('dark-mode').checked = localStorage.getItem('darkMode') === 'true';
    document.getElementById('data-retention').value = localStorage.getItem('dataRetention') || '7';
    
    // 应用暗色模式
    if (localStorage.getItem('darkMode') === 'true') {
      document.documentElement.style.setProperty('--light-color', '#212529');
      document.documentElement.style.setProperty('--dark-color', '#f8f9fa');
    }
  }
  
  // 保存设置
  function saveSettings() {
    localStorage.setItem('autoExtract', document.getElementById('auto-extract').checked);
    localStorage.setItem('showPreviews', document.getElementById('show-previews').checked);
    localStorage.setItem('darkMode', document.getElementById('dark-mode').checked);
    localStorage.setItem('dataRetention', document.getElementById('data-retention').value);
    
    alert('设置已保存！');
  }
  
  // 切换暗色模式
  function toggleDarkMode() {
    if (document.getElementById('dark-mode').checked) {
      document.documentElement.style.setProperty('--light-color', '#212529');
      document.documentElement.style.setProperty('--dark-color', '#f8f9fa');
    } else {
      document.documentElement.style.setProperty('--light-color', '#f8f9fa');
      document.documentElement.style.setProperty('--dark-color', '#212529');
    }
  }
  
  // 提取数据函数
  function extractData() {
    // 获取选中的提取选项
    const options = {
      html: document.getElementById('extract-html').checked,
      text: document.getElementById('extract-text').checked,
      images: document.getElementById('extract-images').checked,
      links: document.getElementById('extract-links').checked,
      meta: document.getElementById('extract-meta').checked,
      styles: document.getElementById('extract-styles').checked,
      scripts: document.getElementById('extract-scripts').checked
    };
    
    // 如果没有选中任何选项，提示用户
    if (!Object.values(options).some(opt => opt)) {
      alert('请至少选择一个提取选项！');
      return;
    }
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: getPageData,
        args: [options]
      }, (results) => {
        if (results && results[0]) {
          extractedData = results[0].result;
          
          // 显示统计信息
          displayStats(extractedData);
          
          // 显示提取结果
          displayResults(extractedData);
          
          // 切换到结果标签页
          switchTab('results');
          
          // 保存提取的数据
          saveExtractedData(extractedData);
        } else if (chrome.runtime.lastError) {
          console.error('提取错误:', chrome.runtime.lastError);
          alert('提取失败: ' + chrome.runtime.lastError.message);
        }
      });
    });
  }
  
  // 在页面上执行的数据提取函数
  function getPageData(options) {
    const data = {};
    const startTime = performance.now();
    
    if (options.html) {
      data.html = document.documentElement.outerHTML;
    }
    
    if (options.text) {
      data.text = document.body.innerText;
      data.wordCount = data.text.length;
    }
    
    if (options.images) {
      data.images = Array.from(document.images).map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      }));
    }
    
    if (options.links) {
      data.links = Array.from(document.links).map(link => ({
        href: link.href,
        text: link.textContent.trim(),
        title: link.title,
        rel: link.rel
      })).filter(link => link.href && !link.href.startsWith('javascript:'));
    }
    
    if (options.meta) {
      data.meta = {};
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach(tag => {
        const name = tag.getAttribute('name') || tag.getAttribute('property') || 'unknown';
        data.meta[name] = tag.getAttribute('content');
      });
      data.title = document.title;
      data.url = window.location.href;
    }
    
    if (options.styles) {
      data.styles = {
        styleSheets: Array.from(document.styleSheets).map(sheet => sheet.href || 'inline'),
        styles: Array.from(document.querySelectorAll('style')).map(style => style.innerHTML)
      };
    }
    
    if (options.scripts) {
      data.scripts = Array.from(document.scripts).map(script => ({
        src: script.src,
        type: script.type,
        async: script.async,
        defer: script.defer
      }));
    }
    
    data.extractionTime = performance.now() - startTime;
    data.extractedAt = new Date().toISOString();
    
    return data;
  }
  
  // 显示统计信息
  function displayStats(data) {
    document.getElementById('images-count').textContent = data.images ? data.images.length : 0;
    document.getElementById('links-count').textContent = data.links ? data.links.length : 0;
    document.getElementById('words-count').textContent = data.wordCount || 0;
  }
  
  // 显示提取结果
  function displayResults(data) {
    // 显示网页信息
    displayPageInfo(data);
    
    // 显示图片
    displayImages(data.images);
    
    // 显示链接
    displayLinks(data.links);
  }
  
  // 显示网页信息
  function displayPageInfo(data) {
    const pageInfoElement = document.getElementById('page-info-result');
    let html = '';
    
    if (data.title) {
      html += `<div><strong>标题:</strong> ${data.title}</div>`;
    }
    
    if (data.url) {
      html += `<div><strong>URL:</strong> ${data.url}</div>`;
    }
    
    if (data.meta) {
      html += '<div><strong>元标签:</strong><ul>';
      for (const [name, content] of Object.entries(data.meta)) {
        if (content && content.length < 100) { // 限制长度避免显示过长内容
          html += `<li><strong>${name}:</strong> ${content}</li>`;
        }
      }
      html += '</ul></div>';
    }
    
    if (data.wordCount) {
      html += `<div><strong>字数:</strong> ${data.wordCount}</div>`;
    }
    
    if (data.extractionTime) {
      html += `<div><strong>提取耗时:</strong> ${data.extractionTime.toFixed(2)}ms</div>`;
    }
    
    pageInfoElement.innerHTML = html;
  }
  
  // 显示图片
  function displayImages(images) {
    const imagesElement = document.getElementById('images-result');
    
    if (!images || images.length === 0) {
      imagesElement.innerHTML = '<div>未提取到图片</div>';
      return;
    }
    
    let html = '';
    
    // 只显示前12张图片的预览
    const imagesToShow = images.slice(0, 12);
    
    imagesToShow.forEach(img => {
      html += `
        <div class="image-item">
          <img src="${img.src}" alt="${img.alt || '无描述'}">
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
    const linksElement = document.getElementById('links-result');
    
    if (!links || links.length === 0) {
      linksElement.innerHTML = '<div>未提取到链接</div>';
      return;
    }
    
    let html = '';
    
    // 只显示前10个链接
    const linksToShow = links.slice(0, 10);
    
    linksToShow.forEach(link => {
      html += `<div><strong>${link.text || '无文本'}:</strong> <a href="${link.href}" target="_blank">${link.href}</a></div>`;
    });
    
    // 如果链接数量超过10个，显示查看全部的提示
    if (links.length > 10) {
      html += `<div>... 还有 ${links.length - 10} 个链接</div>`;
    }
    
    linksElement.innerHTML = html;
  }
  
  // 过滤图片
  function filterImages() {
    const filterText = document.getElementById('image-filter').value.toLowerCase();
    const images = extractedData.images || [];
    
    if (!filterText) {
      displayImages(images);
      return;
    }
    
    const filteredImages = images.filter(img => 
      img.src.toLowerCase().includes(filterText) || 
      (img.alt && img.alt.toLowerCase().includes(filterText))
    );
    
    displayImages(filteredImages);
  }
  
  // 过滤链接
  function filterLinks() {
    const filterText = document.getElementById('link-filter').value.toLowerCase();
    const links = extractedData.links || [];
    
    if (!filterText) {
      displayLinks(links);
      return;
    }
    
    const filteredLinks = links.filter(link => 
      link.href.toLowerCase().includes(filterText) || 
      (link.text && link.text.toLowerCase().includes(filterText))
    );
    
    displayLinks(filteredLinks);
  }
  
  // 查看全部图片
  function viewAllImages() {
    if (!extractedData.images || extractedData.images.length === 0) {
      alert('没有可查看的图片');
      return;
    }
    
    // 在新标签页中打开图片查看器
    chrome.tabs.create({
      url: chrome.runtime.getURL('image-viewer.html')
    });
  }
  
  // 下载全部图片
  function downloadAllImages() {
    if (!extractedData.images || extractedData.images.length === 0) {
      alert('没有可下载的图片');
      return;
    }
    
    // 这里应该实现下载逻辑
    alert(`开始下载 ${extractedData.images.length} 张图片`);
    
    // 实际实现会使用chrome.downloads API
    extractedData.images.forEach((img, index) => {
      chrome.downloads.download({
        url: img.src,
        filename: `image-${index + 1}.${img.src.split('.').pop().split('?')[0]}`,
        saveAs: false
      });
    });
  }
  
  // 查看全部链接
  function viewAllLinks() {
    if (!extractedData.links || extractedData.links.length === 0) {
      alert('没有可查看的链接');
      return;
    }
    
    // 在新标签页中打开链接查看器
    chrome.tabs.create({
      url: chrome.runtime.getURL('link-viewer.html')
    });
  }
  
  // 复制全部数据
  function copyAllData() {
    const text = JSON.stringify(extractedData, null, 2);
    
    navigator.clipboard.writeText(text).then(() => {
      alert('数据已复制到剪贴板！');
    }).catch(err => {
      console.error('复制失败:', err);
      alert('复制失败，请重试');
    });
  }
  
  // 导出数据
  function exportData() {
    if (Object.keys(extractedData).length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    const blob = new Blob([JSON.stringify(extractedData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    // 获取标题和URL来构建文件名
    let title = extractedData.title || 'untitled';
    let urlPart = extractedData.url || 'no-url';
    
    // 清理标题，移除不适合文件名的字符
    title = title.replace(/[\\/:*?"<>|]/g, '-').substring(0, 50);
    
    // 从URL中提取域名部分
    try {
      const urlObj = new URL(urlPart);
      urlPart = urlObj.hostname.replace(/^www\./, '');
    } catch (e) {
      urlPart = 'invalid-url';
    }
    
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${title}-${urlPart}-${date}.json`;
    
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });
  }
  
  // 清除数据
  function clearData() {
    if (confirm('确定要清除所有提取的数据吗？')) {
      extractedData = {};
      document.getElementById('page-info-result').innerHTML = '';
      document.getElementById('images-result').innerHTML = '';
      document.getElementById('links-result').innerHTML = '';
      document.getElementById('images-count').textContent = '0';
      document.getElementById('links-count').textContent = '0';
      document.getElementById('words-count').textContent = '0';
      
      // 清除存储的数据
      localStorage.removeItem('extractedData');
    }
  }
  
  // 保存提取的数据
  function saveExtractedData(data) {
    // 只保存必要的数据，避免存储过大
    const dataToSave = {
      meta: data.meta,
      title: data.title,
      url: data.url,
      wordCount: data.wordCount,
      imagesCount: data.images ? data.images.length : 0,
      linksCount: data.links ? data.links.length : 0,
      extractedAt: data.extractedAt
    };
    
    localStorage.setItem('extractedData', JSON.stringify(dataToSave));
  }
});