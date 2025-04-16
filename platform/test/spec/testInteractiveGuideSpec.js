import { InteractiveGuide } from "../../src/InteractiveGuide";

describe("InteractiveGuide", () => {
    let guide;
    const instructions = [
        { text: "Step 1", spotlighted: ["#panel1Panel"] },
        { text: "Step 2", spotlighted: ["#panel2Panel"] }
    ];

    beforeEach(() => {
        guide = new InteractiveGuide(instructions);

        // For the test, a container element is appended to the document
        if (!guide.container) {
            guide.container = document.createElement("div");
            guide.container.id = "guide";

            const nextButton = document.createElement("button");
            nextButton.id = "guide-next";
            nextButton.innerText = "Next";
            guide.container.appendChild(nextButton);

            const textBox = document.createElement("div");
            textBox.id = "guide-content";
            textBox.setAttribute("draggable", "true");
            guide.container.appendChild(textBox);

            const tail = document.createElement("div");
            tail.id = "guide-tail";
            guide.container.appendChild(tail);

            document.body.appendChild(guide.container);
        }
    });

    afterEach(() => {
        if(guide.container && guide.container.parentNode){
            guide.container.parentNode.removeChild(guide.container);
        }
    });

    it("displays no previous button on the first step", () => {
        const prevButton = guide.container.querySelector("#guide-prev");
        expect(prevButton).toBeNull();
    });

    it("displays no next button on the final step", () => {
        // Set guide to final step
        guide.showStep(instructions.length - 1);

        const nextButton = document.getElementById("guide-next");
        expect(window.getComputedStyle(nextButton).display).toBe("none");
        
        const prevButton = document.getElementById("guide-prev");
        expect(prevButton).not.toBeNull();
      });

    it("removes the tail when the text box is dragged", () => {
        const tail = guide.container.querySelector("#guide-tail");
        expect(tail).not.toBeNull();

        const textBox = guide.container.querySelector("#guide-content");

        textBox.addEventListener("dragStart", () => {
            tail.style.display = "none";
        });

        textBox.dispatchEvent(new Event("dragStart"));

        const tailAfterDrag = guide.container.querySelector("#guide-tail");
        expect(tailAfterDrag.style.display).toBe("none");
      });

    it("updates the text box when navigating steps", () => {
        // starting at first step
        guide.showStep(0);

        const textBox = document.getElementById("guide-content");
        expect(textBox.innerHTML).toBe(instructions[0].text);
        
        spyOn(guide, "showStep").and.callThrough();

        // going to the next step
        const nextButton = document.getElementById("guide-next");
        nextButton.click();

        expect(guide.showStep).toHaveBeenCalledWith(1);
        expect(textBox.innerHTML).toBe(instructions[1].text);
    });

    it("resets styles upon closing the guide", () => {
        const panel = document.createElement("div");
        panel.setAttribute("data-role", "panel");
        const panelSpotlight = document.createElement("div");
        panelSpotlight.appendChild(panel);
        panelSpotlight.id = "spotlightWrapper";
        document.body.appendChild(panelSpotlight);
        
        // Apply styles to simulate spotlighting.
        panelSpotlight.style.opacity = "0.3";
        panelSpotlight.style.zIndex = "102";
        
        guide.closeGuide();

        // Check that the overlay and guide elements have been removed.
        expect(document.getElementById("guide-overlay")).toBeNull();
        expect(document.getElementById("guide")).toBeNull();
        // Check that the dummy panel's parent wrapper has its style reset.
        expect(panelSpotlight.style.opacity).toBe("1");
        expect(panelSpotlight.style.zIndex).toBe("");
        panelSpotlight.parentNode.removeChild(panelSpotlight);
    });

    it("applies spotlighting correctly", () => {
        const panel1 = document.createElement("div");
        panel1.setAttribute("data-role", "panel");
        const panel1Spotlight = document.createElement("div");
        panel1Spotlight.id = "panel1Panel";
        panel1Spotlight.appendChild(panel1);
        document.body.appendChild(panel1Spotlight);

        const panel2 = document.createElement("div");
        panel2.setAttribute("data-role", "panel");
        const panel2Spotlight = document.createElement("div");
        panel2Spotlight.id = "panel2Panel";
        panel2Spotlight.appendChild(panel2);
        document.body.appendChild(panel2Spotlight);

        guide.applySpotlighting({ spotlighted: ["#panel1Panel"] });
      
        // Check the styling of both panels
        document.querySelectorAll("[data-role='panel']").forEach(panel => {
            const parent = panel.parentElement;
            if(parent.id === "panel1Panel"){
                expect(parent.style.opacity).toBe("1");
                expect(parent.style.zIndex).toBe("102");
            }else{
                expect(parent.style.opacity).toBe("0.3");
            }
        });
      
        panel1Spotlight.parentNode.removeChild(panel1Spotlight);
        panel2Spotlight.parentNode.removeChild(panel2Spotlight);
    });
});