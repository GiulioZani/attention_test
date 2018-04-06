"use strict";
let context = new AudioContext();
let g = null;

class Sound {
    constructor(frequency, type, duration, orientation = 0, durationIsRandomized = false, random = 1000, enabled = true) {
        this.enabled = enabled;
        this.orientation = orientation;
        this.random = random;
        this.frequency = frequency;
        this.minimalDuration = duration;
        this.type = type;
        this.durationIsRandomized = durationIsRandomized;
    }

    get duration() {
        if (this.durationIsRandomized) {
            return this.minimalDuration + Math.floor(Math.random() * this.random);
        }
        else {
            return this.minimalDuration;
        }
    }
    set duration(duration){
        this.minimalDuration = duration;
    }

    play(endCallBack = () => {}){
        if (this.enabled) {
            let o = context.createOscillator();
            let panNode = context.createStereoPanner();
            panNode.pan.value = this.orientation;
            panNode.connect(context.destination);

            g = context.createGain();
            o.type = this.type;
            o.connect(g);
            o.frequency.value = this.frequency;
            g.connect(panNode);
            o.start(0);
            setTimeout(() => {
                g.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 1);
                setTimeout(() => {
                    o.stop();
                    o = null;
                }, 700);

                endCallBack();
            }, this.duration);
        }
        else {
            setTimeout(() => {
                endCallBack();
            }, this.duration);
        }
    }
}
class TestData{
    constructor(duration = 60, count = 8){
        this.loops = 1;
        this.correctMatches = 0;
        this.falsePositiveMatches = 0;
        this.count = count;
        this.correctCounts = 0;
        this.falsePositiveCounts = 0;
        this.duration = duration;
    }
    get score(){
        return (this.points < 0 ? -1 : 1) * Math.floor(100*this.points*this.points/this.totalPoints)/100;
    }
    get points() {
        return (this.correctMatches - this.falsePositiveMatches) + this.count*(this.correctCounts - this.falsePositiveCounts);
    }

    get totalNumberCounts(){
        return Math.floor(this.loops/this.count);
    }

    get totalPoints(){
        return this.loops + this.count*this.totalNumberCounts;
    }

    get ratio() {
        return Math.floor(100*100*this.points/this.totalPoints)/100;
    }
}
class SoundLooper {
    constructor(duration = 60, count = 8,  endCallBack = () => {}, randomInterval =1600, minimalIntervalDuration = 100, ) {
        this.endCallBack = endCallBack;
        this.testData = new TestData(duration, count);
        let orientation = (Math.random() >= 0.5) == false ? -1 : 1;
        let beep = new Sound(146.8, 'sine', /*300*/300, orientation);
        this.errorBeep = new Sound(146.8, 'triangle', 350, orientation);
        this.minimalIntervalDuration = minimalIntervalDuration;
        this.randomInterval = randomInterval;
        this.hasToEnd = false;
        this.isPlaying = false;
        this.__difficulty = 1;

        this.randomSoundPlayer = new RandomSoundPlayer(this);
        this.beep = beep;
        this.hasToPlayError = false;
        this.hasToFlip = false;

        this.currentCount = 1;

        let leftVoice = document.createElement('audio');
        leftVoice.setAttribute('src', 'sounds/right_voice.mp3');
        let rightVoice = document.createElement('audio');
        rightVoice.setAttribute('src', 'sounds/left_voice.mp3');
        this.voices = {
            "-1": rightVoice,
            "1": leftVoice
        };
    }
    set beep(beep){
        this.__beep = beep;
        let randomBeep = Object.assign(Object.create(Object.getPrototypeOf(this.beep)), this.beep);
        randomBeep.orientation = - this.beep.orientation;
        this.randomBeep = randomBeep;
        this.randomSoundPlayer.beep = randomBeep;
    }
    get beep(){
        return this.__beep;
    }
    start() {
        setTimeout(()=>{
            this.hasToFlip = true;
        },30000);
        setTimeout(()=>{
            this.hasToEnd = true;
        }, this.testData.duration*1000);
        this.voices[this.beep.orientation].play();
        let firstEnded = ()=> {
            this.voices[this.beep.orientation].removeEventListener("ended", firstEnded ,false);
            let restart = () => {
                this.beep.orientation = -this.beep.orientation;
                this.errorBeep.orientation = this.beep.orientation;
                this.randomSoundPlayer.beep.orientation = -this.beep.orientation;
                this.randomSoundPlayer.start();
                this.go();
            };
            this.voices[1].addEventListener('ended', restart, false);
            this.voices[-1].addEventListener('ended', restart, false);
            this.randomSoundPlayer.start();
            this.go();
        };
        this.voices[this.beep.orientation].addEventListener("ended", firstEnded ,false);
    }

