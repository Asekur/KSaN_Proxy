const serverPort = 15000;
//for client URL's
let visitedURL = [];
//massive with blocked veb-sites
const blockedSites = require("C:/Users/Angelina/Desktop/HTTPProxy/blockedSites.json");

const net = require("net");
const fs = require("fs").promises;
const clientServ = net.createServer();

fs.writeFile("C:/Users/Angelina/Desktop/HTTPProxy/visited.txt", ``);

clientServ.listen(serverPort, () => {
    console.info("Server: http://localhost:" + serverPort);
});

clientServ.on("connection", (clientProxy) => {
    //when data is received to proxy
    clientProxy.on("data", async(data) => {
        visitedURL.push(getURL(data));
        //separately get port and URL to form connection
        let servURL = getServURL(data);
        if (!blockedSites.includes(servURL)) {
            const proxyServ = net.createConnection({
                    host: servURL,
                    port: getPort(data),
                },
                async() => {
                    // write nessesary data to server
                    const modifiedData = data
                        .toString()
                        .replace(/(?<=^GET )http:\/\/[^/]*/, "");
                    //redirect threads of data
                    proxyServ.write(modifiedData);
                    clientProxy.pipe(proxyServ);
                    proxyServ.pipe(clientProxy);
                }
            );

            //when data is received to server
            proxyServ.on("data", async(data) => {
                let response = data.toString("ASCII").split("\r\n")[0];
                fs.appendFile(
                    "C:/Users/Angelina/Desktop/HTTPProxy/visited.txt",
                    `URL: ${visitedURL.pop()}\nServer's URL: ${servURL}\nResponse: ${response}\n\n`
                );
            });

            proxyServ.on("error", () => {
                proxyServ.end();
            });
            //if site in blocked
        } else {
            let blocked = await fs.readFile(
                "C:/Users/Angelina/Desktop/HTTPProxy/blockedSites.html"
            );
            clientProxy.write(blocked);
            fs.appendFile(
                "C:/Users/Angelina/Desktop/HTTPProxy/visited.txt",
                `URL: ${visitedURL.pop()}\nServer's URL: ${servURL}\nResponse: Access is blocked\n\n`
            );
            clientProxy.end();
        }
    });

    clientProxy.on("error", () => {
        clientProxy.end();
    });
});

clientServ.on("error", (err) => {
    throw err;
});

function getURL(data) {
    return data.toString().split("\r\n")[0];
}

function getServURL(data) {
    //search URL without port
    return /(?<=Host: )[^\:\r\n]*/m.exec(data.toString())[0];
}

function getPort(data) {
    const port = /(?<=:).*/m.exec(/(?<=Host: ).*/m.exec(data.toString())[0]);
    //check port from URL
    if (port === null) {
        return 80;
    } else {
        return Number(port[0]);
    }
}