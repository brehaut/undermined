/* 
 * Copyright (c) 2005, Andrew Brehaut
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice, 
 *   this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice, 
 *   this list of conditions and the following disclaimer in the documentation  
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" 
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
 * POSSIBILITY OF SUCH DAMAGE.
 *
 * Abstract: This javascript controls the behaviour of the widget. 
 *
 * Version 0.5
 */
 
// constants 
var SMALL_COLS = 10;
var SMALL_ROWS = 10;

var MEDIUM_COLS = 15;
var MEDIUM_ROWS = 15;

var LARGE_COLS = 20;
var LARGE_ROWS = 15;

var NORMAL = 0.10;
var DIFFICULT = 0.15;
var INSANE = 0.20;

// preloads some images for the webbased version
function preload() {
    preload = new Array(new Image(), new Image(),new Image(),new Image());
    preload[0].src = "images/numbers.png";
    preload[1].src = "images/mine.png";
    preload[2].src = "images/flag.png";
    preload[3].src = "images/green-hover.png";
}

/* preference handling wrappers
 *
 */
function preferenceForKey(key) {
    if (window.widget) { // dashboard  --  use preferences
        return widget.preferenceForKey(key);
    } else {             // browser    --  use cookies 
        return getCookie(key);
    }
}

function setPreferenceForKey(val, key) {
    if (window.widget) { // dashboard  --  use preferences
        widget.setPreferenceForKey(val, key);
    } else /*if (document.cookies)*/ {             // browser    --  use cookies
        var d = new Date();
        d.setDate(d.getDate() + 30);

        setCookie(key, val, d);
    } /*else { // wha?!! ok, fall back to hardcoded defaults!
        switch (key)
        {
            case 'numRows':
                return SMALL_ROWS;
            case 'numCols':
                return SMALL_COLS;
            case 'totalMines':
                return NORMAL;
        }
    }*/
}
  
  
function savePreferences() {
    // Preference fields
    var sizeF = document.getElementById('sizeField');
    var numRowsF = document.getElementById('numRowsField');
    var numColsF = document.getElementById('numColsField');
    
    var difficultyF = document.getElementById('difficultyField');
    var numMinesF = document.getElementById('numMinesField');

    setPreferenceForKey(numColsF.value,  "numCols") ;
    setPreferenceForKey(numRowsF.value,  "numRows");
    setPreferenceForKey(numMinesF.value, "totalMines");
}

/* this function will populate any missing preferences with default values
 */
function defaultPreferences() {
    var numCols =    preferenceForKey("numCols"); 
    var numRows =    preferenceForKey("numRows"); 
    var totalMines = preferenceForKey("totalMines");
    
    var d = new Date();
    d.setDate(d.getDate() + 30);
    
    if (!numCols)    setPreferenceForKey(SMALL_COLS, "numCols", d);
    if (!numRows)    setPreferenceForKey(SMALL_ROWS, "numRows", d);
    if (!totalMines) setPreferenceForKey(SMALL_COLS * SMALL_ROWS * NORMAL, "totalMines", d);
}

/* Resize the widget if needed; this is if the preferences
 * have a different board size to the current game.
 */
function resizeWidget(force) {
    var overlay = document.getElementById('overlay');
    overlay.style.display="none";
    
    var prefRows = new Number(preferenceForKey('numRows'));
    var prefCols = new Number(preferenceForKey('numCols')); 
    var prefMines = new Number(preferenceForKey('totalMines')); 
    
    force |= false;
    
    var top    = document.getElementById('top');
    var left   = document.getElementById('left');
    var bottom = document.getElementById('bottom');
    var right  = document.getElementById('right');

    var front = document.getElementById('front');
    
    if (force || !(currentGame.numRows == prefRows 
         && currentGame.numCols == prefCols
         && currentGame.totalMines == prefMines))
    {

        var w = (prefCols * 16) + 23 + 23;
        var h = (prefRows * 16) + 20 + 44;

        front.style.width = w+"px";
        front.style.height = h+"px";

        if (window.widget) {       
            window.resizeTo(w,h);
        }
        
        if (currentGame) currentGame.pause();            
        currentGame = new Game();

    }
}

