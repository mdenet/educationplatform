//! is import needed
import { Panel } from "./Panel.js";
import { InteractiveGuide } from "./InteractiveGuide.js";
import { urlParamPrivateRepo } from './Utility.js';

class InstructionPanel extends Panel {
    
    constructor(id, instructionUrl, fileHandler) {
        super(id);
        this.instructionUrl = instructionUrl;
        this.fileHandler = fileHandler;
    }

    initialize() {
        this.getElement();  // ! is this line necessary
        this.loadInstructions();
        setTimeout(() => this.adjustPanelSize(), 0);    // setTimeout adjusts panel size after it has been created
    }

    async loadInstructions() {
        console.log("InstructionPanel.js: " + this.instructionUrl);
        try {
            // Fetches file depending on if public or private
            const isPrivate = urlParamPrivateRepo();
            const fileResult = this.fileHandler.fetchFile(this.instructionUrl, isPrivate);
            if (fileResult) {
                // Use the file content returned by the FileHandler
                this.renderInstructionPanel(fileResult.content);
                this.splitInstructions(fileResult.content);
            } else {
                console.error("Failed to load instructions via FileHandler.");
            }
        } catch (error) {
            console.error("Error loading instructions:", error);
        }
    }

    renderInstructionPanel(text){
        this.renderMarkdown(text);
        this.renderProgressBar();
    }

    renderMarkdown(text){
        if (this.element) {
            this.element.innerHTML = this.parseMarkdown(text);
        }
        console.log(this.createInstructionsArray(text));
    }

    // ! https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
    parseMarkdown(text){
        // Headers
        text = text.replace(/^(#{1,6})\s*(.*)$/gm, (_, hashes, content) => {
            const level = Math.min(hashes.length, 6);
            return `<h${level}>${content}</h${level}>`;
        });
    
        // Bold, italic, hyperlink
        text = text.replace(/(\*\*|__)(.*?)\1/g, '<b>$2</b>')
                    .replace(/(\*|_)(.*?)\1/g, '<i>$2</i>')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
        // Ordered lists
        text = text.replace(/(?:^|\n)(\d+\.\s+.*(?:\n\d+\.\s+.*)*)/gm, match => {
            let items = match.trim().split(/\n\d+\.\s+/).map(item => item.replace(/^\d+\.\s*/, ''));
            return `<ol>${items.map(item => `<li>${item}</li>`).join('')}</ol>`;
        });
    
        // Unordered lists
        text = text.replace(/(?:^|\n)([-*]\s+.*(?:\n[-*]\s+.*)*)/gm, match => {
            let items = match.trim().split(/\n[-*]\s+/).map(item => item.replace(/^[-*]\s*/, ''));
            return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
        });

        // Line breaks
        text = text.replace(/(?<!<li>|<h\d+>)\n/g, '<br>');
    
        // Prevent extra line breaks after headers and lists
        text = text.replace(/(<\/h\d+>|<\/ul>|<\/ol>)\s*<br>/g, '$1');
    
        return text;
    }
    
    createElement(){
        const root = document.createElement("div");
        root.setAttribute("data-role", "panel");
        root.setAttribute("id", this.id + "Panel");

        root.setAttribute("class", "instruction-panel");
        root.style.overflow = "auto";
        root.style.padding = "10px";
        return root;
    }

    adjustPanelSize(){
        const panel = document.getElementById(this.id + "Panel");
        if(panel){
            panel.style.flexBasis = "100%";
            panel.style.overflow = "auto";
        }
    }

    renderProgressBar(){
        this.addCheckboxesToSteps();
        this.createProgressBar();
        this.updateProgressBar();
    }

