import { InteractiveGuide } from "../../src/InteractiveGuide";

describe("InteractiveGuide", () => {
    let guide;
    const instructions = [
        { text: "Step 1", spotlighted: ["#panel1Panel"] },
        { text: "Step 2", spotlighted: ["#panel2Panel"] }
    ];

    beforeEach(() => {
        const existingOverlay = document.getElementById("guide-overlay");
        if (existingOverlay) existingOverlay.remove()
        const existingGuide = document.getElementById("guide");
        if (existingGuide) existingGuide.remove();
        guide = new InteractiveGuide(instructions);
    });

    afterEach(() => {
        guide.closeGuide();
    });

    it("displays no previous button on the first step", () => {
        const prevButton = document.getElementById("guide-prev");
        expect(prevButton.style.display).toBe("none");
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
        const tail = document.getElementById("guide-tail");
        expect(tail).not.toBeNull();

        const textBox = document.getElementById("guide-content");

        textBox.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, clientY: 100, bubbles: true }));
        document.dispatchEvent(new MouseEvent("mousemove", { clientX: 150, clientY: 150, bubbles: true }));
        expect(tail.style.display).toBe("none");
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

        const panelContainer = document.createElement("div");
        panelContainer.appendChild(panel);
        document.body.appendChild(panelContainer);
        
        // Apply styles to simulate spotlighting.
        panelContainer.style.opacity = "0.3";
        panelContainer.style.zIndex = "102";
        
        guide.closeGuide();

        // Check that the overlay and guide elements have been removed.
        expect(document.getElementById("guide-overlay")).toBeNull();
        expect(document.getElementById("guide")).toBeNull();
        // Check that the dummy panel's parent wrapper has its style reset.
        expect(panelContainer.style.opacity).toBe("1");
        expect(panelContainer.style.zIndex).toBe("");
        panelContainer.remove();
    });

    it("applies spotlighting correctly", () => {
        const panel1 = document.createElement("div");
        panel1.setAttribute("data-role", "panel");
        panel1.id = "panel1Panel";
        const container1 = document.createElement("div");
        container1.appendChild(panel1);
        document.body.appendChild(container1);

        const panel2 = document.createElement("div");
        panel2.setAttribute("data-role", "panel");
        panel2.id = "panel2Panel";
        const container2 = document.createElement("div");
        container2.appendChild(panel2);
        document.body.appendChild(container2);

        guide.applySpotlighting({ spotlighted: ["#panel1Panel"] });
      
        // Check the styling of both panels
        const panels = Array.from(document.querySelectorAll("[data-role='panel']"));
        panels.forEach(panel => {
            const parent = panel.parentElement;
            if(parent.id === "panel1Panel"){
                expect(parent.style.opacity).toBe("1");
                expect(parent.style.zIndex).toBe("102");
            }else if (panel.id === "panel2Panel"){
                expect(parent.style.opacity).toBe("0.3");
                expect(parent.style.zIndex).toBe("");
            }
        });
      
        container1.remove();
        container2.remove();
    });
});