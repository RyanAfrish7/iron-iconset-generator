import { LitElement, html } from "lit-element";

import "@polymer/iron-icon";
import "@polymer/iron-icons";

class AppMain extends LitElement {
    static get properties() {
        return {
            filesBeingDraggedIntoCount: { type: Number }
        };
    }
    
    render() {
        return html`
            <style>
                :host {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }

                #header {
                    padding: 18px;
                }

                #header .title {
                    font-size: 24px;
                    font-weight: 400;
                }

                #space {
                    position: relative;
                    flex-grow: 1;
                }

                #space > .padded {
                    padding-left: 18px;
                    padding-right: 18px;
                }

                #dragdropoverlay {
                    display: flex;
                    background-color: #fff;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    color: rgba(0, 0, 0, 0.54);
                    visibility: collapse;
                }

                p.secondary {
                    color: rgba(0, 0, 0, 0.54);
                    font-size: 12px;
                }

                span.clickable:hover {
                    cursor: pointer;
                    text-decoration: underline;
                }

                [hidden] {
                    display: none;
                }
            </style>
            <div id="header">
                <div class="title">Iron Iconset Generator</div>
            </div>
            <div id="space">
                <p class="secondary padded">
                    Drag & drop one or more SVG files or <span class="clickable" @click=${() => this.shadowRoot.querySelector('#fileinput').click()}>alternatively click here to open the file chooser</span>
                </p>
                <input type="file" id="fileinput" hidden multiple>
                <div id="collection">
                    
                </div>
                <div id="dragdropoverlay">
                    <iron-icon icon="icons:add-circle-outline" style="width: 48px; height: 48px"></iron-icon>
                    <span style="margin-top: 24px">${
                        this.filesBeingDraggedIntoCount ? `Recognized ${this.filesBeingDraggedIntoCount} SVG files` : `No SVG files recognized`
                    }</span>
                </div>
            </div>
        `;
    }

    constructor() {
        super();

        ["dragenter", "dragover", "dragleave", "drop"]
            .forEach(eventName => this.addEventListener(eventName, (event) => event.preventDefault()));

        const onDrag = (event) => {
            this.shadowRoot.querySelector("#dragdropoverlay").style.visibility = "visible";

            this.filesBeingDraggedIntoCount = Array.from(event.dataTransfer.items)
                .filter(x => x.kind === "file" && x.type === "image/svg+xml")
                .length;
        }

        this.addEventListener("dragenter", onDrag);
        this.addEventListener("dragover", onDrag);
        this.addEventListener("dragleave", () => {
            this.shadowRoot.querySelector("#dragdropoverlay").style.visibility = "hidden";
        });
        this.addEventListener("drop", (event) => {
            this.shadowRoot.querySelector("#dragdropoverlay").style.visibility = "hidden";
        });
    }
}

window.customElements.define("app-main", AppMain);