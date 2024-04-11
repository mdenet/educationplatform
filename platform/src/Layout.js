
class Layout {

    /**
     * Creates the layout on the page for given a set of panels with no control over the order 
     * they are displayed.
     * @param {*} rootId  the containing page element id
     * @param {*} panels[] the instantiated panels
     */
    createFromPanels(rootId, panels){

        var root = document.getElementById(rootId);
        root.innerHTML = "";

        var splitter;

        if ( panels.length == 1 ) {
            splitter = Layout.createVerticalSplitter([panels[0].getElement()]);

        } else if ( panels.length == 2  ) {
            splitter = Layout.createVerticalSplitter([panels[0].getElement(), panels[1].getElement()], "50, 50" );

        } else {
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
                verticalSplitters.push( Layout.createVerticalSplitter([panelsToLayout.pop().getElement()]) );
            }

            splitter = Layout.createHorizontalSplitter( verticalSplitters, splitProportions);   
        }

        splitter.setAttribute("class", "h-100");
        splitter.setAttribute("id", "splitter");
        splitter.setAttribute("style", "min-height:800px");
        root.appendChild(splitter);
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
        let splitter;


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
            splitter = Layout.createHorizontalSplitter( verticalSplitters, splitProportions ); 

        } else {
            // No splitter for single columns
            splitter = Layout.createVerticalSplitter( verticalSplitters) ;
        } 

        splitter.setAttribute("class", "h-100");
        splitter.setAttribute("id", "splitter");
        splitter.setAttribute("style", "min-height:800px");
        
        root.appendChild(splitter);
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

export { Layout };