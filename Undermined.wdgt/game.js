/* File: widget.js
 *
 * Abstract: This javascript controls the behaviour of the widget. 
 *
 * Version 0.5
 *
 * � Copyright © 2005 Andrew Brehaut. All rights reserved.
 */

/* Globals!
 */
 
var currentGame;

// so we can use set updates in the search algorithm
Array.prototype.setInsert = function (val)
{
    if (!(val in this)) {
        this.push(val);
    }
}

/* MineSquares are the game objects that model the games behaviour. they
 * also bind themselves to elements in the #gamearena table to receive clicks.
 */ 
function MineSquare(game, x, y)
{
    var self = this;

    this.mined = false;
    this.flagged = false;
    this.revealed = false;
    this.minesBeside = 0;

    this.numImg = "transparent url(images/numbers.png)";
    this.mineImg = "transparent url(images/mine.png) -1px 0px no-repeat";

    this.game = game;
    this.x = x;
    this.y = y;
    
    // these need to be inited by attachElement
    this.elem;
    this.inner;
}

MineSquare.prototype.incrMinesBeside = function () 
{
    this.minesBeside++;
}

MineSquare.prototype.tryReveal = function (x,y) {
        if ( !this.game.mines[x][y].flagged
          && !this.game.mines[x][y].revealed 
          && !this.game.mines[x][y].mined) this.game.mines[x][y].reveal();  
    }
    
MineSquare.prototype.reveal = function () 
{
    if (!this.revealed) {           
        var unexplored = new Array();  // the cells we have not explored yet
        var current = null;            // current cell
        
        var width = this.game.numCols;   // shorthand
        var height = this.game.numRows;  // shorthand
        var minearray = this.game.mines; // shorthand
        
        unexplored.push(this.x + ","+this.y);
            
        while (unexplored.length > 0) {
            current = unexplored.shift();
        
            var x = new Number(current.split(',')[0]);
            var y = new Number(current.split(',')[1]);

            if (!minearray[x][y].revealed) {
                // if this is not yet revealed, this is not a 'visited' node
                
                // Firstly, visuals
                // this mine now must be revealed
                if (minearray[x][y].flagged == 0) {
                    minearray[x][y].revealed = true;
                    minearray[x][y].elem.className = "revealed";   
                    minearray[x][y].inner.className = '';
                        
                    if (!minearray[x][y].mined) this.game.decrRemaining();
    
                    if (minearray[x][y].minesBeside && !minearray[x][y].mined) 
                    {                                                               
                        minearray[x][y].inner.style.background = 
                            this.numImg + " -" + 
                                (16 * (minearray[x][y].minesBeside - 1))
                                 + "px 0 no-repeat";                                                         
                    } else if (minearray[x][y].mined) {                                        
                        minearray[x][y].inner.style.background = 
                            minearray[x][y].mineImg;                 
                    }   
                
                
                    // search logic
                    if (minearray[x][y].minesBeside == 0) { 
                        // this is blank, therefore we should continue revealing
                            // if we are not in the left most column, add those
                            // cells to the search queue (x-1)
                        if (x > 0) {
                            if (y > 0)                                        
                                unexplored.setInsert((x-1) + ',' + (y-1));  // t
                            unexplored.setInsert((x-1) + ',' + y);          // m
                            if (y < (height - 1))                    
                                unexplored.setInsert((x-1) + ',' + (y+1));  // b
                        }
                        
                        // center column (same x)
                        if (y > 0) unexplored.setInsert(x + ',' + (y-1));   // t
                        if (y < (height - 1))                    
                            unexplored.setInsert(x + ',' + (y+1));          // b
                        
                        // right column if exists (x+1)
                        if (x < (width - 1)) {
                            if (y > 0) 
                                unexplored.setInsert((x+1) + ',' + (y-1));  // t
                            unexplored.setInsert((x+1) + ',' + y);          // m
                            if (y < (height - 1))                    
                                unexplored.setInsert((x+1) + ',' + (y+1));  // b
                        } 
                    } // closes 'if (minearray[x][y].minesBeside == 0)'
                } // closes 'if (minearray[x][y].flagged == 0)'
            } // closes 'if (!minearray[x][y].revealed)'
        } // closes 'while (unexplored.length > 0)'
    } // closes 'if (!this.revealed)'
} // closes this function (reveal)

