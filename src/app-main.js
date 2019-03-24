import { LitElement, html } from "lit-element";

import "@polymer/iron-icon";
import "@polymer/iron-icons";

import { processSvgFile } from "./svg-processor";

class AppMain extends LitElement {
    static get properties() {
        return {
            filesBeingDraggedIntoCount: { type: Number },
            iconCollection: { type: Array },
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

                #footer {
                    background: linear-gradient(to top, rgba(255, 255, 255, 0.99) 40%, rgba(255, 255, 255, 0.92));
                    border-top: 1px solid rgba(0, 0, 0, 0.08);
                    padding: 0 14px;
                    position: sticky;
                    bottom: 0;
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

                div.icon {
                    display: inline-flex;
                    flex-direction: column;
                    align-items: center;
                    margin: 7px;
                    width: 100px;
                    padding: 7px;
                    border-radius: 7px;
                }

                div.icon:focus-within {
                    outline: none;
                    background-color: #efefef;
                }

                div.editable {
                    margin: 7px 0;
                    border: 1px solid transparent;
                    padding: 0 4px;
                    text-align: center;
                }

                div.editable[contenteditable]:focus {
                    outline: none;
                    border: 1px solid black;
                    background-color: white;
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
                <div id="icon-collection">
                    ${this.iconCollection.map(this.renderIcon.bind(this))}
                </div>
                <div id="dragdropoverlay">
                    <iron-icon icon="icons:add-circle-outline" style="width: 48px; height: 48px"></iron-icon>
                    <span style="margin-top: 24px">${
                        this.filesBeingDraggedIntoCount ? `Recognized ${this.filesBeingDraggedIntoCount} SVG files` : `No SVG files recognized`
                    }</span>
                </div>
            </div>
            <div id="footer">
                <p class="secondary">${this.iconCollection.length == 0 ? "No icons in the collection" : this.iconCollection.length === 1 ? "One icon in the collection" : `${this.iconCollection.length} icons in the collection` }</p>
            </div>
        `;
    }

    renderIcon(icon) {
        return html`
            <div class="icon" tabindex="0" @keydown=${event => { 
                if(event.key === "F2") {
                    this.edit(event.path.find(element => element.matches(".icon")).querySelector(".editable"), icon);
                }
            }}>
                <img draggable="false" width="48px" height="48px" src=${"data:image/svg+xml;base64, " + btoa(icon.svgContent)} />
                <div class="editable" style="font-size: 11px; max-width: 100%" @dblclick=${ event => { 
                    this.edit(event.path.find(element => element.matches(".editable")), icon); 
                }}>${icon.name}</div>
            </div>
        `;
    }

    constructor() {
        super();

        this.iconCollection = [];

        ["dragenter", "dragover", "dragleave", "drop"]
            .forEach(eventName => this.addEventListener(eventName, (event) => { event.preventDefault(); event.stopPropagation() }, false));

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
        this.addEventListener("drop", async (event) => {
            this.shadowRoot.querySelector("#dragdropoverlay").style.visibility = "hidden";
            
            const loadedIcons = await Promise.all(Array.from(event.dataTransfer.files)
                .filter(file => file.type === "image/svg+xml")
                .map(async file => {
                    return {
                        name: file.name.replace(/.svg$/, ""),
                        svgContent: await processSvgFile(file),
                        file
                    };
                }));
            
            this.iconCollection = [ ...this.iconCollection, ...loadedIcons ];
        });
    }

    edit(editableDiv, icon) {
        let onKeyDown, onKeyUp, onBlur;

        const stopEditing = () => {
            editableDiv.removeEventListener("keydown", onKeyDown);
            editableDiv.removeEventListener("keyup", onKeyUp);
            editableDiv.removeEventListener("blur", onBlur);
            editableDiv.removeAttribute("contenteditable");
        };

        const commit = () => {
            icon.name = editableDiv.innerText;
            stopEditing();
        };

        const discard = () => {
            editableDiv.innerText = icon.name;
            stopEditing();
        }

        editableDiv.addEventListener("keydown", onKeyDown = (event) => {
            if (event.key === "Enter") {
                commit();
                editableDiv.closest(".icon").focus();
                event.stopImmediatePropagation();
                event.preventDefault();
            }
        });

        editableDiv.addEventListener("keyup", onKeyUp = (event) => {
            if (event.key === "Escape") {
                editableDiv.closest(".icon").focus();
                discard();
            }
        });

        editableDiv.addEventListener("blur", onBlur = () => {
            commit();
        });
        editableDiv.setAttribute("contenteditable", true);
        editableDiv.focus();
    }
}

window.customElements.define("app-main", AppMain);