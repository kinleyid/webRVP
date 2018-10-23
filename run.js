
var decoded = decodeURIComponent(window.location.search);
pID = decoded.substring(decoded.indexOf('=')+1);
var filename = pID + "RVP";

// For 100 digits/minute, per cantab specs, make these two sum to 36
var nBlanksBeforeFixationCross = 0;
var nFixationCrossFrames = 120;
var nBlanksAfterFixationCross = 36;
var nDigitFrames = 36;
var nBlankFramesAfterDigit = 0;
var score;
var allowNegativeScores = false;
var nPointsPerCorrect = 40;
var nPointsPerIncorrect = 20;

var alreadyPressed;
var allowPresses;

var stim = [];
var minTargSep = 3; // Minimum separation between the end of one target and the beginning of another
var noRptsWitin = 2; // No repeated digits within this many
var noRptsWithin = 2;
var practiceTargTypes = [[3,5,7]];
var blockwise_nPracticeDgts = [7,8,7,8];
var blockwise_nPracticeTargs = [1,1,1,1];
var taskTargTypes = [[3,5,7],[2,4,6],[4,6,8]];
var blockwise_nTaskDgts = [200,200];
var blockwise_nTaskTargs = [16,16];
var legalDigits = [2,3,4,5,6,7,8,9];

// Variables governing the type of feedback displayed
var colourDigits = true;
var underlineDigits = true;
var beepForCorrect = true;
var textCues = true;
var feedbackText = true;
var pointsFeedback = true;
var nTextMs = 1000;

var nDecPts = 3;

var ALL = document.getElementsByTagName("html")[0];
var scoreArea = document.getElementById('scoreArea');
var digitDisplayArea = document.getElementById('digitDisplayArea');
var digitDisplayP = document.getElementById('digitDisplayP');
var targetDisplayArea = document.getElementById('targetDisplayArea');
var feedbackTextArea = document.getElementById('feedbackTextArea');
var dialogArea = document.getElementById('dialogArea');
var dialogP = document.getElementById('dialogP');

var frameCount = 0;
var digitCount = 0;
var score;

var isPractice;

var lastTargTime;
var givePosFeedbackWithin = 1800;// ms
sayTooLateWithin = 2500;
var outputText = 'Time,Event,NewLine,';

var mutationObserver = new MutationObserver(function(){
    presentationTime = performance.now();
    if(!isNaN(Number(digitDisplayP.innerHTML)) && digitDisplayP.innerHTML != ""){
        outputText += presentationTime.toFixed(nDecPts) + ',' + digitDisplayP.innerHTML + ',NewLine,';
        if(stim.isTarg[digitCount] && !stim.isTarg[digitCount+1]){
            lastTargTime = presentationTime;
        }
    }
});

mutationObserver.observe(digitDisplayP, {
    childList: true
});

window.onkeydown = window.onTouch = function(e){
    // Add key press time to event log. Don't worry about whether the response was made quickly enough
    if(e.code == 'Space' && allowPresses){
        outputText += e.timeStamp.toFixed(nDecPts) + ',' + e.code + ',NewLine,';
        if(feedbackText){
            if(e.timeStamp - lastTargTime < sayTooLateWithin && !alreadyPressed){
                alreadyPressed = true;
                if(e.timeStamp - lastTargTime < givePosFeedbackWithin){
                    score += nPointsPerCorrect;
                    scoreArea.innerHTML = "Score: " + score;
                    displayFeedback('Correct!');
                } else {
                    score -= nPointsPerIncorrect;
                    if(score < 0 && !allowNegativeScores){
                        score = 0;
                    }
                    if(isPractice){
                        scoreArea.innerHTML = "Score: " + score;
                        displayFeedback('Too late!');
                    } else {
                        scoreArea.innerHTML = "Score: " + score;
                        displayFeedback('Wrong!');
                    }
                }
            } else {
                if(isPractice && stim.isTarg[digitCount] && stim.isTarg[digitCount+1]){
                    score -= nPointsPerIncorrect;
                    if(score < 0 && !allowNegativeScores){
                        score = 0;
                    }
                    scoreArea.innerHTML = "Score: " + score;
                    if(isPractice){
                        displayFeedback('Too early!');
                    }
                } else {
                    score -= nPointsPerIncorrect;
                    if(score < 0 && !allowNegativeScores){
                        score = 0;
                    }
                    scoreArea.innerHTML = "Score: " + score;
                    displayFeedback('Wrong!');
                }
            }
        }
    }
}

function displayFeedback(text){
    feedbackTextArea.innerHTML = text;
    setTimeout(function(){
        if(feedbackTextArea.innerHTML == text){
            feedbackTextArea.innerHTML = ''
        }
    }, nTextMs);
}

