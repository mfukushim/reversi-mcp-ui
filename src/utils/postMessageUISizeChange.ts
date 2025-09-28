// inform MCP host of UI height
export const postMessageUISizeChange = `
<script>
  const containerTag = '.wrap'

// Wait for both DOM and images to load
function waitForContent() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

// Initial height posting with retry logic
async function initializeHeight() {
  console.log("Initializing height calculation...");
  await waitForContent();
  
  // Try multiple times with delays
  for (let i = 0; i < 3; i++) {
    console.log('Height attempt ' + (i + 1) + '/3');
    postHeight('initial attempt ' + (i + 1));
    
    // Wait a bit before next attempt
    if (i < 2) {
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
}

// Set up resize observer
function setupResizeObserver() {
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) { 
      console.log("Resize detected:", entry.target, entry.contentRect);
      postHeight("triggered by resize observer");
    }
  });
  
  // Only observe mcp-ui-container
  const container = document.querySelector(containerTag);
  if (container) {
    console.log("Observing mcp-ui-container for resize");
    resizeObserver.observe(container);
  } else {
    console.error("mcp-ui-container not found for resize observer");
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired");
    initializeHeight();
    setupResizeObserver();
  });
} else {
  // DOM is already loaded
  console.log("DOM already loaded, initializing immediately");
  initializeHeight();
  setupResizeObserver();
}
  const mcpUiContainer = document.querySelector(containerTag);
  
  function postSize() {
    const height = mcpUiContainer.scrollHeight;
    const width = mcpUiContainer.scrollWidth;
    window.parent.postMessage(
      {
        type: "ui-size-change",
        payload: {
          height: height,
          width: width, 
        },
      },
      "*",
    );
  }

  // Create ResizeObserver to watch for size changes
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      // Post size whenever document size changes
      postSize();
    }
  });

  // Start observing the mcp-ui-container element
  resizeObserver.observe(mcpUiContainer);
</script>`;
/*
function getActualHeight() {
  const container = document.querySelector(containerTag);

  if (!container) {
    console.error('mcp-ui-container element not found');
    return { container: null, height: 0 };
  }

  const rect = container.getBoundingClientRect();
  const height = rect.height;

  console.log('mcp-ui-container height:', height);

  return { container, height };
}

function postHeight(info) {
  const { container, height } = getActualHeight();
  console.log("posting height", container, height, info);

  if (height > 0) {
    window.parent.postMessage({
      type: 'size-change',
      payload: {
        height: height + 'px',
        info: info
      }
    }, '*');
  } else {
    console.warn("Height is 0, not posting message", info);
  }
}

 */
/*
  const containerTag = '.wrap'
  function getActualHeight() {
  const container = document.querySelector(containerTag);

  if (!container) {
    console.error('mcp-ui-container element not found');
    return { container: null, height: 0 };
  }

  const rect = container.getBoundingClientRect();
  const height = rect.height;

  console.log('mcp-ui-container height:', height);

  return { container, height };
}

function postHeight(info) {
  const { container, height } = getActualHeight();
  console.log("posting height", container, height, info);

  if (height > 0) {
    window.parent.postMessage({
      type: 'size-change',
      payload: {
        height: height + 'px',
        info: info
      }
    }, '*');
  } else {
    console.warn("Height is 0, not posting message", info);
  }
}

// Wait for both DOM and images to load
function waitForContent() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

// Initial height posting with retry logic
async function initializeHeight() {
  console.log("Initializing height calculation...");
  await waitForContent();

  // Try multiple times with delays
  for (let i = 0; i < 3; i++) {
    console.log('Height attempt ' + (i + 1) + '/3');
    postHeight('initial attempt ' + (i + 1));

    // Wait a bit before next attempt
    if (i < 2) {
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
}

// Set up resize observer
function setupResizeObserver() {
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      console.log("Resize detected:", entry.target, entry.contentRect);
      postHeight("triggered by resize observer");
    }
  });

  // Only observe mcp-ui-container
  const container = document.querySelector(containerTag);
  if (container) {
    console.log("Observing mcp-ui-container for resize");
    resizeObserver.observe(container);
  } else {
    console.error("mcp-ui-container not found for resize observer");
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired");
    initializeHeight();
    setupResizeObserver();
  });
} else {
  // DOM is already loaded
  console.log("DOM already loaded, initializing immediately");
  initializeHeight();
  setupResizeObserver();
}

*/
/*
  const mcpUiContainer = document.querySelector('.wrap');
  function postSize() {
    const height = mcpUiContainer.scrollHeight;
    const width = mcpUiContainer.scrollWidth;
    console.log('postSize',width,height);
    window.parent.postMessage({
        type: 'ui-size-change',
        payload: {
          height: height + 'px',
          width: width+'px',
        },
      }, '*');
  }

  // Create ResizeObserver to watch for size changes
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      // Post size whenever document size changes
      postSize();
    }
  });

  // Start observing the mcp-ui-container element
  resizeObserver.observe(mcpUiContainer);
*/
/*
function getActualHeight() {
  const container = document.querySelector('.mcp-ui-container');

  if (!container) {
    console.error('mcp-ui-container element not found');
    return { container: null, height: 0 };
  }

  const rect = container.getBoundingClientRect();
  const height = rect.height;

  console.log('mcp-ui-container height:', height);

  return { container, height };
}

function postHeight(info) {
  const { container, height } = getActualHeight();
  console.log("posting height", container, height, info);

  if (height > 0) {
    window.parent.postMessage({
      type: 'size-change',
      payload: {
        height: height + 'px',
        info: info
      }
    }, '*');
  } else {
    console.warn("Height is 0, not posting message", info);
  }
}

// Set up resize observer
function setupResizeObserver() {
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      console.log("Resize detected:", entry.target, entry.contentRect);
      postHeight("triggered by resize observer");
    }
  });

  // Only observe mcp-ui-container
  const container = document.querySelector('.mcp-ui-container');
  if (container) {
    console.log("Observing mcp-ui-container for resize");
    resizeObserver.observe(container);
  } else {
    console.error("mcp-ui-container not found for resize observer");
  }
}

 */