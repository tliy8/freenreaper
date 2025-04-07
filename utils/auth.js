const ee = require("@google/earthengine");
const fs = require("fs");
const privateKey = JSON.parse(fs.readFileSync("KitahackServiceAccount.json", "utf8"));

async function authenticate() {
    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(privateKey, () => {
            console.log("Authenticated successfully!");
            ee.initialize(null, null, () => {
                console.log("Earth Engine initialized!");
                resolve();
            }, reject);
        }, reject);
    });
}

module.exports = { authenticate };
