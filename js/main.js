

var GDiff = function(){

    var followersList = [];
    var followingList = [];

    var followersMinusFollowingList = [];
    var followingMinusFollowersList = [];

    var MAX_NO_OF_USERS_PER_REQUEST = 100;
    var MAX_NO_OF_REQUESTS_PER_HOUR = 60;
    var noOfFollowers = 0;
    var noOfFollowing = 0;

    var noOfPagesOfFollowers = 0;
    var noOfPagesOfFollowing = 0;
    var currentPageOfFollowers = 1;
    var currentPageOfFollowing = 1;


    var followersMinusFollowing;
    var followingMinusFollowers;

    var textBox;

    var remainingNoOfRequests = 0;
    var resetTime;

    var totalNoOfRequestsRequired = 0;
    var username = "";

    var outputRef;

    this.init = function() {
        var button = document.getElementById("button");
        var outputDiv = document.getElementById("output");

        /* Adding event listeners */
        button.onclick = function(){
            username = document.getElementById("textBox").value;
            outputDiv.innerHTML = "Loading...";
            doesUserExists(username);
        }

        document.onkeydown = function(){
            if (event.keyCode == 13){
                document.getElementById('button').click();
            }
        }

        followersMinusFollowing = 
            document.getElementById("followersMinusFollowing");
        followingMinusFollowers = 
            document.getElementById("followingMinusFollowers")
        textBox = document.getElementById("textBox");

        outputRef = document.getElementById("output");


        //Clear variables
        followersList = [];
        followingList = [];

        followersMinusFollowingList = [];
        followingMinusFollowersList = [];

        MAX_NO_OF_USERS_PER_REQUEST = 100;
        noOfFollowers = 0;
        noOfFollowing = 0;

        noOfPagesOfFollowers = 0;
        noOfPagesOfFollowing = 0;
        currentPageOfFollowers = 1;
        currentPageOfFollowing = 1;

        //End of clearing


        textBox.focus();
        textBox.selectionStart = textBox.value.length;
        textBox.selectionLength = 0;
        //    username = textBox.value;

        //doesUserExists();
        //fetchRateLimit();
    }

    function doesUserExists(username) {
        console.log(username);
        var url = "https://api.github.com/users/" + username;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function(){
            if(xhr.readyState == 4)
            {
                if(xhr.status == 404)
                {
                    outputRef.innerHTML = "<b>Note:</b> User <i>" + username +  "</i> not found.";
                    return;
                }
                fetchRateLimit();
            }
        }
        xhr.send();
    }



    function fetchRateLimit()
    {
        var url = "https://api.github.com/rate_limit";
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);

        xhr.onload = function(){
            var jsonResponse = this.responseText;
            var parsedJsonResponse = JSON.parse(jsonResponse);
            resetTime = parsedJsonResponse.resources.core.reset;
            remainingNoOfRequests = parsedJsonResponse.resources.core.remaining;

            if(remainingNoOfRequests == 0)
            {
                var resetDate = new Date(resetTime*1000);
                var nowDate = new Date();
                var waitingTimeInMinutes = ((resetDate - nowDate)/1000)/60;
                outputRef.innerHTML = 
                    "<div style='color:lightsalmon;'><b>Note:</b> You have execeed the maxiumum no of GitHub API requests that can be made per hour. Try after "+ 
                    parseInt(waitingTimeInMinutes+1)
                    +" minutes.</div>";            
            }
            else
            {
                fetchUserInfo();
            }
        }

        xhr.onerror = function(){
            console.log("error");
        }
        xhr.send();
    }

    function fetchRateLimit1()
    {
        var url = "https://api.github.com/rate_limit";
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);

        xhr.onload = function(){
            var jsonResponse = this.responseText;
            var parsedJsonResponse = JSON.parse(jsonResponse);
            resetTime = parsedJsonResponse.resources.core.reset;
            remainingNoOfRequests = parsedJsonResponse.resources.core.remaining;

            outputRef.innerHTML +=
            "<br><br><br><b>Note:</b> You are limited to " + 
                remainingNoOfRequests + 
                " more diff calculations.<br><br>";
        }

        xhr.onerror = function(){
            console.log("error");
        }
        xhr.send();
    }

    function fetchUserInfo(){
        var url = "https://api.github.com/users/" + username;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        
        xhr.onload = processResponseAboutUser;
        
        xhr.onerror = function(){
            alert("There was an error in making request.");
        }

        xhr.send();
    }    


    function processResponseAboutUser(){
        var jsonResponse = this.responseText;
        var parsedJsonResponse = JSON.parse(jsonResponse);
        noOfFollowers = parsedJsonResponse.followers;
        noOfFollowing = parsedJsonResponse.following;
        
        noOfPagesOfFollowers = Math.ceil(noOfFollowers/MAX_NO_OF_USERS_PER_REQUEST);
        noOfPagesOfFollowing = Math.ceil(noOfFollowing/MAX_NO_OF_USERS_PER_REQUEST);
        
        totalNoOfRequestsRequired = noOfPagesOfFollowers + noOfPagesOfFollowing;

        outputRef.innerHTML = 
            "User <i>" + username + "</i> has " + noOfFollowers + " followers and is following " + noOfFollowing + ".<br>";

        if(totalNoOfRequestsRequired > MAX_NO_OF_REQUESTS_PER_HOUR)
        {
            outputRef.innerHTML += 
            "<br><br><div style='color:lightsalmon;'><b>Note:</b> You don't have enough GitHub API request left to find diff for this user." +
                "Try another user.</div>";
            return ;
        }

        currentPageOfFollowers = 0;
        currentPageOfFollowing = 0;
        fetchFollowersList();
    }

    function fetchFollowersList() {
        console.log(currentPageOfFollowers);
        if(currentPageOfFollowers > noOfPagesOfFollowers)
        {
            outputRef.innerHTML += "Total of " + 
                followersList.length + 
                " follower usernames collected.<br>";

            fetchFollowingList();
            return;
        }
        console.log("Current page: " + currentPageOfFollowers);
        var url = "https://api.github.com/users/" + username + "/followers?page=" + 
            currentPageOfFollowers + "&per_page=100";
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        
        xhr.onload = processResponseListOfFollowers;
        
        xhr.onerror = function(){
            alert("There was an error in making request.");
        }

        xhr.send();
    }

    function processResponseListOfFollowers()
    {
        followersList = [];
        var jsonResponse = this.responseText;
        var userList = JSON.parse(jsonResponse);

        for(var i = 0; i < userList.length; i++)
        {
            followersList.push(userList[i].login);
        }
        currentPageOfFollowers += 1;
        fetchFollowersList();
    }


    function fetchFollowingList() {
        /* Reached end of scanning through pages of usernames */
        if(currentPageOfFollowing > noOfPagesOfFollowing)
        {
            outputRef.innerHTML += "Total of " + followingList.length + " following usernames collected.<br>";

            calculateList();
            outputList();
            fetchRateLimit1();

            return;
        }

        var url = "https://api.github.com/users/" + username + "/following?page=" + currentPageOfFollowing + "&per_page=100";

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        
        xhr.onload = processResponseListOfFollowing;
        
        xhr.onerror = function(){
            alert("There was an error in making request.");
        }

        xhr.send();
    }

    function processResponseListOfFollowing() {
        followingList = [];
        var jsonResponse = this.responseText;
        var userList = JSON.parse(jsonResponse);

        for(var i = 0; i < userList.length; i++) {
            followingList.push(userList[i].login);
        }
        currentPageOfFollowing += 1;
        fetchFollowingList();
    }

    function calculateList(){
        followingMinusFollowersList =
            diffArrays(followingList, followersList);

        followersMinusFollowingList =
            diffArrays(followersList, followingList);
    }

    function outputList(){
        if(followersMinusFollowingList.length > 0)
        {
            outputRef.innerHTML += 
            "<br><b>Followers - Following ("+ 
                followersMinusFollowingList.length + ")</b><br>";

            for(var i = 0; i < followersMinusFollowingList.length; i++)
            {
                outputRef.innerHTML += 
                "<br>" + parseInt(i+1) + 
                    ". <a target='_blank' href='https://github.com/" + 
                    followersMinusFollowingList[i] +
                    "'>" + 
                    followersMinusFollowingList[i] +
                    "</a>";
            }
        }

        outputRef.innerHTML +="<br>";
        
        if(followingMinusFollowersList.length > 0)
        {
            outputRef.innerHTML += 
            "<br><b>Following - Followers ("+ 
                followingMinusFollowersList.length +")</b><br>";
            
            for(var i = 0; i < followingMinusFollowersList.length; i++)
            {
                outputRef.innerHTML += 
                "<br>" + parseInt(i+1) +
                    ". <a target='_blank' href='https://github.com/" + 
                    followingMinusFollowersList[i] +
                    "'>" + 
                    followingMinusFollowersList[i] +
                    "</a>";
            }
        }
    }
}


function diffArrays(a1, a2)
{
    return a1.filter(function(i) { return a2.indexOf(i) < 0;});
}

//Key Processing

function processKey(event)
{
    if(event.keyCode == 13)
    {
        init();
    }
}