    go() {
        this.hasMatched = false;
        this.hasCounted = false;
        if (this.hasToEnd) {
            this.randomSoundPlayer.end(()=>{this.endCallBack()});
        }
        else if (this.hasToFlip) {
            this.hasToFlip = false;
            setTimeout(()=>{
                this.hasToFlip = true;
            },30000);
            this.randomSoundPlayer.end(() => {
                this.voices[-this.beep.orientation].play();
            });
        }
        else if (this.hasToPlayError) {
            this.hasToPlayError = false;
            this.randomSoundPlayer.end(() => {
                    this.errorBeep.play(() => {
                        this.randomSoundPlayer.start();
                        this.go();
                        console.log("error")
                    })
                }
            );
        }
        else {
            setTimeout(() => {
                if (this.randomSoundPlayer.isPlaying) {
                    this.go();
                }
                else {
                    this.isPlaying = true;
                    this.beep.play(() => {
                        if(this.isCorrectCount() && (!this.hasCounted)){
                            this.hasToPlayError = true;
                        }
                        this.isPlaying = false;
                        this.testData.loops++;
                        console.log(this.currentCount);
                        this.currentCount = this.currentCount === this.testData.count ? 1 : this.currentCount + 1;
                        this.go();
                    });
                }
            }, this.minimalIntervalDuration + Math.floor(Math.random() * this.randomInterval))
        }
    }
    isCorrectCount(){
        //return this.testData.loops % this.testData.count == 0
        return this.currentCount === this.testData.count;
    }
    restartCountSignal(){
        this.currentCount = 1;
    }
    set difficulty(difficulty){
        this.__difficulty = difficulty;
        let difficulties = [
            {
                "beepDuration":500,
                "randomInterval": 2000
            },
            {
                "beepDuration":400,
                "randomInterval": 1600
            },
            {
                "beepDuration":300,
                "randomInterval": 1400
            }
        ];
        this.beep.duration = difficulties[difficulty].beepDuration;
        this.randomInterval = difficulties[difficulty].randomInterval;
    }
    get difficulty(){
        return this.__difficulty;
    }
    countSignal(){
        if(this.isPlaying && this.isCorrectCount()){
            if(!this.hasCounted){
                this.testData.correctCounts++;
                this.hasCounted = true;
            }
        }
        else{
            this.testData.falsePositiveCounts++;
        }
    }
    matchSignal(){
        if(this.isPlaying){
            if(!this.hasMatched){
                this.testData.correctMatches++;
                this.hasMatched = true;
            }
        }
        else{
            this.testData.falsePositiveMatches++;
        }
    }

    anError() {
        this.hasToEnd = true;
    }

    end() {
        this.hasToEnd = true;
    }
}

class RandomSoundPlayer {
    constructor(soundLooper, beep = new Sound(146.8, 'sine', 400, -1)) {
        this.soundLooper = soundLooper;
        this.beep = beep;
        this.minimalIntervalDuration = soundLooper.minimalIntervalDuration;
        this.randomInterval = soundLooper.randomInterval;
        this.hasToEnd = false;
        this.isPlaying = false;
        this.loops = 0;
        this.hasToPlayError = false;
    }

    start() {
        if (this.hasToEnd) {
            this.hasToEnd = false;
            this.ended();
        }
        else {
            setTimeout(() => {
                if (this.soundLooper.isPlaying) {
                    this.start();
                }
                else {
                    this.isPlaying = true;
                    this.beep.play(() => {
                        this.isPlaying = false;
                        this.loops++;
                        this.start();
                    });
                }
            }, this.soundLooper.minimalIntervalDuration + Math.floor(Math.random() * this.randomInterval))
        }
    }

    end(ended) {
        this.ended = ended;
        this.hasToEnd = true;
    }
}