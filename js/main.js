let timerDisplay;
//var mindfulnessMeasure;
let soundLooper = null;
var measureDurationInSeconds = 60;
var measureDate = new Date();
var countInterval = 8;

var leftSound = null;
$(document).ready(()=>{
    $("#displayResults").prop("hidden",true);
    $(".startDisplay").prop("hidden",false);
    $("#timer").prop("hidden",true);
    $("#countInterval").val(countInterval);
    $(".countIntervalDescription").text(countInterval);

    soundLooper = new SoundLooper(measureDurationInSeconds , countInterval, end);

    timerDisplay = $("#timer")[0];
    displayTime(measureDurationInSeconds, timerDisplay);
    $("#duration").val(measureDurationInSeconds/60);
    $(document).keydown(function(e) {
        switch(e.which) {
            case 37: // left
                soundLooper.matchSignal();
                break;
            case 38: // up
                soundLooper.countSignal();
                break;
            case 39: // right
                soundLooper.restartCountSignal();
                break;
            case 40: // down
                break;
            default: return; // exit this handler for other keys
        }
        e.preventDefault(); // prevent the default action (scroll / move caret)
    });

    leftSound = document.createElement('audio');
    leftSound.setAttribute('src', 'sounds/left_voice.mp3');
    difficultyHasChanged();
});

function difficultyHasChanged() {
    soundLooper.difficulty = $("#difficulty").val();
    let difficultyLabelsMap = [
        {
            "label": "easy peasy",
            "background-color":"#1ed1ff",
            "color":"#0d14ff"
        },
        {
            "label": "medium",
            "background-color":"#ff062b",
            "color":"#0d14ff"

        },
        {
            "label": "hard",
            "background-color":"#0d14ff",
            "color":"#fffe0b"

        },
    ];
    $("#difficultyLabel").text(difficultyLabelsMap[soundLooper.difficulty].label);
    $("#difficultyLabel").css("background-color",difficultyLabelsMap[soundLooper.difficulty]["background-color"]);
    $("#difficultyLabel").css("color",difficultyLabelsMap[soundLooper.difficulty].color);
}
function playSoundError() {
    playSound(mindfulnessMeasure.sound1.frequency, "triangle", 500, ()=>{});

}
function countIntervalHasChanged() {
    $(".countIntervalDescription").text($("#countInterval").val());
    soundLooper.testData.count = $("#countInterval").val();
}
function measureDurationTimeHasChanged(){
    let t = $("#timer")[0];
    measureDurationInSeconds = $("#duration").val()*60;
    displayTime(measureDurationInSeconds,timerDisplay);
    soundLooper.testData.duration = measureDurationInSeconds;
}
function displayTime(timeInSeconds,display){
    var minutes = parseInt(timeInSeconds / 60, 10);
    var seconds = parseInt(timeInSeconds % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    display.textContent = minutes + ":" + seconds;
}
function play3D_Sound(o) {
    if(o == -1){
        leftSound.play()
    }
    else{

    }
}
function playSound1() {
    playSound(mindfulnessMeasure.sound1.frequency, mindfulnessMeasure.sound1.type, 500, ()=>{});
}
function playSound2() {
    playSound(mindfulnessMeasure.sound2.frequency, mindfulnessMeasure.sound2.type, 500, ()=>{});
}
function end(){
    $("#timer").prop("hidden",true);
    $("#displayResults").prop("hidden",false);

    $("#ratio").text(soundLooper.testData.ratio + "%");
    $("#score").text(soundLooper.testData.score);
    $("#loops").text(soundLooper.testData.loops);
    $("#date")[0].innerHTML= measureDate.toLocaleDateString();
    $("#time")[0].innerHTML = measureDate.toLocaleTimeString();
    $("#correctMatches").text(soundLooper.testData.correctMatches);
    $("#falsePositiveMatches").text(soundLooper.testData.falsePositiveMatches);
    $("#points").text(soundLooper.testData.points);
    $("#correctCounts").text(soundLooper.testData.correctCounts);
    $("#falsePositiveCounts").text(soundLooper.testData.falsePositiveCounts);
    $("#durationDisplay").text(measureDurationInSeconds/60 + "min");
    $("#totalPoints").text(soundLooper.testData.totalPoints);
    $("#totalNumberCounts").text(soundLooper.testData.totalNumberCounts);
}
function start(){
    $("#timer").prop("hidden",false);
    $(".startDisplay").prop("hidden",true);

    measureDate = new Date();
    //$("#displayResults").prop("hidden",false);
    function startTimer(duration, display, endCallback) {
        var timer = duration, minutes, seconds;
        var interval = setInterval(function () {
            displayTime(timer, display);
            if (--timer < 0) {
                clearInterval(interval);
                endCallback()
            }}, 1000);
    }
    startTimer(measureDurationInSeconds, timerDisplay, ()=>{});
    setTimeout(()=>{soundLooper.start(measureDurationInSeconds)},1000);

}