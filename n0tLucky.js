// ==UserScript==
// @name         Luckyfish chatbot
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://luckyfish.io/*
// @grant        unsafeWindow
// @grant        none

// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js
// @require      http://code.jquery.com/ui/1.9.2/jquery-ui.js
// @require https://git.io/waitForKeyElements.js
// ==/UserScript==

(async function() {
    'use strict';



    /**General user settings for you to play with**/
    const ShowChatMessagesInLog = false;
    const ShowDebugLogs = true;
    const GrabVipRain = false;
    const ResponseToWageredChatMessages = true;
    const TellJokeAtRandomIntervals = false;
    const MaxMessagesBeforeNewJoke = 180;
    const MinMessagesBeforeNewJoke = 70;


    /**Variables the bot uses to work correctly, dont edit if you are a idiot ;) **/
    var waiter = false;
    var MessageCount =0;
    var JokeEveryXMessage = 150;
    var messageText = "start";
    var profitLastBet = '0';

    var LastProfit = "0";
    var LastBetTime = "0";
    var LastBetAmount = "0";
    var LastBetBalance = "0";
    var MaxStreakLoss = "0";
    var MaxStreakWin = "0";
    var TotalWinAmount = "0";
    var TotalLossAmount = "0";

    /**Variables used as chat messages **/
    //Collection of joke messages (Uses a online api normaly
    const jokes = [
        "What rock group has four men that don't sing? Mount Rushmore.",
        "When I was a kid, my mother told me I could be anyone I wanted to be. Turns out, identity theft is a crime.",
        "What do sprinters eat before a race? Nothing, they fast!",
        "What concert costs just 45 cents? 50 Cent featuring Nickelback!",
        "What do you call a mac 'n' cheese that gets all up in your face? Too close for comfort food!",
        "Why couldn't the bicycle stand up by itself? It was two tired!",
        "Did you hear about the restaurant on the moon? Great food, no atmosphere!",
        "How many apples grow on a tree? All of them!",
        "Did you hear the rumor about butter? Well, I'm not going to spread it!",
        "I like telling Dad jokes. Sometimes he laughs!",
        "To whoever stole my copy of Microsoft Office, I will find you. You have my Word!",
        "Did you hear about the mathematician who’s afraid of negative numbers? He’ll stop at nothing to avoid them",
        "Why do we tell actors to “break a leg?” Because every play has a cast",
        "Helvetica and Times New Roman walk into a bar.  “Get out of here!” shouts the bartender. “We don’t serve your type.”",
        "Yesterday I saw a guy spill all his Scrabble letters on the road. I asked him, “What’s the word on the street?”",
        "Once my dog ate all the Scrabble tiles. For days he kept leaving little messages around the house.",
        "Knock! Knock! Who’s there? Control Freak. Con…   OK, now you say, “Control Freak who?”",
        "A bear walks into a bar and says, “Give me a whiskey and … cola.” “Why the big pause?” asks the bartender. The bear shrugged. “I’m not sure; I was born with them.”",
        "Did you hear about the actor who fell through the floorboards? He was just going through a stage",
        "Did you hear about the claustrophobic astronaut? He just needed a little space",
        "Why don’t scientists trust atoms? Because they make up everything.",
    ]
    //Messages to chose from after we collected a rain
    const RainThankYouMessages =[
        "Thank you for the rain",
        "Thx bro, love it",
        "youst what i needed,thx",
        "you are the best",
        "thanks mate",
        "thank you soo much",
        "thx for the rain",
    ]
    //Message collection for what to say when somebody posts a waggered msg with profit
    const WaggeredWinMessages =[
        "Wow nice hit",
        "nice win",
        "Congratulations",
        "I would love a win like that",
        "wow thats a good win, congrats",
        "nice hit bro",
        "lucky guy, best of luck with future wins",
        "oh how i wish for a win like that, good luck forward",
        "keep on winning, you are a champion",
        "play safe now, dont wanna lose that win again",
        "keep the good wins coming",
    ];
    //Message collection for what to say when somebody posts a waggered msg with loss
    const WaggeredLossMessages =[
        "ah bad luck bro",
        "better luck next tim",
        "you make it on the next hit",
        "Oh thats bad luck, better luck next time",
        "next time ul make it"
    ];
    //Messages to post before we collect the faucet
    const FaucetTimeMessages =[
        "here we go again",
        "Comeon faucet, give me some luck",
        "lord faucet, be nice to me",
        "faucet time",
        "and we are back to the faucet"
    ];

    /**Collection of hacks to bypass active window checks**/
    window.focus = function(){
        return true;
    }
    window.blur = function(){
        return false;
    }
    /**Random helper functions used from everywhere**/
    const timer = ms => new Promise(res => setTimeout(res, ms));//timer used to create delays around the bot
    //Printing a intro message with some settings that are on or off, should be run in the begining so we can make time go for the game to finish loading
    async function WriteIntroText(){
        console.clear();
        WriteLog('Starting n0tLuckyfishBot');
        if(ShowChatMessagesInLog){
            WriteLog("Showing chat meesages in log. (this could cause lagg so you should turn it off");
        }else{
            WriteLog("Not showing chatt messages in the log");
        }
        if(ShowDebugLogs){
            WriteLog("Debug logging is enabled, this is really only usefull for developers of the bot");
        }else{
            WriteLog("No debug logs enables, the console will be mostly quiet");
        }
        if(ResponseToWageredChatMessages){
            WriteLog("Responding to waggered messages in chat");
        }else{
            WriteLog("We are not respoding to waggered messages in the chat");
        }
        if(GrabVipRain){
            WriteLog("Grabbing vip rains");
        }else{
            WriteLog("Ignoring vip rains");
        }
        if(TellJokeAtRandomIntervals){
            WriteLog("Telling jokes in the chat with a " + MinMessagesBeforeNewJoke + " to " + MaxMessagesBeforeNewJoke + " messages interval");
        }else{
            WriteLog("Not gonna tell any random jokes today");
        }

    }
    //Helper function to write to the console in the browser
    function WriteLog(LogMessage){
        if(ShowDebugLogs){
            if (typeof LogMessage === 'string' || LogMessage instanceof String){
                console.log(getDateTimeString() + LogMessage);
            }else{
                console.log(LogMessage);
            }
        }
    };
    //Just a helper function to return a random integer//
    async function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    //helper function to get current datetime as string, used to create a better console log in the browser
    function getDateTimeString(IncludeDato=false){
        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        if(IncludeDato){
            return date + " " + time + " ";
        }else{
            return time +" ";
        }
    }
    //helper function to fetch json data from a url
    async function getJSON(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'json';
        xhr.onload = function() {
            var status = xhr.status;
            if (status === 200) {
                callback(null, xhr.response);
            } else {
                callback(status, xhr.response);
            }
        };
        xhr.send();
    };

    /**Keyboard simulation functions**/
    ///Hjelper function for å simulere keypress med events slik at det går inn på nettsiden
    async function simulateKeyPress(writeText,element, appendToElementValue=true,ClearInputValueFirst=false) {
        //Først sørger vi for at elementet er i fokus
        WriteLog("Simulating keyboard input:\n " + writeText);
        await simulateClick(element); //Start by clicking the element
        if(ClearInputValueFirst){//Clears the current value of the input box before we write what we want
            element.value = "";
        }
        //Loops each character in our message and fires the events needed to get them to count as a keypress
        await timer(50);
        for (let i = 0; i < writeText.length; i++) {
            element.dispatchEvent(new KeyboardEvent('keydown',{'key':writeText[i]}));//Keydown event
            if(appendToElementValue){
                element.value += writeText[i];//Appends the character to the input textbox if selected
            }
            await timer(5);//small humanoide intervall
            event= new Event('change', {
                bubbles: true,
                cancelable: true,
            });//Event to tell the page the input has changes
            element.dispatchEvent(event);
            element.dispatchEvent(new KeyboardEvent('keyup',{'key':writeText[i]}));//Event to release the key we pressed down earlier
            var event = new Event('input', {
                bubbles: true,
                cancelable: true,
            });//Event telling the browser we have a input
            element.dispatchEvent(event);
            await timer(35);//small humanoid interval
        }
        await timer(150);
    }

    /**Mouse simulation functions**/
    //Small helper function to fire mouse event//
    async function fireMouseEvent(type, elem, centerX, centerY) {
        var evt = document.createEvent('MouseEvents');
        evt.initMouseEvent(type, true, true, window, 1, 1, 1, centerX, centerY, false, false, false, false, 0, elem);
        elem.dispatchEvent(evt);
    };
    //Hjelper function for å simulere muse klikk
    async function simulateClick(element,OnlyClick=false) {
        // Create our event (with options)
        if(!element)return;//Returns if the element isnt given
        WriteLog("Simulating mouse click");
        //Gets the possition of the element on the page
        var pos = element.getBoundingClientRect();
        var center1X = Math.floor((pos.left + pos.right) / 2);
        var center1Y = Math.floor((pos.top + pos.bottom) / 2);
        //fires the events needed to move the mouse to the element possition
        await fireMouseEvent('mousemove', element, center1X, center1Y);
        await fireMouseEvent('mouseenter', element, center1X, center1Y);
        await fireMouseEvent('mouseover', element, center1X, center1Y);
        if(OnlyClick){//Checks if we should use the click events or just default js click function
            element.click();//executes the click
            await timer(100);//humanoid delay after clicked
        }else{
            //Fires all the mouse events and clicks the element for us
            fireMouseEvent('mousedown', element, center1X, center1Y);
            element.click();
            fireMouseEvent('mouseup', element, center1X, center1Y);
            fireMouseEvent('click', element, center1X, center1Y);
            await timer(100);//humanoid interval again
        }
        element.focus();//Focuses the element
    };
    //hjelper function for å klikke på et element å dra det til et annet elements lokasjon
    async function triggerDragAndDrop(selectorDrag, selectorDrop) {
        // fetch target elements
        var elemDrag = document.querySelector(selectorDrag);
        var elemDrop = document.querySelector(selectorDrop);
        if (!elemDrag || !elemDrop) return false; //returns false if we couldnt fetch the selected elements
        WriteLog("Executing drag and drop simulation on two elements");
        // calculate positions of elements
        var pos = elemDrag.getBoundingClientRect();
        var center1X = Math.floor((pos.left + pos.right) / 2);
        var center1Y = Math.floor((pos.top + pos.bottom) / 2);
        pos = elemDrop.getBoundingClientRect();
        var center2X = Math.floor((pos.left + pos.right) / 2);
        var center2Y = Math.floor((pos.top + pos.bottom) / 2);
        // mouse over dragged element and mousedown
        await fireMouseEvent('mousemove', elemDrag, center1X, center1Y);
        await fireMouseEvent('mouseenter', elemDrag, center1X, center1Y);
        await fireMouseEvent('mouseover', elemDrag, center1X, center1Y);
        await fireMouseEvent('mousedown', elemDrag, center1X, center1Y);
        // start dragging process over to drop target
        await fireMouseEvent('dragstart', elemDrag, center1X, center1Y);
        await fireMouseEvent('drag', elemDrag, center1X, center1Y);
        await fireMouseEvent('mousemove', elemDrag, center1X, center1Y);
        await fireMouseEvent('drag', elemDrag, center2X, center2Y);
        await fireMouseEvent('mousemove', elemDrop, center2X, center2Y);
        // trigger dragging process on top of drop target
        await fireMouseEvent('mouseenter', elemDrop, center2X, center2Y);
        await fireMouseEvent('dragenter', elemDrop, center2X, center2Y);
        await fireMouseEvent('mouseover', elemDrop, center2X, center2Y);
        await fireMouseEvent('dragover', elemDrop, center2X, center2Y);
        // release dragged element on top of drop target
        await fireMouseEvent('drop', elemDrop, center2X, center2Y);
        await fireMouseEvent('dragend', elemDrag, center2X, center2Y);
        await fireMouseEvent('mouseup', elemDrag, center2X, center2Y);
        await timer(1000);
        return true;
    };

    /**Helper functions to retrive a random message for what we need**/
    async function getJokes(){
        await getJSON('https://official-joke-api.appspot.com/jokes/random',
                      async function(err, data) {
            if (err !== null) {
                await SendChatMessage("This is a faucet message");
            } else {
                WriteLog(data.setup + ' ' + data.punchline);
                await SendChatMessage(data.setup + ' ' + data.punchline);
            }
        });
    }
    async function getRainThx() {
        //Returns a random thanks for the rain comment from the list at the top, just for semi random spam in the chat
        let randomNumber = Math.floor(Math.random() * (RainThankYouMessages.length));
        return RainThankYouMessages[randomNumber];
    }
    async function getWaggeredWin() {
        //Returns a random thanks for the rain comment from the list at the top, just for semi random spam in the chat
        let randomNumber = Math.floor(Math.random() * (WaggeredWinMessages.length));
        return WaggeredWinMessages[randomNumber];
    }
    async function getWaggeredLoss() {
        //Returns a random thanks for the rain comment from the list at the top, just for semi random spam in the chat
        let randomNumber = Math.floor(Math.random() * (WaggeredLossMessages.length));
        return WaggeredLossMessages[randomNumber];
    }
    async function getFaucetmessage() {
        let randomNumber = Math.floor(Math.random() * (FaucetTimeMessages.length));
        return FaucetTimeMessages[randomNumber];
    }

    /**General ui functions**/
    //function to send a chat message
    var WritingMessage=false;
    async function SendChatMessage(ChatMessage){
        //Sends the selected message in the chat
        if(WritingMessage)return;
        var TextInput = document.querySelector('.send_input1');//fetches the textinput for the chat system
        if(!TextInput){
            WriteLog("No text input found for the chat message to be writen in, update youre querys");
            return;
        }
        WritingMessage=true;
        await simulateKeyPress(ChatMessage,TextInput);//Writes the chat message for us
        var SendChatButton = document.querySelector('div.warp_common:nth-child(2)');//presses the send button
        await simulateClick(SendChatButton);//presses the send button
        WritingMessage=false;
        }
    //helper function to collect all the chat meesages
    async function GetChatMessages(){
        var messages = document.querySelectorAll('div.vue-recycle-scroller__item-view');
        return messages
    }
    //helper function to recive the current balance of selected coin,comes with coin name, but is removed
    async function GetSelectedCoinBalance(){
        var selectedcoin = document.querySelector('#app > div > div > div > header > div > div.header_center > ul > li.switch_currency > div.userAmountStatus.oneGameWin');
        if(selectedcoin){
            WriteLog("Current balance is: " + selectedcoin.textContent);
            return selectedcoin.textContent.replace(/\D/g,'');//replaces every non digit charachter from our balance
        }
        return null;//returns null if we couldnt find a balance
    }
    //helper function to fetch our username
    async function GetUsername(){
        var username = document.querySelector('.el-dropdown-link');
        return username.title;
    }
    //Gets the profit from last bet made, might fail, not tested any good
    async function GetLastBetProfit(){
        var MyBets = document.querySelector('.myBets_main');
        var AllBets = MyBets.getElementsByTagName('li');
        var proofit = AllBets[0].querySelector('div:nth-child(6) > span:nth-child(2)');
        return proofit.textContent;
    }
    var StreakLossCounter =0;
    var StreakWinCounter =0;

    async function GetLastResults(){
        var MyBets = document.querySelector('.myBets_main');
        var AllBets = MyBets.getElementsByTagName('li');
        var proofit = AllBets[0].querySelector('div:nth-child(6) > span:nth-child(2)');
        var amountBet = AllBets[0].querySelector('div:nth-child(4) > span:nth-child(2)');

        var lastbettim = AllBets[0].querySelector('div:nth-child(3)');


        if(LastBetTime == lastbettim){
            return;
        }
        LastBetAmount =amountBet;
        LastBetTime = lastbettim;
        LastProfit = proofit;
        if(proofit.includes("-")){
            StreakLossCounter = StreakLossCounter+1;
            if(StreakLossCounter >= MaxStreakWin){
                MaxStreakLoss =StreakLossCounter;
            }
            TotalLossAmount = TotalLossAmount - proofit.replace("-","");
            StreakWinCounter = 0;
        }else{
            StreakWinCounter = StreakWinCounter+1;
            if(StreakWinCounter >= MaxStreakWin){
                MaxStreakWin =StreakWinCounter;
            }
            TotalWinAmount = TotalWinAmount + proofit;
            StreakLossCounter = 0;
        }
        WriteLog("Max win streaks=" + MaxStreakWin + " Max loss streaks=" +MaxStreakLoss);
        return proofit.textContent;

    }
    //helper function to collect the current betamount
    async function GetBetAmount(){
        var amount = document.querySelector('.userAmountStatus');
        return amount.textContent;
    }
    //Todo finished this funtion
    //helper function if you want to make it rain and share youre winnings
    async function MakeItRain(Amount){
        WriteLog("Maing it rain\nTodo add resten av funksjon ");
        var rainbutton = document.querySelector('#chat_nav > li:nth-child(2)');
        if(!rainbutton) return false;
        await simulateClick(rainbutton);
        var inputRainAmount = document.querySelector('div.causeRain_main:nth-child(4) > div:nth-child(2) > div:nth-child(2) > input:nth-child(2)');
        if(!inputRainAmount) return false;
        await simulateKeyPress(Amount ,inputRainAmount);
        return true;
    }
    //Universal helper function to set the game to automode for us
    async function SetGameToAutoMode(){
        var auto = null;
        //Collects the auto button based on what game we are playing
        if(window.location.href.includes('https://luckyfish.io/mines')){
            auto = document.querySelector('.right_main > ul:nth-child(1) > li:nth-child(2)');
        }else if(window.location.href.includes('https://luckyfish.io/diceClassic')){
            auto = document.querySelector('li.right:nth-child(2)');
        }else if(window.location.href.includes('https://luckyfish.io/limbo')){
            auto = document.querySelector('.gameOperating_nav > li:nth-child(2)');
        }
        else if(window.location.href.includes('https://luckyfish.io/crash')){
            auto = document.querySelector('ul.classic > li:nth-child(2)');
        }else if(window.location.href.includes('https://luckyfish.io/crash')){
            auto = document.querySelector('ul.classic > li:nth-child(2)');
        }else if(window.location.href.includes('https://luckyfish.io/plinko')){
            auto = document.querySelector('.right_main > ul:nth-child(1) > li:nth-child(2)');
        }else{
            WriteLog("Sorry this game is not supported at this moment");
            return false;
        }
        if(auto){
            WriteLog('Setting game to automode');
            await simulateClick(auto);
            return true;
        }else{
            WriteLog('Failed to find the auto button, we need a query upgrade here');
            return false;
        }
    }

    /**Faucet solving functions**/
    //WIP function to solve the faucet for free coins
    async function ClaimFaucet(){
        //Denne funtionen åpner ikke fauceten og funker kun ettter du har trykka bet  in game med 0 i balance
        var ClaimFaucetButton = document.querySelector('button.el-button:nth-child(2)');
        await simulateClick(ClaimFaucetButton);
        await timer(300);
        //Text string fauceten til luckydice
        var TextInputCaptcha = document.querySelector('.faucet_yanzhengma > input:nth-child(1)')
        await simulateClick(TextInputCaptcha);
        WriteLog('Todo lag en tyder av bildet for å hente texten');
        //Recaptcha delen
        var recaptchaSolver = document.querySelector('.faucet_main > div:nth-child(4) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > iframe:nth-child(1)');
        await simulateClick(recaptchaSolver);
        WriteLog("Todo, add recaptcha solver med enten tensorflowjs eller yolo og server app");
    }
    //This is the function that solves the rain faucet and fixes us some more coins//
    async function SolveRainFaucet(element,rainfromUser){
        WriteLog('Rain detected');
        waiter = true;
        var openrain = document.querySelector('.cards_coinDrop');//Opens the rain popup
        await simulateClick(openrain);//Opens the rain popup
        await timer(650);
        //Moves the puzle piece to its spot
        await triggerDragAndDrop('.verify-move-block','.verify-gap')
        await timer(1200);//Random interval just to make sure its all loaded
        //Here we try to close the popup and write a thankyou chat
        var ee = document.querySelectorAll('section.v-application');//tries to find the close button
        if(!ee){
            ee = document.querySelectorAll('section.commonAlert_page');//tries to find the close button
        }
        if(ee){//Closes the popup if we found our button
            var ff = ee[ee.length-1].querySelector('div:nth-child(1)');
            var fa = ff.querySelector('span:nth-child(1)');
            await simulateClick(fa,true);
            await timer(450);
        }else{
            WriteLog("Failed to find the button to close the rain popup, we need to update our query");
        }
        var reply = element.querySelector('div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > span:nth-child(1)');//Clicks the mention button before we write a thx msg
        if(reply){
            await simulateClick(reply,true);//Clicks the mention button before we write a thx msg
        }
        await SendChatMessage(await getRainThx());//Sends the thx msg
        waiter = false;
    }

    /**Chat analysator functioner**/
    //This function is to create a response for waggered messages from ppl, good for higher activity and more payout//
    async function AnswerWaggeredChat(sendtFrom, Message){
        waiter = true;
        if(sendtFrom.includes("LuckyFish")){//Stop if its from the luckyfish bot
            waiter = false;
            return;
        }
        var procent = await getRandomInt(0,100);
        var reply = Message.querySelector('div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > span:nth-child(1)');//gets the mention button
        Message = Message.querySelector('.chat_bet_main');
        var profitt = Message.querySelector('.bet_text');
        if(profitt){
            if(profitt.textContent.includes('-')){
                if(procent>=80){//30 procent change to make a response if somebody lost
                    if(reply){
                        await simulateClick(reply,true);//Clicks the mention button
                    }
                    await SendChatMessage(await getWaggeredLoss());
                }
            }
            else{
                if(procent>=60){//60procent change to make a response if somebody wins, maybe they will give ut some rain :P
                    if(reply){
                        await simulateClick(reply,true);//Clicks the mention button
                    }
                    await SendChatMessage( await getWaggeredWin());
                }
            }
        }else{//Just a error message if we couldnt find the profit box
            WriteLog("no profit text found, update youre query");
        }
        waiter = false;
    }





    /**
     Her har vi en haug med functioner for hvert av spillene boten skal gå på , vi starter først med mines
    **/
    //Sets the betamount when playing mines, should be made universal for all games
    async function SetBetAmountMines(Amount){
        var balance = await GetSelectedCoinBalance();
        var input = document.querySelector('.mines_bet > input:nth-child(2)');

        if(Amount>=balance){
            if(ShowDebugLogs){
                WriteLog(Amount.replace(/\D/g,'') + ' is higher than youre balance ' + balance.replace(/\D/g,'') + ', settings bet to balance insted');
            }
            await simulateKeyPress(balance.replace(/\D/g,'') ,input)
        }else{
            if(ShowDebugLogs){
                WriteLog('Setting bet to ' + Amount.replace(/\D/g,''));
            }
            await simulateKeyPress(Amount.replace(/\D/g,''),input)
        }
    }
    //Clicker bet knappen for a starte en runde under mindes spillet
    async function ClickBetButtonMines(){
        var BetButton = document.querySelector('.right_main > p:nth-child(2)');
        var balance = await GetSelectedCoinBalance().replace(/\D/g,'');
        await simulateClick(BetButton);
        if(balance == '0.00000000'){
            if(ShowDebugLogs){
                WriteLog("Looks like balance is zero, looking for faucet popup");
            }
            await timer(1000);
            await ClaimFaucet();
        }
    }

    /**background loops driving the bot**/
    //Main function for checking chat and collecting rain
    async function RainGrabberLoop(){
        //Checks if we can continue or need to wait

        var messages = await GetChatMessages();
        if(messages.length == 0){
            //WriteLog("No chat messages found");
            return;
        }
        if(waiter){
            return;
        }

        //Gets the data from the latest chat message
        var length = messages.length -1;//Last message posted in chat
        var message = messages[length]; //put the message in its own variable
        var reply = message.querySelector('div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > span:nth-child(1)'); //The mention button to answer ppl
        var sendtFrom = message.querySelector('div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1)').textContent; //Username of the person who sendt the message
        var texta = message.querySelector('div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2)');//The text part of the message
        var textstring = texta.textContent;//Clean text string of the message

        //Check if we already worked with this message or not
        if(textstring == messageText){
            //await timer(100);
            return;
        }
        //await ClaimRealFaucet();

        messageText = textstring;//Sets the text variable so we dont work on the same post 100 times
        if(ShowChatMessagesInLog){//Writes the chatmessage in the log
            WriteLog('Incoming chatmessage:\nUser: ' + sendtFrom + ' \nmessage: ' + textstring);
        }
                if(textstring.includes('Grab')){//Checks if we got some rain to collect
            //Opens the rain popup
            if(GrabVipRain){
                await SolveRainFaucet(message,sendtFrom);
            }else if(!GrabVipRain && !textstring.includes('VIP')){
                await SolveRainFaucet(message,sendtFrom);
            }else{
                await SolveRainFaucet(message,sendtFrom);

            }
                    return;
        }
        MessageCount = MessageCount + 1; //Random counter for posting a randomm joke and random intervals
        if(TellJokeAtRandomIntervals){
            if(MessageCount>=JokeEveryXMessage){
                await getJokes();
                JokeEveryXMessage = await getRandomInt(MinMessagesBeforeNewJoke,MaxMessagesBeforeNewJoke);
                MessageCount = 0;
            }
        }

        if(ResponseToWageredChatMessages){//Check if we should respond to ppl posting waggered messages (just for extra message counts and more rain/faucet cashout)
            var waggered = message.querySelector('.chat_bet_main');
            if(waggered){
                await AnswerWaggeredChat(sendtFrom, messages[length]);
            }
        }
        else if(textstring.includes('@'+ await GetUsername())){ //Checks if we are mentioned in the chat message
            WriteLog("Sombody is talking to us in the chat,should we answer maybe?");
            WriteLog("todo add bert or something for a good response");
            //    await getJokes();
        }

    };
    async function ClaimRealFaucet(){
        if(window.location.href =="https://luckyfish.io/")return;
        waiter=true;
        var am = await GetSelectedCoinBalance();
        if(am == null){
            waiter = false;
            return;
        }
        if(0.00000000==am){
        var bet = document.querySelector('#minesgameScene > section.gameOperatingSpace_wrap.minesGameOperatingSpace_wrap > div > div.right.right_main.changeFontSize > p');
        if(bet){
            await simulateClick(bet);
            await timer(1500);
            var ss = document.querySelector('body > section.commonAlert_page.firstDeposit_page > div > div > div > div.firstDeposit_faucet > button');
            if(ss){
            await simulateClick(ss);
            await timer(1500);
            document.querySelector('#rc-anchor-container').click();

            var frame = document.querySelector('#rc-anchor-container');
            console.log(frame);
            await simulateClick(frame);
            await timer(500);
            }


        }
        }
        waiter=false;
    }
    //A loop checking to see if the faucet image is visible or the recaptcha is clickable
    async function FaucetSolverLoop(){
        WriteLog("Todo implement faucet solver");
    }
    /**WIP not tested functions**/
    //function to go back to start page and open the mines game//
    async function OpenMines(){
        WriteLog("Opening Mines game");
        await simulateClick(document.querySelector('.logo > a:nth-child(1)',true));
        var minebutton = document.querySelector('.home_wrap > ul:nth-child(2) > li:nth-child(10) > a:nth-child(1)');
        if(minebutton){
            await simulateClick(minebutton);
        }else{
            WriteLog("Sorry we cant find the mines game");
        }
    }
    //function to go back to start page and open the dices game//
    async function OpenDices(){
        WriteLog("Opening Dice game");
        await simulateClick(document.querySelector('.logo > a:nth-child(1)',true));
        var minebutton = document.querySelector('.home_wrap > ul:nth-child(2) > li:nth-child(1) > a:nth-child(1)');
        if(minebutton){
            await simulateClick(minebutton);
        }else{
            WriteLog("Sorry we cant find the mines game");
        }
    }
    //Tood inject a user interface to manage the bot from the browser
    async function InjectUI(){
        //--- CSS styles make it work...
        //GM_addStyle ();
    }



    /**Start the bot and makes sure we are ready to win**/
    await WriteIntroText();
    var rainlootLoop = setInterval(RainGrabberLoop,10);
    //  var BetLoop = setInterval(GetLastResults,500);









})();
