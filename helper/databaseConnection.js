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
    database: "ezrak",
    timezone: 'UTC'
});

con.on('connection', conn => {
    conn.query("SET time_zone='+03:00';", error => {
        if(error){
            throw error
        }
    })
})
module.exports = con