/* These 3 events are the standard handling for
 *   a) revealEvent - this is a normal click
 *   b) massRevealEvent - this is normally a middle click, based on flags
 *   c) flagEvent - this is for flagging a tile.
 *
 * These are all here, because event handling is teh ev1l across browsers 
 * and also changes between dashboard and safari. w00t :(
 */

MineSquare.prototype.revealEvent = function () 
{
    this.game.firstClick(this.x,this.y);
    
    if ((!this.flagged != 0) && this.mined) {
        this.game.gameOver(false);
    } else if (!this.flagged) { 
        this.reveal();
    }
}

MineSquare.prototype.massRevealEvent = function () 
{
    if (this.game.state == this.game.NEW) return;
    var localFlags = 0;
    
    // count flags
    if (this.x > 0) {
        if (this.y > 0) 
            localFlags += (this.game.mines[this.x-1][this.y-1].flagged & 1);
        localFlags += (this.game.mines[this.x-1][this.y].flagged & 1);
        if (this.y < (this.game.numRows - 1)) 
            localFlags += (this.game.mines[this.x-1][this.y+1].flagged & 1);
    }
    
    if (this.y > 0)
         localFlags += (this.game.mines[this.x][this.y-1].flagged & 1);
    if (this.y < (this.game.numRows - 1))
         localFlags += (this.game.mines[this.x][this.y+1].flagged & 1);
    
    if (this.x < (this.game.numCols - 1)) {
        if (this.y > 0)             
            localFlags += (this.game.mines[this.x+1][this.y-1].flagged & 1);
        localFlags += (this.game.mines[this.x+1][this.y].flagged & 1);
        if (this.y < (this.game.numRows - 1)) 
            localFlags += (this.game.mines[this.x+1][this.y+1].flagged & 1);
    }

    /* if the number of flags around this mine is the same as the number of 
     * mines around this square, reveal all the surounding squares.
     */    
    var minearray = this.game.mines; // shorthand
    
    if (localFlags == this.minesBeside) {
        if (this.x > 0) {
            if (this.y > 0) 
                minearray[this.x-1][this.y-1].revealEvent(); //top
            minearray[this.x-1][this.y].revealEvent();       //middle
            if (this.y < (this.game.numRows - 1)) 
                minearray[this.x-1][this.y+1].revealEvent(); //bottom
        }
        
        if (this.y > 0) 
            minearray[this.x][this.y-1].revealEvent(); // top
        minearray[this.x][this.y].revealEvent();       // middle
        if (this.y < (this.game.numRows - 1)) 
            minearray[this.x][this.y+1].revealEvent(); //bottom
        
        if (this.x < (this.game.numCols - 1)) {
            if (this.y > 0) 
                minearray[this.x+1][this.y-1].revealEvent();
            minearray[this.x+1][this.y].revealEvent();
            if (this.y < (this.game.numRows - 1))
                minearray[this.x+1][this.y+1].revealEvent();
        }
            // sanity resumes at this point. 
            
            // well, kinda...
    }
        
}

MineSquare.prototype.flagEvent = function () {
    if (this.flagged == 0 && this.game.flags > 0) {
        this.flagged = 1;
        this.game.flags--;
    
        this.inner.className = "flagged";      
        
    } else if (this.flagged == 1) {
        this.flagged = 0;
        this.game.flags++;
        
        this.inner.className = "queried";
    } else if (this.flagged == 2) {
        this.flagged = 0;
        this.inner.className = "";            
    }
    
    // update the field
    var fs = document.getElementById("flagsRemaining");
    while(fs.childNodes.length > 0) {
        fs.removeChild(fs.firstChild);
    }
    fs.appendChild(document.createTextNode(this.game.flags));
}

