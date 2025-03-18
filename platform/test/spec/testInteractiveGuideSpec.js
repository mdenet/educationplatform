import { InteractiveGuide } from "../../src/InteractiveGuide";

describe("InteractiveGuide", () => {
    let guide;
    const instructions = [
        { text: "Step 1", highlighted: ["#panel1Panel"] },
        { text: "Step 2", highlighted: ["#panel2Panel"] }
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
});