if (window.widget) {
    widget.onhide = function () {
        currentGame.pause();
    };
    
    widget.onshow = function () {
        currentGame.play();
    }
}


function bindBackEvents () 
{
    var back = document.getElementById("back");
    
    // UI related stuff (tabs etc)
    var lis = back.getElementsByTagName("li");
    
    var tabdivstmp = back.getElementsByTagName("div");
    var tabdivs = Array();
    
    for (var i = 0; i < tabdivstmp.length; i++) {
        if (tabdivstmp[i].className.indexOf("tabcontent") != -1) {
            tabdivs.push(tabdivstmp[i]);
        }
    }

    for (var i = 0; i < lis.length; i++)
    {
        var tab = lis[i];
        var tabitem; 
        var tabdiv;
                        
        // find the 'a' tag that has the class 'tabitem'
        var as = tab.getElementsByTagName("span");
        for (var ai = 0; ai < as.length; ai++) 
        {
            if (as[ai].className == "tabitem") 
            { 
                tabitem = as[ai]; 
                break; 
            }

        }

        if (!tabitem) continue;

        // find the first 'div' tag        
        var divs = tab.getElementsByTagName("div");

        if (divs.length > 0) {
            tabdiv = divs[0];    
        } else { continue; }
        
        //bind events
        function closeTabHandler(div) {
            return function() 
            {
                for (var i = 0; i < tabdivs.length; i++) {
                    tabdivs[i].className = "tabcontent";
                }
                
                div.className = "tabcontent vis";
            }
        }
        tabitem.onclick = closeTabHandler(tabdiv)
    }
    
    // Preferences 
    var sizeF = document.getElementById('sizeField');
    var numRowsF = document.getElementById('numRowsField');
    var numColsF = document.getElementById('numColsField');
    
    var difficultyF = document.getElementById('difficultyField');
    var numMinesF = document.getElementById('numMinesField');

    var diff = NORMAL;

    function calcDiff() {
        var cells =  new Number(numColsF.value) * new Number(numRowsF.value);
        
        numMinesF.value = Math.round(diff * cells); 
    }
    
    // bind pref events:
    sizeF.onchange = function () 
    {
        // normal 
        switch (this.value) 
        {
        
            case 's':
                numColsF.value = SMALL_COLS;
                numRowsF.value = SMALL_ROWS;                
                calcDiff(); 
                                
                numRowsF.disabled = true;
                numColsF.disabled = true;                

                break;
            case 'm':
                numColsF.value = MEDIUM_COLS;
                numRowsF.value = MEDIUM_ROWS;
                calcDiff(); 
                                
                numRowsF.disabled = true;
                numColsF.disabled = true;                

                break;
            case 'l':
                numColsF.value = LARGE_COLS;
                numRowsF.value = LARGE_ROWS;
                calcDiff(); 
                
                numRowsF.disabled = true;
                numColsF.disabled = true;                
                break;
            case 'c':
                numRowsF.disabled = false;
                numColsF.disabled = false;               
                break;
        }
        
        savePreferences();
    }
    
    difficultyF.onchange = function () {
        switch (this.value) 
        {
            case 'n':
                diff = NORMAL;
                calcDiff(); 
                numMinesF.disabled = true;
                break;
            case 'd':
                diff = DIFFICULT;
                calcDiff(); 
                numMinesF.disabled = true;
                break;
            case 'i':
                diff = INSANE;
                calcDiff(); 
                numMinesF.disabled = true;
                break;
            case 'c':
                numMinesF.disabled = false;
    
        }
        
        savePreferences();
    }
    
    numRowsF.onchange = function () {
        if (this.value < 10) this.value = 10;
        if (this.value > 30) this.value = 30;
        calcDiff();
        
        savePreferences();
    }

    numColsF.onchange = function () {
        if (this.value < 10) this.value = 10;
        if (this.value > 30) this.value = 30;
        calcDiff();
        
        savePreferences();
    }
    
    numMinesF.onchange = function () {
        var cells =  new Number(numColsF.value) * new Number(numRowsF.value);
    
        if (this.value < 8) this.value = 8;
        if (this.value > (cells * 0.9)) this.value = (cells * 0.9);

        this.value = Math.round(this.value);
        savePreferences();
    }
}

