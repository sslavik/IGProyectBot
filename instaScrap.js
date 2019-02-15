const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");

(async () =>{
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox'] 
    });
    const page = await browser.newPage();
    page.viewport({ width: 1200, height: 764});

    //VARIABLES USED
    var lastImgPosition = 0;
    var likes = []; // ITS FROMED BY {user: "nameOfUser", count: numberOfTimesLiked}
    var next = true; // CONTROLS THE EXIT OF THE LOOP

    // LOAD INSTAGRAM PAGE
    await page.goto("https://www.instagram.com/my.coach.amy/");
    
    await page.waitForSelector(".v1Nh3.kIKUG._bz0w > a"); 
    await page.click(".v1Nh3.kIKUG._bz0w > a");
    await page.waitForSelector(".KlCQn.G14m-.EtaWk");
    
    // LOOP FOR EACH POST IN THE PAGE
    while(next){
        // VARIABLES WE USE IN THE BOT
        var currentHeight = 0;
        var distance = 100;
        var isVideo = false;
        var nextUser = true;
        var nextComments = true;
        
        // CHECK IF IT IS A VIDEO OR AN IMAGE
        await page.waitForSelector(".KlCQn.G14m-.EtaWk");
        var contentTmp = await page.content();
        console.log(cheerio(".kPFhm.B1JlO",contentTmp).length);
        if(cheerio(".kPFhm.B1JlO",contentTmp).length != 0){ // ASK FOR VIDEO REPS EXISTS
            isVideo = true;
        } else {
            await page.waitForSelector("._0mzm-.sqdOP.yWX7d._8A5w5"); // WAIT FOR LIKES BUTTON
            await page.click("._0mzm-.sqdOP.yWX7d._8A5w5"); // CLICK THE LIKES BUTTON
        }
        if(!isVideo){
            while (nextUser) {
                emptyList:
                await page.waitForSelector("._7UhW9.xLCgt.MMzan.KV-D4.fDxYl").catch( async () => {// WAIT FOR USER : NEED A CATCH
                    await page.click(".dCJp8.afkep._0mzm-"); // EXIT THE LIST OF LIKES
                    await page.waitFor(10000);
                    await page.click("._0mzm-.sqdOP.yWX7d._8A5w5"); // TRY TO GET AGAIN THE LIST OF LIKES
                    await emptyList;
                }); 
                var content = await page.content(); // READ THE CONTENT OF THE POST
                
                // PAGE SCROLL
                //await page.waitFor(100);
                await page.$eval(".Igw0E.IwRSH.eGOV_.vwCYk.i0EQd > div", (div) => {
                    div.scrollBy(0, 100); // SCROLL DOWN
                });
                currentHeight += distance;

                // ARRAY USERS ADDED
                var accounts = cheerio("._7UhW9.xLCgt.MMzan.KV-D4.fDxYl", content).children("a");
                for (let i = 0; i < accounts.length; i++) {
                    var existe = false;
                    for (let j = lastImgPosition; j < likes.length; j++) {
                        if(accounts[i].attribs["title"] == likes[j].user){ // REMOVE REDUNDANCIES FROM USERS
                            existe = true;
                            break; // IF THERE IS A USER IN LIKES 
                        }
                    }
                    if(!existe){
                        likes.push({user: accounts[i].attribs["title"], count: 1});
                        console.log(accounts[i].attribs["title"]); // SHOW YOUR PROGRESS
                    } 
                }
                // CHECK MAX SCROLL
                var maxScrollHeight = await page.$eval(".Igw0E.IwRSH.eGOV_.vwCYk.i0EQd > div", (div) => {
                    return div.scrollHeight; // RETURNS THE MAXIMUM HEIGHT OF SCROLL
                });
                console.log(currentHeight + ":" + maxScrollHeight);
                if(currentHeight >= maxScrollHeight){
                    nextUser = false; // EXIT THE LOOP FOR SEARCHING NEW USERS
                }
            }
            lastImgPosition = likes.length; // SAVE THE LAST POSITION OF OUR ARRAY "LIKES"
            console.log("apunto de irme");
            await page.click(".dCJp8.afkep._0mzm-"); // EXIT THE LIST OF LIKES
            console.log("me fui");
        } else { // VIDEO RESPONSE
            while(nextComments){
                console.log("QUE HAGO AQUI!");
                var content = await page.content();
                // ARRAY USERS ADDED
                var accounts = cheerio(".FPmhX.notranslate.TlrDj", content);
                for (let i = 0; i < accounts.length; i++) {
                    var existe = false;
                    for (let j = lastImgPosition; j < likes.length; j++) {
                        if(accounts[i].attribs["title"] == likes[j].user){ // REMOVE REDUNDANCIES FROM USERS
                            existe = true;
                            break; // IF THERE IS A USER IN LIKES 
                        }
                    }
                    if(!existe){
                        likes.push({user: accounts[i].attribs["title"], count: 1});
                        console.log(accounts[i].attribs["title"]); // SHOW YOUR PROGRESS
                    } 
                }
                // CHECK IF WE HAVE MORE COMMENTS TO OPEN
                var contentTmp = await page.content();
                if(cheerio(".Z4IfV._0mzm-.sqdOP.yWX7d",contentTmp).length != 0) // CHECK IF HAVE MORE THAN 15 COMMENTS
                {
                    await page.waitForSelector(".Z4IfV._0mzm-.sqdOP.yWX7d",{timeout: 1800000}); // SHOW MORE COMMENTS BUTTON
                    await page.click(".Z4IfV._0mzm-.sqdOP.yWX7d");
                } else {
                    nextComments = false; // EXIT THE LOOP FROM COMMENTS
                }

            }
            lastImgPosition = likes.length; // SAVE THE LAST POSITION OF USERS LIKED
            
        }
        
        if(cheerio(".HBoOv.coreSpriteRightPaginationArrow", await page.content()).length != 0){ // CHECKS IF EXISTS THE BUTTON "NEXT POST"
            await page.click(".HBoOv.coreSpriteRightPaginationArrow"); // NEXT POST
        } else {
            next = false; // EXIT THE LOOP
        }
    } // END OF BIG LOOP
    // COUNT HOW MANY TIMES APPEAR AN USER IN OUR LIKES LIST
    console.log ("About to end");
    let userTmp;
    let lastUser = likes.length; // THE LAST USER VISIBLE
    if(lastUser > 2){ // CHECK IF WE HAVE MORE THAN 1 USERS
        for (let i = 0; i < lastUser; i++) {
            for (let j = i + 1; j < lastUser; j++) {
                if(likes[i].user == likes[j].user){
                    likes[i].count++; // ADD 1 TO COUNT
                    for (let k = j; k < lastUser; k++) { // DELETE THE USER FOUND
                        userTmp = likes[k+1];
                        likes[k+1] = likes[k];
                        likes[k] = userTmp;
                    }
                    lastUser--;
                }                
            }
        }
    }
    for (let i = 0; i < lastUser; i++) {
        console.log(likes[i]);
    }
    console.log("Users that liked in this profile : " + lastUser);
    //SAVE ALL USERS IN A FILE
    for (let i = 0; i < likes.length; i++) {
        fs.appendFile("usersLiked.txt", "User : " + likes[i].user + " Times liked : " + likes[i].count + "\r\n", (err) => {
            if(err) throw err; 
            console.log("Have been saved all users");
        });
        
    }
    
    // CLOSE BROWSER INSTANCE
    await browser.close();
})().catch((err) => {
    console.log(err);
});
