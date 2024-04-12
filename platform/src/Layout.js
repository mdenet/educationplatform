const PANEL_HOLDER_ID = "navview-content-panels";

class Layout {

    /**
     * Creates the layout on the page for given a set of panels with no control over the order 
     * they are displayed.
     * @param {*} rootId  the containing page element id
     * @param {*} panels[] the instantiated panels
     */
    createFromPanels(rootId, panels){

        if (panels == null || panels.length < 1){
             // Nothing to do
            return;
        }

        var root = document.getElementById(rootId);
        root.innerHTML = "";

        var panelHolderElement;

        if ( panels.length == 1 ) {
            panelHolderElement = panels[0].getElement(); // only the element to add

        } else if ( panels.length == 2  ) {
                panelHolderElement = Layout.createVerticalSplitter([panels[0].getElement(), panels[1].getElement()], "50, 50" );

        } else {
            // Three or more panels
            var panelsToLayout = [...panels];
            var numberOfVerticalSplitters= Math.floor(panels.length / 2 );
            var verticalSplitters = [];
            var splitProportions =  ("10, ".repeat(numberOfVerticalSplitters)).slice(0, -2);

            // Layout pairs of panels
            for ( let sNo = 0; sNo < numberOfVerticalSplitters; sNo++) {
                verticalSplitters.push(
                    // Appearance:                                Top               ,                  Bottom
                    Layout.createVerticalSplitter([panelsToLayout.pop().getElement(), panelsToLayout.pop().getElement()] ) 
                );
            }

            // Odd number of panels so add the last element
            if (panelsToLayout.length==1){
                verticalSplitters.push(panelsToLayout.pop().getElement());
            }

            panelHolderElement = Layout.createHorizontalSplitter( verticalSplitters, splitProportions);
        }

        Layout.addPanelHolderAttributes(panelHolderElement);

        root.appendChild(panelHolderElement);
    }


    /**
     * Creates the layout on the page for given a set of panels corresponding to the position 
     * in the layout array parameter.
     * @param {*} rootId the containing page element id
     * @param {*} panels[] the instantiated panels
     * @param {*} layout[][] panel ids 
     */
    createFrom2dArray(rootId, panels, layout){

        let root = document.getElementById(rootId);
        root.innerHTML = "";

        let verticalSplitters=[];
        let panelHolderElement;

        // Get the number of rows and columns
        let numberOfRows = layout.length;
        let numberOfColumns = 0;
        for (let row of layout) {
            if (row.length > numberOfColumns) {
                numberOfColumns = row.length;
            }
        }

        for(let column=0; column < numberOfColumns; column++  ) {

            let panelsToLayout=[];

            for(let row=0; row < numberOfRows; row++){
                // Lookup the panels in the row
                let panel = panels.find( pn => (pn.id==layout[row][column]) ); 

                if (panel!=undefined){
                    panelsToLayout.push(panel);
                }
            }

            // Create the splitters for the row
            let splitProportions = ("10, ".repeat(numberOfRows)); // Add a proportion per splitter

            if (panelsToLayout.length > 1) {
                verticalSplitters.push( Layout.createVerticalSplitter( panelsToLayout.map( pn => pn.getElement() ), splitProportions) );
            } else {
                // No splitter required for a single panel
                verticalSplitters.push( panelsToLayout[0].getElement() );
            }
        }
        
        if (numberOfColumns > 1) {
            let splitProportions =  ("10, ".repeat(verticalSplitters.length)); // Add a proportion per splitter
            panelHolderElement = Layout.createHorizontalSplitter( verticalSplitters, splitProportions );

        } else {
            // No splitter for single columns
            panelHolderElement = verticalSplitters[0];
        } 

        Layout.addPanelHolderAttributes(panelHolderElement);
        
        root.appendChild(panelHolderElement);
    }

    /**
     * Add the panel holder attributes to the given element.
     * @param {HTMLElement} holderElement - The HTML element to add the attributes to
     */
    static addPanelHolderAttributes(holderElement){
        holderElement.setAttribute("class", "h-100");
        holderElement.setAttribute("id", PANEL_HOLDER_ID);
        holderElement.setAttribute("style", "min-height:800px");
    }

    static createHorizontalSplitter(components, split = "50, 50") {
        return Layout.createSplitter(true, components, split);
    }

    static createVerticalSplitter(components, split = "50, 50") {
        return Layout.createSplitter(false, components, split);
    }

    static createSplitter(horizontal, components, split) {
        var splitter = document.createElement("div");
        splitter.setAttribute("data-role", "splitter");
        splitter.setAttribute("data-on-resize-stop", "fit()");
        splitter.setAttribute("data-on-resize-split", "fit()");
        splitter.setAttribute("data-on-resize-window", "fit()");
        splitter.setAttribute("data-split-sizes", split);

        if (!horizontal) splitter.setAttribute("data-split-mode", "vertical");
        components.forEach(component => splitter.appendChild(component));
        return splitter;
    }

}

export { Layout, PANEL_HOLDER_ID };