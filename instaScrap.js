const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");
const exec = require('child_process').execFile;

var countPost = 0;
const profile = "https://www.instagram.com/trapinboys/";// _loyalapparel
var likes = []; // ITS FROMED BY {user: "nameOfUser", count: numberOfTimesLiked}

(async () =>{
    //let proxys = await proxyScrap();
    fs.truncate("usersLiked.txt",0,(err)=>{
        console.log(err);
    });
    fs.truncate("usersLiked.csv",0,(err)=>{
        console.log(err);
    });
    fs.truncate("formatedLiked.txt",0,(err)=>{
        console.log(err);
    });
    let browser = await puppeteer.launch({
        headless: false,
        handleSIGINT: false,
        args: [
            "--disable-gpu",
            "--disable-setuid-sandbox",
            "--force-device-scale-factor",
            "--ignore-certificate-errors",
            "--no-sandbox",
            //'--proxy-server='+proxys.pop()
        ] 
    });
    let page = await browser.newPage();
    await page.setViewport({width: 1000, height: 1000});
    //VARIABLES USED
    var lastImgPosition = 0;
    var next = true; // CONTROLS THE EXIT OF THE LOOP
    var ServerResponse = true; // CHECK THE SERVER ANSWER
    
    // LOAD INSTAGRAM PAGE
    await page.goto(profile);
    
    await page.waitForSelector(".v1Nh3.kIKUG._bz0w > a").catch(async () => {
        await NoConnection(browser,page);
    }); 
    do {
        await page.evaluate(() => {
            window.scrollBy(0,100);
        })
        await page.click(".v1Nh3.kIKUG._bz0w > a");
    } while (cheerio(".KlCQn.G14m-.EtaWk", await page.content()).length == 0);
   
    
    // LOOP FOR EACH POST IN THE PAGE
    while(next){
        // VARIABLES WE USE IN THE BOT
        var currentHeight = 0;
        var distance = 100;
        var isVideo = false;
        var nextUser = true;
        var nextComments = true;
        
        // CHECK IF IT IS A VIDEO OR AN IMAGE
        await page.waitForSelector(".KlCQn.G14m-.EtaWk").catch(async () => {
            await NoConnection(browser,page);
        });
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
                ServerResponse = true;
                await page.waitForSelector("._7UhW9.xLCgt.MMzan.KV-D4.fDxYl",{timeout : 6500}).catch( async () => {// WAIT FOR USER : NEED A CATCH
                    var instance;
                    instance = await NoConnection(browser,page);
                    browser = instance.Browser;
                    page = instance.Page;
                    ServerResponse = false;
                });
                if(ServerResponse){
                    var content = await page.content(); // READ THE CONTENT OF THE POST
                    
                    // PAGE SCROLL
                    await page.waitForSelector(".Igw0E.IwRSH.eGOV_.vwCYk.i0EQd > div");
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
                            fs.appendFile("usersLiked.txt",accounts[i].attribs["title"] + "\r\n",(err) =>{
                                console.log(err);
                            });
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
                        fs.appendFile("usersLiked.txt",accounts[i].attribs["title"] + "\r\n",(err) =>{
                                console.log(err);
                            });
                        likes.push({user: accounts[i].attribs["title"], count: 1});
                        console.log(accounts[i].attribs["title"]); // SHOW YOUR PROGRESS
                    } 
                }
                // CHECK IF WE HAVE MORE COMMENTS TO OPEN
                var contentTmp = await page.content();
                if(cheerio(".Z4IfV._0mzm-.sqdOP.yWX7d",contentTmp).length != 0) // CHECK IF HAVE MORE THAN 15 COMMENTS
                {
                    var CommentDetected = true;
                    await page.waitForSelector(".Z4IfV._0mzm-.sqdOP.yWX7d").catch(async () => {
                        countPost++;
                        CommentDetected = false;
                        await NoConnection(browser,page);
                    });                                             // SHOW MORE COMMENTS BUTTON
                    // CHECK IF IT DIDNT CRASHED EARLIER
                    if(CommentDetected){
                        await page.click(".Z4IfV._0mzm-.sqdOP.yWX7d");
                    }
                } else {
                    nextComments = false; // EXIT THE LOOP FROM COMMENTS
                }

            }
            lastImgPosition = likes.length; // SAVE THE LAST POSITION OF USERS LIKED
            
        }
         
        if(cheerio(".HBoOv.coreSpriteRightPaginationArrow", await page.content()).length != 0){ // CHECKS IF EXISTS THE BUTTON "NEXT POST" AND SERVER ANSWERED
            await page.click(".HBoOv.coreSpriteRightPaginationArrow"); // NEXT POST
            countPost++;
        } else {
            next = false; // EXIT THE LOOP
        }
    } // END OF BIG LOOP
    // COUNT HOW MANY TIMES APPEAR AN USER IN OUR LIKES LIST
    var userTxt = fs.readFileSync("usersLiked.txt","utf8");
    console.log(userTxt);
    likes = userTxt.split("\r\n"); // DIVIDE USERS
    
    for (let i = 0; i < likes.length; i++) {
        likes[i] = {user : likes[i], count : 1};
    }
    console.log ("About to end");
    let userTmp;
    let lastUser = likes.length; // THE LAST USER VISIBLE
    if(lastUser > 2){ // CHECK IF WE HAVE MORE THAN 1 USERS
        for (let i = 0; i < lastUser; i++) {
            for (let j = i + 1; j < lastUser; j++) {
                if(likes[i].user == likes[j].user){
                    likes[i].count++; // ADD 1 TO COUNT
                    for (let k = j; k < lastUser - 1; k++) { // DELETE THE USER FOUND
                        userTmp = likes[k+1];
                        likes[k+1] = likes[k];
                        likes[k] = userTmp;
                    }
                    lastUser--;
                }                
            }
        }
    }
    // SORT THE USERS BY COUNTER
    if (likes.length > 2){
        for (let i = 0; i < lastUser; i++) {
            for (let j = 0; j < lastUser - 1 ; j++) {
                if(likes[j].count < likes[j+1].count){
                    console.log(likes[j]);
                    userTmp = likes[j+1];
                    likes[j+1] = likes[j];
                    likes[j] = userTmp;
                }
            }
        }
    }
    for (let i = 0; i < lastUser; i++) {
        console.log(likes[i]);
    }
    console.log("Users that liked in this profile : " + lastUser);
    

    
    //SAVE ALL USERS IN A FILE
    fs.appendFile("usersLiked.csv",profile+"\r\n"+"Usuario;Likes\r\n", (err) => {
        if(err) throw err; 
        console.log("Have been saved all users");
    });
    for (let i = 0; i < likes.length; i++) {
        fs.appendFile("formatedLiked.txt", "Usuario : @" + likes[i].user + " Contador Me Gusta : " + likes[i].count + "\r\n", (err) => {
            if(err) throw err; 
            console.log("Have been saved all users");
        });
        fs.appendFile("usersLiked.csv",likes[i].user+";"+likes[i].count+"\r\n", (err) => {
            if(err) throw err; 
            console.log("Have been saved all users");
        });
        
    }
    
    // CLOSE BROWSER INSTANCE
    await browser.close();
})().catch(async (err) => {
    console.log(err);
});
// USE LESS
async function proxyScrap(){
    let ips = [];
    let ports = [];
    let proxys = [];
    let content;
    const browser2 = await puppeteer.launch({
        headless: false
    });

    const ProxyPage = await browser2.newPage();
    ProxyPage.viewport({ width: 1200, height: 764});

    await ProxyPage.goto("https://hidemyna.me/es/proxy-list/?country=BEFRDEHUIEITLUNLNOPLESSEUA&type=s#list"); // NAVIGATE TO PROXY WEB
    await ProxyPage.waitForSelector(".tdl"); // WAIT FOR PROXYS
    
    content = await ProxyPage.content();
    
    ips = cheerio(".tdl",content);
    ports = cheerio(".tdl",content).next();
    
    for (let i = 0; i < ips.length; i++) {
        
        proxys.push(cheerio(ips[i]).text() + ":" + cheerio(ports[i]).text());
    }
    console.log(proxys);
    await browser2.close();
    return proxys;
}

