import { InstructionPanel } from "../../src/InstructionPanel";

const fileHandler = {
    fetchFile: jasmine.createSpy("fetchFile").and.callFake((url, isPrivate) => {
        // For testing, return an object with content
        return{
            content: "# Header1 Introduction\nText\n- Step 1 <!-- { pointed: console, highlighted: panel1, panel2 } -->\n- Step 2"
        };
    })
};

// Assume public repo for tests
window.urlParamPrivateRepo = () => false;

describe("InstructionPanel", () => {
    let panel;

    // create new instruction panel
    beforeEach( () => {
       panel = new InstructionPanel("test", "url", fileHandler);
       panel.element = panel.createElement();
       document.body.appendChild(panel.element) 
    });

    // clean up after each test
    afterEach( () =>{
        if(panel.element && panel.element.parentNode){
            panel.element.parentNode.removeChild(panel.element);
        }
        localStorage.clear();
    });

    it("creates an element with the correct attributes", () => {
        const elem = panel.createElement();
        expect(elem.getAttribute("data-role")).toBe("panel");
        expect(elem.id).toBe("testPanel");
        expect(elem.classList.contains("instruction-panel")).toBe(true);
        // expect(elem.style.overflow).toBe("auto");
        // expect(elem.style.padding).toBe("10px");
    });

    it("parses markdown headers correctly", () => {
        const input = "# Header"
        const output = panel.parseMarkdown(input);
        expect(output).toBe("<h1>Header</h1>");
    });

    it("parses markdown bold text correctly", () => {
        const input1 = "**Bold**";
        const input2 = "__Bold__";

        const output1 = panel.parseMarkdown(input1);
        const output2 = panel.parseMarkdown(input2);

        expect(output1).toBe("<b>Bold</b>");
        expect(output2).toBe("<b>Bold</b>")
    });

    it("parses markdown italicised text correctly", () => {
        const input1 = "*Italics*";
        const input2 = "_Italics_";

        const output1 = panel.parseMarkdown(input1);
        const output2 = panel.parseMarkdown(input2);

        expect(output1).toBe("<i>Italics</i>");
        expect(output2).toBe("<i>Italics</i>")
    });

    it("parses markdown hyperlinks correctly", () => {
        const input = ""

        const output1 = panel.parseMarkdown(input1);
        const output2 = panel.parseMarkdown(input2);

        expect(output1).toBe("<b>Bold1</b>");
        expect(output2).toBe("<b>Bold2</b>")
    });

    it("loads instructions via the file handler", async function(){
        spyOn(panel, "renderInstructionPanel").and.callThrough();
        panel.initialize();
        // check that the file handler has the correct url and repository privacy value
        expect(fileHandler.fetchFile).toHaveBeenCalledWith("url", jasmine.any(Boolean));
        expect(panel.renderInstructionPanel).toHaveBeenCalledWith(fileHandler.fetchFile.calls.mostRecent().returnValue.content);
        // check that some of the expected text is present after rendering
        expect(panel.element.innerHTML).toContain("Step 1");
    });

    it("adds checkboxes to list items and update the progress bar correctly", () => {
        panel.element.innerHTML = "<ul><li>Step 1</li><li>Step 2</li></ul>";
        panel.addCheckboxesToSteps();
        const checkboxes = panel.element.querySelectorAll("input.instruction-checkbox");
        expect(checkboxes.length).toBe(2);
        
        // Checking the first checkbox.
        checkboxes[0].checked = true;
        checkboxes[0].dispatchEvent(new Event("change"));

        panel.createProgressBar();
        panel.updateProgressBar();
        
        // Checking if progress bar updated
        const progressBar = panel.element.querySelector(`#test-progress-bar`);
        expect(progressBar).not.toBeNull();
        expect(progressBar.value).toBe(1);

        const percentageLabel = panel.element.querySelector(`#test-percentage-label`);
        // 50% completion expected as 1 of 2 steps are checked
        expect(percentageLabel.innerText).toBe("50%");
    });

    it("creates a 'Begin Guide' button if the instructions are in the correct format", () => {
        const instructions = [{text: "Text 1", centred: true }];
        spyOn(panel, "startGuide");

        panel.createStartGuideButton(instructions);
        const startButton = panel.element.querySelector("button");
        expect(startButton).not.toBeNull();

        startButton.click();
        expect(panel.startGuide).toHaveBeenCalledWith(instructions);
    });

    it("creates the correct instructions array from the markdown input", () => {
        const markdownText = `
            # Header
            Text
            - Step 1 <!-- { pointed: console, highlighted: panel1, panel2 } -->
            - Step 2
        `;
        const instructionsArray = panel.createInstructionsArray(markdownText);

        expect(instructionsArray[0].text).toContain("<h1>Header</h1>");
        expect(instructionsArray[0].text).toContain("Text");
        expect(instructionsArray[0].centred).toBe(true);

        expect(instructionsArray[1].text).toContain("Step 1");
        expect(instructionsArray[1].pointed).toBe("#consolePanel");
        expect(instructionsArray[1].highlighted).toEqual(["#panel1Panel", "#panel2Panel"]);

        expect(instructionsArray[2].text).toContain("Step 2");
        expect(instructionsArray[2].centred).toBe(true);
    });

    it("saves and retrieves checkbox state from localStorage", () => {
        const index = 0;
        panel.saveCheckboxState(index, true);
        expect(panel.getCheckboxState(index)).toBe(true);
        panel.saveCheckboxState(index, false);
        expect(panel.getCheckboxState(index)).toBe(false);
    });

    it("adjusts the panel size as expected", () => {
        panel.adjustPanelSize();
        expect(panel.element.style.flexBasis).toBe("100%");
        expect(panel.element.style.overflow).toBe("auto");
    });
});