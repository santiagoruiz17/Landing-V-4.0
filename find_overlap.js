const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/calculadora.html', { waitUntil: 'networkidle0' });
    
    // Evaluate in browser context
    const overlayElement = await page.evaluate(() => {
        // Find the button's position
        let btn = document.getElementById('btn-automotriz');
        if (!btn) return "Button not found";
        let rect = btn.getBoundingClientRect();
        
        // Find what's on top of its center
        let cx = rect.left + rect.width / 2;
        let cy = rect.top + rect.height / 2;
        
        let el = document.elementFromPoint(cx, cy);
        
        if (!el) return "Nothing found at point " + cx + "," + cy;
        
        return {
            tag: el.tagName,
            id: el.id,
            className: el.className,
            html: el.outerHTML.substring(0, 150)
        };
    });
    
    console.log("Element blocking coords:", overlayElement);
    
    await browser.close();
})();