async function NoConnection(browser, page){
    await browser.close(); // CLOSE THE BROWSER AND OPEN A NEW ONE WITH DIFERENT PROXY AT LAST POSITION
    await (() => { // WAIT 1 MIN UNTIL THE SERVER ITS AVAILABLE
        return new Promise((resolve,reject) => {
            setTimeout(() => {
                resolve();
            }, 60000);
        });
    })();
    // LAUNCH NEW SERVER
    browser = await puppeteer.launch({
        headless: false,
        handleSIGINT: false,
        args: [
            "--disable-gpu",
            "--disable-setuid-sandbox",
            "--force-device-scale-factor",
            "--ignore-certificate-errors",
            "--no-sandbox",
            //'--proxy-server='+proxys.pop()
        ] 
    });
    page = await browser.newPage();
    await page.goto(profile).catch(async () => {
        await NoConnection(browser,page);
    });
    await page.setViewport({width: 1000, height: 1000});
    
    do {
        await page.evaluate(() => {
            window.scrollBy(0,100);
        })
        await page.click(".v1Nh3.kIKUG._bz0w > a");
    } while (cheerio(".KlCQn.G14m-.EtaWk", await page.content()).length == 0);
    // GOES TO THE LAST POST SCRAPPED
    for (let i = 0; i < countPost; i++) {
        if(cheerio(".HBoOv.coreSpriteRightPaginationArrow", await page.content()).length != 0){ // CHECKS IF EXISTS THE BUTTON "NEXT POST" AND SERVER ANSWERED
            await page.click(".HBoOv.coreSpriteRightPaginationArrow"); // NEXT POST
            await page.waitFor(500); // WAIT FOR LOAD THE NEXT POST
        }
    }
    await page.waitForSelector("._0mzm-.sqdOP.yWX7d._8A5w5").catch(async () => {
        await NoConnection(browser,page);
    });                                             // WAIT FOR LIKES BUTTON
    await page.click("._0mzm-.sqdOP.yWX7d._8A5w5"); // CLICK THE LIKES BUTTON
    return { Page : page, Browser : browser};
}