function startPractice(){
    outputText += performance.now().toFixed(nDecPts) + ',' + 'Practice start' + ',NewLine,';
    score = 0;
    feedbackTextArea.innerHTML = '';
    ALL.style.cursor = 'none';
    isPractice = true;
    // Initialize stim
    stim.digits = stim.isTarg = [];
    var i, tempStim;
    for(i = 0; i < blockwise_nPracticeDgts.length; i++){
        tempStim = new initializeDigits(blockwise_nPracticeTargs[i],blockwise_nPracticeDgts[i],practiceTargTypes);
        stim.digits = stim.digits.concat(tempStim.digits);
        stim.isTarg = stim.isTarg.concat(tempStim.isTarg);
    }
    elimSpuriousTargs(stim.digits, stim.isTarg, practiceTargTypes);
    targetDisplayArea.children[1].style.visibility = 'hidden';
    targetDisplayArea.children[2].style.visibility = 'hidden';
    dialogArea.style.display = 'none';
    digitDisplayArea.style.display = 'block';
    targetDisplayArea.style.display = 'block';
    feedbackTextArea.style.display = 'block';
    if(nBlanksBeforeFixationCross > 0){
        window.requestAnimationFrame(function(){wait(nBlanksBeforeFixationCross,fixationCross)});
    } else {
        window.requestAnimationFrame(fixationCross);
    }
}

function fixationCross(){
    if(frameCount == 0){
        digitDisplayP.style.color = 'black';
        digitDisplayP.style.textDecoration = 'none';
        digitDisplayP.innerHTML = '\u2022';
    }
    if(frameCount == nFixationCrossFrames - 1){
        frameCount = 0;
        if(nBlanksAfterFixationCross > 0){
            window.requestAnimationFrame(function(){
                digitDisplayP.innerHTML = '';
                wait(nBlanksAfterFixationCross,showDigit);
            });
        } else {
            window.requestAnimationFrame(showDigit);
        }
    } else {
        frameCount++;
        window.requestAnimationFrame(fixationCross);
    }
}

function showDigit(){
    if(performance.now() - lastTargTime > sayTooLateWithin){
        alreadyPressed = false;
    }
    if(frameCount == 0){
        allowPresses = true;
        if(isPractice){
            if(stim.isTarg[digitCount]){
                digitDisplayP.style.color = 'yellow';
                digitDisplayP.style.textDecoration = 'underline';
                digitDisplayP.style.textDecorationColor = 'red';
                if(!stim.isTarg[digitCount+1]){
                        feedbackTextArea.innerHTML = 'Press now!';
                }
            } else {
                digitDisplayP.style.color = 'black';
                digitDisplayP.style.textDecoration = 'none';
                if(feedbackTextArea.innerHTML == 'Press now!'){
                    feedbackTextArea.innerHTML = '';
                }
            }
        }
        digitDisplayP.innerHTML = stim.digits[digitCount];
    }
    if(frameCount == nDigitFrames - 1){
        frameCount = 0;
        digitCount++;
        if(nBlankFramesAfterDigit > 0){
            window.requestAnimationFrame(showBlank);
        } else { // Still have to get out of test if no call to 
            if(digitCount == stim.digits.length){
                if(isPractice){
                    feedbackTextArea.innerHTML = '';
                    digitDisplayP.innerHTML = '';
                    digitDisplayP.style.color = 'black';
                    digitDisplayP.style.textDecoration = 'none';
                    setTimeout(afterPracticeScreen,sayTooLateWithin);
                } else {
                    setTimeout(saveData,sayTooLateWithin);
                }
            } else {
                window.requestAnimationFrame(showDigit);
            }
        }
    } else {
        frameCount++;
        window.requestAnimationFrame(showDigit);
    }
}

function showBlank(){
    if(frameCount == 0){
        digitDisplayP.innerHTML = '';
    }
    if(frameCount == nBlankFramesAfterDigit - 1){
        frameCount = 0;
        if(digitCount == stim.digits.length){
            if(isPractice){
                setTimeout(afterPracticeScreen,sayTooLateWithin);
            } else {
                setTimeout(function(){
                    saveData();
                },sayTooLateWithin);
            }
        } else {
            window.requestAnimationFrame(showDigit);
        }
    }
}

function afterPracticeScreen(){
    score = 0;
    scoreArea.innerHTML = "Score: " + score;
    allowPresses = false;
    ALL.style.cursor = 'default';
    dialogArea.style.display = 'block';
    digitDisplayArea.style.display = 'none';
    targetDisplayArea.style.display = 'none';
    feedbackTextArea.style.display = 'none';
    dialogArea.innerHTML = "<center>\
                            <p class='dialog'>That was the end of the practice round.<br/>\
                            Now you'll have to look out for 3 sequences<br/>\
                            (they will be shown off to the side in case you forget them):<br/><br/>\
                            3 5 7<br/>\
                            2 4 6<br/>\
                            4 6 8<br/><br/>\
                            Press space once you've seen any of them<br/>\
                            (i.e. press space as soon as you see the last digit).<br/>\
                            React as fast as you can, but avoid making mistakes.</br>\
                            This time the game won't tell you when you're seeing a sequence.\
                            Click to start the game for real.</p><button onclick='startTask()'>Start game</button>\
                            </center>";
}

