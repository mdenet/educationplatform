import { Panel } from "./Panel.js";
import { InteractiveGuide } from "./InteractiveGuide.js";
import { urlParamPrivateRepo } from './Utility.js';
import { marked } from 'marked';
import { ErrorHandler } from "./ErrorHandler.js";

const errorHandler = new ErrorHandler();

class InstructionPanel extends Panel {
    constructor(id, instructionUrl, fileHandler) {
        super(id);
        this.instructionUrl = instructionUrl;
        this.fileHandler = fileHandler;
    }

    initialize(){
        this.getElement();
        this.loadInstructions();
        setTimeout(() => this.adjustPanelSize(), 0);    // setTimeout adjusts panel size after it has been created
    }

    async loadInstructions(){
        try{
            // Fetches file depending on if public or private
            const isPrivate = urlParamPrivateRepo();
            const fileResult = this.fileHandler.fetchFile(this.instructionUrl, isPrivate);
            if(fileResult){
                // Use the file content returned by the FileHandler
                this.renderInstructionPanel(fileResult.content);
                this.splitInstructions(fileResult.content);
            }else{
                errorHandler.notify("Failed to load instructions from: " + this.instructionUrl);
            }
        }catch(error){
            errorHandler.notify("Error loading instructions:", error);
        }
    }

    renderInstructionPanel(text){
        this.renderMarkdown(text);
        this.renderProgressBar();
    }

    renderMarkdown(text){
        if(this.element){
            this.element.innerHTML = marked(text);
        }
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
            checkbox.style.marginLeft = "auto";
            
            checkbox.addEventListener("change", () => {
                this.saveCheckboxState(index, checkbox.checked);
                this.updateProgressBar();
            });
            li.appendChild(checkbox);
        });
    }

    // Add a progress bar at the bottom of the panel
    createProgressBar(){
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

    // Update the progress bar based on the checkboxes checked
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

    // Get info on if the checkbox is checked or not
    getCheckboxState(index){
        const key = `${this.id}-checkbox-${index}`;
        return localStorage.getItem(key) === 'true';
    }

    // Save checkbox state to localStorage
    saveCheckboxState(index, state){
        const key = `${this.id}-checkbox-${index}`;
        localStorage.setItem(key, state);
    }

    // Create the "Start Guide" button if the markdown instructions split properly
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
            new InteractiveGuide(instructions);
        }else{
            console.error("Guide could not start as instructions array is not set")
        }
    }

    // Creates an array of instructions from the markdown
    createInstructionsArray(markdownText) {
        const lines = markdownText.split('\n');
        const instructionsArray = [];
        let currentBlock = '';

        // Convert block of text to HTML and push to array
        const pushCurrentBlock = () => {
            if(currentBlock.trim()){
                const htmlText = marked.parseInline(currentBlock.trim());
                instructionsArray.push({ text: htmlText, centred: true });
                currentBlock = '';
            }
        };

        // Add a line to the current text block
        const addLineToBlock = (line) => {
            if(!currentBlock){
                currentBlock = line;
            }else if(/<\/h[1-6]>$/.test(currentBlock.trim())){
                // If there is a header, the text after it is added to the block, rather than starting a new block
                currentBlock += line;
            }else{
                currentBlock += "\n" + line;
            }
        };

        // Extract metadata from comments
        const getMetadata = (comment) => {
            if (!comment) return {};

            const match = comment.match(/\{(.*?)\}/);   // metadata regex matcher
            if (!match) return {};

            const metadata = {};
            const metadataItems = match[1].split(',').map(part => part.trim());
            let currentKey = null;

            for(let item of metadataItems){
                if(item.includes(':')){
                    let [key, value] = item.split(':').map(s => s.trim());
                    currentKey = key;

                    // spotlighted panels are an array, pointed panels are a singular value
                    if(key === 'spotlighted'){
                        metadata[key] = [`#${value}Panel`];
                    }else{
                        metadata[key] = `#${value}Panel`;
                    }
                }else{
                    // If there is no colon, append to the spotlighted array if that is the current key
                    if(currentKey === 'spotlighted'){
                        metadata[currentKey].push(`#${item}Panel`);
                        // ! test this
                    }else if(currentKey === 'pointed'){
                        errorHandler.notify(`Multiple pointed values detected, ignoring ${part}`)
                    }
                }
            }
            // If only "spotlighted" is specified in the metadata, "centred" is added
            if(metadata.hasOwnProperty('spotlighted') && !metadata.hasOwnProperty('pointed')){
                metadata.centred = true;
            }
            return metadata;
        };

        // Process each line
        for(const line of lines){
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // Check if the line is a header
            const headerMatch = trimmedLine.match(/^(#{1,6})\s*(.*)$/);
            if(headerMatch){
                pushCurrentBlock(); // Push the current text block before starting a header
                const level = headerMatch[1].length;
                const headerContent = marked.parseInline(headerMatch[2].trim());
                currentBlock = `<h${level}>${headerContent}</h${level}>`;
                // Continue to next line so that non-list lines are added to this block
                continue;
            }

            // Check for list items
            const listMatch =
                trimmedLine.match(/^[*-]\s*(.*?)\s*(?:(?:<|\\x3C)!--\s*(\{.*\})\s*-->)?$/) ||
                trimmedLine.match(/^\d+\.\s*(.*?)\s*(?:(?:<|\\x3C)!--\s*(\{.*\})\s*-->)?$/);

            if(listMatch){
                pushCurrentBlock(); // Push the current text block before the new list item
                const listItemText = listMatch[1];
                const metadataComment = listMatch[2];
                const metadata = getMetadata(metadataComment);

                // If no metadata is provided, default to centred
                if(!metadataComment || Object.keys(metadata).length === 0){
                    metadata.centred = true;
                }

                const htmlText = marked.parseInline(listItemText.trim());
                instructionsArray.push({ text: htmlText, ...metadata });
                continue;
            }

            // For any other line of text, treat it as part of the header block
            addLineToBlock(line);
        }
        
        pushCurrentBlock();
        return instructionsArray;
    }
}

export { InstructionPanel };