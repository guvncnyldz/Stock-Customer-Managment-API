const mysql = require('mysql');

/*const con = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "qwe123--",
    database: "ezrak"
});*/

const con = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "1GUlqrvm5!",
    database: "ezrak"
});

module.exports = con