    addCheckboxesToSteps(){
        const listItems = this.element.querySelectorAll("li");
        listItems.forEach((li, index) => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "instruction-checkbox"
            // Get checkbox save state from local storage
            checkbox.checked = this.getCheckboxState(index);
            checkbox.addEventListener("change", () => {
                this.saveCheckboxState(index, checkbox.checked);
                this.updateProgressBar();
            });
            li.insertBefore(checkbox, li.firstChild);
        });
    }
    createProgressBar(){
        // const existingProgressBar = this.element.querySelector(`#${this.id}-progress-bar`);
        // if (existingProgressBar) return;

        const progressContainer = document.createElement("div");
        progressContainer.style.textAlign = "center";
        progressContainer.style.marginTop = "10px";

        const progressBar = document.createElement("progress");
        progressBar.id = this.id + "-progress-bar";
        const itemCount = this.element.querySelectorAll("li").length;
        progressBar.value = 0;
        progressBar.max = itemCount;
        
        const percentageLabel = document.createElement("span");
        percentageLabel.id = this.id + "-percentage-label";
        percentageLabel.innerText = "0%";
        percentageLabel.style.marginLeft = "10px";

        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(percentageLabel);
        this.element.appendChild(progressContainer);
    }

    updateProgressBar(){
        const listItems = this.element.querySelectorAll("li");
        const itemCount = listItems.length;
        let completed = 0;

        listItems.forEach(li => {
            const checkbox = li.querySelector("input.instruction-checkbox");
            if(checkbox && checkbox.checked){
                completed++;
            }
        });
        const progressBar = this.element.querySelector(`#${this.id}-progress-bar`);
        const percentageLabel = this.element.querySelector(`#${this.id}-percentage-label`);
        if(progressBar){
            progressBar.value = completed;
        }
        if(percentageLabel){
            const percentage = itemCount > 0 ? Math.round((completed/itemCount)*100) : 0;
            percentageLabel.innerText = `${percentage}%`;
        }
    }

    getCheckboxState(index){
        const key = `${this.id}-checkbox-${index}`;
        return localStorage.getItem(key) === 'true';
    }

    saveCheckboxState(index, state){
        const key = `${this.id}-checkbox-${index}`;
        localStorage.setItem(key, state);
    }

    splitInstructions(text){
        try{
            const instructions = this.createInstructionsArray(text);

            if(instructions.length > 0){
                this.createStartGuideButton(instructions);
            }else{
                console.warn("Parsed instructions array is empty.");
            }
        }catch(error){
            console.error("Error parsing instructions:", error);
        }
    }

    createStartGuideButton(instructions){
        const startButton = document.createElement("button");
        startButton.innerText = "Begin Guide";
        startButton.addEventListener("click", () => this.startGuide(instructions));
        this.element.appendChild(startButton);
    }

    startGuide(instructions){
        if(instructions){
            console.log("startGuide instructions:");
            console.log(instructions);

            new InteractiveGuide(instructions);
        }else{
            console.error("Guide could not start as instructions array is not set")
        }
    }

    // TODO CHECK THIS FUNCTION PROPERLY
    // Creates an array of instructions from the markdown
    createInstructionsArray(text){
        const lines = text.split('\n');
        const instructionsArray = [];
        let currentText = "";

        const boldRegex = /\*\*(.*?)\*\*|__(.*?)__/g;
        const italicRegex = /\*(.*?)\*|_(.*?)_/g;
        const linkRegex = /\[(.*?)\]\((.*?)\)/g;
        const metadataRegex = /\{(.*?)\}/;

        function formatText(text){
            return text
                .replace(linkRegex, (_, txt, url) => `<a href="${url}" target="_blank">${txt}</a>`)
                .replace(boldRegex, (_, g1, g2) => `<strong>${g1 || g2}</strong>`)
                .replace(italicRegex, (_, g1, g2) => `<em>${g1 || g2}</em>`);
        }

        function getMetadata(metaString){
            if (!metaString) return {};

            const content = metaString.match(metadataRegex)?.[1];
            if (!content) return {};

            // Split metadata attributes based on commas in the comment and trim each part
            const parts = content.split(',').map(part => part.trim());
            const metaObj = {};
            let currentKey = null;
            for(let part of parts){
                if(part.includes(':')){
                    // When a colon is present, parse the key and value
                    let [key, value] = part.split(':').map(s => s.trim());
                    currentKey = key;

                    if(key === 'highlighted'){
                        metaObj[key] = [`#${value}Panel`];
                    }else{
                        metaObj[key] = `#${value}Panel`;
                    }
                }else{
                    // Create an array for highlighted values
                    if(currentKey === 'highlighted'){
                        metaObj[currentKey].push(`#${part}Panel`);
                    }
                }
            }
            return metaObj;
        }

        // Push the currentText as a new instruction if not empty.
        const pushCurrentText = () => {
            if (currentText.trim()) {
                instructionsArray.push({ text: formatText(currentText.trim()), centred: true });
                currentText = "";
            }
        };

        // Append a new line to currentText.
        const appendLine = (line) => {
            if(!currentText){
                currentText = line;
            }else if (/<\/h[1-6]>$/.test(currentText)){
                // If currentText ends with a header, append without a <br>
                currentText += line;
            }else{
                currentText += "<br>" + line;
            }
        };

        for(const line of lines){
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // Process headers
            const headerMatch = trimmedLine.match(/^(#{1,6})\s*(.*)$/);
            if(headerMatch){
                pushCurrentText(); // push previous text block
                const level = headerMatch[1].length;
                currentText = `<h${level}>${headerMatch[2]}</h${level}>`;
                continue;
            }

            // Process list items
            // ! Test if the x3C match is even necessary
            const listMatch = trimmedLine.match(/^[*-]\s*(.*?)\s*(?:(?:<|\\x3C)!--\s*(\{.*\})\s*-->)?$/) ||
                              trimmedLine.match(/^\d+\.\s*(.*?)\s*(?:(?:<|\\x3C)!--\s*(\{.*\})\s*-->)?$/);
            if(listMatch){
                pushCurrentText();
                const [, listText, meta] = listMatch;
                const metaObj = getMetadata(meta);
                if(!meta || Object.keys(metaObj).length === 0){
                    metaObj.centred = true;
                }
                instructionsArray.push({
                    text: formatText(listText),
                    ...metaObj
                });
                // ? The above version makes lists centred if they have no metadata
                // const [, text, meta] = match;
                // instructionsArray.push({
                //     text: formatText(text),
                //     ...getMetadata(meta)
                // });
                continue;
            }

            // Default case: append line to currentText
            appendLine(line);
        }
        
        pushCurrentText();
        return instructionsArray;
    }

}

export { InstructionPanel };