// this function attaches a DOM element to this MineSquare.
MineSquare.prototype.attachElement = function (elem, inner) 
{
    this.elem = elem;   // this is the tab cell itself
    this.inner = inner; // this is the container for the flag graphic, or a 
                        // number
                        
    var self = this;
    this.elem.onclick = function (e) 
    {   
        if(e.altKey || e.metaKey) {
            self.massRevealEvent();
        } else if (e.ctrlKey || e.shiftKey) {
            self.flagEvent();
        } else {
            self.revealEvent();
        }
        return false;
    }
    
    this.elem.oncontextmenu = function (e)
    {
        self.flagEvent();
        
        return false; // stop context menu appearing
    }
}



/* Game is the constructor for a game object.
 *   in addition it sets up #gamearena ready for a brand new game.
 */ 
function Game () 
{
    var self = this;

    this.numCols;   // the number of cells across for mines
    this.numRows;   // the number of cells down for mines
    this.totalMines;// the total number of mines in said cells

    this.mines;     // this is the array of cells
    this.remaining; // the number of remaining cells
    this.flags;     // number of flags remaining
    
    this.NEW = 0;          // A new game has been created, not started yet
    this.PLAYING = 1;      // currently playing a game
    this.PAUSED = 2;        // game is paused
    this.FINISHED = 4;     // game has been completed (won or lost)
    
    this.state = this.NEW; // the game state.
    
    this.numCols =    preferenceForKey("numCols");
    this.numRows =    preferenceForKey("numRows");
    this.totalMines = preferenceForKey("totalMines");
     
    if (this.totalMines >= this.numCols * this.numRows) 
        this.totalMines = (this.numCols * this.numRows) - 1;
    this.flags = this.totalMines;
    
    this.timerInterval = null; // handle for the timerInterval used to update
                               // the timer
    this.timeTaken = 0;        // the time taken
    this.startedAt;            // when this session of play started.
    
    
    // clear the text fields
    { 
        var tt = document.getElementById("timeTaken");
        while(tt.childNodes.length > 0) {
            tt.removeChild(tt.firstChild);
        }
        tt.appendChild(document.createTextNode("0:00"));

        var fs = document.getElementById("flagsRemaining");
        while(fs.childNodes.length > 0) {
            fs.removeChild(fs.firstChild);
        }
        
        fs.appendChild(document.createTextNode(this.flags));
    }
    
    var gamearena = document.getElementById('gamearena');

    // empty table!
    //  for (var i = 0; i < n.length; i++) 
    while (gamearena.childNodes.length)
    {  
        gamearena.removeChild(gamearena.firstChild);
    }
        
    // now populate the mines array
    this.mines = Array(this.numCols);
    for (var x = 0; x < this.numCols; x++) 
    {
        this.mines[x] = Array(this.numRows);

        for (var y = 0; y < this.numRows; y++) 
        {            
            this.mines[x][y] = new MineSquare(this,x,y);    
        }
    }


    // and build up the table (#gamearena)    
    for (var y = 0; y < this.numRows; y++) 
    {
        var tr = document.createElement('tr');
        gamearena.appendChild(tr);
        
        for (var x = 0; x < this.numCols; x++) 
        {
            var td = document.createElement('td');
            var div = document.createElement('div');

            tr.appendChild(td);
            td.appendChild(div);
            
            this.mines[x][y].attachElement(td, div);
        }
    }
}

/* this stupidly named method 'firstClick' (yeah, i cant think of a better one)
 * is called by each mineSquare calls this when it is clicked, and the Game       
 * object then goes and populates the game with mines, so that the first click
 * is safe. It also starts the gaming 'playing' (mostly the timer)
 */
