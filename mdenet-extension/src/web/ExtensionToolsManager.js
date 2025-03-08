import { ToolManager } from '../../../platform/src/ToolsManager'; 

class ExtensionToolsManager extends ToolManager{
    constructor(){
        super();
    }

    setToolsUrls(urls){
        if(this.toolsUrls==null) {

            this.toolsUrls = [];
            
            for(let url of urls){
                
                let toolUrl = new Object();
                toolUrl.id = ""; // Populate when tool is fetched
                if(this.isIDPlaceHolder(url)){
                    // url is in the form of {{ID-...}}, no modification needed
                    toolUrl.url = url;
                }
                else if (this.isBaseUrlPlaceHolder(url)){
                    // the url variable is a placeholder, so it needs to be re-written with the correct path
                    var url_tail = '';
                    let url_port = this.getPort(url);

                    if(url.indexOf('/') > 0){
                        url_tail = url.split('/')[1];
                    }

                    if (url_port != null){
                        let path = this.fetchPathByPort(url_port);

                        if(path != null){
                            let base_url = "https://ep.mde-network.org";
                            path = path.endsWith('/') ? path : path + '/';
                            toolUrl.url = base_url + path + url_tail;
                        }
                    }
                    else{
                        toolUrl.url = url;
                    }
                }
                else if (this.isValidUrl(url)){
                    // the url variable is hardcoded in the activity file, so no need for re-writing
                    toolUrl.url = url;
                }
                else{
                    // something is wrong
                    this.configErrors.push(new Error(`${url} is not a valid URL or a valid URL placeholder.`))
                }
                
                this.toolsUrls.push(toolUrl);
            }

            this.configErrors = this.configErrors.concat( this.fetchTools() );
            this.registerToolFunctions();
            this.createClassesFromConfig();
        }
    }

    /** 
     * Fetches the tools from the tools url and populates tool's
     * functions and panel definitions.
     * @returns errors from parsing and validation
     */
    fetchTools(){
        let errors = [];

        for (let toolUrl of this.toolsUrls) {

            let xhr = new XMLHttpRequest();
            xhr.open("GET", toolUrl.url, false);

            try{
                xhr.send();
            } catch (err) {
                if (err instanceof DOMException){
                    errors.push( new Error(`A tool configuration file was not accessible at: ${toolUrl.url}. 
                                                            Check the tool's url given in the activity file is correct and the tool 
                                                            service is still available.`) );
                } else {
                    throw err;
                }
            }

            if (xhr.status === 200) {    

                let response_text =  xhr.responseText;

                var toolConfig = this.rewriteUrl("https://ep.mde-network.org", toolUrl.url, response_text);

                // Now parse tool config
                let validatedConfig = this.parseAndValidateToolConfig(toolConfig);

                if ( validatedConfig.errors.length == 0 ){
                    
                    const config = validatedConfig.config;

                    // Store the tool found in the given json
                    if (config.tool.id){
                        this.storeTool(config.tool);
                        
                        toolUrl.id = config.tool.id;

                        //TODO update any tool mangement menu. 
                    }
                
                } else {
                    // Error tool file parsing error
                    errors = errors.concat(validatedConfig.errors);
                }                
            }
        }

        return errors;
    }
}

export{ExtensionToolsManager}