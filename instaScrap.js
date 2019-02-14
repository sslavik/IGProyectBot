const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

(async () =>{
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox'] 
    });
    const page = await browser.newPage();
    page.viewport({ width: 1200, height: 764});

    //VARIABLES USED
    var likes = []; // ITS FROMED BY {user: "nameOfUser", count: numberOfTimesLiked}
    var next = true; // CONTROLS THE EXIT OF THE LOOP

    // LOAD INSTAGRAM PAGE
    await page.goto("https://www.instagram.com/vyaslavik/");
    await page.waitForSelector(".v1Nh3.kIKUG._bz0w > a");
    await page.click(".v1Nh3.kIKUG._bz0w > a");
    await page.waitForSelector("._0mzm-.sqdOP.yWX7d._8A5w5");
   
    // LOOP FOR EACH POST IN THE PAGE
    while(next){
        // VARIABLES WE USE IN THE BOT
        var currentHeight = 0;
        var distance = 100;
        var nextUser = true;
        var lastImgPosition = 0;

        // NUEVA EXCEPCIÓN : NO CONTROLA LOS LIKES DE LOS VIDEOS

        await page.waitForSelector("._0mzm-.sqdOP.yWX7d._8A5w5");
        await page.click("._0mzm-.sqdOP.yWX7d._8A5w5"); // CLICK THE LIKES BUTTON

        
        while (nextUser) {
            await page.waitForSelector("._7UhW9.xLCgt.qyrsm.KV-D4.fDxYl.rWtOq",{timeout: 1800000}); // WAIT FOR USER
            var content = await page.content(); // READ THE CONTENT OF THE POST
            
            // PAGE SCROLL
            await page.waitFor(400);
            await page.$eval(".Igw0E.IwRSH.eGOV_.vwCYk.i0EQd > div", (div) => {
                div.scrollBy(0, 100); // SCROLL DOWN
            });
            currentHeight += distance;

            // ARRAY USERS
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
            var maxScrollHeight = await page.$eval(".Igw0E.IwRSH.eGOV_.vwCYk.i0EQd > div", (div) => {
                return div.scrollHeight; // RETURNS THE MAXIMUM HEIGHT OF SCROLL
            });
            if(currentHeight >= maxScrollHeight){
                nextUser = false; // EXIT THE LOOP FOR SEARCHING NEW USERS
            }
        }
        lastImgPosition = likes.length; // SAVE THE LAST POSITION OF OUR ARRAY "LIKES"
        
        await page.click(".dCJp8.afkep._0mzm-"); // EXIT THE LIST OF LIKES
        
        if(cheerio(".HBoOv.coreSpriteRightPaginationArrow", content).length != 0){ // CHECKS IF EXISTS THE BUTTON "NEXT POST"
            await page.click(".HBoOv.coreSpriteRightPaginationArrow"); // NEXT POST
        } else {
            next = false; // EXIT THE LOOP
        }
    }
    for (let i = 0; i < likes.length; i++) {
        console.log(likes[i]);
    }
    console.log("Personas que le han dado like : " + likes.length);
    // CLOSE BROWSER INSTANCE
    await browser.close();
})().catch((err) => {
    console.log(err);
});
