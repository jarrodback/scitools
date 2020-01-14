var count = 0;
function toggleSidebar(){
    document.getElementById("sidebar").classList.toggle('active');
    document.getElementById("sidebar").style.transition = "all 1s";
    document.getElementById("circle").style.transition = "all 1s";
    document.querySelector("span").style.transition = "all 1s";
    document.querySelectorAll("span")[1].style.transition = "all 1s";
    count++;
    if(count % 2 == 1)
    {
        document.getElementById("map").style.transition = "all 1s";
        document.getElementById("map").style.marginLeft = "40%";
        document.getElementById('map').style.width = "60%";      
        document.getElementById('circle').style.transform = "rotate(180deg)";
        document.getElementById('circle').style.transformOrigin = "center left";
        document.getElementById('circle').style.backgroundColor = "black";
        document.querySelector("span").style.backgroundColor = "white";
        document.querySelectorAll("span")[1].style.backgroundColor = "white";
        setTimeout(function(){ map.invalidateSize()}, 400);
    }
    else
    {
        document.getElementById("map").style.marginLeft = "0%";
        document.getElementById('map').style.width = "100%";
        document.getElementById('circle').style.transform = "rotate(360deg)";
        document.getElementById('circle').style.backgroundColor = "white";
        document.querySelector("span").style.backgroundColor = "black";
        document.querySelectorAll("span")[1].style.backgroundColor = "black";
        setTimeout(function(){ map.invalidateSize()}, 400);
    }
}

var acc = document.getElementsByClassName("accordion");
var i;
for(i = 0; i< acc.length;i++){
    acc[i].addEventListener("click", function(){
        var panel = this.nextElementSibling;
        this.classList.toggle("active");
        if(panel.style.maxHeight){
            panel.style.maxHeight = null;
        }
        else{
            panel.style.maxHeight = panel.scrollHeight +"px";
        }
    });
}

var acc = document.getElementsByClassName("missionSearch");
var i;
for(i = 0; i< acc.length;i++){
    acc[i].addEventListener("search", function(){
        var panel = document.getElementsByClassName('panel')[0];
        panel.style.maxHeight = panel.scrollHeight +"px";
    });
}