function startTask(){
    outputText += performance.now().toFixed(nDecPts) + ',' + 'Task start' + ',NewLine,';
    ALL.style.cursor = 'none';
    isPractice = false;
    // Initialize stimuli
    stim = new initializeDigits(blockwise_nTaskTargs[0],blockwise_nTaskDgts[0],taskTargTypes);
    if(blockwise_nTaskDgts.length > 1){
        var i, tempStim;
        for(i = 1; i < blockwise_nTaskDgts.length; i++){
            tempStim = new initializeDigits(blockwise_nTaskTargs[i],blockwise_nTaskDgts[i],taskTargTypes);
            stim.digits = stim.digits.concat(tempStim.digits);
            stim.isTarg = stim.isTarg.concat(tempStim.isTarg);
        }
    }
    stim.digits = elimRepeats(stim.digits, stim.isTarg, noRptsWithin);
    stim.digits = elimSpuriousTargs(stim.digits, stim.isTarg, taskTargTypes);
    colourDigits = false;
    underlineDigits = false;
    beepForCorrect = false;
    // feedbackText = false; We actually do want text feedback
    targetDisplayArea.children[1].style.visibility = 'visible';
    targetDisplayArea.children[2].style.visibility = 'visible';
    dialogArea.style.display = 'none';
    digitDisplayArea.style.display = 'block';
    targetDisplayArea.style.display = 'block';
    feedbackTextArea.style.display = 'block';
    feedbackTextArea.innerHTML = '';
    if(nBlanksBeforeFixationCross > 0){
        window.requestAnimationFrame(function(){wait(nBlanksBeforeFixationCross,fixationCross)});
    } else {
        window.requestAnimationFrame(fixationCross);
    }
}

function initializeDigits(nTargs,nDigits,targTypes){
    var maxTargLen = Math.max(...targTypes.map(x => x.length));
    var i, j, candTargStart, localDigits = Array(nDigits), isTarg = Array(nDigits).fill(false), targTypeIdx = 0;
    for(i = 0; i < nTargs; i++){ // Fill out targets
        while(true){
            candTargStart = Math.floor(minTargSep + (nDigits-maxTargLen+1 - minTargSep)*Math.random());
            if(!isTarg.slice(candTargStart-minTargSep,candTargStart).includes(true) &&
               !isTarg.slice(candTargStart,candTargStart+targTypes[targTypeIdx].length+minTargSep).includes(true)){
                    for(j = 0; j < targTypes[targTypeIdx].length; j++){
                        isTarg[candTargStart+j] = true;
                        localDigits[candTargStart+j] = targTypes[targTypeIdx][j];
                    }
                    targTypeIdx = targTypeIdx==targTypes.length-1 ? 0 : targTypeIdx+1; // cycle through target types
                    break; // out of while loop
            }
        }
    }
    for(i = 0; i < localDigits.length; i++){
        if(!isTarg[i]){
            localDigits[i] = sample(legalDigits,1)[0];
        }
    }
    this.digits = localDigits;
    this.isTarg = isTarg;
}

function elimRepeats(gStimArray, indicatorArray, noRptsWithin) {
    var stimArray = gStimArray.slice(0); // Local copy of global variable
    var stimIdx, localElements, unavailableElements, availableElements, preIdx, postIdx;
    for (stimIdx = 0; stimIdx < stimArray.length; stimIdx++) {
        if (!indicatorArray[stimIdx]) { // Don't alter target sequences
            unavailableElements = getLocalUniques(stimArray, stimIdx, noRptsWithin);
            if (unavailableElements.includes(stimArray[stimIdx])) {
                availableElements = legalDigits.slice(0);
                var i;
                for (i = 0; i < unavailableElements.length; i++) {
                    availableElements.splice(availableElements.indexOf(unavailableElements[i]), 1);
                }
                stimArray[stimIdx] = sample(availableElements, 1)[0];
            }
        }
    }
    return(stimArray);
}



function uniqueElements(inArray) {
    var i, collection = new Array();
    for (i = 0; i < inArray.length; i++) {
        if (!collection.includes(inArray[i])) {
            collection.push(inArray[i]);
        }
    }
    return(collection);
}

