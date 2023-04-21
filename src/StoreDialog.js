import { isAuthenticated } from './Utility.js';

class StoreDialog {

    show(event) {
        event.preventDefault();

        var defaultBranchOnly = true;
        var forkName;

        Metro.dialog.create({
            title: "Commit Activity",
            content: `
                
                <label for="storedialog-owner">Owner:</label>
                <input type="text" id="storedialog-owner" data-role="input">
                
                <label for="storedialog-reponame">Repsitory name:</label>
                <input type="text" id="storedialog-reponame" data-role="input">

                <input type="checkbox" data-role="checkbox" data-caption="Copy main branch only " data-caption-position="left" checked>
            `,
            actions: [
                {
                    caption: "Create Branch",
                    cls: "js-dialog-close success",
                    onclick: function () {

  
                    }
                },
                {
                    caption: "Cancel",
                    cls: "js-dialog-close"
                }
            ]
        });
    }



    storeActivityPanelContents(){

        if ( isAuthenticated() ){

        }
       
    }

}

export { StoreDialog };