Game.prototype.firstClick = function (x, y) {

    if (this.state == this.NEW) 
    {
        // seed the mines!   
        var empty = Array(this.numCols * this.numRows);
        for (var i = 0; i < empty.length; i++)
        {
            empty[i] = i; 
        }

        // remove the clicked position from the possible positions
        delete empty[(y * this.numCols) + x];
        
        //--- regular seeding of mines ---//
            
        for (var i = 0; i < this.totalMines; i++) {
            var index = Math.random() * (empty.length);
            var coord = empty.splice(index,1);
    
            var x = coord % this.numCols;
            var y = (coord - x) / this.numCols;            
            
            // this is a mine!
            this.mines[x][y].mined = true;
        }
	
        for(var x=0; x < this.numCols; x++)
        {
            for(var y=0; y < this.numRows; y++)
            {
                // increment neighbours
		if(this.mines[x][y].mined)
		{
                    if (x > 0)
                    {
                        if (y > 0)               this.mines[x-1][y-1].incrMinesBeside();
                                                 this.mines[x-1][y].incrMinesBeside();
                        if (y < this.numRows - 1)this.mines[x-1][y+1].incrMinesBeside();
                    }
     
                    if (y > 0)                this.mines[x][y-1].incrMinesBeside();        
                    if (y < this.numRows - 1) this.mines[x][y+1].incrMinesBeside();
     
      
                    if (x < this.numCols - 1) 
                    {
                        if (y > 0)               this.mines[x+1][y-1].incrMinesBeside();
                                                 this.mines[x+1][y].incrMinesBeside();
                        if (y < this.numRows - 1)this.mines[x+1][y+1].incrMinesBeside();
                    }
                }
            }
	}
        
        // set remaining cells
        this.remaining = this.numCols * this.numRows;

        this.state = this.PAUSED;
        this.play();
    }
}

Game.prototype.pause = function () {
    if (this.state == this.PLAYING) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timeTaken += Math.round(((new Date()).getTime() - this.startedAt) / 
                                         1000);
            this.timerInterval = null;
        }
        this.state = this.PAUSED;
    }
}

Game.prototype.play = function () {
    if (this.state == this.PAUSED) {
        this.state = this.PLAYING;
    
        this.startedAt = (new Date()).getTime();
        var self = this;
        var timeTakenField = document.getElementById("timeTaken");
        
        function updateTimer ()
        {
            while(timeTakenField.childNodes.length > 0) {
                timeTakenField.removeChild(timeTakenField.firstChild);
            }
            var t = Math.round(((new Date()).getTime() - self.startedAt) / 1000);
            t = self.formatTime(t + self.timeTaken);
            timeTakenField.appendChild(document.createTextNode(t));
        }
    
        if (this.timerInterval == null) {
            this.timerInterval = setInterval(updateTimer, 1000);
        }
    }
}

Game.prototype.playpause = function () {
    if (this.state == this.PLAYING) {
        this.pause();      
    } else if (this.state == this.PAUSED) {
        this.play();      
    } 
}

Game.prototype.gameOver = function (won) 
{
    
    this.pause();
    this.state = this.FINISHED;
    
    for (var x = 0; x < this.numCols; x++) 
    {
        for (var y = 0; y < this.numRows; y++)
        {
            this.mines[x][y].reveal();
            this.mines[x][y].elem.onclick = null;
            this.mines[x][y].elem.oncontextmenu = null;
        }
    }
    
    var overlay = document.getElementById('overlay');
    
    var win = document.getElementById('win');
    var lose = document.getElementById('lose');    
    
    if (won == true) {
        overlay.className = "won";
        
        //--update highscores?
        // work out what size board we are using
        
        // get board size / difficulty score table 
        
        // convert to array
        
        // compare time to high scores
        
        // insert if needed
        
        // save table back to prefs.
        
    } else {
        overlay.className = "lost";        
    }
    
    overlay.style.display = "block";
        
}

Game.prototype.decrRemaining = function ()
{
    if (--this.remaining <= this.totalMines) this.gameOver(true); 
}

Game.prototype.formatTime = function (time) 
{
    var seconds = time % 60;
    var mins = (time - seconds) / 60;
    return mins + ":" + (seconds < 10 ? "0"+seconds : seconds);    
}



// handle onload events
var onload_pre_game = this.onload;
this.onload = function () 
{
    if (onload_pre_game) onload_pre_game();
}
