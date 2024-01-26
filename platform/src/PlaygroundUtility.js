

class PlaygroundUtility {


    static showMenu(){
        document.getElementById("navview").style.display = "block";
    }

    static hideLogin(){
        document.getElementById("login").style.display = "none";
    }

    static showLogin(){
        document.getElementById("login").style.display = "block";
    }

    static showFeedbackButton(){
        document.getElementById("feedback-button").style.display = "block";
    }

    static setFeedbackButtonUrl(url){
        document.getElementById("feedback-url").href = url;
    }

}

export { PlaygroundUtility };