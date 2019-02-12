const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

(async () =>{
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'] 
    });
    const page = await browser.newPage();
    page.viewport({ width: 1200, height: 764});

    // LOAD INSTAGRAM PAGE
    await page.goto("https://www.instagram.com/trapinboys/");
    await page.click(".v1Nh3.kIKUG._bz0w > a");
    await page.waitForSelector("._0mzm-.sqdOP.yWX7d._8A5w5");
    let likes = [];
    var next = true;
    // LOOP FOR EVERY POST IN THE PAGE
    while(next){
        await page.waitForSelector("._0mzm-.sqdOP.yWX7d._8A5w5");
        await page.click("._0mzm-.sqdOP.yWX7d._8A5w5"); // CLICK THE LIKES BUTTON
        await page.waitForSelector("._7UhW9.xLCgt.qyrsm.KV-D4.fDxYl.rWtOq");
        var content = await page.content(); // READ THE CONTENT OF THE POST
        // ARRAY CUENTAS
        var accounts = cheerio("._7UhW9.xLCgt.MMzan.KV-D4.fDxYl", content).children("a");
        for (let i = 0; i < accounts.length; i++) {
            likes.push(accounts[i].attribs["title"]);
        }
        await page.click(".dCJp8.afkep._0mzm-"); // EXIT THE LIST OF LIKES
        if(cheerio(".HBoOv.coreSpriteRightPaginationArrow", content).length != 0){
            await page.click(".HBoOv.coreSpriteRightPaginationArrow"); // NEXT POST
        }
        else {
            next = false; // EXIT THE LOOP
        }
    }
    for (let i = 0; i < likes.length; i++) {
        console.log(likes[i]);
    }

    // CLOSE BROWSER INSTANCE
    await browser.close();
})().catch((err) => {
    console.log(err);
});