/**
 * Created by danielhindi on 2/16/18.
 */

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");
if (!buildfire.social) buildfire.social = {};

buildfire.social.reactions= (function(){

    var endPoint="https://kzq9kqyroa.execute-api.us-east-1.amazonaws.com/dev/social/";

    function createReactionDiv(container,articleId,emotion){
        var div = document.createElement('div');
        div.setAttribute('emotion',emotion);


        function handler() {

            if (this.parentNode.className.indexOf("activeBar") >= 0) {
                console.log(this.getAttribute('emotion'));
                this.parentNode.classList.remove("activeBar");
                buildfire.social.reactions.toggleEmotion(articleId,emotion,function(err,result){
debugger;
                });
            }
            else {
                this.parentNode.classList.add("activeBar");
            }

        }

        if(location.protocol.indexOf("http")==0)
            div.onclick=handler;
        else
            div.ontouch=handler;

        container.appendChild(div);
    }
    function createReactionDivs(container,articleId){
        ['hate','love','lol','wow','sad','like'].forEach(function(e){
            createReactionDiv(container,articleId,e);
        });

    }

    function getUser(callback) {
        buildfire.auth.getCurrentUser(function (err, user) {
            if (err)
                callback(err);
            else if (!user) {
                buildfire.auth.login({}, function (err, user) {
                    if (err)
                        callback(err);
                    else
                        callback(null,user);
                });
            }
            else
                callback(null,user);

        });
    }

    function addLastReactorsPics(div,participants) {
        if (!participants || !div || !participants.length) return;

        var picCount=0;
        for (var i = participants.length - 1; i >= 0 && picCount < 3; i--){
            if (participants[i].user.profilePic) {
                var img = document.createElement('img');
                img.src = buildfire.imageLib.cropImage(participants[i].user.profilePic, {width: 52, height: 52});
                img.className = "reactorAvatar";
                div.appendChild(img);
                picCount++;
            }
        }


    }

    function didIParticipate(userId,participants) {
        if(!userId || !participants)return false;
        if (stats.participants && participants.length)
            for (var i = 0; i < participants.length; i++)
                if (participants.userId == userId)
                    return true;
        return false;
    }

    return {
        fetchStats:function(articleIds,currentUserId,callback){
            if(!callback)callback=function(){};

            var ids = articleIds;
            if(!Array.isArray(ids))
                ids=[ids];
            var url = endPoint + "articles?includeAllReaction=1&articleIds="+ ids.join(",");

            fetch(url).then(function(res) {

                if(res.status == 200){
                    res.json().then(function(b){
                        if(Array.isArray(b) && b.length > 0  )
                            callback(null,b[0]);
                        else
                            callback();
                    }).catch(function(err){
                        console.error(err);
                    });
                }
                else if(res.status == 400)
                    console.error(res) ;
            } );


        }
        ,toggleEmotion:function(articleId,emotion,callback){
            if(!callback)callback=function(){};
            getUser(function(err,user){
                if(err)
                    callback(new Error('no logged in user',err));
                else {

                    fetch(endPoint + "reactToggle",{
                        method: 'post',
                        body: JSON.stringify({
                            articleId,articleId
                            ,emotion:emotion
                            ,user: user
                        })
                    }).then(function(res) {
debugger;
                        if(res.status == 200){
                            res.json().then(function(b){
                                if(Array.isArray(b) && b.length > 0  )
                                    callback(null,b[0]);
                                else
                                    callback();
                            }).catch(function(err){
                                console.error(err);
                            });
                        }
                        else if(res.status == 400)
                            console.error(res) ;
                    } );
                }
            });




        }
        ,attach:function(element,articleId,currentUserId){

            var divTransformer = document.createElement('div');
            divTransformer.className = "reactionTransformer";
            element.appendChild(divTransformer);


            var divReactionBar = document.createElement('div');
            divReactionBar.className="reactionBar";
            createReactionDivs(divReactionBar,articleId);

            divTransformer.appendChild(divReactionBar);

            this.fetchStats(articleId,currentUserId,function(err,stats){
                if(!stats)return;

                var divReactionStats = document.createElement('div');
                divReactionStats.className="reactionStats";

                addLastReactorsPics(divReactionStats,stats.participants);


                if(didIParticipate(currentUserId,stats.participants)){

                }


                var count = 0 ;
                for(p in stats.emotions)
                    count+= stats.emotions[p];

                if(count) {
                    var divReactionCount = document.createElement('div');
                    divReactionCount.className = "reactionCount";
                    divReactionCount.innerHTML = "(+" + count + ")";
                    divReactionStats.appendChild(divReactionCount);
                }
                divTransformer.appendChild(divReactionStats);

            });



        }
    }
})();

document.addEventListener("DOMContentLoaded", function() {
    buildfire.auth.getCurrentUser(function(err,user){
        var elements = document.querySelectorAll(".reactionContainer[articleId]");
        elements.forEach(function(e){
            var articleId= e.getAttribute("articleId");
            buildfire.social.reactions.attach(e,articleId,user?user.id:null);
        });
    });

});