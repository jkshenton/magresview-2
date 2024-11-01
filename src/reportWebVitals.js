const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals')
      .then((webVitals) => {
        // Note onFID is deprecated and will be removed in the next major version of web-vitals
        const { onCLS, onFID, onFCP, onLCP, onTTFB } = webVitals;
        
        // Call the functions with the callback
        onCLS(onPerfEntry);
        onFID(onPerfEntry);
        onFCP(onPerfEntry);
        onLCP(onPerfEntry);
        onTTFB(onPerfEntry);
      })
      .catch((error) => {
        console.error('Error loading web-vitals:', error);
      });
  }
};

export default reportWebVitals;