function getLocalUniques(inArray, idx, n) {
    var preIdx = idx - n, localElements = new Array();
    if (preIdx >= 0 && preIdx + n - 1 < idx) {
        localElements = localElements.concat(inArray.slice(0).splice(preIdx, n));
    }
    postIdx = idx + 1;
    if (postIdx < inArray.length) {
        localElements = localElements.concat(inArray.slice(0).splice(postIdx, n));
    }
    return(uniqueElements(localElements));
}

function elimSpuriousTargs(gStimArray, gIndicatorArray, targArray) {
    var stimArray = gStimArray.slice(0); // Local copies of global variables
    var indicatorArray = gIndicatorArray.slice(0);
    var stimIdx, targIdx, currSeq, currTarg, currIndic, tbrIdx, availableReplacements; // Variables for level 1
    var stimIdx2, targIdx2, candIdx, unavailableReplacements, candRep, candStimArray, flag2, startIdx; // Variables for level 2
    var tbrIdxs, subTbrIdx, tbrIdx, flag1; // These names really need to be changed at some point
    for (targIdx = 0; targIdx < targArray.length; targIdx++) { // Cycle through target sequences to detect spurious occurrences
        currTarg = targArray[targIdx];
        for (stimIdx = 0; stimIdx < stimArray.length; stimIdx++) { // Inspect entire length of stimArray
            currSeq = stimArray.slice(0).splice(stimIdx, currTarg.length);
            currIndic = indicatorArray.slice(0).splice(stimIdx, currTarg.length);
            if (arrayCmp(currSeq, currTarg) && currIndic.includes(false)) { // Spurious sequence detected
                tbrIdxs = findIndices(currIndic, false);
                flag1 = false;
                for (subTbrIdx = 0; subTbrIdx < tbrIdxs.length; subTbrIdx++) {
                    if (flag1) {
                        break;
                    }
                    tbrIdx = tbrIdxs[subTbrIdx];
                    availableReplacements = legalDigits;
                    unavailableReplacements = getLocalUniques(stimArray, stimIdx, noRptsWithin);
                    for (candIdx = 0; candIdx < availableReplacements.length; candIdx++) { // Find candidates that would introduce a spurious target sequence
                        candStimArray = stimArray.slice(0);
                        candRep = availableReplacements[candIdx];
                        candStimArray[tbrIdx] = candRep; 
                        flag2 = false;
                        for (targIdx2 = 0; targIdx2 < targArray.length; targIdx2++) { // Cycle through target sequences to test candidate replacement
                            if (flag2) {
                                break;
                            }
                            currTarg2 = targArray[targIdx2];
                            startIdx = Math.max(0, tbrIdx - currTarg2.length + 1);
                            for (stimIdx2 = startIdx; stimIdx2 <= tbrIdx; stimIdx2++) {
                                if (arrayCmp(currTarg2, candStimArray.slice(0).splice(stimIdx2, currTarg2.length))) { // A spurious target would be introduced
                                    unavailableReplacements.push(candRep);
                                    flag2 = true; // Go to next candidate replacement digit
                                    break;
                                }
                            }
                        }
                    }
                    // The digits that would spurious sequences are now stored in unavailableReplacements
                    var unavailableIdx;
                    var currUnavail;
                        for (unavaialbeIdx = 0; unavailableIdx < unavailableReplacements.length; unavailableIdx++) {
                        currUnavail = unavaiableReplacements[unavailableIdx];
                        availableReplacements.splice(availableReplacements.indexOf(currUnavail));
                    }
                    if (availableReplacements.length > 0) {
                        stimArray[stimIdx] = sample(availableReplacements, 1)[0];
                        flag1 = true; // Go to next element in stimArray
                    }
                }
            }
        }
    }
    return(stimArray);
}

function sample(inArray,k) {// Sample k elements without replacement
	var arrayToSubsample = inArray.slice(0);// Don't alter original array
	outArray = new Array(k);
	var i;
	for(i = 0; i < k; i++){
		currIdx = Math.floor(Math.random()*arrayToSubsample.length);
		outArray[i] = arrayToSubsample[currIdx];
		arrayToSubsample.splice(currIdx,1);
	}
    return outArray;
}

function arrayCmp(array1, array2) {
    if (array1.length != array2.length) {
        return false;
    }
    var i, returnVal = true;
    for (i = 0; i < array1.length; i++) {
        if (array1[i] != array2[i]) {
            returnVal = false;
            break;
        }
    }
    return returnVal;
}

function isMember(array1, array2) {
    var i;
    for (i = 0; i < array2.length; i++) {
        if(arrayCmp(array1, array2.slice(0).splice(i, array1.length))) {
            return true;
        }
    }
    return false;
}

function findIndices(array, element) {
    var i, indices = new Array();
    for (i = 0; i < array.length; i++) {
        if (array[i] == element) {
            indices.push(i);
        }
    }
    return(indices);
}
