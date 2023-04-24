

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

}

export { PlaygroundUtility };