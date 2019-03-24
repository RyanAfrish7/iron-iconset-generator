import { SVGPathData } from "svg-pathdata";

const readFileAsText = (inputFile) => {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
        fileReader.onerror = () => {
            fileReader.abort();
            reject(new DOMException("Problem parsing input file."));
        };

        fileReader.onload = () => {
            resolve(fileReader.result);
        };

        fileReader.readAsText(inputFile);
    });
};

export function generateIconsetFromSvgCollection(collection, collectionName) {
    const domParser = new DOMParser();

    return `
        import '@polymer/iron-icon/iron-icon.js';
        import '@polymer/iron-iconset-svg/iron-iconset-svg.js';

        import {html} from '@polymer/polymer/lib/utils/html-tag.js';

        const template = html\`<iron-iconset-svg name="${collectionName}" size="24">
        <svg><defs>${
            collection
                .map(icon => {
                    const svgDoc = domParser.parseFromString(icon.svgContent, "image/svg+xml");
                    const g = svgDoc.createElement("g");
                    Array.from(svgDoc.rootElement.children).forEach(g.appendChild.bind(g));
                    g.id = icon.name;
                    return g.outerHTML;
                })
                .reduce((a, x) => `${a}\n${x}`)
        }</defs></svg>
        </iron-iconset-svg>\`;
        document.head.appendChild(template.content);
    `;
}

export async function processSvgFile(file) {
    const svg = await readFileAsText(file);
    const svgDoc = new DOMParser().parseFromString(svg, "image/svg+xml");
    
    const SVG_NORMAL_SIZE = 24;

    const svgRoot = svgDoc.rootElement;
    Array.from(svgRoot.querySelectorAll("g"))
        .filter(g => !g.childElementCount > 0)
        .forEach(g => g.remove());
    
    const paths = Array.from(svgRoot.querySelectorAll("path"));
    const { minX, minY, maxX, maxY } = paths.map(path => new SVGPathData(path.getAttribute("d")).toAbs().getBounds())
        .reduce(( { minX, minY, maxX, maxY } , { minX: currentMinX, minY: currentMinY, maxX: currentMaxX, maxY: currentMaxY }) => ({ 
            minX: Math.min(minX, currentMinX),
            minY: Math.min(minY, currentMinY),
            maxX: Math.max(maxX, currentMaxX),
            maxY: Math.max(maxY, currentMaxY)
        }), { 
            minX: Number.POSITIVE_INFINITY, 
            maxX: Number.NEGATIVE_INFINITY, 
            minY: Number.POSITIVE_INFINITY, 
            maxY: Number.NEGATIVE_INFINITY
        });
    
    const [ scaleX, scaleY ] = (maxX - minX) > (maxY - minY) 
        ? [ SVG_NORMAL_SIZE / (maxX - minX), SVG_NORMAL_SIZE / (maxX - minX) ] 
        : [ SVG_NORMAL_SIZE / (maxY - minY), SVG_NORMAL_SIZE / (maxY - minY) ];
    const [ offsetX, offsetY ] = (maxX - minX) > (maxY - minY)
        ? [ 0, (maxY - minY) * scaleY / 2 ]
        : [ (maxX - minX) * scaleX / 2, 0 ];

    paths.forEach(path => {
            const pathData = new SVGPathData(path.getAttribute("d")).toAbs();
                
            pathData.translate(offsetX, offsetY);
            pathData.scale(scaleX, scaleY);

            path.setAttribute("d", pathData.encode());
        });
    
    svgRoot.setAttribute("viewBox", "0 0 24 24");
    
    return svgRoot.outerHTML;
}