function showBack()
{
    currentGame.pause();
    
    var front = document.getElementById("front");
    var back = document.getElementById("back");
        
    if (window.widget)
        widget.prepareForTransition("ToBack");
                
    front.style.display="none";
    back.style.display="block";
        
    currentGame.pause();
    // fill prefs correctly 
    var numCols = preferenceForKey("numCols");
    var numRows = preferenceForKey("numRows");
    var totalMines = preferenceForKey("totalMines");
    
    document.getElementById("numColsField").value = numCols;    
    document.getElementById("numRowsField").value = numRows;
    document.getElementById("numMinesField").value = totalMines;
    
    document.getElementById("sizeField").value="c";
    if (numCols == SMALL_COLS && numRows == SMALL_ROWS) document.getElementById("sizeField").value="s";
    if (numCols == MEDIUM_COLS && numRows == MEDIUM_ROWS) document.getElementById("sizeField").value="m";
    if (numCols == LARGE_COLS && numRows == LARGE_ROWS) document.getElementById("sizeField").value="l";
    
    // do the transition
    
    if (window.widget)
        setTimeout ('widget.performTransition();', 0);  
}

function hideBack()
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");

    resizeWidget();
        
    if (window.widget)
        widget.prepareForTransition("ToFront");

    back.style.display="none";                
    front.style.display="block";
        
    if (window.widget)
        setTimeout ('widget.performTransition();', 0);
        

    currentGame.play();
}

var flipShown = false;
var animation = {duration:0, starttime:0, to:1.0, now:0.0, from:0.0, firstElement:null, timer:null};
function mousemove (event)
{
    if (!flipShown)
    {
        if (animation.timer != null)
        {
            clearInterval (animation.timer);
            animation.timer  = null;
        }
                
        var starttime = (new Date).getTime() - 13;
                
        animation.duration = 500;
        animation.starttime = starttime;
        animation.firstElement = document.getElementById ('flip');
        animation.timer = setInterval ("animate();", 13);
        animation.from = animation.now;
        animation.to = 1.0;
        animate();
        flipShown = true;
    }
}
function mouseexit (event)
{
    if (flipShown)
    {
        // fade in the info button
        if (animation.timer != null)
        {
            clearInterval (animation.timer);
            animation.timer  = null;
        }
                
        var starttime = (new Date).getTime() - 13;
                
        animation.duration = 500;
        animation.starttime = starttime;
        animation.firstElement = document.getElementById ('flip');
        animation.timer = setInterval ("animate();", 13);
        animation.from = animation.now;
        animation.to = 0.0;
        animate();
        flipShown = false;
    }
}
function animate()
{
    var T;
    var ease;
    var time = (new Date).getTime();
                
        
    T = limit_3(time-animation.starttime, 0, animation.duration);
        
    if (T >= animation.duration)
    {
        clearInterval (animation.timer);
        animation.timer = null;
        animation.now = animation.to;
    }
    else
    {
        ease = 0.5 - (0.5 * Math.cos(Math.PI * T / animation.duration));
        animation.now = computeNextFloat (animation.from, animation.to, ease);
    }
        
    animation.firstElement.style.opacity = animation.now;
}
function limit_3 (a, b, c)
{
    return a < b ? b : (a > c ? c : a);
}
function computeNextFloat (from, to, ease)
{
    return from + (to - from) * ease;
}


function enterflip(event)
{
    document.getElementById('fliprollie').style.display = 'block';
}
function exitflip(event)
{
    document.getElementById('fliprollie').style.display = 'none';
}

// handle onload events -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

var onload_pre_widget = this.onload; 
this.onload = function () 
{
    if (onload_pre_widget) onload_pre_widget (); 
    
    setTimeout(preload, 0);
    
    defaultPreferences() // make sure the preferences are ok.
    
    // bind the new game button
    var newGame = document.getElementById('newGame');
    var overlay = document.getElementById('overlay');
    
    newGame.onclick = function () {
        currentGame.pause();
        currentGame = new Game();
        overlay.style.display = "none";
    }
    
    overlay.onclick = newGame.onclick;

    resizeWidget(true);
    
    currentGame = new Game();
        
    bindBackEvents();
    
}
