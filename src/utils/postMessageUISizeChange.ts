// inform MCP host of UI height
export const postMessageUISizeChange = `
<script>
  const mcpUiContainer = document.querySelector('.wrap');
  
  function postSize() {
    const height = mcpUiContainer.scrollHeight;
    const width = mcpUiContainer.scrollWidth;
    console.log('postSize',width,height);
    window.parent.postMessage({
        type: 'size-change',
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
</script>`;
