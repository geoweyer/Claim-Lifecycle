// Assembles dist-artifact/claim-lifecycle-explorer.html: a single page with the styles
// and script inline and React loaded from a CDN. Run after `vite build -c vite.artifact.config.ts`.
import { readFileSync, writeFileSync } from 'node:fs';

const css = readFileSync('dist-artifact/app.css', 'utf8');
const js = readFileSync('dist-artifact/app.js', 'utf8').replace(/<\/script/gi, '<\\/script');
const cdn = 'https://cdnjs.cloudflare.com/ajax/libs';

const page = `<title>Claim Lifecycle Explorer</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
<div id="root"></div>
<script src="${cdn}/react/18.3.1/umd/react.production.min.js"></script>
<script src="${cdn}/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>
${js}
</script>
`;
writeFileSync('dist-artifact/claim-lifecycle-explorer.html', page);
console.log('wrote dist-artifact/claim-lifecycle-explorer.html', (page.length / 1024).toFixed(0) + ' KB');
