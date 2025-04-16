class InteractiveGuide{
    constructor(instructions){
        this.instructions = instructions;
        this.currentStep = 0;
        this.overlay = null;
        this.initGuide();
    }

    // Initiate the interactive guide
    initGuide(){
        this.createGuide();
        this.makeDraggable(this.guide);
        this.showStep(this.currentStep);
    }  
    
    // Create and append the guide and overlay
    createGuide(){
        // Dimmed screen overlay
        this.overlay = document.createElement("div");
        this.overlay.id = "guide-overlay";
        this.overlay.style.zIndex = "100";
        document.body.appendChild(this.overlay);
    
        // Guide bubble with buttons
        this.guide = document.createElement("div");
        this.guide.id = "guide";
        this.guide.innerHTML = `
            <span id="guide-close" class="guide-close">X</span>
            <div id="guide-content"></div>
            <div id="guide-tail"></div>
            <div id="guide-buttons">
                <button id="guide-prev">Prev</button>
                <button id="guide-next">Next</button>
            </div>`;
        this.guide.style.zIndex = "105";
        document.body.appendChild(this.guide);

        // Set up event listeners on buttons
        document.getElementById("guide-prev").addEventListener("click", () => this.prevStep());
        document.getElementById("guide-next").addEventListener("click", () => this.nextStep());
        document.getElementById("guide-close").addEventListener("click", () => this.closeGuide());
    }

    // Makes the guide bubble draggable
    makeDraggable(elem){
        let offsetX, offsetY, isDragging = false;

        elem.addEventListener("mousedown", (e) => {
        isDragging = true;
        // Calculate offset relative to the element's top-left corner
        offsetX = e.clientX - elem.offsetLeft;
        offsetY = e.clientY - elem.offsetTop;
        // Bring element to front
        elem.style.zIndex = 105;
        e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
        if(isDragging){
            elem.style.top = `${e.clientY - offsetY}px`;
            elem.style.left = `${e.clientX - offsetX}px`;
            // Hide the tail while dragging
            const tail = document.getElementById("guide-tail");
            tail.style.display = "none";
        }
        });

        document.addEventListener("mouseup", () => {
        if(isDragging){
            isDragging = false;
            // If the current step is pointed, reposition the tail
            const step = this.instructions[this.currentStep];
            if(step.pointed){
                this.positionTail(step);
            }
        }
        });
    }

    // Show the relevant panels and instructions at a specific step
    showStep(stepNumber){
        if (stepNumber < 0 || stepNumber >= this.instructions.length) return;

        this.currentStep = stepNumber;
        const step = this.instructions[stepNumber];

        document.getElementById("guide-content").innerHTML = step.text;
        // Reset text bubble style if it was moved manually
        const guide = document.getElementById("guide");
        guide.style.transform = "";
        guide.style.top = "";
        guide.style.left = "";
        
        if(step.centred){
            // Centre the bubble
            guide.style.top = "50%";
            guide.style.left = "50%";
            guide.style.transform = "translate(-50%, -50%)";
            document.getElementById("guide-tail").style.display = "none";
        }else if(step.pointed){
            this.positionTextBubble(step);
        }
        this.applySpotlighting(step);
        this.manageGuideButtons();
    }

    // Hide and display guide buttons based on the current step
    manageGuideButtons(){
        const prevButton = document.getElementById("guide-prev");
        const nextButton = document.getElementById("guide-next");

        if(this.currentStep === 0){
            prevButton.style.display = "none";
        }else{
            prevButton.style.display = "inline-block";
        }

        if(this.currentStep === this.instructions.length - 1){
            nextButton.style.display = "none";
        }else{
            nextButton.style.display = "inline-block";
        }
    }


    positionTextBubble(step){
        const guide = document.getElementById("guide");
        const tail = document.getElementById("guide-tail");
        tail.style.display = "block";
        tail.style.borderStyle = "solid";
    
        const targetElement = document.querySelector(step.pointed);
        if (!targetElement) return;
    
        // Get target element's position and size
        const rect = targetElement.getBoundingClientRect();
        const targetCentreX = rect.left + rect.width / 2 + window.scrollX;
        const targetCentreY = rect.top + rect.height / 2 + window.scrollY;
        const guideWidth = guide.offsetWidth;
        const guideHeight = guide.offsetHeight;
    
        // Determine available space around the target
        const spaceRight = window.innerWidth - (rect.right + 10);
        const spaceLeft = rect.left - 10;
        const spaceBelow = window.innerHeight - rect.bottom - 10;
        const spaceAbove = rect.top - 10;
    
        let top, left, tailDirection;
    
        // Calculating the tail direction and bubble position
        if(spaceRight > guideWidth){
            left = rect.right + 10 + window.scrollX;
            top = targetCentreY - guideHeight / 2;
            tailDirection = "left";
        }else if(spaceLeft > guideWidth){
            left = rect.left - guideWidth - 10 + window.scrollX;
            top = targetCentreY - guideHeight / 2;
            tailDirection = "right";
        }else if(spaceBelow >= spaceAbove){
            left = targetCentreX - (guideWidth / 2);
            top = rect.top - guideHeight - 10 + window.scrollY;
            tailDirection = "bottom";
        }else{
            left = targetCentreX - (guideWidth / 2);
            top = rect.bottom + 10 + window.scrollY;
            tailDirection = "top";
        }
    
        // Ensure the bubble remains within the viewport
        top = Math.max(window.scrollY + 10, Math.min(top, window.scrollY + window.innerHeight - guideHeight - 10));
        left = Math.max(window.scrollX + 10, Math.min(left, window.scrollX + window.innerWidth - guideWidth - 10));
    
        guide.style.top = `${top}px`;
        guide.style.left = `${left}px`;
        guide.style.transform = "none";
    
        // Set up the tail
        this.positionTail({ pointed: step.pointed, tailDirection, targetRect: rect });
    }
    

    // Position the tail
    positionTail({ tailDirection, targetRect }){
        const guide = document.getElementById("guide");
        const tail = document.getElementById("guide-tail");

        // Reset any previous styles
        tail.style.top = "";
        tail.style.left = "";
        tail.style.borderWidth = "";

        const guideRect = guide.getBoundingClientRect();

        if(tailDirection === "left"){
            tail.style.borderWidth = "10px 10px 10px 0";
            tail.style.borderColor = "transparent white transparent transparent";
            tail.style.top = `${targetRect.top + targetRect.height/2 - guideRect.top - 10}px`;
            tail.style.left = `-10px`;
        }else if(tailDirection === "right"){
            tail.style.borderWidth = "10px 0 10px 10px";
            tail.style.borderColor = "transparent transparent transparent white";
            tail.style.top = `${targetRect.top + targetRect.height/2 - guideRect.top - 10}px`;
            tail.style.left = `${guideRect.width}px`;
        }else if(tailDirection === "bottom"){
            // Tail at bottom of bubble (points up)
            tail.style.borderWidth = "0 10px 10px 10px";
            tail.style.borderColor = "transparent transparent white transparent";
            tail.style.top = `${guideRect.height}px`;
            tail.style.left = `${targetRect.left + targetRect.width/2 - guideRect.left - 10}px`;
        }else if (tailDirection === "top"){
            // Tail at top of bubble (points down)
            tail.style.borderWidth = "10px 10px 0 10px";
            tail.style.borderColor = "white transparent transparent transparent";
            tail.style.top = `-10px`;
            tail.style.left = `${targetRect.left + targetRect.width/2 - guideRect.left - 10}px`;
        }        
    }

    applySpotlighting(step){
        const panels = Array.from(document.querySelectorAll("[data-role='panel']")).map(elem => elem.parentElement).filter(elem => elem !== null);

        panels.forEach(panel => {
            panel.style.opacity = "0.3";
            panel.style.zIndex = "";
        });  

        let panelsToSpotlight = [];

        // Check for pointed element and its parent
        if(step.pointed){
            const element = document.querySelector(step.pointed);
            if(element && element.parentElement && !panelsToSpotlight.includes(element.parentElement)){
                panelsToSpotlight.push(element.parentElement);
            }
        }
    
        // Check for spotlighted element and its parent
        if(step.spotlighted){
            step.spotlighted.forEach(panel => {
                const element = document.querySelector(panel);
                if(element && element.parentElement){
                    panelsToSpotlight.push(element.parentElement);
                }
            });
        }

        panelsToSpotlight.forEach(panel => {
            panel.style.opacity = "1";
            panel.style.position = "relative";
            panel.style.zIndex = "102";
        });
    }

    prevStep(){
        if(this.currentStep > 0){
            this.showStep(this.currentStep - 1);
        }
    }

    nextStep(){
        if(this.currentStep < this.instructions.length - 1){
            this.showStep(this.currentStep + 1);
        }
    }

    // Close the guide and reset styles
    closeGuide(){
        const overlay = document.getElementById("guide-overlay");
        const guide = document.getElementById("guide");
        if (overlay) overlay.remove();
        if (guide) guide.remove();

        const panels = Array.from(document.querySelectorAll("[data-role='panel']")).map(elem => elem.parentElement);
        panels.forEach(panel => {
            panel.style.opacity = "1";
            panel.style.zIndex = "";
        });
    }

}

export { InteractiveGuide };