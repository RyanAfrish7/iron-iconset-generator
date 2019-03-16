import { LitElement, html } from "lit-element";

class AppMain extends LitElement {
    render() {
        return html`
            <div id="header">Iron Iconset Generator</div>
        `;
    }
}

window.customElements.define("app-main", AppMain);