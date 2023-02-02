
class Layout {

    /**
     * Creates a layout given a set of panels.
     * @param {*} rootId 
     * @param {*} panels 
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
            var splitProportions =  ("10, ".repeat(numberOfVerticalSplitters)).slice(0, -2)

            // Layout pairs of panels
            for ( let sNo = 0; sNo < numberOfVerticalSplitters; sNo++) {
                verticalSplitters.push( 
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